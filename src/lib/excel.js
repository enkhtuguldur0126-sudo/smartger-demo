// Байрны төрлүүдийг Excel (.xlsx) файлаас уншина. read-excel-file санг зөвхөн хэрэгтэй үед ачаална.
import { DIRS, UNIT_STATUS } from './forms.js';

export const EXCEL_COLUMNS = ['block', 'rooms', 'area', 'floors', 'balcony', 'orientation', 'price', 'priceDate', 'status', 'availableCount', 'paymentMn', 'paymentEn'];

const yes = (v) => ['yes', 'тийм', 'true', '1', 'y'].includes(String(v ?? '').trim().toLowerCase());
const iso = (v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).trim() : '');

// blocks: тухайн төслийн блокууд [{id, name}]. Мөр бүрийг шалгаж {rows, errors} буцаана.
export async function readUnitsFile(file, blocks) {
  const { readSheet } = await import('read-excel-file/browser');
  const data = await readSheet(file);
  if (!data.length) return { rows: [], errors: [{ line: 1, key: 'excel.empty' }] };
  const header = data[0].map((h) => String(h ?? '').trim());
  const missingCols = EXCEL_COLUMNS.filter((c) => !header.includes(c)).filter((c) => ['block', 'rooms', 'area', 'status'].includes(c));
  if (missingCols.length) return { rows: [], errors: [{ line: 1, key: 'excel.missingColumns', vars: { cols: missingCols.join(', ') } }] };
  const col = (r, name) => r[header.indexOf(name)];

  const rows = [];
  const errors = [];
  data.slice(1).forEach((r, i) => {
    const line = i + 2;
    if (r.every((c) => c == null || c === '')) return;
    const blockName = String(col(r, 'block') ?? '').trim();
    const matches = blocks.filter((b) => String(b.name).trim() === blockName);
    const rooms = Number(col(r, 'rooms'));
    const area = Number(col(r, 'area'));
    const priceRaw = col(r, 'price');
    const price = priceRaw === '' || priceRaw == null ? null : Number(priceRaw);
    const priceDate = iso(col(r, 'priceDate'));
    const status = String(col(r, 'status') ?? '').trim();
    const orientation = String(col(r, 'orientation') ?? '').trim().toUpperCase();
    const err = (key) => errors.push({ line, key });
    if (matches.length !== 1) return err(matches.length ? 'excel.blockAmbiguous' : 'excel.blockNotFound');
    if (!(rooms > 0) || !(area > 0)) return err('excel.badNumber');
    if (price != null && (Number.isNaN(price) || !/^\d{4}-\d{2}-\d{2}$/.test(priceDate))) return err('excel.priceNeedsDate');
    if (!UNIT_STATUS.includes(status)) return err('excel.badStatus');
    if (orientation && !DIRS.includes(orientation)) return err('excel.badOrientation');
    const block = matches[0];
    rows.push({
      line,
      id: `u-${block.id}-${rooms}-${String(area).replace('.', '_')}`,
      blockId: block.id,
      rooms,
      area,
      floors: col(r, 'floors') ? String(col(r, 'floors')) : undefined,
      balcony: yes(col(r, 'balcony')),
      orientation: orientation || undefined,
      ...(price != null
        ? { price, pricePerM2: Math.round(price / area), priceSource: 'company', priceDate }
        : { price: { status: 'not_published' }, pricePerM2: { status: 'not_published' } }),
      status,
      availableCount: Number(col(r, 'availableCount')) || 0,
      payment: col(r, 'paymentMn') || col(r, 'paymentEn') ? { mn: col(r, 'paymentMn') || '', en: col(r, 'paymentEn') || '' } : undefined
    });
  });
  return { rows, errors };
}
