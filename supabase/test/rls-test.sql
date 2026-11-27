-- Зөвхөн дотоод туршилт: эрхийн дүрмийг шалгана. Алдаа гарвал зогсоно.
\set ON_ERROR_STOP 1
insert into auth.users values ('00000000-0000-0000-0000-0000000000a1', 'admin@example.test'),
                              ('00000000-0000-0000-0000-0000000000c1', 'sumber@example.test'),
                              ('00000000-0000-0000-0000-0000000000c2', 'khangai@example.test') on conflict do nothing;
update profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update profiles set company_id = 'c-sumber' where id = '00000000-0000-0000-0000-0000000000c1';
update profiles set company_id = 'c-khangai' where id = '00000000-0000-0000-0000-0000000000c2';
delete from projects where id like 't-%';
delete from audit_log where row_id like 't-%';

create or replace function pg_temp.expect_fail(sql text, label text) returns void language plpgsql as $$
begin
  begin execute sql; exception when others then raise notice 'OK  %: хориглогдсон (%)', label, sqlerrm; return; end;
  raise exception 'FAIL %: зөвшөөрөгдсөн байна', label;
end $$;
create or replace function pg_temp.expect(cond boolean, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK  %', label; else raise exception 'FAIL %', label; end if; end $$;

-- 1. Нэвтрээгүй хэрэглэгч (anon)
set role anon; select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from projects) = 5, 'anon: нийтлэгдсэн 5 төслийг харна');
select pg_temp.expect_fail($$insert into projects (id, company_id, status, last_update, lat, lng, data) values ('t-x','c-sumber','planning','2026-11-27',47.9,106.9,'{}')$$, 'anon: төсөл нэмэх');
select pg_temp.expect_fail($$update projects set status = 'completed' where id = 'p-khavryn-tuyaa'$$, 'anon: засах');
select pg_temp.expect_fail($$delete from projects where id = 'p-khavryn-tuyaa'$$, 'anon: устгах');
select pg_temp.expect((select count(*) from projects) = 5 and (select status from projects where id = 'p-khavryn-tuyaa') = 'under_construction', 'anon: юу ч өөрчлөгдөөгүй');
select pg_temp.expect((select count(*) from audit_log) = 0, 'anon: түүхийг харахгүй');
select pg_temp.expect((select count(*) from profiles) = 0, 'anon: профайл харахгүй');
reset role;

-- 2. Компанийн хэрэглэгч (Сүмбэр)
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
insert into projects (id, company_id, status, last_update, lat, lng, data, review_status)
  values ('t-new', 'c-sumber', 'planning', '2026-11-27', 47.9, 106.9, '{"name":{"mn":"Тест","en":"Test"}}', 'published');
select pg_temp.expect((select review_status from projects where id = 't-new') = 'pending', 'компани: шинэ төсөл "хянагдаж буй" болно (published гэж бичсэн ч)');
insert into phases (id, project_id, number, promised_handover, data) values ('t-ph', 't-new', 1, '2028-01', '{}');
select pg_temp.expect((select company_id from phases where id = 't-ph') = 'c-sumber', 'компани: ээлжид компани автоматаар бөглөгдөнө');
select pg_temp.expect_fail($$insert into projects (id, company_id, status, last_update, lat, lng, data) values ('t-y','c-khangai','planning','2026-11-27',47.9,106.9,'{}')$$, 'компани: өөр компанид төсөл нэмэх');
select pg_temp.expect_fail($$insert into phases (id, project_id, number, promised_handover, data) values ('t-ph2','p-tsenkher-khundii',3,'2029-01','{}')$$, 'компани: өөр компанийн төсөлд ээлж нэмэх');
update projects set status = 'completed' where id = 'p-tsenkher-khundii';
select pg_temp.expect((select status from projects where id = 'p-tsenkher-khundii') = 'under_construction', 'компани: өөр компанийн төслийг засахгүй');
select pg_temp.expect_fail($$update projects set company_id = 'c-khangai' where id = 't-new'$$, 'компани: төслөө өөр компанид шилжүүлэх');
select pg_temp.expect_fail($$insert into companies (id, data) values ('c-fake', '{}')$$, 'компани: шинэ компани үүсгэх');
select pg_temp.expect_fail($$insert into benchmarks (id, data) values ('b-fake', '{}')$$, 'компани: жишиг үнэ нэмэх');
select pg_temp.expect_fail($$insert into projects (id, company_id, status, last_update, lat, lng, data) values ('t-z','c-sumber','planning','2026-11-27',47.9,106.9,'{"totalArea":{"value":5}}')$$, 'компани: эх сурвалжгүй тоо');
select pg_temp.expect_fail($$insert into claims (id, project_id, text, source, date, state) values ('t-cl','t-new','{"mn":"x"}','company',null,'planned')$$, 'компани: огноогүй амлалт');
update profiles set role = 'admin' where id = auth.uid();
select pg_temp.expect(not public.is_admin(), 'компани: өөрийгөө админ болгож чадахгүй');
delete from projects where id = 'p-sumber-3';
select pg_temp.expect((select count(*) from projects where id = 'p-sumber-3') = 1, 'компани: устгаж чадахгүй');
update projects set data = data || '{"note":"шинэчилсэн"}' where id = 'p-khavryn-tuyaa';
select pg_temp.expect((select review_status from projects where id = 'p-khavryn-tuyaa') = 'pending', 'компани: нийтлэгдсэн төслийг засвал дахин хянагдана');
reset role;

-- 3. Нэвтрээгүй хүн хянагдаагүй мэдээллийг харахгүй
set role anon; select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from projects where id in ('t-new', 'p-khavryn-tuyaa')) = 0, 'anon: хянагдаж буй төслийг харахгүй');
reset role;

-- 4. Өөр компани (Хангай) Сүмбэрийн хянагдаагүй мэдээллийг харахгүй
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c2', false);
select pg_temp.expect((select count(*) from projects where id = 't-new') = 0, 'өөр компани: хянагдаж буйг харахгүй');
reset role;

-- 5. Админ шалгаж нийтэлнэ
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select pg_temp.expect((select count(*) from projects where review_status = 'pending') = 2, 'админ: хянах дараалалд 2 төсөл');
update projects set review_status = 'published' where id in ('t-new', 'p-khavryn-tuyaa');
select pg_temp.expect((select bool_and(reviewed_by = auth.uid() and reviewed_at is not null) from projects where id in ('t-new','p-khavryn-tuyaa')), 'админ: хэн, хэзээ баталсныг бичнэ');
select pg_temp.expect((select count(*) from audit_log where row_id = 't-new' and actor = '00000000-0000-0000-0000-0000000000c1' and action = 'INSERT') = 1, 'түүх: компани нэмснийг бичсэн');
select pg_temp.expect((select count(*) from audit_log where row_id = 't-new' and actor = '00000000-0000-0000-0000-0000000000a1' and action = 'UPDATE') = 1, 'түүх: админ баталсныг бичсэн');
select pg_temp.expect_fail($$delete from audit_log$$, 'админ: түүхийг устгах');
select pg_temp.expect_fail($$update audit_log set actor = null$$, 'админ: түүхийг засах');
reset role;

-- 6. Одоо нэвтрээгүй хүн харна
set role anon; select set_config('request.jwt.claim.sub', '', false);
select pg_temp.expect((select count(*) from projects where id = 't-new') = 1, 'anon: баталсны дараа харагдана');
reset role;

-- 7. Зураг: компани зөвхөн өөрийн хавтас руу
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', false);
insert into storage.objects (bucket_id, name) values ('progress-photos', 'c-sumber/t.jpg');
select pg_temp.expect(true, 'зураг: өөрийн хавтас руу оруулна');
select pg_temp.expect_fail($$insert into storage.objects (bucket_id, name) values ('progress-photos', 'c-khangai/t.jpg')$$, 'зураг: өөр компанийн хавтас руу');
reset role;

-- 8. Өөрөө бүртгүүлсэн хэрэглэгч: эрхгүй, админ устгана
insert into auth.users (id, email, raw_user_meta_data) values ('00000000-0000-0000-0000-0000000000d1', 'new@example.test', '{"company_name":"Шинэ компани (зохиомол)"}') on conflict do nothing;
select pg_temp.expect((select requested_company from profiles where id = '00000000-0000-0000-0000-0000000000d1') = 'Шинэ компани (зохиомол)', 'бүртгэл: компанийн нэр хадгалагдсан');
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000d1', false);
select pg_temp.expect_fail($$insert into projects (id, company_id, status, last_update, lat, lng, data) values ('t-n','c-sumber','planning','2026-11-27',47.9,106.9,'{}')$$, 'шинэ бүртгэл: компанид холбогдоогүй үед төсөл нэмэх');
select pg_temp.expect_fail($$select public.admin_delete_user('00000000-0000-0000-0000-0000000000c2')$$, 'шинэ бүртгэл: бусдыг устгах');
reset role;
set role authenticated; select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', false);
select pg_temp.expect_fail($$select public.admin_delete_user('00000000-0000-0000-0000-0000000000a1')$$, 'админ: өөрийгөө устгах');
select public.admin_delete_user('00000000-0000-0000-0000-0000000000d1');
reset role;
select pg_temp.expect((select count(*) from auth.users where id = '00000000-0000-0000-0000-0000000000d1') = 0 and (select count(*) from profiles where id = '00000000-0000-0000-0000-0000000000d1') = 0, 'админ: бүртгэл устгасан');
select pg_temp.expect((select count(*) from audit_log where table_name = 'profiles' and row_id = '00000000-0000-0000-0000-0000000000d1') >= 1, 'түүх: устгасныг бичсэн');

-- Цэвэрлэгээ
select set_config('request.jwt.claim.sub', '', false);
delete from projects where id like 't-%';
delete from audit_log where row_id like 't-%';
update projects set data = data - 'note', review_status = 'published' where id = 'p-khavryn-tuyaa';
delete from storage.objects;
select 'ALL_TESTS_PASSED';
