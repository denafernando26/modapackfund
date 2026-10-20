-- Mengisi akun demo untuk peninjau Google Play dengan data contoh.
--
-- 1. Buat akunnya dulu: Supabase Dashboard → Authentication → Users → Add user
--    → Create new user, isi email & kata sandi, centang "Auto Confirm User".
-- 2. Ganti email di bawah bila berbeda, lalu jalankan skrip ini di SQL Editor.
--
-- Aman dijalankan berulang: pengajuan lama milik akun demo dihapus lalu dibuat ulang.
-- Pengajuan contoh di sini bercatatan "[DEMO]". Pengajuan yang dikirim peninjau sendiri lewat
-- aplikasi tidak bertanda; tim mengenalinya dari akun peninjau dan tidak perlu menindaklanjuti.

do $$
declare
  v_email    text := 'peninjau.play@modapack.co.id';
  v_user     uuid;
  v_projects record;
  v_count    int := 0;
begin
  select id into v_user from auth.users where lower(email) = lower(v_email);
  if v_user is null then
    raise exception 'Akun % belum ada. Buat dulu di Authentication → Users → Add user (centang Auto Confirm User).', v_email;
  end if;

  insert into public.profiles (id, full_name, phone, city, occupation)
  values (v_user, 'Peninjau Google Play', '081200000000', 'Jakarta', 'Peninjau aplikasi')
  on conflict (id) do update
    set full_name = excluded.full_name,
        phone = excluded.phone,
        city = excluded.city,
        occupation = excluded.occupation;

  delete from public.investments where user_id = v_user;

  -- Satu pengajuan per status, dibagi ke proyek yang dipublikasikan.
  for v_projects in
    with p as (
      select id, min_investment, row_number() over (order by created_at, id) as n,
             count(*) over () as total
      from public.projects
      where published
    ),
    demo(i, status, multiplier, days_ago) as (
      values (1, 'approved', 5, 60), (2, 'contacted', 1, 9), (3, 'pending', 2, 1)
    )
    select p.id, p.min_investment * demo.multiplier as amount, demo.status, demo.days_ago
    from demo
    join p on p.n = 1 + (demo.i - 1) % p.total
  loop
    insert into public.investments (user_id, project_id, amount, note, status, created_at)
    values (v_user, v_projects.id, v_projects.amount, '[DEMO] Data contoh untuk peninjau Google Play',
            v_projects.status, now() - make_interval(days => v_projects.days_ago));
    v_count := v_count + 1;
  end loop;

  if v_count = 0 then
    raise exception 'Belum ada proyek dengan published = true. Jalankan seed.sql atau publikasikan proyek dulu.';
  end if;

  raise notice 'Akun demo % siap dengan % pengajuan contoh.', v_email, v_count;
end
$$;
