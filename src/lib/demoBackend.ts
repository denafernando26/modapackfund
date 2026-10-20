import AsyncStorage from '@react-native-async-storage/async-storage';

import { ADMIN_TRANSITIONS } from './admin';
import { SEED_PROJECTS } from './seed';
import type {
  AdminInvestment,
  AdminProject,
  Backend,
  Investment,
  InvestmentStatus,
  Profile,
  SessionUser,
  SignUpInput,
  StatusChange,
} from './types';

/**
 * Backend lokal untuk mencoba aplikasi tanpa server. Semua data hanya disimpan
 * di perangkat ini — JANGAN dipakai untuk rilis produksi.
 */

type DemoAccount = { profile: Profile; password: string };

const KEY_ACCOUNTS = 'demo:accounts';
const KEY_SESSION = 'demo:session';
const KEY_INVESTMENTS = 'demo:investments';
const KEY_PROJECTS = 'demo:projects';
const KEY_STATUS_LOG = 'demo:status-log';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? (JSON.parse(raw) as T) : fallback;
}

async function writeJson(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

const listeners = new Set<(user: SessionUser | null) => void>();

function emit(user: SessionUser | null) {
  listeners.forEach((cb) => cb(user));
}

async function requireUser(): Promise<SessionUser> {
  const user = await readJson<SessionUser | null>(KEY_SESSION, null);
  if (!user) throw new Error('Silakan masuk terlebih dahulu.');
  return user;
}

type StoredInvestment = Investment & { userId: string; updatedAt?: string };
type StoredStatusChange = StatusChange & { investmentId: string };

/** Proyek contoh, ditambah perubahan yang dibuat lewat panel admin demo. */
function readProjects(): Promise<AdminProject[]> {
  return readJson<AdminProject[]>(
    KEY_PROJECTS,
    SEED_PROJECTS.map((p) => ({ ...p, published: true })),
  );
}

async function logStatus(investmentId: string, from: InvestmentStatus | null, to: InvestmentStatus, note: string) {
  const user = await readJson<SessionUser | null>(KEY_SESSION, null);
  const log = await readJson<StoredStatusChange[]>(KEY_STATUS_LOG, []);
  log.push({
    id: `log-${Date.now()}-${log.length}`,
    investmentId,
    fromStatus: from,
    toStatus: to,
    note,
    changedBy: user?.email ?? '',
    createdAt: new Date().toISOString(),
  });
  await writeJson(KEY_STATUS_LOG, log);
}

async function readAdminInvestments(): Promise<AdminInvestment[]> {
  const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
  const accounts = await readJson<Record<string, DemoAccount>>(KEY_ACCOUNTS, {});
  const profiles = new Map(Object.values(accounts).map((a) => [a.profile.id, a.profile]));
  return all.map(({ userId, updatedAt, ...i }) => {
    const p = profiles.get(userId);
    return {
      ...i,
      updatedAt: updatedAt ?? i.createdAt,
      investor: {
        id: userId,
        fullName: p?.fullName ?? '',
        email: p?.email ?? '',
        phone: p?.phone ?? '',
        city: p?.city ?? '',
        occupation: p?.occupation ?? '',
      },
    };
  });
}

export const demoBackend: Backend = {
  mode: 'demo',

  getUser: () => readJson<SessionUser | null>(KEY_SESSION, null),

  onAuthChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  async signIn(email, password) {
    const accounts = await readJson<Record<string, DemoAccount>>(KEY_ACCOUNTS, {});
    const account = accounts[email.toLowerCase()];
    if (!account || account.password !== password) {
      throw new Error('Email atau kata sandi salah.');
    }
    const user = { id: account.profile.id, email: account.profile.email };
    await writeJson(KEY_SESSION, user);
    emit(user);
  },

  async signUp({ email, password, fullName, phone }: SignUpInput) {
    const key = email.toLowerCase();
    const accounts = await readJson<Record<string, DemoAccount>>(KEY_ACCOUNTS, {});
    if (accounts[key]) throw new Error('Email sudah terdaftar.');
    const profile: Profile = {
      id: `user-${Date.now()}`,
      email: key,
      fullName,
      phone,
      city: '',
      occupation: '',
    };
    accounts[key] = { profile, password };
    await writeJson(KEY_ACCOUNTS, accounts);
    const user = { id: profile.id, email: key };
    await writeJson(KEY_SESSION, user);
    emit(user);
    return { needsEmailConfirmation: false };
  },

  async signOut() {
    await AsyncStorage.removeItem(KEY_SESSION);
    emit(null);
  },

  async deleteAccount() {
    const user = await requireUser();
    const accounts = await readJson<Record<string, DemoAccount>>(KEY_ACCOUNTS, {});
    delete accounts[user.email];
    await writeJson(KEY_ACCOUNTS, accounts);
    const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
    await writeJson(
      KEY_INVESTMENTS,
      all.filter((i) => i.userId !== user.id),
    );
    await AsyncStorage.removeItem(KEY_SESSION);
    emit(null);
  },

  async listProjects() {
    return (await readProjects()).filter((p) => p.published);
  },

  async getProject(id) {
    return (await readProjects()).find((p) => p.id === id) ?? null;
  },

  async submitInvestment(projectId, amount, note) {
    const user = await requireUser();
    const project = (await readProjects()).find((p) => p.id === projectId);
    if (!project) throw new Error('Proyek tidak ditemukan.');
    const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
    const id = `inv-${Date.now()}`;
    all.unshift({
      id,
      userId: user.id,
      projectId,
      projectTitle: project.title,
      amount,
      note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await writeJson(KEY_INVESTMENTS, all);
    await logStatus(id, null, 'pending', '');
  },

  async listMyInvestments() {
    const user = await requireUser();
    const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
    return all.filter((i) => i.userId === user.id);
  },

  async cancelInvestment(id) {
    const user = await requireUser();
    const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
    const target = all.find((i) => i.id === id && i.userId === user.id);
    if (!target || target.status !== 'pending') {
      throw new Error('Pengajuan ini tidak dapat dibatalkan.');
    }
    target.status = 'cancelled';
    target.updatedAt = new Date().toISOString();
    await writeJson(KEY_INVESTMENTS, all);
    await logStatus(id, 'pending', 'cancelled', '');
  },

  async getProfile() {
    const user = await requireUser();
    const accounts = await readJson<Record<string, DemoAccount>>(KEY_ACCOUNTS, {});
    return accounts[user.email]?.profile ?? null;
  },

  async updateProfile(patch) {
    const user = await requireUser();
    const accounts = await readJson<Record<string, DemoAccount>>(KEY_ACCOUNTS, {});
    const account = accounts[user.email];
    if (!account) throw new Error('Akun tidak ditemukan.');
    account.profile = { ...account.profile, ...patch };
    await writeJson(KEY_ACCOUNTS, accounts);
  },

  // Di mode demo setiap akun dianggap admin agar panel admin bisa dicoba.
  async isAdmin() {
    return true;
  },

  adminListInvestments: readAdminInvestments,

  async adminGetInvestment(id) {
    return (await readAdminInvestments()).find((i) => i.id === id) ?? null;
  },

  async adminInvestmentHistory(id) {
    const log = await readJson<StoredStatusChange[]>(KEY_STATUS_LOG, []);
    return log.filter((l) => l.investmentId === id).map(({ investmentId, ...l }) => l);
  },

  async adminSetInvestmentStatus(id, status, note) {
    const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
    const target = all.find((i) => i.id === id);
    if (!target) throw new Error('Pengajuan tidak ditemukan.');
    if (!ADMIN_TRANSITIONS[target.status].includes(status)) {
      throw new Error('Status pengajuan ini tidak dapat diubah ke status tersebut.');
    }
    const from = target.status;
    target.status = status;
    target.updatedAt = new Date().toISOString();
    await writeJson(KEY_INVESTMENTS, all);
    await logStatus(id, from, status, note.trim());
  },

  adminListProjects: readProjects,

  async adminGetProject(id) {
    return (await readProjects()).find((p) => p.id === id) ?? null;
  },

  async adminSaveProject(id, input) {
    const projects = await readProjects();
    if (id) {
      const index = projects.findIndex((p) => p.id === id);
      if (index < 0) throw new Error('Proyek tidak ditemukan.');
      projects[index] = { ...input, id };
    } else {
      id = `demo-${Date.now()}`;
      projects.unshift({ ...input, id });
    }
    await writeJson(KEY_PROJECTS, projects);
    return id;
  },
};
