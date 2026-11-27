#!/usr/bin/env bash
# Нөөц файлыг хоосон Postgres-д сэргээж, өгөгдөл бүрэн эсэхийг шалгана.
# Хэрэглээ: scripts/restore-test.sh <backup.dump> <хоосон өгөгдлийн сангийн холбоос>
# Supabase-ийн auth/storage хэсгийг supabase/test/supabase-stub.sql дуурайлгана.
set -euo pipefail
DUMP="$1"; DB="$2"
HERE="$(cd "$(dirname "$0")/.." && pwd)"
psql "$DB" -q -v ON_ERROR_STOP=0 -f "$HERE/supabase/test/supabase-stub.sql" >/dev/null 2>&1 || true
# "public" схем аль хэдийн байдаг тул жагсаалтаас хасна.
pg_restore -l "$DUMP" | grep -v ' SCHEMA - public ' > /tmp/restore.list
set +e
pg_restore --no-owner --no-privileges -L /tmp/restore.list -d "$DB" "$DUMP" 2> /tmp/restore.err
set -e
# Зөвшөөрөгдөх цорын ганц алдаа: профайл -> auth.users холбоос (auth хэсэг нөөцөд ордоггүй, Supabase дээр байдаг).
UNEXPECTED=$(grep -E '^pg_restore: error' /tmp/restore.err | grep -v 'profiles_id_fkey' || true)
if [ -n "$UNEXPECTED" ]; then cat /tmp/restore.err; echo "СЭРГЭЭХ АЛДАА"; exit 1; fi
echo "Сэргээсэн хүснэгтүүд:"
FAIL=0
for t in companies projects phases blocks unit_types progress claims prices snapshots benchmarks audit_log profiles; do
  n=$(psql "$DB" -tAc "select count(*) from public.$t")
  echo "  $t: $n"
  case $t in companies|projects|phases|blocks|unit_types) [ "$n" -gt 0 ] || FAIL=1 ;; esac
done
rls=$(psql "$DB" -tAc "select count(*) from pg_tables where schemaname='public' and rowsecurity")
pol=$(psql "$DB" -tAc "select count(*) from pg_policies where schemaname='public'")
echo "  RLS асаалттай хүснэгт: $rls, эрхийн дүрэм: $pol"
[ "$rls" -ge 11 ] && [ "$pol" -ge 40 ] || FAIL=1
[ $FAIL = 0 ] && echo "СЭРГЭЭХ ТУРШИЛТ АМЖИЛТТАЙ" || { echo "СЭРГЭЭХ ТУРШИЛТ АМЖИЛТГҮЙ"; exit 1; }
