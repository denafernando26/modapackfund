-- Contoh proyek. Sesuaikan isinya dengan proyek perusahaan yang sebenarnya,
-- lalu set `published = true` agar tampil di aplikasi.
insert into public.projects
  (title, category, location, summary, description, target_amount, raised_amount, min_investment,
   expected_return_pct, tenor_months, risk_level, status, closing_date, highlights, published)
values
  ('Ekspansi Pabrik Kemasan Karton', 'Manufaktur', 'Bekasi, Jawa Barat',
   'Penambahan lini produksi kemasan karton bergelombang untuk klien FMCG.',
   'Proyek ini membiayai pembelian dua unit mesin corrugator dan perluasan gudang seluas 1.200 m².',
   2500000000, 1625000000, 10000000, 14, 24, 'Sedang', 'open', now() + interval '45 days',
   array['Kontrak pembelian dari 3 klien FMCG', 'Bagi hasil dibayarkan per kuartal', 'Aset mesin sebagai jaminan'],
   true),
  ('Kemasan Ramah Lingkungan (Paper Pouch)', 'Produk Baru', 'Surabaya, Jawa Timur',
   'Pengembangan lini kemasan berbahan kertas daur ulang untuk UMKM makanan.',
   'Dana digunakan untuk riset material, sertifikasi food-grade, dan mesin pembuat pouch otomatis.',
   1200000000, 360000000, 5000000, 18, 36, 'Tinggi', 'open', now() + interval '90 days',
   array['Pasar kemasan ramah lingkungan tumbuh pesat', 'Sudah ada 120 UMKM calon pembeli'],
   true);
