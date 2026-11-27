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
