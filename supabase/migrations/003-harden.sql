-- 003: Supabase-ийн аюулгүй байдлын зөвлөмжөөр. Trigger функцуудыг API-аар дуудах боломжгүй болгоно.
-- (Trigger өөрөө ажилласаар байна. is_admin, my_company-г RLS дүрэм ашигладаг тул нээлттэй үлдэнэ.)
alter function public.sourced_ok(jsonb) set search_path = public;
revoke execute on function public.before_write() from public, anon, authenticated;
revoke execute on function public.fill_company_id() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.write_audit() from public, anon, authenticated;
