// JSON дахь зохиомол өгөгдлийг Supabase-д оруулах SQL файл болгон хувиргана.
// Ажиллуулах: node scripts/make-seed.mjs  ->  supabase/seed.sql
// Бүх мөр is_fictional = true (зохиомол), review_status = 'published' гэж тэмдэглэгдэнэ.
import { readFileSync, writeFileSync } from 'node:fs';

const read = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}.json`, import.meta.url), 'utf8'));
const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const DQ = '$' + 'j' + '$';
const j = (o) => `${DQ}${JSON.stringify(o)}${DQ}::jsonb`;
const omit = (o, keys) => Object.fromEntries(Object.entries(o).filter(([k]) => !keys.includes(k)));

const out = [
  '-- Автоматаар үүсгэсэн (scripts/make-seed.mjs). Гараар бүү засаарай.',
  '-- Зохиомол demo өгөгдөл: is_fictional = true. Бодит өгөгдлөөс тусдаа тэмдэглэгдэнэ.',
  'begin;'
];
const add = (table, cols, vals, conflict = 'id') =>
  out.push(
    `insert into public.${table} (${cols.join(', ')}, is_fictional, review_status) values (${vals.join(', ')}, true, 'published')` +
      ` on conflict (${conflict}) do update set ${cols.filter((c) => c !== conflict).map((c) => `${c} = excluded.${c}`).join(', ')}, is_fictional = true, review_status = 'published';`
  );

for (const c of read('companies')) add('companies', ['id', 'verified', 'data'], [q(c.id), !!c.verified, j(omit(c, ['id', 'verified']))]);
for (const p of read('projects'))
  add('projects', ['id', 'company_id', 'status', 'last_update', 'lat', 'lng', 'data'],
    [q(p.id), q(p.companyId), q(p.status), q(p.lastUpdate), p.coords[0], p.coords[1], j(omit(p, ['id', 'companyId', 'status', 'lastUpdate', 'coords']))]);
for (const ph of read('phases'))
  add('phases', ['id', 'project_id', 'number', 'promised_handover', 'data'],
    [q(ph.id), q(ph.projectId), ph.number, q(ph.promisedHandover), j(omit(ph, ['id', 'projectId', 'number', 'promisedHandover']))]);
for (const b of read('blocks')) add('blocks', ['id', 'phase_id', 'data'], [q(b.id), q(b.phaseId), j(omit(b, ['id', 'phaseId']))]);
for (const u of read('unitTypes')) add('unit_types', ['id', 'block_id', 'data'], [q(u.id), q(u.blockId), j(omit(u, ['id', 'blockId']))]);
for (const r of read('progress'))
  add('progress', ['id', 'project_id', 'date', 'percent', 'verification_level', 'data'],
    [q(r.id), q(r.projectId), q(r.date), r.percent, r.verificationLevel, j(omit(r, ['id', 'projectId', 'date', 'percent', 'verificationLevel']))]);
for (const c of read('claims'))
  add('claims', ['id', 'project_id', 'text', 'source', 'date', 'state'], [q(c.id), q(c.projectId), j(c.text), q(c.source), q(c.date), q(c.state)]);
for (const p of read('prices'))
  add('prices', ['id', 'project_id', 'category', 'price_per_m2', 'source', 'date', 'data'],
    [q(p.id), q(p.projectId), q(p.category), p.pricePerM2, q(p.source), q(p.date), j(omit(p, ['id', 'projectId', 'category', 'pricePerM2', 'source', 'date']))]);
for (const s of read('snapshots'))
  add('snapshots', ['project_id', 'captured_on', 'data'], [q(s.projectId), q(s.capturedOn), j(omit(s, ['projectId', 'capturedOn']))], 'project_id');
for (const b of read('benchmarks')) add('benchmarks', ['id', 'data'], [q(b.id), j(omit(b, ['id']))]);

out.push('commit;');
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), out.join('\n') + '\n');
console.log(`supabase/seed.sql: ${out.length - 4} insert`);
