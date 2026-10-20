import type { InvestmentStatus, ProjectStatus } from './types';

export function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Rp 1.250.000 */
export function formatRupiah(n: number): string {
  return `Rp ${groupThousands(n)}`;
}

/** Rp 1,25 M / Rp 750 Jt */
export function formatRupiahShort(n: number): string {
  const units: [number, string][] = [
    [1e12, 'T'],
    [1e9, 'M'],
    [1e6, 'Jt'],
  ];
  for (const [value, label] of units) {
    if (n >= value) {
      const v = (n / value).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
      return `Rp ${v} ${label}`;
    }
  }
  return formatRupiah(n);
}

/** Mengubah input bebas ("1.000.000", "Rp 1000000") menjadi angka. */
export function parseRupiah(text: string): number {
  const digits = text.replace(/\D/g, '');
  return digits ? Number(digits) : 0;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function daysLeft(iso: string | null): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  open: 'Penggalangan Dibuka',
  funded: 'Pendanaan Terpenuhi',
  running: 'Proyek Berjalan',
  completed: 'Selesai',
};

export const INVESTMENT_STATUS_LABEL: Record<InvestmentStatus, string> = {
  pending: 'Menunggu Tinjauan',
  contacted: 'Dihubungi Tim',
  approved: 'Disetujui',
  rejected: 'Ditolak',
  cancelled: 'Dibatalkan',
};
