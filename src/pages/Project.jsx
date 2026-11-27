import { useLang } from '../lib/i18n.jsx';
import {
  projectById, companyById, phasesOf, blocksOf, unitsOf, availableCount, progressOf, claimsOf,
  snapshotOf, projectsOf, monthsBetween, millions, missing, isStale
} from '../lib/data.js';
import { href } from '../lib/router.js';
import Placeholder from './Placeholder.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Sourced from '../components/Sourced.jsx';
import PriceCategories from '../components/PriceCategories.jsx';
import ProgressIllustration from '../components/ProgressIllustration.jsx';
import CompanyLogo from '../components/CompanyLogo.jsx';
import FloorPlan from '../components/FloorPlan.jsx';
import QA from '../components/QA.jsx';
import { VerifiedBadge, LevelBadge } from '../components/TrustBadges.jsx';

export const TABS = ['overview', 'units', 'progress', 'documents', 'company', 'promises', 'qa'];

function NotFound({ k = 'common.notFound' }) {
  const { t } = useLang();
  return <span className="not-found">{t(k)}</span>;
}

function SourceTag({ source }) {
  const { t } = useLang();
  return <span className={`src-tag src-${source}`}>{t(`claim.${source}`)}</span>;
}

/* ---------- Тойм ---------- */
function Overview({ project }) {
  const { t, pick, locale } = useLang();
  const num = (v) => Number(v).toLocaleString(locale);
  const latest = progressOf(project.id)[0];
  return (
    <div className="stack">
      <div className="card">
        <h2>{t('project.facts')}</h2>
        <dl className="facts">
          <dt>{t('project.totalUnits')}</dt>
          <dd><Sourced field={project.totalUnits} format={num} /></dd>
          <dt>{t('project.available')}</dt>
          <dd>{t('home.availableUnits', { n: availableCount(project.id) })}</dd>
          <dt>{t('project.totalArea')}</dt>
          <dd><Sourced field={project.totalArea} format={(v) => `${num(v)} ${t('unit.m2')}`} /></dd>
          <dt>{t('project.greenArea')}</dt>
          <dd><Sourced field={project.greenArea} format={(v) => `${num(v)} ${t('unit.m2')}`} /></dd>
          <dt>{t('project.phases')}</dt>
          <dd>{phasesOf(project.id).length}</dd>
          <dt>{t('project.latestProgress')}</dt>
          <dd>
            {latest ? (
              <span>{latest.percent}% · {pick(latest.of)} <span className="sourced-meta">{latest.date}</span></span>
            ) : (
              <NotFound k="progress.none" />
            )}
          </dd>
        </dl>
      </div>

      <PriceCategories projectId={project.id} />

      <div className="card">
        <h2>{t('claim.title')}</h2>
        <p className="small muted">{t('claim.intro')}</p>
        <ul className="claims">
          {claimsOf(project.id).map((c) => (
            <li key={c.id}>
              <span>{pick(c.text)}</span>
              <span className="claim-meta">
                <SourceTag source={c.source} />
                <span className={`badge tiny badge-${c.state === 'done' ? 'ok' : 'planning'}`}>{t(`claim.state.${c.state}`)}</span>
                <span className="sourced-meta">{c.date}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Байр: ээлж → блок → байрны төрөл ---------- */
function UnitCard({ unit }) {
  const { t, pick, locale } = useLang();
  const priced = !missing(unit.price);
  return (
    <div className="unit-card">
      <div className="card-row">
        <strong>{t('unit.rooms', { n: unit.rooms })} · {unit.area} {t('unit.m2')}</strong>
        <span className={`badge tiny badge-unit-${unit.status}`}>{t(`unit.status.${unit.status}`)}</span>
      </div>
      <FloorPlan plan={unit.floorPlan} />
      <dl className="facts small">
        <dt>{t('unit.floors')}</dt><dd>{unit.floors}</dd>
        <dt>{t('unit.balcony')}</dt><dd>{t(unit.balcony ? 'common.yes' : 'common.no')}</dd>
        <dt>{t('unit.orientation')}</dt>
        <dd>{missing(unit.orientation) ? <NotFound /> : t(`dir.${unit.orientation}`)}</dd>
        <dt>{t('unit.available')}</dt><dd>{unit.availableCount}</dd>
        <dt>{t('price.cat.developer')}</dt>
        <dd>
          {priced ? (
            <span className="sourced">
              <span className="sourced-value">{t('price.total', { price: millions(unit.price, locale) })}</span>
              <span className="sourced-meta">
                {t('price.perM2', { price: millions(unit.pricePerM2, locale) })} · {t(`source.${unit.priceSource}`)} · {unit.priceDate}
              </span>
            </span>
          ) : (
            <NotFound k="common.priceNotPublished" />
          )}
        </dd>
        <dt>{t('unit.payment')}</dt>
        <dd>{missing(unit.payment) ? <NotFound /> : pick(unit.payment)}</dd>
      </dl>
      <a className="btn btn-secondary" href={href('compare', unit.id)}>{t('compare.add')}</a>
    </div>
  );
}

function Units({ project }) {
  const { t } = useLang();
  return (
    <div className="stack">
      {phasesOf(project.id).map((ph) => (
        <div key={ph.id} className="card stack">
          <h2>
            {t('unit.phase', { n: ph.number })}
            <span className="muted small"> · {t('company.units', { n: ph.units })} · {t('home.handover', { date: ph.promisedHandover })}</span>
          </h2>
          {blocksOf(ph.id).map((b) => (
            <div key={b.id} className="block">
              <h3>{t('unit.block', { name: b.name })} <span className="muted small">· {t('unit.blockFloors', { n: b.floors })}</span></h3>
              <div className="grid">
                {unitsOf(b.id).length ? (
                  unitsOf(b.id).map((u) => <UnitCard key={u.id} unit={u} />)
                ) : (
                  <NotFound />
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ---------- Явц ---------- */
function Progress({ project }) {
  const { t, pick } = useLang();
  const list = progressOf(project.id);
  if (project.status === 'planning' || list.length === 0) {
    return (
      <div className="card empty">
        <h2>{t('progress.noneTitle')}</h2>
        <p>{t('progress.planningOnly')}</p>
      </div>
    );
  }
  return (
    <div className="stack">
      <p className="small muted">{t('progress.intro')}</p>
      <ol className="timeline">
        {list.map((p) => (
          <li key={p.id} className="card timeline-item">
            <div className="timeline-date">{p.date}</div>
            {p.photo ? (
              <figure>
                <ProgressIllustration percent={p.percent} />
                <figcaption className="small muted">{t('progress.illustration')}</figcaption>
              </figure>
            ) : (
              <NotFound k="progress.photoNotFound" />
            )}
            <div className="stack-sm">
              <strong>{p.percent}% · {pick(p.of)}</strong>
              <div className="bar" role="progressbar" aria-valuenow={p.percent} aria-valuemin="0" aria-valuemax="100">
                <span style={{ width: `${p.percent}%` }} />
              </div>
              <LevelBadge level={p.verificationLevel} />
              <span className="small muted">{t('progress.checkedBy')}: {pick(p.checkedBy)}</span>
            </div>
          </li>
        ))}
      </ol>
      {isStale(project) && <p className="stale-note">{t('map.stale', { date: project.lastUpdate })}</p>}
    </div>
  );
}

/* ---------- Баримт ---------- */
function Documents({ project }) {
  const { t, pick } = useLang();
  const permit = project.permit;
  const acc = project.escrowAccount;
  return (
    <div className="stack">
      <div className="card">
        <h2>{t('doc.permit')}</h2>
        {missing(permit) ? (
          <NotFound />
        ) : (
          <dl className="facts">
            <dt>{t('doc.number')}</dt><dd>{pick(permit.number)}</dd>
            <dt>{t('doc.issuer')}</dt><dd>{pick(permit.issuer)}</dd>
            <dt>{t('doc.date')}</dt><dd>{permit.date}</dd>
            <dt>{t('common.source')}</dt><dd><SourceTag source={permit.source} /></dd>
          </dl>
        )}
      </div>
      <div className="card">
        <h2>{t('doc.account')}</h2>
        <p className="small muted">{t('doc.accountNote')}</p>
        {missing(acc) ? (
          <NotFound />
        ) : (
          <dl className="facts">
            <dt>{t('doc.bank')}</dt><dd>{pick(acc.bank)}</dd>
            <dt>{t('doc.accountNo')}</dt><dd>{acc.account}</dd>
            <dt>{t('common.source')}</dt><dd><SourceTag source={acc.source} /> <span className="sourced-meta">{acc.date}</span></dd>
          </dl>
        )}
      </div>
      <div className="card">
        <h2>{t('price.cat.deal')}</h2>
        <NotFound />
      </div>
    </div>
  );
}

/* ---------- Компани ---------- */
function CompanyTab({ project }) {
  const { t, pick } = useLang();
  const c = companyById(project.companyId);
  const list = projectsOf(c.id);
  return (
    <div className="card stack">
      <div className="company-head">
        <CompanyLogo company={c} size={56} />
        <div>
          <h2>{pick(c.name)}</h2>
          <VerifiedBadge verified={c.verified} />
        </div>
      </div>
      <p>{pick(c.about)}</p>
      <p className="small muted">
        {t('company.activeCount', { n: list.filter((p) => p.status !== 'completed').length })} ·{' '}
        {t('company.doneCount', { n: list.filter((p) => p.status === 'completed').length + c.pastProjects.length })}
      </p>
      <a className="btn btn-secondary" href={href('company', c.id)}>{t('company.profile')}</a>
    </div>
  );
}

/* ---------- Амлалт ---------- */
function Promises({ project }) {
  const { t, pick, locale } = useLang();
  const snap = snapshotOf(project.id);
  return (
    <div className="stack">
      <div className="card">
        <h2>{t('promise.handoverTitle')}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>{t('project.phases')}</th><th>{t('promise.promised')}</th><th>{t('promise.current')}</th><th>{t('promise.status')}</th></tr>
            </thead>
            <tbody>
              {phasesOf(project.id).map((ph) => {
                const est = ph.currentEstimate;
                const known = typeof est === 'string';
                const diff = known ? monthsBetween(ph.promisedHandover, est) : null;
                return (
                  <tr key={ph.id}>
                    <td>{t('unit.phase', { n: ph.number })}</td>
                    <td>{ph.promisedHandover}</td>
                    <td>
                      {known ? (
                        <>
                          {est}
                          <div className="sourced-meta">{t(`source.${ph.estimateSource}`)} · {ph.estimateDate}</div>
                        </>
                      ) : (
                        <NotFound />
                      )}
                    </td>
                    <td>
                      {!known ? (
                        <span className="badge tiny badge-warn">{t('promise.unknown')}</span>
                      ) : diff > 0 ? (
                        <span className="badge tiny badge-bad">{t('promise.late', { n: diff })}</span>
                      ) : (
                        <span className="badge tiny badge-ok">{t('promise.onTime')}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {snap ? (
        <div className="card">
          <h2>{t('promise.snapshot')}</h2>
          <p className="small muted">{t('promise.snapshotIntro', { date: snap.capturedOn })}</p>
          <dl className="facts">
            <dt>{t('promise.entryPrice')}</dt>
            <dd>
              {missing(snap.pricePerM2From) ? (
                <NotFound k="common.priceNotPublished" />
              ) : (
                t('map.fromPrice', { price: millions(snap.pricePerM2From, locale) })
              )}
            </dd>
            <dt>{t('promise.promised')}</dt><dd>{snap.promisedHandover}</dd>
            <dt>{t('promise.plan')}</dt><dd>{pick(snap.plan)}</dd>
            <dt>{t('promise.amenities')}</dt><dd>{pick(snap.amenities)}</dd>
          </dl>
          <p className="small"><span className="badge tiny badge-planning">🔒 {t('promise.locked')}</span></p>
        </div>
      ) : (
        <div className="card"><h2>{t('promise.snapshot')}</h2><NotFound /></div>
      )}

      <div className="card">
        <h2>{t('promise.history')}</h2>
        {snap && snap.history.length ? (
          <ol className="history">
            {snap.history.map((h, i) => (
              <li key={i}>
                <span className="sourced-meta">{h.date}</span>
                <span>
                  {t(`promise.field.${h.field}`)}: <s>{h.from}</s> → <strong>{h.to}</strong>
                  {h.field === 'price' && ` ${t('promise.millionUnit')}`}
                </span>
                <SourceTag source={h.source} />
                {h.note && <p className="small muted">{pick(h.note)}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <p className="muted">{t('promise.noChanges')}</p>
        )}
      </div>
    </div>
  );
}

const VIEWS = { overview: Overview, units: Units, progress: Progress, documents: Documents, company: CompanyTab, promises: Promises, qa: ({ project }) => <QA projectId={project.id} /> };

export default function Project({ id, tab = 'overview' }) {
  const { t, pick } = useLang();
  const project = projectById(id);
  if (!project) return <Placeholder titleKey="page.notFound" />;
  const company = companyById(project.companyId);
  const active = TABS.includes(tab) ? tab : 'overview';
  const View = VIEWS[active];

  return (
    <section className="stack">
      <a className="back" href={href()}>← {t('common.back')}</a>
      <div className="card project-head">
        <div className="card-row">
          <StatusBadge status={project.status} />
          <span className="badge badge-warn tiny">{t('home.demoTag')}</span>
        </div>
        <h1>{pick(project.name)}</h1>
        <p className="muted">
          <a href={href('company', company.id)}>{pick(company.name)}</a>
          {' '}<VerifiedBadge verified={company.verified} compact /> · {pick(project.address)}
        </p>
      </div>

      <nav className="tabs" aria-label={t('page.project')}>
        {TABS.map((k) => (
          <a key={k} href={href('project', project.id, k)} aria-current={active === k ? 'page' : undefined}>
            {t(`tab.${k}`)}
          </a>
        ))}
      </nav>

      <View project={project} />
    </section>
  );
}
