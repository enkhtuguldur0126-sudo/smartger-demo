// Smartger админ: хянах дараалал (нийтлэх / татгалзах), хэрэглэгчийн эрх, өөрчлөлтийн түүх.
import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { useAuth } from '../lib/auth.jsx';
import { backendConfigured } from '../lib/backend.js';
import { href } from '../lib/router.js';
import { KINDS } from '../lib/forms.js';
import { loadAll, review, loadAudit, loadProfiles, updateProfile } from '../lib/workspace.js';
import { Loading, ErrorState } from '../components/States.jsx';
import { ReviewBadge, FictionalTag } from './Workspace.jsx';

const QUEUE_KINDS = ['companies', 'projects', 'phases', 'blocks', 'unitTypes', 'progress', 'claims', 'prices'];
const TABLE_KIND = { companies: 'companies', projects: 'projects', phases: 'phases', blocks: 'blocks', unit_types: 'unitTypes', progress: 'progress', claims: 'claims', prices: 'prices', snapshots: 'snapshots', benchmarks: 'benchmarks' };

function titleOf(kind, r, pick, t) {
  const def = KINDS[kind];
  if (def) return def.title(r, pick, t) || r.id;
  return pick(r.name) || pick(r.label) || r.id;
}

// Хуучин ба шинэ мөрийн ялгаатай талбарууд.
function changedFields(oldRow, newRow) {
  if (!oldRow || !newRow) return [];
  const skip = ['updated_at', 'updated_by', 'created_at', 'created_by', 'reviewed_at', 'reviewed_by'];
  const keys = new Set([...Object.keys(oldRow), ...Object.keys(newRow)]);
  const out = [];
  for (const k of keys) {
    if (skip.includes(k)) continue;
    if (k === 'data') {
      const a = oldRow.data || {};
      const b = newRow.data || {};
      for (const dk of new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (JSON.stringify(a[dk]) !== JSON.stringify(b[dk])) out.push(dk);
      }
    } else if (JSON.stringify(oldRow[k]) !== JSON.stringify(newRow[k])) out.push(k);
  }
  return out;
}

function Queue({ all, onChange, parentLabel }) {
  const { t, pick } = useLang();
  const [busy, setBusy] = useState(null);
  const pending = QUEUE_KINDS.flatMap((k) => all[k].filter((r) => r.reviewStatus === 'pending').map((r) => ({ kind: k, r })));
  const act = async (kind, r, status) => {
    setBusy(r.id);
    try {
      await review(kind, r.id, status, r._fictional ?? r.isFictional);
      onChange();
    } catch (e) {
      console.warn(e);
    }
    setBusy(null);
  };
  if (pending.length === 0) return <div className="card empty"><p>{t('admin.queueEmpty')}</p></div>;
  return (
    <ul className="stack-sm plain-list">
      {pending.map(({ kind, r }) => (
        <li key={`${kind}-${r.id}`} className="card stack-sm">
          <div className="card-row">
            <span className="badge tiny">{t(`kind.${kind}`)}</span>
            <ReviewBadge status={r.reviewStatus} />
            <FictionalTag value={r.isFictional} />
          </div>
          <strong>{titleOf(kind, r, pick, t)}</strong>
          <span className="small muted">{parentLabel(kind, r)} · {t('ws.updated', { date: String(r.updatedAt || '').slice(0, 16).replace('T', ' ') })}</span>
          <details>
            <summary className="small">{t('admin.showData')}</summary>
            <pre className="code-block">{JSON.stringify(r._row, null, 2)}</pre>
          </details>
          <label className="check small">
            <input type="checkbox" defaultChecked={r.isFictional} onChange={(e) => (r._fictional = e.target.checked)} />
            <span>{t('admin.markFictional')}</span>
          </label>
          <div className="card-row">
            <button className="btn btn-primary" disabled={busy === r.id} onClick={() => act(kind, r, 'published')}>{t('admin.publish')}</button>
            <button className="btn btn-secondary" disabled={busy === r.id} onClick={() => act(kind, r, 'rejected')}>{t('admin.reject')}</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Users({ companies }) {
  const { t, pick } = useLang();
  const [list, setList] = useState(null);
  const [msg, setMsg] = useState(null);
  const load = () => loadProfiles().then(setList).catch(() => setList([]));
  useEffect(() => { load(); }, []);
  if (!list) return <Loading />;
  const change = async (id, patch) => {
    try {
      await updateProfile(id, patch);
      setMsg({ k: 'admin.userSaved' });
      load();
    } catch {
      setMsg({ bad: true, k: 'form.saveFailed' });
    }
  };
  return (
    <div className="stack-sm">
      <p className="small muted">{t('admin.usersIntro')}</p>
      {msg && <p className={`small ${msg.bad ? 'text-bad' : 'text-ok'}`} role="status">{t(msg.k)}</p>}
      <ul className="stack-sm plain-list">
        {list.map((p) => (
          <li key={p.id} className="card stack-sm">
            <strong>{p.email}</strong>
            <div className="field-pair">
              <select className="input" aria-label={t('admin.role')} value={p.role} onChange={(e) => change(p.id, { role: e.target.value })}>
                <option value="company">{t('role.company')}</option>
                <option value="admin">{t('role.admin')}</option>
              </select>
              <select className="input" aria-label={t('ws.company')} value={p.company_id || ''} onChange={(e) => change(p.id, { company_id: e.target.value || null })}>
                <option value="">{t('admin.noCompany')}</option>
                {companies.map((c) => <option key={c.id} value={c.id}>{pick(c.name)}</option>)}
              </select>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function History() {
  const { t } = useLang();
  const [rows, setRows] = useState(null);
  const [people, setPeople] = useState({});
  const [error, setError] = useState(false);
  useEffect(() => {
    Promise.all([loadAudit(), loadProfiles()])
      .then(([a, p]) => { setRows(a); setPeople(Object.fromEntries(p.map((x) => [x.id, x.email]))); })
      .catch(() => setError(true));
  }, []);
  if (error) return <ErrorState />;
  if (!rows) return <Loading />;
  return (
    <div className="stack-sm">
      <p className="small muted">{t('admin.historyIntro')}</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t('admin.when')}</th><th>{t('admin.who')}</th><th>{t('admin.what')}</th><th>{t('admin.fields')}</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="nowrap">{r.at.slice(0, 16).replace('T', ' ')}</td>
                <td>{r.actor ? people[r.actor] || r.actor.slice(0, 8) : t('admin.system')}</td>
                <td>{t(`admin.action.${r.action}`)} · {t(`kind.${TABLE_KIND[r.table_name] || r.table_name}`)} · <code>{r.row_id}</code></td>
                <td className="small">{r.action === 'UPDATE' ? changedFields(r.old_row, r.new_row).join(', ') || '—' : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Admin() {
  const { t, pick } = useLang();
  const { ready, user, role } = useAuth();
  const [tab, setTab] = useState('queue');
  const [all, setAll] = useState(null);
  const [error, setError] = useState(false);
  const reload = () => { setError(false); loadAll().then(setAll).catch(() => setError(true)); };
  useEffect(() => { if (role === 'admin') reload(); }, [role]);

  if (!backendConfigured) return <section className="stack"><h1>{t('nav.admin')}</h1><div className="card empty"><p>{t('auth.notConfigured')}</p></div></section>;
  if (!ready) return <Loading />;
  if (!user || role !== 'admin') return <section className="stack"><h1>{t('nav.admin')}</h1><div className="card empty"><p>{t('admin.only')}</p><a className="btn btn-primary" href={href('login')}>{t('auth.signIn')}</a></div></section>;
  if (error) return <ErrorState onRetry={reload} />;
  if (!all) return <Loading />;

  const byId = (k, id) => all[k].find((x) => x.id === id);
  const parentLabel = (kind, r) => {
    const project = r.projectId ? byId('projects', r.projectId)
      : r.phaseId ? byId('projects', byId('phases', r.phaseId)?.projectId)
      : r.blockId ? byId('projects', byId('phases', byId('blocks', r.blockId)?.phaseId)?.projectId)
      : kind === 'projects' ? r : null;
    const companyId = project?.companyId || (kind === 'companies' ? r.id : null);
    const company = companyId && byId('companies', companyId);
    return [company && pick(company.name), project && kind !== 'projects' && pick(project.name)].filter(Boolean).join(' · ');
  };
  const pendingCount = QUEUE_KINDS.reduce((n, k) => n + all[k].filter((r) => r.reviewStatus === 'pending').length, 0);

  return (
    <section className="stack">
      <h1>{t('nav.admin')}</h1>
      <div className="tabs" role="tablist">
        {['queue', 'users', 'history'].map((k) => (
          <button key={k} role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>
            {t(`admin.tab.${k}`)}{k === 'queue' && <span className="tab-count">{pendingCount}</span>}
          </button>
        ))}
      </div>
      {tab === 'queue' && <Queue all={all} onChange={reload} parentLabel={parentLabel} />}
      {tab === 'users' && <Users companies={all.companies} />}
      {tab === 'history' && <History />}
    </section>
  );
}
