# Kebijakan Privasi Modapack Fund

Halaman kebijakan privasi siap publikasi ada di [`kebijakan-privasi.html`](kebijakan-privasi.html):
satu file HTML mandiri (tanpa file pendukung), responsif, dan mendukung mode gelap.

## Sebelum dipublikasikan

1. Ganti semua bagian bersorot kuning (`class="isi"`). Cek sisa placeholder dengan:
   `grep -o 'class="isi">[^<]*' docs/kebijakan-privasi.html`
   - `[tanggal berlaku]`, `[tahun]`
   - `[nama badan hukum]` (dua tempat, plus contoh di bagian 1)
   - `[wilayah server]` — sesuai region proyek Supabase (Project Settings → General)
   - `[email privasi]`, `[nomor telepon]`, `[alamat kantor lengkap]`
2. Ganti setiap `<span class="isi">[...]</span>` utuh dengan teks biasa, supaya sorotan kuningnya ikut hilang.
3. Minta konsultan hukum meninjau isinya, terutama bagian dasar pemrosesan, transfer data
   ke luar negeri, dan retensi dokumen perjanjian.

## Tempat mempublikasikan

Google Play mewajibkan URL publik yang aktif dan tidak berupa PDF. Pilihan:
- **Situs web perusahaan (disarankan):** unggah sebagai `https://<domain>/kebijakan-privasi/`.
- **GitHub Pages:** butuh repositori publik atau paket GitHub berbayar.
- **Layanan hosting statis gratis** seperti Netlify atau Cloudflare Pages: unggah file HTML-nya saja.

## URL yang diisi di Play Console

| Isian | URL |
| --- | --- |
| Kebijakan privasi (*App content → Privacy policy*) | `https://<domain>/kebijakan-privasi/` |
| URL hapus akun (*Data safety → Data deletion*) | `https://<domain>/kebijakan-privasi/#hapus-akun` |

Bagian **Menghapus akun** menjelaskan cara menghapus akun lewat aplikasi maupun lewat email,
sesuai syarat Google Play untuk aplikasi yang memiliki fitur akun.

Jika praktik data aplikasi berubah (misalnya menambah analitik, unggah dokumen KYC, atau izin
perangkat baru), perbarui halaman ini dan formulir *Data safety* di Play Console.
