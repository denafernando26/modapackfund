import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type User } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type {
  AdminInvestment,
  AdminProject,
  Backend,
  Investment,
  Profile,
  Project,
  ProjectInput,
  SessionUser,
  StatusChange,
} from './types';

type ProjectRow = {
  id: string;
  title: string;
  category: string;
  location: string;
  summary: string;
  description: string;
  image_url: string | null;
  target_amount: number;
  raised_amount: number;
  min_investment: number;
  expected_return_pct: number;
  tenor_months: number;
  risk_level: Project['riskLevel'];
  status: Project['status'];
  closing_date: string | null;
  highlights: string[] | null;
  prospectus_url: string | null;
  published: boolean;
};

type InvestmentRow = {
  id: string;
  project_id: string;
  amount: number;
  note: string | null;
  status: Investment['status'];
  created_at: string;
  projects: { title: string } | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  city: string | null;
  occupation: string | null;
};

function toProject(r: ProjectRow): Project {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    location: r.location,
    summary: r.summary,
    description: r.description,
    imageUrl: r.image_url,
    targetAmount: Number(r.target_amount),
    raisedAmount: Number(r.raised_amount),
    minInvestment: Number(r.min_investment),
    expectedReturnPct: Number(r.expected_return_pct),
    tenorMonths: r.tenor_months,
    riskLevel: r.risk_level,
    status: r.status,
    closingDate: r.closing_date,
    highlights: r.highlights ?? [],
    prospectusUrl: r.prospectus_url,
  };
}

function toAdminProject(r: ProjectRow): AdminProject {
  return { ...toProject(r), published: r.published };
}

function toProjectRow(p: ProjectInput): Omit<ProjectRow, 'id'> {
  return {
    title: p.title,
    category: p.category,
    location: p.location,
    summary: p.summary,
    description: p.description,
    image_url: p.imageUrl,
    target_amount: p.targetAmount,
    raised_amount: p.raisedAmount,
    min_investment: p.minInvestment,
    expected_return_pct: p.expectedReturnPct,
    tenor_months: p.tenorMonths,
    risk_level: p.riskLevel,
    status: p.status,
    closing_date: p.closingDate,
    highlights: p.highlights,
    prospectus_url: p.prospectusUrl,
    published: p.published,
  };
}

/** Baris hasil fungsi `admin_investments` (supabase/admin.sql). */
type AdminInvestmentRow = {
  id: string;
  project_id: string;
  project_title: string;
  amount: number;
  note: string | null;
  status: Investment['status'];
  created_at: string;
  updated_at: string;
  user_id: string;
  investor_name: string | null;
  investor_email: string | null;
  investor_phone: string | null;
  investor_city: string | null;
  investor_occupation: string | null;
};

function toAdminInvestment(r: AdminInvestmentRow): AdminInvestment {
  return {
    id: r.id,
    projectId: r.project_id,
    projectTitle: r.project_title,
    amount: Number(r.amount),
    note: r.note ?? '',
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    investor: {
      id: r.user_id,
      fullName: r.investor_name ?? '',
      email: r.investor_email ?? '',
      phone: r.investor_phone ?? '',
      city: r.investor_city ?? '',
      occupation: r.investor_occupation ?? '',
    },
  };
}

type StatusChangeRow = {
  id: number;
  from_status: StatusChange['fromStatus'];
  to_status: StatusChange['toStatus'];
  note: string | null;
  changed_by_email: string | null;
  created_at: string;
};

function toSessionUser(u: User | null | undefined): SessionUser | null {
  return u ? { id: u.id, email: u.email ?? '' } : null;
}

function translateError(message: string): string {
  if (/invalid login credentials/i.test(message)) return 'Email atau kata sandi salah.';
  if (/email not confirmed/i.test(message)) return 'Email belum dikonfirmasi. Periksa kotak masuk Anda.';
  if (/already registered/i.test(message)) return 'Email sudah terdaftar.';
  if (/password should be/i.test(message)) return 'Kata sandi minimal 6 karakter.';
  // update/insert + .single() tanpa baris hasil: diblokir RLS atau datanya tidak ada.
  if (/cannot coerce the result to a single json object/i.test(message)) {
    return 'Data tidak ditemukan atau Anda tidak berhak mengubahnya.';
  }
  return message;
}

function check<T>(res: { data?: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(translateError(res.error.message));
  return res.data as T;
}

export function createSupabaseBackend(url: string, anonKey: string): Backend {
  const supabase = createClient(url, anonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });

  // Supabase menyarankan menghentikan refresh token saat aplikasi di latar belakang.
  if (Platform.OS !== 'web') {
    AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });
  }

  async function requireUserId(): Promise<string> {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    if (!id) throw new Error('Silakan masuk terlebih dahulu.');
    return id;
  }

  return {
    mode: 'supabase',

    async getUser() {
      const { data } = await supabase.auth.getSession();
      return toSessionUser(data.session?.user);
    },

    onAuthChange(cb) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        cb(toSessionUser(session?.user));
      });
      return () => data.subscription.unsubscribe();
    },

    async signIn(email, password) {
      check<unknown>(await supabase.auth.signInWithPassword({ email, password }));
    },

    async signUp({ email, password, fullName, phone }) {
      const data = check(
        await supabase.auth.signUp({
          email,
          password,
          // Dibaca oleh trigger `handle_new_user` untuk membuat baris profil.
          options: { data: { full_name: fullName, phone } },
        }),
      );
      return { needsEmailConfirmation: !data.session };
    },

    async signOut() {
      check(await supabase.auth.signOut());
    },

    async deleteAccount() {
      check(await supabase.rpc('delete_my_account'));
      await supabase.auth.signOut();
    },

    async listProjects() {
      const rows = check(
        await supabase.from('projects').select('*').eq('published', true).order('created_at', { ascending: false }),
      );
      return (rows as ProjectRow[]).map(toProject);
    },

    async getProject(id) {
      const row = check(await supabase.from('projects').select('*').eq('id', id).maybeSingle());
      return row ? toProject(row as ProjectRow) : null;
    },

    async submitInvestment(projectId, amount, note) {
      const userId = await requireUserId();
      check(
        await supabase.from('investments').insert({ user_id: userId, project_id: projectId, amount, note }),
      );
    },

    async listMyInvestments() {
      const userId = await requireUserId();
      const rows = check(
        await supabase
          .from('investments')
          .select('id, project_id, amount, note, status, created_at, projects(title)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      );
      return (rows as unknown as InvestmentRow[]).map((r) => ({
        id: r.id,
        projectId: r.project_id,
        projectTitle: r.projects?.title ?? '-',
        amount: Number(r.amount),
        note: r.note ?? '',
        status: r.status,
        createdAt: r.created_at,
      }));
    },

    async cancelInvestment(id) {
      check(await supabase.rpc('cancel_investment', { investment_id: id }));
    },

    async getProfile() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const row = check(await supabase.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()) as
        | ProfileRow
        | null;
      const profile: Profile = {
        id: auth.user.id,
        email: auth.user.email ?? '',
        fullName: row?.full_name ?? '',
        phone: row?.phone ?? '',
        city: row?.city ?? '',
        occupation: row?.occupation ?? '',
      };
      return profile;
    },

    async updateProfile(patch) {
      const userId = await requireUserId();
      check(
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: patch.fullName,
          phone: patch.phone,
          city: patch.city,
          occupation: patch.occupation,
        }),
      );
    },

    async isAdmin() {
      // Sebelum supabase/admin.sql dijalankan, fungsi ini belum ada: anggap bukan admin.
      const { data, error } = await supabase.rpc('is_admin');
      return !error && data === true;
    },

    async adminListInvestments() {
      const rows = check(await supabase.rpc('admin_investments'));
      return (rows as AdminInvestmentRow[]).map(toAdminInvestment);
    },

    async adminGetInvestment(id) {
      const rows = check(await supabase.rpc('admin_investments', { investment_id: id }));
      const row = (rows as AdminInvestmentRow[])[0];
      return row ? toAdminInvestment(row) : null;
    },

    async adminInvestmentHistory(id) {
      const rows = check(await supabase.rpc('admin_investment_history', { investment_id: id }));
      return (rows as StatusChangeRow[]).map((r) => ({
        id: String(r.id),
        fromStatus: r.from_status,
        toStatus: r.to_status,
        note: r.note ?? '',
        changedBy: r.changed_by_email ?? '',
        createdAt: r.created_at,
      }));
    },

    async adminSetInvestmentStatus(id, status, note) {
      check(
        await supabase.rpc('admin_set_investment_status', {
          investment_id: id,
          new_status: status,
          status_note: note || null,
        }),
      );
    },

    async adminListProjects() {
      const rows = check(await supabase.from('projects').select('*').order('created_at', { ascending: false }));
      return (rows as ProjectRow[]).map(toAdminProject);
    },

    async adminGetProject(id) {
      const row = check(await supabase.from('projects').select('*').eq('id', id).maybeSingle());
      return row ? toAdminProject(row as ProjectRow) : null;
    },

    async adminSaveProject(id, input) {
      const row = toProjectRow(input);
      const saved = check(
        id
          ? await supabase.from('projects').update(row).eq('id', id).select('id').single()
          : await supabase.from('projects').insert(row).select('id').single(),
      ) as { id: string };
      return saved.id;
    },
  };
}
