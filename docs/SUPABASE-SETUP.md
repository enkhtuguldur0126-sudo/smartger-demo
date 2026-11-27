# Supabase тохируулах заавар (06-р шат)

Энэ заавар нэг удаа хийгдэнэ. Бүх өгөгдөл одоохондоо **зохиомол**. Бодит өгөгдлийг хуульчийн хариу (B1) болон өгөгдлийн гэрээ ирсний дараа л оруулна.

> ⚠️ **service_role**, **secret** түлхүүр болон өгөгдлийн сангийн **нууц үгийг** хэзээ ч кодонд, чатад, хэнд ч бүү илгээ. Зөвхөн Project URL ба publishable түлхүүр нийтэд харагдаж болно.

## 1. Хүснэгтүүдийг үүсгэх
1. Энэ холбоосыг нээ: https://raw.githubusercontent.com/enkhtuguldur0126-sudo/smartger-demo/main/supabase/schema.sql
2. Бүгдийг сонгоод (Ctrl+A эсвэл утсан дээр "Select all") хуулна.
3. Supabase → зүүн цэсний **SQL Editor** → **New query** → буулгаад → **Run** дарна.
4. Харагдах ёстой: доор "Success. No rows returned".

## 2. Зохиомол өгөгдлийг оруулах
1. https://raw.githubusercontent.com/enkhtuguldur0126-sudo/smartger-demo/main/supabase/seed.sql нээж, бүгдийг хуулна.
2. SQL Editor → **New query** → буулгаад → **Run**.
3. Шалгах: зүүн цэсний **Table Editor** → `projects` хүснэгтэд 5 мөр, `is_fictional` багана `TRUE` байна.

## 3. Бүртгүүлэхийг хаах, сайтын хаяг
1. **Authentication → Sign In / Providers** → "Allow new users to sign up" унтраана (хэн ч өөрөө бүртгүүлэхгүй).
2. **Authentication → URL Configuration** → Site URL: `https://enkhtuguldur0126-sudo.github.io/smartger-demo/` → Save.

## 4. Админ хэрэглэгч (та өөрөө)
1. **Authentication → Users → Add user → Create new user**. Имэйл, нууц үг (10+ тэмдэгт) бичиж, "Auto Confirm User" сонгоод Create.
2. SQL Editor-т дараахыг бичиж (имэйлийг өөрийнхөөрөө сольж) Run:
   ```sql
   update public.profiles set role = 'admin' where email = 'таны-имэйл';
   ```

## 5. Туршилтын компанийн хэрэглэгч
1. Дахин **Add user**. Gmail ашигладаг бол `нэр+sumber@gmail.com` гэх мэт хаяг таны ижил имэйл хайрцагт очно.
2. Сайт → Нэвтрэх → админаар орно → **Админ → Хэрэглэгчид** → шинэ хэрэглэгчийг "Сүмбэр Өргөө Девелопмент"-д холбоно.

## 6. Өдөр бүрийн нөөцлөлт (GitHub)
1. Supabase → дээд талын **Connect** → **Session pooler** холбоосыг хуулна. `[YOUR-PASSWORD]` хэсэгт өгөгдлийн сангийн нууц үгээ бичнэ. **Үүнийг надад бүү илгээ.**
2. GitHub → репо → **Settings → Secrets and variables → Actions → New repository secret**:
   - `SUPABASE_DB_URL` = дээрх холбоос
   - `BACKUP_PASSPHRASE` = нөөцийг шифрлэх урт нууц үг (өөр газар хадгал; алдвал нөөцийг нээж чадахгүй)
3. GitHub → **Actions → Backup database → Run workflow**. Хоёр алхам (backup, restore-test) ногоон болно. Restore-test нь нөөцийг хоосон санд сэргээж шалгадаг.

## Нөөцөөс сэргээх (яаралтай үед)
1. Actions → хамгийн сүүлийн амжилттай "Backup database" → доор **Artifacts**-аас татна.
2. `gpg -d smartger-backup.tar.gz.gpg > backup.tar.gz` (BACKUP_PASSPHRASE асууна), `tar -xzf backup.tar.gz`.
3. `pg_restore --no-owner --no-privileges -d "<Supabase холбоос>" smartger.dump`. Зургууд `photos/` хавтсанд.

## Анхаарах
- Supabase-ийн үнэгүй багц 1 долоо хоног ашиглагдахгүй бол түр зогсдог. Dashboard-аас "Restore" дарж сэргээнэ. Өдөр бүрийн нөөц (GitHub) үүнээс үл хамааран хадгалагдана.
- Компани нийтлэгдсэн мэдээллийг засвал тэр мөр админ дахин батлах хүртэл нийтэд түр харагдахгүй.
- Явцын зургийн хавтас нийтэд нээлттэй (холбоосоор). Хянагдаагүй зургийн холбоос сайт дээр харагдахгүй ч холбоосыг мэдсэн хүн нээж болно.
