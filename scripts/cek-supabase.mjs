#!/usr/bin/env node
/**
 * Mengecek apakah proyek Supabase sudah siap dipakai aplikasi Modapack Fund.
 *
 *   npm run cek-supabase                 → cek koneksi, kunci API, dan tabel
 *   npm run cek-supabase -- --uji        → + uji alur investor dengan akun uji baru
 *   npm run cek-supabase -- --uji --email a@b.com --password rahasia
 *                                        → + uji alur memakai akun yang sudah ada
 *
 * Kredensial dibaca dari .env.local (atau .env) di folder proyek.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { createClient } from '@supabase/supabase-js';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

let failures = 0;
const ok = (msg) => console.log(`  ✅ ${msg}`);
const warn = (msg) => console.log(`  ⚠️  ${msg}`);
const fail = (msg, hint) => {
  failures++;
  console.log(`  ❌ ${msg}`);
  if (hint) console.log(`     → ${hint}`);
};
const section = (title) => console.log(`\n${title}`);

function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
    return file;
  }
  return null;
}

/** Peran (role) yang tertanam di kunci JWT lama, atau jenis kunci format baru. */
function keyRole(key) {
  if (key.startsWith('sb_publishable_')) return 'anon';
  if (key.startsWith('sb_secret_')) return 'service_role';
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

function explainError(error) {
  const msg = error?.message ?? String(error);
  if (/fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|network/i.test(msg)) {
    return [`Tidak bisa terhubung ke server: ${msg}`, 'Periksa koneksi internet dan EXPO_PUBLIC_SUPABASE_URL.'];
  }
  if (/invalid api key|jwt/i.test(msg)) {
    return [`Kunci API ditolak: ${msg}`, 'Salin ulang anon / publishable key dari Project Settings → API Keys.'];
  }
  return [msg, undefined];
}

async function checkTables(supabase) {
  section('3. Tabel database');
  let allPresent = true;
  for (const table of ['profiles', 'projects', 'investments']) {
    // Bukan HEAD: supabase-js menganggap 404 tanpa isi (tabel tak ada) sebagai sukses.
    const { error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      ok(`Tabel "${table}" ditemukan`);
    } else if (error.code === 'PGRST205' || error.code === '42P01' || /does not exist|could not find/i.test(error.message)) {
      allPresent = false;
      fail(`Tabel "${table}" belum ada`, 'Jalankan supabase/schema.sql di SQL Editor.');
    } else {
      allPresent = false;
      fail(...explainError(error));
      return false;
    }
  }
  return allPresent;
}

async function runFlowTest(supabase, url, key) {
  section('4. Uji alur investor');
  const email = option('--email');
  const password = option('--password');
  let createdAccount = false;

  if (email && password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return fail(`Gagal masuk sebagai ${email}: ${error.message}`);
    ok(`Masuk sebagai ${email}`);
  } else {
    // Jangan daftar ke alamat palsu bila email konfirmasi akan dikirim: email yang
    // memantul (bounce) bisa membuat Supabase membatasi pengiriman email proyek.
    const settings = await fetch(new URL('/auth/v1/settings', url), {
      headers: { apikey: key },
    })
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);
    if (settings?.mailer_autoconfirm !== true) {
      warn('"Confirm email" aktif, jadi akun uji otomatis tidak dibuat.');
      warn('Daftar dulu lewat aplikasi, konfirmasi emailnya, lalu jalankan:');
      warn('npm run cek-supabase -- --uji --email <email> --password <kata sandi>');
      return;
    }
    const testEmail = `cek.supabase.${Date.now()}@modapack-test.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: `Uji-${Math.random().toString(36).slice(2)}-9`,
      options: { data: { full_name: 'Akun Uji Cek Supabase', phone: '0800000000' } },
    });
    if (error) {
      return fail(
        `Pendaftaran akun uji gagal: ${error.message}`,
        /rate limit/i.test(error.message)
          ? 'Batas kirim email Supabase tercapai. Coba lagi nanti atau pakai --email/--password akun yang sudah ada.'
          : undefined,
      );
    }
    if (!data.session) {
      warn('Pendaftaran berhasil, tetapi "Confirm email" aktif sehingga akun uji belum bisa masuk.');
      warn('Ulangi dengan akun yang sudah dikonfirmasi: npm run cek-supabase -- --uji --email ... --password ...');
      return;
    }
    createdAccount = true;
    ok(`Akun uji dibuat: ${testEmail}`);
  }

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user.id;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();
  if (profileError) fail(`Gagal membaca profil: ${profileError.message}`);
  else if (!profile && createdAccount) {
    fail('Profil tidak terbentuk otomatis saat mendaftar', 'Trigger "on_auth_user_created" di schema.sql belum terpasang.');
  } else ok('Profil investor dapat dibaca');

  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('id, title, status, min_investment, target_amount, raised_amount, closing_date');
  if (projectsError) {
    fail(`Gagal membaca proyek: ${projectsError.message}`);
  } else if (projects.length === 0) {
    warn('Belum ada proyek yang dipublikasikan (published = true). Jalankan seed.sql atau tambah proyek.');
  } else {
    ok(`${projects.length} proyek terlihat oleh investor`);
  }

  const now = Date.now();
  const open = (projects ?? []).find(
    (p) =>
      p.status === 'open' &&
      (!p.closing_date || new Date(p.closing_date).getTime() > now) &&
      Number(p.target_amount) - Number(p.raised_amount) >= Number(p.min_investment),
  );

  if (!open) {
    warn('Tidak ada proyek berstatus "open" dengan sisa kuota — uji pengajuan dilewati.');
  } else {
    const min = Number(open.min_investment);

    const tooSmall = await supabase.from('investments').insert({ user_id: userId, project_id: open.id, amount: min - 1 });
    if (tooSmall.error) ok('Pengajuan di bawah minimum ditolak (aturan keamanan aktif)');
    else fail('Pengajuan di bawah minimum DITERIMA', 'Aturan RLS tabel investments belum terpasang. Jalankan ulang schema.sql.');

    const forged = await supabase
      .from('investments')
      .insert({ user_id: userId, project_id: open.id, amount: min, status: 'approved' });
    if (forged.error) ok('Pengajuan dengan status palsu "approved" ditolak');
    else fail('Investor bisa membuat pengajuan berstatus "approved"', 'Aturan RLS tabel investments belum terpasang.');

    const valid = await supabase
      .from('investments')
      .insert({ user_id: userId, project_id: open.id, amount: min, note: 'Uji otomatis cek-supabase' })
      .select('id')
      .single();
    if (valid.error) {
      fail(`Pengajuan valid ke "${open.title}" ditolak: ${valid.error.message}`);
    } else {
      ok(`Pengajuan valid ke "${open.title}" berhasil`);
      const cancel = await supabase.rpc('cancel_investment', { investment_id: valid.data.id });
      if (cancel.error) fail(`Pembatalan pengajuan gagal: ${cancel.error.message}`, 'Fungsi cancel_investment belum ada.');
      else ok('Pembatalan pengajuan berhasil');
    }
  }

  if (createdAccount) {
    const del = await supabase.rpc('delete_my_account');
    if (del.error) {
      fail(`Hapus akun gagal: ${del.error.message}`, 'Fungsi delete_my_account belum ada. Hapus akun uji manual di Authentication → Users.');
    } else {
      ok('Hapus akun berhasil (akun uji sudah dibersihkan)');
    }
  } else {
    warn('Akun Anda tidak dihapus. Pengajuan uji tersimpan dengan status "cancelled".');
    await supabase.auth.signOut();
  }
}

async function main() {
  console.log('Cek Supabase — Modapack Fund');

  section('1. Konfigurasi');
  const envFile = loadEnv();
  if (envFile) ok(`Membaca ${envFile}`);
  else warn('File .env.local tidak ditemukan; memakai variabel lingkungan sistem.');

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url) fail('EXPO_PUBLIC_SUPABASE_URL belum diisi', 'Salin .env.example menjadi .env.local lalu isi nilainya.');
  else if (!/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/?$/.test(url)) {
    warn(`URL tidak berpola https://<id>.supabase.co: ${url} (abaikan jika memakai domain kustom)`);
  } else ok(`URL: ${url}`);

  if (!key) fail('EXPO_PUBLIC_SUPABASE_ANON_KEY belum diisi', 'Ambil dari Project Settings → API Keys.');
  if (!url || !key) return;

  const role = keyRole(key);
  if (role === 'service_role') {
    return fail(
      'Kunci yang dipakai adalah service_role / secret key!',
      'Kunci ini melewati semua aturan keamanan dan TIDAK BOLEH ada di aplikasi. Ganti dengan anon / publishable key.',
    );
  }
  if (role === 'anon') ok('Kunci API bertipe anon / publishable');
  else warn('Jenis kunci API tidak dikenali; pastikan itu anon / publishable key.');

  for (const name of ['EXPO_PUBLIC_CONTACT_WHATSAPP', 'EXPO_PUBLIC_CONTACT_EMAIL']) {
    if (!process.env[name]) warn(`${name} belum diisi (tombol kontak tidak akan tampil)`);
  }

  section('2. Koneksi');
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  try {
    const res = await fetch(new URL('/auth/v1/health', url), { headers: { apikey: key } });
    if (res.ok) ok('Server Supabase dapat dihubungi');
    else if (res.status === 401) return fail('Kunci API ditolak server (401)', 'Pastikan kunci berasal dari proyek yang sama dengan URL.');
    else return fail(`Server menjawab status ${res.status}`, 'Pastikan proyek tidak sedang di-pause di dashboard Supabase.');
  } catch (e) {
    return fail(...explainError(e));
  }

  const tablesReady = await checkTables(supabase);

  if (flag('--uji')) {
    if (tablesReady) await runFlowTest(supabase, url, key);
    else warn('Uji alur dilewati karena tabel belum lengkap.');
  } else if (tablesReady) {
    console.log('\n  Tips: jalankan "npm run cek-supabase -- --uji" untuk menguji pendaftaran & pengajuan.');
  }
}

main()
  .catch((e) => fail(`Kesalahan tak terduga: ${e?.message ?? e}`))
  .finally(() => {
    console.log(failures === 0 ? '\nHasil: semua pemeriksaan lolos ✅' : `\nHasil: ${failures} masalah perlu diperbaiki ❌`);
    process.exitCode = failures === 0 ? 0 : 1;
  });
