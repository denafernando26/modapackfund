import type { Project } from './types';

/**
 * Data contoh untuk mode demo. Ganti dengan proyek perusahaan yang sebenarnya
 * di tabel `projects` Supabase (lihat supabase/seed.sql).
 */
export const SEED_PROJECTS: Project[] = [
  {
    id: 'demo-1',
    title: 'Ekspansi Pabrik Kemasan Karton',
    category: 'Manufaktur',
    location: 'Bekasi, Jawa Barat',
    summary: 'Penambahan lini produksi kemasan karton bergelombang untuk klien FMCG.',
    description:
      'Proyek ini membiayai pembelian dua unit mesin corrugator dan perluasan gudang seluas 1.200 m². ' +
      'Kapasitas produksi diproyeksikan naik 40% untuk memenuhi kontrak jangka panjang dengan tiga klien FMCG nasional.',
    imageUrl: null,
    targetAmount: 2_500_000_000,
    raisedAmount: 1_625_000_000,
    minInvestment: 10_000_000,
    expectedReturnPct: 14,
    tenorMonths: 24,
    riskLevel: 'Sedang',
    status: 'open',
    closingDate: new Date(Date.now() + 45 * 86_400_000).toISOString(),
    highlights: [
      'Kontrak pembelian dari 3 klien FMCG',
      'Bagi hasil dibayarkan per kuartal',
      'Aset mesin sebagai jaminan',
    ],
    prospectusUrl: null,
  },
  {
    id: 'demo-2',
    title: 'Kemasan Ramah Lingkungan (Paper Pouch)',
    category: 'Produk Baru',
    location: 'Surabaya, Jawa Timur',
    summary: 'Pengembangan lini kemasan berbahan kertas daur ulang untuk UMKM makanan.',
    description:
      'Dana digunakan untuk riset material, sertifikasi food-grade, dan mesin pembuat pouch otomatis. ' +
      'Target pasar adalah UMKM makanan dan minuman yang beralih dari plastik.',
    imageUrl: null,
    targetAmount: 1_200_000_000,
    raisedAmount: 360_000_000,
    minInvestment: 5_000_000,
    expectedReturnPct: 18,
    tenorMonths: 36,
    riskLevel: 'Tinggi',
    status: 'open',
    closingDate: new Date(Date.now() + 90 * 86_400_000).toISOString(),
    highlights: ['Pasar kemasan ramah lingkungan tumbuh pesat', 'Sudah ada 120 UMKM calon pembeli'],
    prospectusUrl: null,
  },
  {
    id: 'demo-3',
    title: 'Gudang Distribusi Makassar',
    category: 'Logistik',
    location: 'Makassar, Sulawesi Selatan',
    summary: 'Gudang distribusi untuk mempercepat pengiriman ke Indonesia Timur.',
    description:
      'Pembangunan gudang distribusi seluas 2.000 m² dekat pelabuhan untuk memangkas waktu kirim ke klien di Indonesia Timur dari 14 hari menjadi 4 hari.',
    imageUrl: null,
    targetAmount: 3_000_000_000,
    raisedAmount: 3_000_000_000,
    minInvestment: 25_000_000,
    expectedReturnPct: 12,
    tenorMonths: 48,
    riskLevel: 'Rendah',
    status: 'running',
    closingDate: null,
    highlights: ['Pendanaan sudah terpenuhi', 'Konstruksi berjalan 60%'],
    prospectusUrl: null,
  },
];
