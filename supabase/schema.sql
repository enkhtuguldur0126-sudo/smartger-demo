-- Smartger: өгөгдлийн сангийн бүтэц (Supabase / PostgreSQL)
-- Ажиллуулах: Supabase → SQL Editor → New query → энэ файлыг бүхлээр нь хуулж тавиад Run.
-- Дахин ажиллуулахад аюулгүй (байгаа зүйлийг дахин үүсгэхгүй).
--
-- Эрх:
--   зочин   (нэвтрээгүй)   : зөвхөн нийтлэгдсэн (published) мөрийг уншина. Өөрчилж чадахгүй.
--   company (компани)      : өөрийн компанийн мөрийг уншиж, нэмж, засна. Нийтлэх эрхгүй:
--                            оруулсан, зассан бүхэн "pending" (хянагдахыг хүлээж байна) болно.
--   admin   (Smartger)     : бүгдийг уншиж, засаж, нийтэлж, устгана.

-- ---------------------------------------------------------------------------
-- 1. Хэрэглэгчийн профайл ба эрх
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  role        text not null default 'company' check (role in ('company', 'admin')),
  company_id  text,            -- компанийн хэрэглэгч аль компанид харьяалагдах
  requested_company text,      -- бүртгүүлэхдээ бичсэн компанийн нэр (админ шалгана)
  phone       text,
  created_at  timestamptz not null default now()
);

-- Шинэ хэрэглэгч бүртгэгдэхэд профайл үүсгэнэ. Компанийг админ дараа нь оноож өгнө.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_company() returns text
language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid() and role = 'company';
$$;

-- ---------------------------------------------------------------------------
-- 2. Тусламжийн функцууд
-- ---------------------------------------------------------------------------
-- Тоон мэдээлэл бүр {value, source, date} эсвэл {status: "not_found" | "not_published"} байх ёстой.
create or replace function public.sourced_ok(j jsonb) returns boolean
language sql immutable as $$
  select j is null
      or jsonb_typeof(j) = 'null'
      or j ? 'status'
      or (j ? 'value' and j ? 'source' and j ? 'date');
$$;

-- Нийтлэг багануудыг автоматаар бөглөнө, компани өөрөө нийтэлж чадахгүй.
create or replace function public.before_write() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
  end if;
  -- auth.uid() хоосон = SQL Editor/нөөцөөс сэргээх (итгэмжлэгдсэн). Тэгээгүй бол админ эсэхийг шалгана.
  if auth.uid() is not null and not public.is_admin() then
    -- Компанийн оруулсан, зассан бүх зүйл дахин хянагдана.
    new.review_status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.is_fictional := coalesce(new.is_fictional, false);
  elsif new.review_status is distinct from coalesce(old.review_status, '') and new.review_status = 'published' then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Үндсэн хүснэгтүүд. "data" баганад дэлгэцэнд харуулах бусад талбар (mn/en) хадгалагдана.
-- ---------------------------------------------------------------------------
create table if not exists public.companies (
  id            text primary key,
  company_id    text generated always as (id) stored,
  verified      boolean not null default false,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id            text primary key,
  company_id    text not null references public.companies (id),
  status        text not null check (status in ('planning', 'under_construction', 'completed')),
  last_update   date not null,
  lat           double precision not null,
  lng           double precision not null,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now(),
  constraint projects_sourced check (
    public.sourced_ok(data -> 'totalArea') and public.sourced_ok(data -> 'greenArea') and public.sourced_ok(data -> 'totalUnits')
  )
);

create table if not exists public.phases (
  id            text primary key,
  project_id    text not null references public.projects (id) on delete cascade,
  company_id    text,
  number        int not null,
  promised_handover text not null,          -- "2027-06"
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id            text primary key,
  phase_id      text not null references public.phases (id) on delete cascade,
  company_id    text,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

create table if not exists public.unit_types (
  id            text primary key,
  block_id      text not null references public.blocks (id) on delete cascade,
  company_id    text,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now(),
  -- Үнэ бичсэн бол эх сурвалж, огноо заавал.
  constraint unit_price_sourced check (
    jsonb_typeof(data -> 'price') is distinct from 'number'
    or (data ? 'priceSource' and data ? 'priceDate' and data ->> 'priceSource' is not null and data ->> 'priceDate' is not null)
  )
);

create table if not exists public.progress (
  id            text primary key,
  project_id    text not null references public.projects (id) on delete cascade,
  company_id    text,
  date          date not null,
  percent       int not null check (percent between 0 and 100),
  verification_level int not null default 1 check (verification_level between 1 and 4),
  photo_path    text,                       -- Storage дахь зургийн зам
  photo_taken_at timestamptz,               -- зураг авсан огноо
  photo_lat     double precision,           -- зураг авсан байршил
  photo_lng     double precision,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

-- Мэдэгдэл (claim): эх сурвалж, огноо, төлөв заавал.
create table if not exists public.claims (
  id            text primary key,
  project_id    text not null references public.projects (id) on delete cascade,
  company_id    text,
  text          jsonb not null,
  source        text not null check (source in ('company', 'smartger', 'document')),
  date          date not null,
  state         text not null check (state in ('planned', 'done')),
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

-- Зарын үнэ (жишиг). Эх сурвалж, огноо заавал.
create table if not exists public.prices (
  id            text primary key,
  project_id    text not null references public.projects (id) on delete cascade,
  company_id    text,
  category      text not null check (category in ('listing', 'deal')),
  price_per_m2  numeric not null,
  source        text not null,
  date          date not null,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

-- Амлалтын агшин зураг: зөвхөн админ бичнэ, дараа нь өөрчлөгдөхгүй (түүх нь data.history-д).
create table if not exists public.snapshots (
  project_id    text primary key references public.projects (id) on delete cascade,
  company_id    text,
  captured_on   date not null,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

-- ҮСХ зэрэг нийтлэг жишиг үнэ. Зөвхөн админ.
create table if not exists public.benchmarks (
  id            text primary key,
  company_id    text,
  data          jsonb not null,
  is_fictional  boolean not null default false,
  review_status text not null default 'pending' check (review_status in ('pending', 'published', 'rejected')),
  reviewed_by   uuid, reviewed_at timestamptz,
  created_by    uuid, created_at timestamptz not null default now(),
  updated_by    uuid, updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 4. Хүүхэд мөрөнд компанийн id-г эцгээс нь автоматаар авна (эрх шалгахад хэрэглэнэ).
-- ---------------------------------------------------------------------------
create or replace function public.fill_company_id() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_table_name in ('phases', 'progress', 'claims', 'prices', 'snapshots') then
    select company_id into new.company_id from public.projects where id = new.project_id;
  elsif tg_table_name = 'blocks' then
    select company_id into new.company_id from public.phases where id = new.phase_id;
  elsif tg_table_name = 'unit_types' then
    select company_id into new.company_id from public.blocks where id = new.block_id;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Өөрчлөлтийн түүх: хэн, хэзээ, юуг өөрчилсөн.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_log (
  id          bigserial primary key,
  table_name  text not null,
  row_id      text not null,
  action      text not null,
  old_row     jsonb,
  new_row     jsonb,
  actor       uuid,
  at          timestamptz not null default now()
);

create or replace function public.write_audit() returns trigger
language plpgsql security definer set search_path = public as $$
declare rid text;
begin
  rid := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end) ->> 'project_id');
  insert into public.audit_log (table_name, row_id, action, old_row, new_row, actor)
  values (tg_table_name, rid, tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          auth.uid());
  return null;
end $$;

-- ---------------------------------------------------------------------------
-- 6. Trigger ба эрхийн дүрэм (Row Level Security) хүснэгт бүрт
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['companies', 'projects', 'phases', 'blocks', 'unit_types', 'progress', 'claims', 'prices', 'snapshots', 'benchmarks']
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop trigger if exists %I on public.%I', t || '_before_write', t);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.before_write()', t || '_before_write', t);

    if t in ('phases', 'blocks', 'unit_types', 'progress', 'claims', 'prices', 'snapshots') then
      execute format('drop trigger if exists %I on public.%I', t || '_company', t);
      execute format('create trigger %I before insert or update on public.%I for each row execute function public.fill_company_id()', t || '_company', t);
    end if;

    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.write_audit()', t || '_audit', t);

    -- Унших: нийтлэгдсэнийг хүн бүр; өөрийн компанийнхыг компани; бүгдийг админ.
    execute format('drop policy if exists read_rows on public.%I', t);
    execute format($p$create policy read_rows on public.%I for select using (
      review_status = 'published' or public.is_admin() or (company_id is not null and company_id = public.my_company()))$p$, t);

    -- Бичих: админ бүгд; компани зөвхөн өөрийнхийг (snapshots, benchmarks-т компани бичихгүй).
    execute format('drop policy if exists insert_rows on public.%I', t);
    execute format('drop policy if exists update_rows on public.%I', t);
    execute format('drop policy if exists delete_rows on public.%I', t);
    if t in ('snapshots', 'benchmarks') then
      execute format('create policy insert_rows on public.%I for insert with check (public.is_admin())', t);
      execute format('create policy update_rows on public.%I for update using (public.is_admin())', t);
    else
      execute format($p$create policy insert_rows on public.%I for insert with check (
        public.is_admin() or (company_id is not null and company_id = public.my_company()))$p$, t);
      execute format($p$create policy update_rows on public.%I for update using (
        public.is_admin() or (company_id is not null and company_id = public.my_company()))
        with check (public.is_admin() or (company_id is not null and company_id = public.my_company()))$p$, t);
    end if;
    execute format('create policy delete_rows on public.%I for delete using (public.is_admin())', t);
  end loop;
end $$;

-- Компани шинэ компани үүсгэж чадахгүй, зөвхөн өөрийн компанийн мэдээллийг засна.
drop policy if exists insert_rows on public.companies;
create policy insert_rows on public.companies for insert with check (public.is_admin());

-- Профайл: хүн өөрийнхөө профайлыг харна, эрхийг зөвхөн админ өөрчилнө.
alter table public.profiles enable row level security;
drop policy if exists read_own on public.profiles;
create policy read_own on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists admin_update on public.profiles;
create policy admin_update on public.profiles for update using (public.is_admin());

-- Түүхийг зөвхөн админ уншина. Хэн ч засаж, устгаж чадахгүй.
alter table public.audit_log enable row level security;
drop policy if exists admin_read on public.audit_log;
create policy admin_read on public.audit_log for select using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Явцын зураг хадгалах газар (Storage). Компани зөвхөн өөрийн хавтас руу оруулна:
--    progress-photos/<company_id>/<файл>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', true)
on conflict (id) do nothing;

drop policy if exists "company uploads own folder" on storage.objects;
create policy "company uploads own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'progress-photos'
    and (public.is_admin() or (storage.foldername(name))[1] = public.my_company()));

drop policy if exists "admin deletes photos" on storage.objects;
create policy "admin deletes photos" on storage.objects for delete to authenticated
  using (bucket_id = 'progress-photos' and public.is_admin());

-- Хүснэгтэд хандах ерөнхий эрх. Хэн юуг харж, засахыг дээрх RLS дүрэм нарийн шийднэ.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
revoke insert, update, delete on all tables in schema public from anon;

-- Түүхийг хэн ч (админ ч) засаж, устгаж чадахгүй. Зөвхөн trigger бичнэ.
revoke insert, update, delete, truncate on public.audit_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 8. Өөрөө бүртгүүлэх ба админ бүртгэл устгах (migrations/002-signup.sql-тэй ижил)
-- ---------------------------------------------------------------------------
-- 002: Сайт дээр өөрөө бүртгүүлэх, админ бүртгэл устгах.
-- Шинэ бүртгэл "company" эрхтэй боловч компанид холбогдоогүй тул админ холбох хүртэл юу ч өөрчилж чадахгүй.
alter table public.profiles add column if not exists requested_company text;
alter table public.profiles add column if not exists phone text;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, requested_company, phone)
  values (new.id, new.email,
          left(nullif(trim(new.raw_user_meta_data ->> 'company_name'), ''), 200),
          left(nullif(trim(new.raw_user_meta_data ->> 'phone'), ''), 40))
  on conflict (id) do nothing;
  return new;
end $$;

-- Админ хэрэглэгчийг бүрмөсөн устгана (нэвтрэх бүртгэл + профайл). Өөрийгөө устгаж болохгүй.
create or replace function public.admin_delete_user(target uuid) returns void
language plpgsql security definer set search_path = public as $$
declare who text;
begin
  if not public.is_admin() then raise exception 'only admin'; end if;
  if target = auth.uid() then raise exception 'cannot delete yourself'; end if;
  select email into who from public.profiles where id = target;
  insert into public.audit_log (table_name, row_id, action, old_row, actor)
  values ('profiles', target::text, 'DELETE', jsonb_build_object('email', who), auth.uid());
  delete from auth.users where id = target;
end $$;

revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 9. Аюулгүй байдал (migrations/003-harden.sql-тэй ижил)
-- ---------------------------------------------------------------------------
-- 003: Supabase-ийн аюулгүй байдлын зөвлөмжөөр. Trigger функцуудыг API-аар дуудах боломжгүй болгоно.
-- (Trigger өөрөө ажилласаар байна. is_admin, my_company-г RLS дүрэм ашигладаг тул нээлттэй үлдэнэ.)
alter function public.sourced_ok(jsonb) set search_path = public;
revoke execute on function public.before_write() from public, anon, authenticated;
revoke execute on function public.fill_company_id() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.write_audit() from public, anon, authenticated;
