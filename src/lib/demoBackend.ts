import AsyncStorage from '@react-native-async-storage/async-storage';

import { SEED_PROJECTS } from './seed';
import type { Backend, Investment, Profile, SessionUser, SignUpInput } from './types';

/**
 * Backend lokal untuk mencoba aplikasi tanpa server. Semua data hanya disimpan
 * di perangkat ini — JANGAN dipakai untuk rilis produksi.
 */

type DemoAccount = { profile: Profile; password: string };

const KEY_ACCOUNTS = 'demo:accounts';
const KEY_SESSION = 'demo:session';
const KEY_INVESTMENTS = 'demo:investments';

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

type StoredInvestment = Investment & { userId: string };

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
    return SEED_PROJECTS;
  },

  async getProject(id) {
    return SEED_PROJECTS.find((p) => p.id === id) ?? null;
  },

  async submitInvestment(projectId, amount, note) {
    const user = await requireUser();
    const project = SEED_PROJECTS.find((p) => p.id === projectId);
    if (!project) throw new Error('Proyek tidak ditemukan.');
    const all = await readJson<StoredInvestment[]>(KEY_INVESTMENTS, []);
    all.unshift({
      id: `inv-${Date.now()}`,
      userId: user.id,
      projectId,
      projectTitle: project.title,
      amount,
      note,
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await writeJson(KEY_INVESTMENTS, all);
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
    await writeJson(KEY_INVESTMENTS, all);
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
};
