# Modapack Fund

Aplikasi Android (dan iOS) untuk calon investor yang ingin menanamkan modal pada proyek-proyek Modapack.
Dibangun dengan **Expo / React Native** dan **Supabase** sebagai backend.

## Fitur

| Layar | Fungsi |
| --- | --- |
| Daftar / Masuk | Registrasi investor (nama, HP, email) dengan persetujuan penafian risiko |
| Proyek | Daftar peluang investasi dengan progres pendanaan, estimasi imbal hasil, tenor, risiko, filter status |
| Detail Proyek | Deskripsi, poin utama, prospektus, tombol tanya via WhatsApp |
| Ajukan Minat | Input nominal (validasi minimum & sisa kuota) + simulasi imbal hasil |
| Portofolio | Riwayat pengajuan dan statusnya (Menunggu Tinjauan → Dihubungi Tim → Disetujui/Ditolak), pembatalan |
| Profil | Ubah data diri, kontak tim, keluar, **hapus akun** (wajib untuk Google Play) |

**Alur investasi:** aplikasi hanya mencatat *minat investasi*. Tim Anda meninjau pengajuan,
melakukan KYC, menandatangani perjanjian, lalu investor mentransfer ke rekening resmi perusahaan.
Tidak ada pembayaran di dalam aplikasi.

## Menjalankan secara lokal

```bash
npm install
npx expo start        # pindai QR dengan aplikasi Expo Go di HP Android
```

Tanpa konfigurasi, aplikasi berjalan dalam **mode demo**: memakai proyek contoh dan
menyimpan data di perangkat. Cocok untuk melihat tampilan, bukan untuk produksi.

## Menghubungkan Supabase (backend produksi)

1. Buat proyek gratis di <https://supabase.com>.
2. Buka **SQL Editor**, jalankan `supabase/schema.sql`, lalu (opsional) `supabase/seed.sql`.
3. Salin `.env.example` menjadi `.env.local` dan isi `EXPO_PUBLIC_SUPABASE_URL` serta
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API), juga nomor WhatsApp & email tim.
4. Periksa hasil setup dengan `npm run cek-supabase` (cek kunci API, koneksi, dan tabel).
   Tambahkan `-- --uji` untuk menguji pendaftaran, aturan keamanan, dan pengajuan.
   Bila *Confirm email* aktif, pakai akun yang sudah dikonfirmasi:
   `npm run cek-supabase -- --uji --email <email> --password <kata sandi>`.
5. Jalankan ulang `npx expo start`.

**Mengelola data (tim internal)** — lewat Supabase Dashboard → Table Editor:
- `projects`: tambah/ubah proyek; centang `published` agar tampil; perbarui `raised_amount` setelah dana masuk.
- `investments`: ubah `status` pengajuan (`contacted`, `approved`, `rejected`).

Keamanan dijaga dengan Row Level Security: investor hanya melihat data miliknya, hanya dapat
mengajukan ke proyek yang terbuka dengan nominal ≥ minimum dan ≤ sisa kuota, dan tidak dapat
mengubah status pengajuan.

## Rilis ke Google Play Store

1. **Akun Google Play Console** — daftar di <https://play.google.com/console> (biaya satu kali USD 25).
   Gunakan akun **Organisasi** atas nama badan hukum perusahaan (memerlukan nomor D-U-N-S);
   aplikasi keuangan dari akun organisasi lebih mudah lolos verifikasi.
2. **Akun Expo** — `npx eas-cli@latest login`, lalu `npx eas-cli@latest init` untuk menautkan proyek.
3. **Variabel lingkungan build** — simpan nilai Supabase di EAS:
   `npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value ... --environment production`
   (ulangi untuk variabel lain di `.env.example`).
4. **Build** — `npx eas-cli@latest build --platform android --profile production`
   menghasilkan file `.aab`. Untuk uji coba di HP gunakan profil `preview` (menghasilkan `.apk`).
5. **Unggah** — buat aplikasi di Play Console, lalu `npx eas-cli@latest submit --platform android`
   (atau unggah `.aab` secara manual) ke jalur *Internal testing* terlebih dahulu.
6. **Lengkapi listing Play Store:**
   - Ikon 512×512, feature graphic 1024×500, minimal 2 screenshot HP.
   - URL **Kebijakan Privasi** publik (templat di `docs/kebijakan-privasi.md`).
   - Formulir **Data safety**: nama, email, nomor HP (dikumpulkan, dienkripsi saat transit, dapat dihapus pengguna).
   - Formulir **Financial features**: pilih kategori yang sesuai dan lampirkan dokumen izin bila diminta.
   - Akun demo untuk peninjau Google (email + kata sandi) di bagian *App access*.
   - Untuk akun pengembang pribadi baru: wajib *closed testing* dengan minimal 12 penguji selama 14 hari sebelum produksi.
7. Promosikan rilis ke **Production** setelah lolos peninjauan.

Ganti ikon di folder `assets/` dengan logo Modapack sebelum rilis.

## ⚠️ Catatan regulasi (penting)

Menghimpun dana dari masyarakat umum di Indonesia diawasi **OJK**. Penawaran efek/urun dana kepada
publik melalui aplikasi umumnya memerlukan izin sebagai penyelenggara *Securities Crowdfunding*
(POJK tentang Layanan Urun Dana) atau kerja sama dengan penyelenggara berizin. Google Play juga
dapat meminta bukti izin untuk aplikasi berfitur keuangan.

Aplikasi ini dirancang sebagai sarana **informasi proyek dan pengajuan minat** untuk investor yang
kemudian diproses secara langsung (*private placement*) melalui perjanjian. Konsultasikan model
penghimpunan dana Anda dengan konsultan hukum pasar modal sebelum membuka aplikasi untuk publik.

## Struktur kode

```
src/app/             Layar (Expo Router, berbasis file)
  (auth)/            Masuk & daftar
  (tabs)/            Proyek, Portofolio, Profil
  project/[id].tsx   Detail proyek
  invest/[id].tsx    Formulir pengajuan minat
src/components/      Komponen UI & tema warna
src/lib/             Backend (Supabase / demo), tipe data, format Rupiah
supabase/            Skema database, RLS, dan data contoh
```

Perintah pengecekan: `npm run typecheck`.
