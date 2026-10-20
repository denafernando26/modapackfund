import type { InvestmentStatus, ProjectInput } from './types';

/**
 * Perubahan status yang boleh dilakukan admin. Harus sama dengan aturan di fungsi
 * `admin_set_investment_status` (supabase/admin.sql), yang menjadi penentu akhirnya.
 */
export const ADMIN_TRANSITIONS: Record<InvestmentStatus, InvestmentStatus[]> = {
  pending: ['contacted', 'approved', 'rejected'],
  contacted: ['approved', 'rejected'],
  approved: ['contacted'],
  rejected: ['contacted'],
  cancelled: [],
};

const WIB_OFFSET_MS = 7 * 3_600_000;

/** ISO → "YYYY-MM-DD" menurut tanggal WIB. */
export function isoToWibDate(iso: string | null): string {
  if (!iso) return '';
  const t = Date.parse(iso);
  return Number.isNaN(t) ? '' : new Date(t + WIB_OFFSET_MS).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → ISO pukul 23.59 WIB pada tanggal itu, atau null bila tidak valid. */
export function wibDateToIso(date: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const t = Date.parse(`${date}T23:59:59+07:00`);
  if (Number.isNaN(t) || isoToWibDate(new Date(t).toISOString()) !== date) return null;
  return new Date(t).toISOString();
}

/** Mengembalikan pesan kesalahan pertama, atau null bila data proyek valid. */
export function validateProject(p: ProjectInput): string | null {
  if (!p.title.trim()) return 'Judul proyek wajib diisi.';
  if (!p.category.trim()) return 'Kategori wajib diisi.';
  if (p.targetAmount <= 0) return 'Target dana harus lebih dari 0.';
  if (p.minInvestment <= 0) return 'Minimum investasi harus lebih dari 0.';
  if (p.minInvestment > p.targetAmount) return 'Minimum investasi tidak boleh melebihi target dana.';
  if (p.raisedAmount > p.targetAmount) return 'Dana terkumpul tidak boleh melebihi target dana.';
  if (!Number.isInteger(p.tenorMonths) || p.tenorMonths <= 0) return 'Tenor harus berupa bulan, lebih dari 0.';
  if (!(p.expectedReturnPct >= 0 && p.expectedReturnPct < 1000)) return 'Estimasi imbal hasil tidak valid.';
  for (const url of [p.imageUrl, p.prospectusUrl]) {
    if (url && !/^https:\/\/\S+$/i.test(url)) return 'URL gambar dan prospektus harus diawali https://';
  }
  return null;
}

/** "0812-3456 789" / "+62 812…" → "628123456789" untuk tautan wa.me; kosong bila tidak valid. */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return digits;
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('8')) return `62${digits}`;
  return '';
}
