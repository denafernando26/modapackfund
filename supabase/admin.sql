-- Panel admin Modapack Fund.
-- Jalankan di Supabase Dashboard → SQL Editor SETELAH schema.sql. Aman dijalankan ulang.
--
-- Mendaftarkan admin (akun harus sudah terdaftar di Authentication → Users):
--   insert into public.admins (user_id)
--   select id from auth.users where email = 'admin@modapack.id'
--   on conflict do nothing;
-- Mencabut admin:
--   delete from public.admins
--   where user_id = (select id from auth.users where email = 'admin@modapack.id');

-- ───────────── Daftar admin ─────────────
-- Hanya bisa diubah lewat SQL Editor: RLS aktif tanpa policy, jadi API (anon key) tidak
-- dapat membaca maupun menulis tabel ini. Jangan menandai admin lewat user_metadata,
-- karena pengguna bisa mengubah metadata miliknya sendiri.
create table if not exists public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ───────────── Proyek ─────────────
-- Admin melihat semua proyek (termasuk draf), menambah, dan mengubahnya.
-- Tidak ada policy hapus: proyek yang sudah punya pengajuan cukup dijadikan draf.
drop policy if exists "proyek: admin membaca semua" on public.projects;
create policy "proyek: admin membaca semua" on public.projects
  for select to authenticated using ((select public.is_admin()));

drop policy if exists "proyek: admin menambah" on public.projects;
create policy "proyek: admin menambah" on public.projects
  for insert to authenticated with check ((select public.is_admin()));

drop policy if exists "proyek: admin mengubah" on public.projects;
create policy "proyek: admin mengubah" on public.projects
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ───────────── Riwayat status pengajuan ─────────────
-- Diisi otomatis oleh trigger untuk setiap pengajuan baru dan setiap perubahan status,
-- termasuk pembatalan oleh investor dan perubahan lewat Table Editor (changed_by kosong).
create table if not exists public.investment_status_log (
  id             bigint generated always as identity primary key,
  investment_id  uuid not null references public.investments (id) on delete cascade,
  from_status    text,
  to_status      text not null,
  note           text,
  changed_by     uuid references auth.users (id) on delete set null,
  created_at     timestamptz not null default now()
);

create index if not exists investment_status_log_investment_idx
  on public.investment_status_log (investment_id);

-- Tanpa policy: hanya dibaca lewat fungsi admin_investment_history.
alter table public.investment_status_log enable row level security;

create or replace function public.log_investment_status()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.investment_status_log (investment_id, from_status, to_status, note, changed_by)
    values (
      new.id,
      case when tg_op = 'UPDATE' then old.status end,
      new.status,
      -- Catatan admin diteruskan oleh admin_set_investment_status lewat set_config.
      nullif(current_setting('modapack.status_note', true), ''),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists investments_log_status on public.investments;
create trigger investments_log_status
  after insert or update of status on public.investments
  for each row execute function public.log_investment_status();

-- ───────────── Fungsi admin ─────────────
-- Data pengajuan beserta data investor. Email diambil dari auth.users, yang tidak
-- dapat dibaca langsung lewat API.
create or replace function public.admin_investments(investment_id uuid default null)
returns table (
  id                   uuid,
  project_id           uuid,
  project_title        text,
  amount               numeric,
  note                 text,
  status               text,
  created_at           timestamptz,
  updated_at           timestamptz,
  user_id              uuid,
  investor_name        text,
  investor_email       text,
  investor_phone       text,
  investor_city        text,
  investor_occupation  text
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat melihat data ini.';
  end if;
  return query
    select i.id, i.project_id, p.title, i.amount, i.note, i.status, i.created_at, i.updated_at,
           i.user_id, pr.full_name, u.email::text, pr.phone, pr.city, pr.occupation
      from public.investments i
      join public.projects p on p.id = i.project_id
      left join public.profiles pr on pr.id = i.user_id
      left join auth.users u on u.id = i.user_id
     where admin_investments.investment_id is null or i.id = admin_investments.investment_id
     order by i.created_at desc;
end;
$$;

revoke all on function public.admin_investments(uuid) from public, anon;
grant execute on function public.admin_investments(uuid) to authenticated;

create or replace function public.admin_investment_history(investment_id uuid)
returns table (
  id                bigint,
  from_status       text,
  to_status         text,
  note              text,
  changed_by_email  text,
  created_at        timestamptz
)
language plpgsql
stable
security definer set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat melihat data ini.';
  end if;
  return query
    select l.id, l.from_status, l.to_status, l.note, u.email::text, l.created_at
      from public.investment_status_log l
      left join auth.users u on u.id = l.changed_by
     where l.investment_id = admin_investment_history.investment_id
     order by l.created_at, l.id;
end;
$$;

revoke all on function public.admin_investment_history(uuid) from public, anon;
grant execute on function public.admin_investment_history(uuid) to authenticated;

-- Satu-satunya jalan bagi admin untuk mengubah status pengajuan.
-- Alur: pending → contacted → approved/rejected; approved/rejected dapat dikoreksi
-- kembali ke contacted. Pengajuan yang dibatalkan investor tidak dapat diubah.
-- Samakan dengan ADMIN_TRANSITIONS di src/lib/admin.ts.
create or replace function public.admin_set_investment_status(
  investment_id uuid,
  new_status text,
  status_note text default null
)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  current_status text;
begin
  if not public.is_admin() then
    raise exception 'Hanya admin yang dapat mengubah status pengajuan.';
  end if;

  select i.status into current_status
    from public.investments i
   where i.id = admin_set_investment_status.investment_id
     for update;
  if not found then
    raise exception 'Pengajuan tidak ditemukan.';
  end if;

  if not (
    (current_status = 'pending' and new_status in ('contacted', 'approved', 'rejected'))
    or (current_status = 'contacted' and new_status in ('approved', 'rejected'))
    or (current_status in ('approved', 'rejected') and new_status = 'contacted')
  ) then
    raise exception 'Status tidak dapat diubah dari % ke %.', current_status, new_status;
  end if;

  perform set_config('modapack.status_note', coalesce(trim(status_note), ''), true);
  update public.investments i
     set status = new_status
   where i.id = admin_set_investment_status.investment_id;
  perform set_config('modapack.status_note', '', true);
end;
$$;

revoke all on function public.admin_set_investment_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_investment_status(uuid, text, text) to authenticated;
