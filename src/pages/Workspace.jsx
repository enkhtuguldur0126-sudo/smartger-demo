// Компанийн самбар: төсөл, ээлж, блок, байрны төрөл, явц, амлалт нэмэх/засах, Excel-ээр оруулах.
// Компанийн оруулсан бүх зүйл "хянагдаж буй" төлөвтэй хадгалагдаж, админ шалгасны дараа л нийтэд харагдана.
import { useEffect, useMemo, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { backendConfigured } from '../lib/backend.js';
import { href } from '../lib/router.js';
import { KINDS, KIND_ORDER, blank, toForm, newId } from '../lib/forms.js';
import { loadAll, saveRecord, saveMany, uploadPhoto, currentPosition } from '../lib/workspace.js';
import { readUnitsFile, EXCEL_COLUMNS } from '../lib/excel.js';
import RecordForm from '../components/RecordForm.jsx';
import { Loading, ErrorState } from '../components/States.jsx';

export function ReviewBadge({ status }) {
  const { t } = useLang();
  const cls = { pending: 'badge-warn', published: 'badge-ok', rejected: 'badge-bad' }[status] || '';
  return <span className={`badge tiny ${cls}`}>{t(`review.${status}`)}</span>;
}

export function FictionalTag({ value }) {
  const { t } = useLang();
  return value ? <span className="badge tiny">{t('data.fictional')}</span> : <span className="badge tiny badge-ok">{t('data.real')}</span>;
}

// Тухайн компанийн мөрүүд ба эцэг мөрийн шошго.
export function useCompanyView(all, companyId) {
  const { pick, t } = useLang();
  return useMemo(() => {
    if (!all) return null;
    const projects = all.projects.filter((p) => p.companyId === companyId);
    const pIds = new Set(projects.map((p) => p.id));
    const phases = all.phases.filter((x) => pIds.has(x.projectId));
    const phIds = new Set(phases.map((x) => x.id));
    const blocks = all.blocks.filter((x) => phIds.has(x.phaseId));
    const bIds = new Set(blocks.map((x) => x.id));
    const label = {};
    projects.forEach((p) => (label[p.id] = pick(p.name)));
    phases.forEach((x) => (label[x.id] = `${label[x.projectId]} · ${t('unit.phase', { n: x.number })}`));
    blocks.forEach((x) => (label[x.id] = `${label[x.phaseId]} · ${t('unit.block', { name: x.name })}`));
    return {
      label,
      rows: {
        projects,
        phases,
        blocks,
        unitTypes: all.unitTypes.filter((x) => bIds.has(x.blockId)),
        progress: all.progress.filter((x) => pIds.has(x.projectId)),
        claims: all.claims.filter((x) => pIds.has(x.projectId))
      }
    };
  }, [all, companyId, pick, t]);
}

function PhotoInput({ onPick, existing }) {
  const { t } = useLang();
  const [info, setInfo] = useState(null);
  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInfo({ name: file.name, locating: true });
    const pos = await currentPosition();
    const takenAt = new Date(file.lastModified || Date.now()).toISOString();
    setInfo({ name: file.name, pos, takenAt });
    onPick({ file, pos, takenAt });
  };
  return (
    <div className="field">
      <label htmlFor="f-photo">{t('field.photo')}</label>
      <input id="f-photo" type="file" accept="image/*" capture="environment" onChange={pickFile} />
      <span className="small muted">{t('field.photoHint')}</span>
      {existing && !info && <span className="small">{t('field.photoExisting')}</span>}
      {info && (
        <span className="small" role="status">
          {info.locating
            ? t('field.photoLocating')
            : t('progress.photoMeta', {
                date: info.takenAt.slice(0, 10),
                place: info.pos ? `${info.pos.lat.toFixed(4)}, ${info.pos.lng.toFixed(4)}` : t('field.noLocation')
              })}
        </span>
      )}
    </div>
  );
}

function ExcelImport({ view, onDone }) {
  const { t } = useLang();
  const [projectId, setProjectId] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const blocks = view.rows.blocks.filter((b) => view.rows.phases.find((ph) => ph.id === b.phaseId)?.projectId === projectId);

  const read = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMsg(null);
    try {
      setResult(await readUnitsFile(file, blocks));
    } catch {
      setResult({ rows: [], errors: [{ line: 1, key: 'excel.unreadable' }] });
    }
    e.target.value = '';
  };
  const save = async () => {
    setBusy(true);
    try {
      await saveMany('unitTypes', result.rows.map(({ line, ...r }) => r));
      setMsg({ k: 'excel.saved', n: result.rows.length });
      setResult(null);
      onDone();
    } catch {
      setMsg({ bad: true, k: 'form.saveFailed' });
    }
    setBusy(false);
  };

  return (
    <div className="card stack">
      <h2>{t('excel.title')}</h2>
      <p className="small">{t('excel.intro')}</p>
      <p className="small muted">{t('excel.columns')}: <code>{EXCEL_COLUMNS.join(', ')}</code></p>
      <div><a className="btn btn-secondary" href={`${import.meta.env.BASE_URL}templates/unit-types.xlsx`} download>{t('excel.template')}</a></div>
      <div className="field">
        <label htmlFor="x-project">{t('field.projectId')} *</label>
        <select id="x-project" className="input" value={projectId} onChange={(e) => { setProjectId(e.target.value); setResult(null); }}>
          <option value="">—</option>
          {view.rows.projects.map((p) => <option key={p.id} value={p.id}>{view.label[p.id]}</option>)}
        </select>
        {projectId && blocks.length === 0 && <span className="small text-bad">{t('excel.noBlocks')}</span>}
      </div>
      {projectId && blocks.length > 0 && (
        <div className="field">
          <label htmlFor="x-file">{t('excel.file')}</label>
          <input id="x-file" type="file" accept=".xlsx" onChange={read} />
        </div>
      )}
      {result && (
        <div className="stack-sm">
          <p className="small">{t('excel.summary', { ok: result.rows.length, bad: result.errors.length })}</p>
          {result.errors.length > 0 && (
            <ul className="small text-bad">
              {result.errors.map((e, i) => <li key={i}>{t('excel.line', { n: e.line })}: {t(e.key, e.vars)}</li>)}
            </ul>
          )}
          {result.rows.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>#</th><th>{t('field.blockId')}</th><th>{t('field.rooms')}</th><th>{t('field.area')}</th><th>{t('field.price')}</th><th>{t('field.status')}</th></tr></thead>
                <tbody>
                  {result.rows.map((r) => (
                    <tr key={r.line}>
                      <td>{r.line}</td><td>{view.label[r.blockId]}</td><td>{r.rooms}</td><td>{r.area}</td>
                      <td>{typeof r.price === 'number' ? `${r.price.toLocaleString()} (${r.priceDate})` : t('common.priceNotPublished')}</td>
                      <td>{t(`unit.status.${r.status}`)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="card-row">
            <button className="btn btn-primary" onClick={save} disabled={busy || result.rows.length === 0 || result.errors.length > 0}>
              {t('excel.import', { n: result.rows.length })}
            </button>
            {result.errors.length > 0 && <span className="small muted">{t('excel.fixFirst')}</span>}
          </div>
        </div>
      )}
      {msg && <p className={`small ${msg.bad ? 'text-bad' : 'text-ok'}`} role="status">{t(msg.k, { n: msg.n })}</p>}
    </div>
  );
}

function KindList({ kind, rows, view, onEdit, onAdd }) {
  const { t, pick } = useLang();
  const def = KINDS[kind];
  return (
    <div className="stack">
      <div className="card-row">
        <button className="btn btn-primary" onClick={onAdd} disabled={def.parent && parentsFor(kind, view).length === 0}>
          + {t(`kind.${kind}.add`)}
        </button>
        {def.parent && parentsFor(kind, view).length === 0 && <span className="small muted">{t(`kind.${kind}.needParent`)}</span>}
      </div>
      {rows.length === 0 ? (
        <div className="card empty"><p>{t('ws.empty')}</p></div>
      ) : (
        <ul className="stack-sm plain-list">
          {rows.map((r) => (
            <li key={r.id} className="card ws-row">
              <div className="stack-sm">
                <strong>{def.title(r, pick, t) || r.id}</strong>
                {def.parent && <span className="small muted">{view.label[r[def.parent.field]]}</span>}
                <div className="card-row">
                  <ReviewBadge status={r.reviewStatus} />
                  <FictionalTag value={r.isFictional} />
                  <span className="small muted">{t('ws.updated', { date: String(r.updatedAt || '').slice(0, 10) })}</span>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={() => onEdit(r)}>{t('ws.edit')}</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function parentsFor(kind, view) {
  const p = KINDS[kind].parent;
  if (!p) return [];
  return view.rows[p.kind].map((x) => ({ id: x.id, label: view.label[x.id] }));
}

export default function Workspace() {
  const { t, pick } = useLang();
  const { ready, user, profile, role } = useAuth();
  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState('projects');
  const [editing, setEditing] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [adminCompany, setAdminCompany] = useState('');

  const reload = () => {
    setError(false);
    loadAll().then(setAll).catch(() => setError(true));
  };
  useEffect(() => {
    if (user && (role === 'company' || role === 'admin')) reload();
  }, [user, role]);

  const companyId = role === 'admin' ? adminCompany || all?.companies[0]?.id : profile?.company_id;
  const view = useCompanyView(all, companyId);

  if (!backendConfigured) return <section className="stack"><h1>{t('nav.workspace')}</h1><div className="card empty"><p>{t('auth.notConfigured')}</p></div></section>;
  if (!ready) return <Loading />;
  if (!user) return <section className="stack"><h1>{t('nav.workspace')}</h1><div className="card empty"><p>{t('ws.needLogin')}</p><a className="btn btn-primary" href={href('login')}>{t('auth.signIn')}</a></div></section>;
  if (role !== 'company' && role !== 'admin') return <section className="stack"><h1>{t('nav.workspace')}</h1><div className="card empty"><p>{t('auth.noRole')}</p></div></section>;
  if (error) return <ErrorState onRetry={reload} />;
  if (!all || !view) return <Loading />;

  const company = all.companies.find((c) => c.id === companyId);

  const startAdd = () => {
    setPhoto(null);
    setNotice(null);
    setEditing({ kind: tab, values: { ...blank(tab), id: newId(KINDS[tab].idPrefix) }, isNew: true });
  };
  const startEdit = (r) => {
    setPhoto(null);
    setNotice(null);
    setEditing({ kind: tab, values: toForm(tab, r), isNew: false });
  };

  const save = async (value) => {
    setBusy(true);
    try {
      const rec = { ...editing.values, ...value };
      if (editing.kind === 'projects') {
        rec.companyId = companyId;
        rec.coords = [Number(rec.lat), Number(rec.lng)];
        delete rec.lat;
        delete rec.lng;
      }
      if (editing.kind === 'progress' && photo) {
        rec.photoPath = await uploadPhoto(companyId, rec.id, photo.file);
        rec.photoTakenAt = photo.takenAt;
        rec.photoLat = photo.pos?.lat ?? null;
        rec.photoLng = photo.pos?.lng ?? null;
        delete rec.photo;
      }
      await saveRecord(editing.kind, rec);
      setEditing(null);
      setNotice({ k: role === 'admin' ? 'ws.savedAdmin' : 'ws.saved' });
      reload();
    } catch (e) {
      console.warn(e);
      setNotice({ bad: true, k: 'form.saveFailed' });
    }
    setBusy(false);
  };

  // Төслийн маягтад координатыг lat/lng талбар болгон харуулна.
  const formInitial = (ed) =>
    ed.kind === 'projects' && ed.values.coords ? { ...ed.values, lat: ed.values.coords[0], lng: ed.values.coords[1] } : ed.values;

  return (
    <section className="stack">
      <h1>{t('nav.workspace')}</h1>
      <div className="card stack-sm">
        {role === 'admin' ? (
          <div className="field">
            <label htmlFor="ws-company">{t('ws.company')}</label>
            <select id="ws-company" className="input" value={companyId} onChange={(e) => { setAdminCompany(e.target.value); setEditing(null); }}>
              {all.companies.map((c) => <option key={c.id} value={c.id}>{pick(c.name)}</option>)}
            </select>
          </div>
        ) : (
          <p><strong>{company ? pick(company.name) : companyId}</strong></p>
        )}
        <p className="small muted">{t('ws.intro')}</p>
      </div>

      <div className="tabs" role="tablist">
        {[...KIND_ORDER, 'excel'].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className="tab" onClick={() => { setTab(k); setEditing(null); setNotice(null); }}>
            {t(`kind.${k}`)}
            {k !== 'excel' && <span className="tab-count">{view.rows[k].length}</span>}
          </button>
        ))}
      </div>

      {notice && <p className={`card small ${notice.bad ? 'text-bad' : 'text-ok'}`} role="status">{t(notice.k)}</p>}

      {tab === 'excel' ? (
        <ExcelImport view={view} onDone={reload} />
      ) : editing ? (
        <RecordForm
          key={editing.values.id}
          kind={editing.kind}
          initial={formInitial(editing)}
          parents={parentsFor(editing.kind, view)}
          busy={busy}
          onSave={save}
          onCancel={() => setEditing(null)}
          extra={editing.kind === 'progress' && <PhotoInput onPick={setPhoto} existing={editing.values.photoPath} />}
        />
      ) : (
        <KindList kind={tab} rows={view.rows[tab]} view={view} onAdd={startAdd} onEdit={startEdit} />
      )}
    </section>
  );
}
