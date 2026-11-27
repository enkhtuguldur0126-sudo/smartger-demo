// Өгөгдлийн сангийн мөрийг сайтад хэрэглэдэг JSON хэлбэр рүү, эсрэгээр нь хувиргана.
// Тодорхой багана + "data" (үлдсэн бүх талбар).

const common = (r) => ({
  isFictional: r.is_fictional,
  reviewStatus: r.review_status,
  updatedAt: r.updated_at
});

export const TABLES = {
  companies: {
    table: 'companies',
    from: (r) => ({ ...r.data, id: r.id, verified: r.verified, ...common(r) }),
    to: ({ id, verified, ...data }) => ({ id, verified: !!verified, data: strip(data) })
  },
  projects: {
    table: 'projects',
    from: (r) => ({ ...r.data, id: r.id, companyId: r.company_id, status: r.status, lastUpdate: r.last_update, coords: [r.lat, r.lng], ...common(r) }),
    to: ({ id, companyId, status, lastUpdate, coords, ...data }) => ({
      id, company_id: companyId, status, last_update: lastUpdate, lat: coords[0], lng: coords[1], data: strip(data)
    })
  },
  phases: {
    table: 'phases',
    from: (r) => ({ ...r.data, id: r.id, projectId: r.project_id, number: r.number, promisedHandover: r.promised_handover, ...common(r) }),
    to: ({ id, projectId, number, promisedHandover, ...data }) => ({
      id, project_id: projectId, number: Number(number), promised_handover: promisedHandover, data: strip(data)
    })
  },
  blocks: {
    table: 'blocks',
    from: (r) => ({ ...r.data, id: r.id, phaseId: r.phase_id, ...common(r) }),
    to: ({ id, phaseId, ...data }) => ({ id, phase_id: phaseId, data: strip(data) })
  },
  unitTypes: {
    table: 'unit_types',
    from: (r) => ({ ...r.data, id: r.id, blockId: r.block_id, ...common(r) }),
    to: ({ id, blockId, ...data }) => ({ id, block_id: blockId, data: strip(data) })
  },
  progress: {
    table: 'progress',
    from: (r) => ({
      ...r.data, id: r.id, projectId: r.project_id, date: r.date, percent: r.percent, verificationLevel: r.verification_level,
      photoPath: r.photo_path, photoTakenAt: r.photo_taken_at, photoLat: r.photo_lat, photoLng: r.photo_lng, ...common(r)
    }),
    to: ({ id, projectId, date, percent, verificationLevel, photoPath, photoTakenAt, photoLat, photoLng, ...data }) => ({
      id, project_id: projectId, date, percent: Number(percent), verification_level: Number(verificationLevel || 1),
      photo_path: photoPath || null, photo_taken_at: photoTakenAt || null, photo_lat: photoLat ?? null, photo_lng: photoLng ?? null,
      data: strip(data)
    })
  },
  claims: {
    table: 'claims',
    from: (r) => ({ id: r.id, projectId: r.project_id, text: r.text, source: r.source, date: r.date, state: r.state, ...common(r) }),
    to: ({ id, projectId, text, source, date, state }) => ({ id, project_id: projectId, text, source, date, state })
  },
  prices: {
    table: 'prices',
    from: (r) => ({ ...r.data, id: r.id, projectId: r.project_id, category: r.category, pricePerM2: Number(r.price_per_m2), source: r.source, date: r.date, ...common(r) }),
    to: ({ id, projectId, category, pricePerM2, source, date, ...data }) => ({
      id, project_id: projectId, category, price_per_m2: Number(pricePerM2), source, date, data: strip(data)
    })
  },
  snapshots: {
    table: 'snapshots',
    from: (r) => ({ ...r.data, projectId: r.project_id, capturedOn: r.captured_on, ...common(r) }),
    to: ({ projectId, capturedOn, ...data }) => ({ project_id: projectId, captured_on: capturedOn, data: strip(data) })
  },
  benchmarks: {
    table: 'benchmarks',
    from: (r) => ({ ...r.data, id: r.id, ...common(r) }),
    to: ({ id, ...data }) => ({ id, data: strip(data) })
  }
};

// Сайт дээр нэмсэн туслах талбаруудыг "data" руу хадгалахгүй.
function strip(o) {
  const { isFictional, reviewStatus, updatedAt, ...rest } = o;
  return rest;
}
