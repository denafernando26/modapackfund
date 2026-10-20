# Teks Listing Google Play — Modapack Fund

Salin bagian di bawah ke Play Console → **Grow → Store presence → Main store listing**.
Batas karakter Google Play: nama aplikasi 30, deskripsi singkat 80, deskripsi lengkap 4.000.

## Nama aplikasi

```
Modapack Fund
```

## Deskripsi singkat

```
Pelajari proyek Modapack, simulasikan imbal hasil, dan ajukan minat investasi.
```

## Deskripsi lengkap

```
Modapack Fund adalah aplikasi resmi Modapack untuk calon investor yang ingin mengenal dan ikut mendanai proyek-proyek perusahaan.

Lihat proyek yang sedang membuka pendanaan, pelajari detailnya, lalu ajukan minat investasi langsung dari ponsel Anda. Tim investor Modapack akan menghubungi Anda untuk proses selanjutnya.

FITUR UTAMA

• Daftar peluang investasi
Lihat proyek Modapack lengkap dengan target dana, dana yang sudah terkumpul, dan sisa waktu penggalangan. Saring berdasarkan status: dibuka, berjalan, atau selesai.

• Detail proyek yang jelas
Setiap proyek menampilkan tujuan penggunaan dana, poin utama, lokasi, tenor, tingkat risiko, minimum investasi, dan estimasi imbal hasil per tahun.

• Simulasi imbal hasil
Masukkan nominal yang Anda rencanakan dan lihat perkiraan imbal hasil per tahun serta di akhir tenor sebelum mengajukan.

• Ajukan minat investasi
Kirim pengajuan dengan nominal dan catatan untuk tim. Nominal otomatis dicek terhadap batas minimum dan sisa kuota proyek.

• Pantau status pengajuan
Ikuti perkembangan setiap pengajuan di menu Portofolio: Menunggu Tinjauan, Dihubungi Tim, hingga Disetujui. Pengajuan yang masih menunggu dapat dibatalkan.

• Terhubung dengan tim investor
Tanyakan detail proyek langsung melalui WhatsApp atau email dari dalam aplikasi.

• Kendali atas data Anda
Perbarui data diri kapan saja dan hapus akun langsung dari menu Profil.

BAGAIMANA PROSESNYA

1. Daftar dan pelajari proyek yang tersedia.
2. Ajukan minat investasi beserta nominalnya.
3. Tim Modapack meninjau pengajuan dan menghubungi Anda untuk verifikasi identitas (KYC).
4. Penandatanganan perjanjian investasi.
5. Transfer dana ke rekening resmi atas nama perusahaan sesuai perjanjian.

Aplikasi ini tidak memproses pembayaran. Waspadai penipuan: Modapack tidak pernah meminta transfer ke rekening pribadi.

PENTING UNTUK DIKETAHUI

Setiap investasi mengandung risiko, termasuk kemungkinan kehilangan sebagian atau seluruh modal. Estimasi imbal hasil yang ditampilkan adalah proyeksi, bukan jaminan hasil. Baca informasi proyek dan perjanjian dengan saksama sebelum berinvestasi, dan pertimbangkan berkonsultasi dengan penasihat keuangan independen.

Butuh bantuan? Hubungi tim investor Modapack di [email kontak] atau WhatsApp [nomor WhatsApp].
```

## Pengaturan lain di Play Console

| Bagian | Isian yang disarankan |
| --- | --- |
| Kategori aplikasi | Keuangan (*Finance*) |
| Tag | Investasi, Keuangan |
| Email kontak | Email tim investor (wajib) |
| Situs web | Situs resmi Modapack |
| Kebijakan privasi | URL publik halaman `docs/kebijakan-privasi.html` (lihat `docs/kebijakan-privasi.md`) |
| Target audiens | 18 tahun ke atas |
| Iklan | Tidak berisi iklan |

## Sebelum menyalin

- Ganti `[email kontak]` dan `[nomor WhatsApp]` di akhir deskripsi lengkap.
- Hindari menambahkan klaim seperti "terbaik", "#1", "pasti untung", atau "imbal hasil dijamin". Google Play melarang klaim yang tidak dapat dibuktikan, dan klaim jaminan imbal hasil bertentangan dengan aturan pemasaran produk keuangan.
- Jika perusahaan sudah memiliki izin atau terdaftar di OJK, cantumkan nomor izinnya di deskripsi lengkap. Jika belum, jangan menyebut OJK sama sekali.

## Akun demo untuk peninjau Google (*App access*)

Google wajib bisa masuk ke aplikasi untuk meninjaunya. Siapkan akun khusus peninjau:

1. **Buat akun:** Supabase Dashboard → **Authentication → Users → Add user → Create new user**.
   - Email: `peninjau.play@modapack.co.id` (atau alamat lain milik perusahaan)
   - Kata sandi: buat yang kuat dan khusus untuk akun ini
   - Centang **Auto Confirm User** agar bisa langsung masuk tanpa konfirmasi email
2. **Isi data contoh:** jalankan `supabase/demo-reviewer.sql` di SQL Editor (ganti emailnya bila berbeda).
   Akun mendapat profil "Peninjau Google Play" dan 3 pengajuan contoh berstatus
   Disetujui, Dihubungi Tim, dan Menunggu Tinjauan. Skrip aman dijalankan ulang.
3. **Uji sendiri:** masuk ke APK uji memakai akun tersebut dan pastikan menu Portofolio terisi.
4. **Isi di Play Console:** **Policy → App content → App access** → pilih
   *All or some functionality is restricted* → **Add new instructions**:

| Kolom | Isian |
| --- | --- |
| Name | Akun peninjau |
| Username | `peninjau.play@modapack.co.id` |
| Password | *(kata sandi akun peninjau)* |
| Any other information | *(teks di bawah)* |

```
Masuk dengan email dan kata sandi di atas pada layar "Masuk". Akun ini sudah berisi contoh pengajuan di menu Portofolio. Peninjau bebas melihat proyek, mencoba simulasi, dan mengirim pengajuan minat investasi. Aplikasi tidak memproses pembayaran apa pun. Pengajuan dari akun ini diperlakukan sebagai data uji dan tidak akan ditindaklanjuti tim.
```

**Penting selama masa peninjauan:**
- **Jangan hapus atau ubah kata sandi akun ini.** Peninjau Google bisa masuk kapan saja, termasuk saat pembaruan aplikasi di kemudian hari.
- **Proyek Supabase gratis otomatis di-*pause* setelah sekitar seminggu tanpa aktivitas.** Jika proyek ter-pause saat ditinjau, peninjau tidak bisa masuk dan aplikasi ditolak. Pastikan proyek aktif sebelum mengirim untuk ditinjau, atau gunakan paket berbayar untuk produksi.
- Abaikan semua pengajuan dari akun peninjau saat memproses tabel `investments`. Pengajuan contoh dari skrip bercatatan `[DEMO]`, tetapi pengajuan yang dikirim peninjau lewat aplikasi tidak; kenali dari `user_id` akun peninjau (lihat di Authentication → Users).
- Jika peninjau menghapus akun dari menu Profil, buat ulang akunnya dan jalankan lagi `demo-reviewer.sql`.
