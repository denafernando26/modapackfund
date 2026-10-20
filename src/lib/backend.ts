import { demoBackend } from './demoBackend';
import { createSupabaseBackend } from './supabaseBackend';
import type { Backend } from './types';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/** Supabase bila kredensial tersedia, selain itu mode demo lokal. */
export const backend: Backend = url && anonKey ? createSupabaseBackend(url, anonKey) : demoBackend;

export const contact = {
  whatsapp: process.env.EXPO_PUBLIC_CONTACT_WHATSAPP ?? '',
  email: process.env.EXPO_PUBLIC_CONTACT_EMAIL ?? '',
};
