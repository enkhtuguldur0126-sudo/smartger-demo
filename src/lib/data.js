// Бүх өгөгдөл JSON файлаас ачаалагдана. Кодонд өгөгдөл бичихгүй.
import companies from '../data/companies.json';
import projects from '../data/projects.json';
import phases from '../data/phases.json';
import blocks from '../data/blocks.json';
import unitTypes from '../data/unitTypes.json';
import progress from '../data/progress.json';
import claims from '../data/claims.json';
import snapshots from '../data/snapshots.json';
import benchmarks from '../data/benchmarks.json';

export const db = { companies, projects, phases, blocks, unitTypes, progress, claims, snapshots, benchmarks };

// Талбар "олдоогүй" эсвэл "үнэ нийтлээгүй" төлөвтэй эсэх.
export function missing(v) {
  return v == null || (typeof v === 'object' && !Array.isArray(v) && 'status' in v && !('value' in v));
}

// {value, source, date} хэлбэртэй талбарын утгыг авна.
export function valueOf(v) {
  if (missing(v)) return null;
  return typeof v === 'object' && 'value' in v ? v.value : v;
}

export const companyById = (id) => companies.find((c) => c.id === id) || null;
export const projectById = (id) => projects.find((p) => p.id === id) || null;
export const phasesOf = (projectId) => phases.filter((p) => p.projectId === projectId);
export const blocksOf = (phaseId) => blocks.filter((b) => b.phaseId === phaseId);
export const unitsOf = (blockId) => unitTypes.filter((u) => u.blockId === blockId);
export const projectsOf = (companyId) => projects.filter((p) => p.companyId === companyId);

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
