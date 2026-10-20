-- Skema database Modapack Fund untuk Supabase.
-- Jalankan sekali di Supabase Dashboard → SQL Editor.
-- Tim internal mengelola proyek & status pengajuan lewat Table Editor (service role melewati RLS).

-- ───────────── Profil investor ─────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  phone       text,
  city        text,
  occupation  text,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profil: baca milik sendiri" on public.profiles
  for select to authenticated using (id = auth.uid());
create policy "profil: buat milik sendiri" on public.profiles
  for insert to authenticated with check (id = auth.uid());
create policy "profil: ubah milik sendiri" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Buat baris profil otomatis saat pengguna mendaftar.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'phone');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── Proyek ─────────────
create table if not exists public.projects (
  id                   uuid primary key default gen_random_uuid(),
  title                text not null,
  category             text not null,
  location             text not null default '',
  summary              text not null default '',
  description          text not null default '',
  image_url            text,
  target_amount        numeric(16, 0) not null check (target_amount > 0),
  raised_amount        numeric(16, 0) not null default 0 check (raised_amount >= 0),
  min_investment       numeric(16, 0) not null check (min_investment > 0),
  expected_return_pct  numeric(5, 2) not null default 0,
  tenor_months         int not null check (tenor_months > 0),
  risk_level           text not null check (risk_level in ('Rendah', 'Sedang', 'Tinggi')),
  status               text not null default 'open' check (status in ('open', 'funded', 'running', 'completed')),
  closing_date         timestamptz,
  highlights           text[] not null default '{}',
  prospectus_url       text,
  published            boolean not null default false,
  created_at           timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "proyek: investor membaca yang dipublikasikan" on public.projects
  for select to authenticated using (published);

-- ───────────── Pengajuan minat investasi ─────────────
create table if not exists public.investments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  project_id  uuid not null references public.projects (id),
  amount      numeric(16, 0) not null check (amount > 0),
  note        text,
  status      text not null default 'pending'
              check (status in ('pending', 'contacted', 'approved', 'rejected', 'cancelled')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists investments_user_idx on public.investments (user_id);
create index if not exists investments_project_idx on public.investments (project_id);

alter table public.investments enable row level security;

create policy "investasi: baca milik sendiri" on public.investments
  for select to authenticated using (user_id = auth.uid());

-- Investor hanya boleh membuat pengajuan berstatus 'pending' untuk proyek yang
-- sedang dibuka, dengan nominal ≥ minimum dan ≤ sisa kuota.
create policy "investasi: ajukan untuk proyek terbuka" on public.investments
  for insert to authenticated with check (
    user_id = auth.uid()
    and status = 'pending'
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.published
        and p.status = 'open'
        and (p.closing_date is null or p.closing_date > now())
        and amount >= p.min_investment
        and amount <= p.target_amount - p.raised_amount
    )
  );

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists investments_touch on public.investments;
create trigger investments_touch
  before update on public.investments
  for each row execute function public.touch_updated_at();

-- Investor membatalkan pengajuannya sendiri selama masih 'pending'.
create or replace function public.cancel_investment(investment_id uuid)
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  update public.investments
     set status = 'cancelled'
   where id = investment_id
     and user_id = auth.uid()
     and status = 'pending';
  if not found then
    raise exception 'Pengajuan ini tidak dapat dibatalkan.';
  end if;
end;
$$;

revoke all on function public.cancel_investment(uuid) from public, anon;
grant execute on function public.cancel_investment(uuid) to authenticated;

-- Hapus akun dari dalam aplikasi (diwajibkan Google Play untuk aplikasi dengan akun).
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Tidak ada sesi aktif.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
