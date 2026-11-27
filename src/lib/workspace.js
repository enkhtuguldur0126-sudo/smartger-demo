// Компанийн самбар ба админы хуудсанд хэрэгтэй өгөгдлийн сангийн үйлдлүүд.
// Эрхийг өгөгдлийн сан өөрөө (RLS) шалгадаг: энд зөвхөн хүсэлт илгээнэ.
import { getClient, photoBucket } from './backend.js';
import { TABLES } from './rows.js';

const KEYS = ['companies', 'projects', 'phases', 'blocks', 'unitTypes', 'progress', 'claims', 'prices', 'snapshots', 'benchmarks'];

async function client() {
  const c = await getClient();
  if (!c) throw new Error('backend not configured');
  return c;
}

// Надад харагдах бүх мөр (компани: нийтлэгдсэн + өөрийн; админ: бүгд). Хуучин мөр нь доор, шинэ нь дээр.
export async function loadAll() {
  const c = await client();
  const res = await Promise.all(KEYS.map((k) => c.from(TABLES[k].table).select('*').order('updated_at', { ascending: false })));
  const out = {};
  res.forEach((r, i) => {
    if (r.error) throw r.error;
    out[KEYS[i]] = r.data.map((row) => ({ ...TABLES[KEYS[i]].from(row), _row: row }));
  });
  return out;
}

// Нэмэх эсвэл засах. Компанийн бичсэн мөр автоматаар "хянагдаж буй" болно.
export async function saveRecord(kind, record) {
  const c = await client();
  const { _row, ...rest } = record;
  const row = TABLES[kind].to(rest);
  const { error } = await c.from(TABLES[kind].table).upsert(row, { onConflict: kind === 'snapshots' ? 'project_id' : 'id' });
  if (error) throw error;
}

export async function saveMany(kind, records) {
  const c = await client();
  const rows = records.map((r) => TABLES[kind].to(r));
  const { error } = await c.from(TABLES[kind].table).upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

// Админ: нийтлэх, татгалзах, зохиомол/бодит тэмдэглэх.
export async function review(kind, id, status, isFictional) {
  const c = await client();
  const key = kind === 'snapshots' ? 'project_id' : 'id';
  const patch = { review_status: status };
  if (typeof isFictional === 'boolean') patch.is_fictional = isFictional;
  const { error } = await c.from(TABLES[kind].table).update(patch).eq(key, id);
  if (error) throw error;
}

// Явцын зураг: <компани>/<явцын id>-<цаг>.<өргөтгөл> руу оруулна.
export async function uploadPhoto(companyId, progressId, file) {
  const c = await client();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${companyId}/${progressId}-${Date.now()}.${ext}`;
  const { error } = await c.storage.from(photoBucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  return path;
}

// Утасны байршлыг асууна (хүн зөвшөөрвөл). Татгалзвал null.
export function currentPosition() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  });
}

// Админ: өөрчлөлтийн түүх ба хэрэглэгчид.
export async function loadAudit(limit = 200) {
  const c = await client();
  const { data, error } = await c.from('audit_log').select('*').order('at', { ascending: false }).limit(limit);
  if (error) throw error;
  return data;
}

export async function loadProfiles() {
  const c = await client();
  const { data, error } = await c.from('profiles').select('*').order('created_at');
  if (error) throw error;
  return data;
}

export async function updateProfile(id, patch) {
  const c = await client();
  const { error } = await c.from('profiles').update(patch).eq('id', id);
  if (error) throw error;
}

// Админ: хэрэглэгчийг бүрмөсөн устгана (өгөгдлийн сангийн admin_delete_user функц).
export async function deleteUser(id) {
  const c = await client();
  const { error } = await c.rpc('admin_delete_user', { target: id });
  if (error) throw error;
}
