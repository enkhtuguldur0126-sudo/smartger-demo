// Өгөгдөл: өгөгдлийн сан (Supabase) тохируулсан бол тэндээс, үгүй бол JSON файлаас. Кодонд өгөгдөл бичихгүй.
import companies from '../data/companies.json';
import projects from '../data/projects.json';
import phases from '../data/phases.json';
import blocks from '../data/blocks.json';
import unitTypes from '../data/unitTypes.json';
import progress from '../data/progress.json';
import claims from '../data/claims.json';
import snapshots from '../data/snapshots.json';
import benchmarks from '../data/benchmarks.json';
import prices from '../data/prices.json';
import qa from '../data/qa.json';
import reports from '../data/reports.json';

// JSON өгөгдөл бүгд зохиомол.
const fictional = (list) => list.map((x) => ({ ...x, isFictional: true, reviewStatus: 'published' }));

export const db = {
  companies: fictional(companies), projects: fictional(projects), phases: fictional(phases), blocks: fictional(blocks),
  unitTypes: fictional(unitTypes), progress: fictional(progress), claims: fictional(claims), snapshots: fictional(snapshots),
  benchmarks: fictional(benchmarks), prices: fictional(prices), qa, reports,
  source: 'json' // 'json' эсвэл 'database'
};

// Өгөгдлийн сангаас зөвхөн нийтлэгдсэн (шалгагдсан) мөрийг уншина. Алдаа гарвал JSON хэвээр үлдэнэ.
export async function loadData() {
  const { getClient } = await import('./backend.js');
  const client = await getClient();
  if (!client) return db.source;
  try {
    const { TABLES } = await import('./rows.js');
    const keys = Object.keys(TABLES);
    const results = await Promise.all(
      keys.map((k) => client.from(TABLES[k].table).select('*').eq('review_status', 'published'))
    );
    const failed = results.find((r) => r.error);
    if (failed) throw failed.error;
    if (results[keys.indexOf('projects')].data.length === 0) throw new Error('empty database');
    keys.forEach((k, i) => db[k].splice(0, db[k].length, ...results[i].data.map(TABLES[k].from)));
    db.source = 'database';
  } catch (e) {
    console.warn('Өгөгдлийн сан уншиж чадсангүй, JSON ашиглана:', e);
  }
  return db.source;
}

// Талбар "олдоогүй" эсвэл "үнэ нийтлээгүй" төлөвтэй эсэх.
export function missing(v) {
  return v == null || (typeof v === 'object' && !Array.isArray(v) && 'status' in v && !('value' in v));
}

// {value, source, date} хэлбэртэй талбарын утгыг авна.
export function valueOf(v) {
  if (missing(v)) return null;
  return typeof v === 'object' && 'value' in v ? v.value : v;
}

export const companyById = (id) => db.companies.find((c) => c.id === id) || null;
export const projectById = (id) => db.projects.find((p) => p.id === id) || null;
export const phasesOf = (projectId) => db.phases.filter((p) => p.projectId === projectId);
export const blocksOf = (phaseId) => db.blocks.filter((b) => b.phaseId === phaseId);
export const unitsOf = (blockId) => db.unitTypes.filter((u) => u.blockId === blockId);
export const projectsOf = (companyId) => db.projects.filter((p) => p.companyId === companyId);

export function unitsOfProject(projectId) {
  return phasesOf(projectId).flatMap((ph) => blocksOf(ph.id).flatMap((b) => unitsOf(b.id)));
}

export function availableCount(projectId) {
  return unitsOfProject(projectId)
    .filter((u) => u.status === 'available')
    .reduce((sum, u) => sum + (u.availableCount || 0), 0);
}

// Хамгийн ойрын ээлжийн амласан хугацаа.
export function nextHandover(projectId) {
  const list = phasesOf(projectId).map((p) => p.promisedHandover).sort();
  return list[0] || null;
}

// Аль нэг ээлж амласнаасаа хоцорсон эсэх.
export function isDelayed(projectId) {
  return phasesOf(projectId).some(
    (p) => typeof p.currentEstimate === 'string' && p.currentEstimate > p.promisedHandover
  );
}

// 60 хоногоос дээш шинэчлэлгүй эсэх (demo-д "өнөөдөр"-ийг тогтмол авна).
export const DEMO_TODAY = '2026-11-27';
export function isStale(project, today = DEMO_TODAY) {
  const days = (new Date(today) - new Date(project.lastUpdate)) / 86400000;
  return days > 60;
}

// Бүх байр зарагдсан эсэх (зарагдсан хотхон өгөгдмөлөөр нуугдана).
export function isSoldOut(projectId) {
  const units = unitsOfProject(projectId);
  return units.length > 0 && units.every((u) => u.status === 'sold');
}

// Эхлэх үнэ: хамгийн бага м² үнэ, эх сурвалж, огноотой. Нийтлээгүй бол {status}.
export function startingPrice(projectId) {
  const priced = unitsOfProject(projectId).filter((u) => typeof u.pricePerM2 === 'number');
  if (priced.length === 0) return { status: 'not_published' };
  const min = priced.reduce((a, b) => (b.pricePerM2 < a.pricePerM2 ? b : a));
  return { value: min.pricePerM2, source: min.priceSource, date: min.priceDate };
}

export const companyOf = (project) => companyById(project.companyId);

// Үнийг сая төгрөгөөр (2 оронтой) харуулна.
export const millions = (v, locale) =>
  (Number(v) / 1e6).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });


export const unitById = (id) => db.unitTypes.find((u) => u.id === id) || null;
export const blockById = (id) => db.blocks.find((b) => b.id === id) || null;
export const phaseById = (id) => db.phases.find((p) => p.id === id) || null;
export const progressOf = (projectId) =>
  db.progress.filter((p) => p.projectId === projectId).sort((a, b) => (a.date < b.date ? 1 : -1));
export const claimsOf = (projectId) => db.claims.filter((c) => c.projectId === projectId);
export const snapshotOf = (projectId) => db.snapshots.find((s) => s.projectId === projectId) || null;
export const listingPricesOf = (projectId) => db.prices.filter((p) => p.projectId === projectId && p.category === 'listing');

// Байрны төрлөөс төсөл хүртэлх замыг олно.
export function unitContext(unit) {
  const block = blockById(unit.blockId);
  const phase = block && phaseById(block.phaseId);
  const project = phase && projectById(phase.projectId);
  return { block, phase, project };
}

// "2026-10" ба "2027-05" хоорондох сарын зөрүү.
export function monthsBetween(a, b) {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  return (by - ay) * 12 + (bm - am);
}

export const qaOf = (projectId) => db.qa.filter((q) => q.projectId === projectId);

// Хариу өгсөн хувь ба дундаж хариулах хугацаа (хоногоор).
export function qaStats(projectId) {
  const list = qaOf(projectId);
  const answered = list.filter((q) => q.answer);
  const days = answered.map((q) => (new Date(q.answeredOn) - new Date(q.askedOn)) / 86400000);
  return {
    total: list.length,
    answered: answered.length,
    rate: list.length ? Math.round((answered.length / list.length) * 100) : null,
    avgDays: days.length ? Math.round((days.reduce((a, b) => a + b, 0) / days.length) * 10) / 10 : null
  };
}
