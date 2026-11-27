// Компанийн самбарын маягтуудын талбарууд. Бичвэр (шошго) нь хэлний файлд: "field.<нэр>".
// Талбарын төрөл: text, i18n (mn/en), number, date, month, select, checkbox, sourced (утга + эх сурвалж + огноо), parent.

export const STATUS = ['planning', 'under_construction', 'completed'];
export const SOURCES = ['company', 'document', 'smartger'];
export const UNIT_STATUS = ['available', 'reserved', 'sold', 'not_on_sale'];
export const DIRS = ['N', 'S', 'E', 'W', 'NE', 'NW', 'SE', 'SW'];

export const KINDS = {
  projects: {
    idPrefix: 'p',
    title: (r, pick) => pick(r.name),
    fields: [
      { name: 'name', type: 'i18n', required: true },
      { name: 'address', type: 'i18n', required: true },
      { name: 'status', type: 'select', options: STATUS, optionKey: 'status', required: true },
      { name: 'lat', type: 'number', step: 'any', required: true, hint: 'field.latHint' },
      { name: 'lng', type: 'number', step: 'any', required: true },
      { name: 'lastUpdate', type: 'date', required: true, today: true },
      { name: 'totalUnits', type: 'sourced' },
      { name: 'totalArea', type: 'sourced', unit: 'm2' },
      { name: 'greenArea', type: 'sourced', unit: 'm2' }
    ]
  },
  phases: {
    idPrefix: 'ph',
    parent: { field: 'projectId', kind: 'projects' },
    title: (r, pick, t) => t('unit.phase', { n: r.number }),
    fields: [
      { name: 'number', type: 'number', required: true, min: 1 },
      { name: 'units', type: 'number', min: 0 },
      { name: 'promisedHandover', type: 'month', required: true },
      { name: 'currentEstimate', type: 'month' },
      { name: 'estimateSource', type: 'select', options: SOURCES, optionKey: 'source' },
      { name: 'estimateDate', type: 'date', today: true }
    ]
  },
  blocks: {
    idPrefix: 'b',
    parent: { field: 'phaseId', kind: 'phases' },
    title: (r) => r.name,
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'floors', type: 'number', min: 1 }
    ]
  },
  unitTypes: {
    idPrefix: 'u',
    parent: { field: 'blockId', kind: 'blocks' },
    title: (r, pick, t) => `${t('unit.rooms', { n: r.rooms })} · ${r.area} m²`,
    fields: [
      { name: 'rooms', type: 'number', required: true, min: 1 },
      { name: 'area', type: 'number', step: '0.1', required: true, min: 1 },
      { name: 'floors', type: 'text' },
      { name: 'balcony', type: 'checkbox' },
      { name: 'orientation', type: 'select', options: DIRS, optionKey: 'dir' },
      { name: 'price', type: 'number', min: 0, hint: 'field.priceHint' },
      { name: 'priceSource', type: 'select', options: SOURCES, optionKey: 'source' },
      { name: 'priceDate', type: 'date', today: true },
      { name: 'status', type: 'select', options: UNIT_STATUS, optionKey: 'unit.status', required: true },
      { name: 'availableCount', type: 'number', min: 0 },
      { name: 'payment', type: 'i18n' }
    ]
  },
  progress: {
    idPrefix: 'pr',
    parent: { field: 'projectId', kind: 'projects' },
    title: (r, pick) => `${r.date} · ${r.percent}% · ${pick(r.of) || ''}`,
    fields: [
      { name: 'date', type: 'date', required: true, today: true },
      { name: 'percent', type: 'number', required: true, min: 0, max: 100 },
      { name: 'of', type: 'i18n', required: true },
      { name: 'checkedBy', type: 'i18n' }
    ],
    photo: true
  },
  claims: {
    idPrefix: 'cl',
    parent: { field: 'projectId', kind: 'projects' },
    title: (r, pick) => pick(r.text),
    fields: [
      { name: 'text', type: 'i18n', required: true },
      { name: 'source', type: 'select', options: SOURCES, optionKey: 'source', required: true },
      { name: 'date', type: 'date', required: true, today: true },
      { name: 'state', type: 'select', options: ['planned', 'done'], optionKey: 'claim.state', required: true }
    ]
  }
};

export const KIND_ORDER = ['projects', 'phases', 'blocks', 'unitTypes', 'progress', 'claims'];

export const today = () => new Date().toISOString().slice(0, 10);
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// Хоосон маягтын анхны утга.
export function blank(kind) {
  const v = {};
  for (const f of KINDS[kind].fields) {
    if (f.type === 'i18n') v[f.name] = { mn: '', en: '' };
    else if (f.type === 'checkbox') v[f.name] = false;
    else if (f.type === 'sourced') v[f.name] = { status: 'not_found' };
    else if (f.today) v[f.name] = today();
    else v[f.name] = '';
  }
  return v;
}

// Хадгалсан мөрийг маягтад засах хэлбэрт оруулна.
export function toForm(kind, record) {
  const v = { ...blank(kind), ...record };
  for (const f of KINDS[kind].fields) {
    const x = v[f.name];
    if (f.type === 'number' && x && typeof x === 'object') v[f.name] = '';
    if (f.type === 'i18n' && typeof x !== 'object') v[f.name] = { mn: x || '', en: '' };
  }
  return v;
}

// Маягтын утгыг шалгаж, хадгалах хэлбэрт оруулна. Алдаатай талбаруудыг буцаана.
export function validate(kind, values) {
  const errors = {};
  const out = { ...values };
  for (const f of KINDS[kind].fields) {
    const v = values[f.name];
    if (f.type === 'number') {
      if (v === '' || v == null) {
        if (f.required) errors[f.name] = 'form.required';
        delete out[f.name];
      } else {
        const n = Number(v);
        if (Number.isNaN(n) || (f.min != null && n < f.min) || (f.max != null && n > f.max)) errors[f.name] = 'form.badNumber';
        out[f.name] = n;
      }
    } else if (f.type === 'i18n') {
      if (f.required && !v?.mn?.trim()) errors[f.name] = 'form.requiredMn';
    } else if (f.type === 'sourced') {
      if (v && !('status' in v)) {
        if (v.value === '' || Number.isNaN(Number(v.value))) errors[f.name] = 'form.badNumber';
        else if (!v.source || !v.date) errors[f.name] = 'form.needSource';
        else out[f.name] = { ...v, value: Number(v.value), ...(f.unit ? { unit: f.unit } : {}) };
      }
    } else if (f.required && (v === '' || v == null)) {
      errors[f.name] = 'form.required';
    }
  }
  // Үнэ бичсэн бол эх сурвалж, огноо заавал (тоо бүрт эх сурвалж).
  if (kind === 'unitTypes') {
    if (typeof out.price === 'number') {
      if (!out.priceSource || !out.priceDate) errors.price = 'form.needSource';
      out.pricePerM2 = out.area ? Math.round(out.price / out.area) : undefined;
    } else {
      out.price = { status: 'not_published' };
      out.pricePerM2 = { status: 'not_published' };
    }
  }
  if (kind === 'progress') out.verificationLevel = values.verificationLevel || 1;
  return { errors, value: out };
}
