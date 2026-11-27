import { useLang } from '../lib/i18n.jsx';
import { companyById, projectsOf } from '../lib/data.js';
import { href } from '../lib/router.js';
import Placeholder from './Placeholder.jsx';
import CompanyLogo from '../components/CompanyLogo.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import { VerifiedBadge } from '../components/TrustBadges.jsx';

function Value({ v }) {
  const { t } = useLang();
  return v ? <span>{v}</span> : <span className="not-found">{t('common.notFound')}</span>;
}

export default function Company({ id }) {
  const { t, pick } = useLang();
  const c = companyById(id);
  if (!c) return <Placeholder titleKey="page.notFound" />;
  const list = projectsOf(c.id);
  const active = list.filter((p) => p.status !== 'completed');
  const done = list.filter((p) => p.status === 'completed');

  return (
    <section className="stack">
      <a className="back" href={href('companies')}>← {t('page.companies')}</a>

      <div className="card company-head">
        <CompanyLogo company={c} size={72} />
        <div>
          <h1>{pick(c.name)}</h1>
          <VerifiedBadge verified={c.verified} />
          {!c.logo && <p className="small muted">{t('company.logoNotFound')}</p>}
        </div>
      </div>

      <div className="card">
        <h2>{t('company.about')}</h2>
        <p>{pick(c.about) || <span className="not-found">{t('common.notFound')}</span>}</p>
        <dl className="facts">
          <dt>{t('company.phone')}</dt><dd><Value v={pick(c.contact.phone)} /></dd>
          <dt>{t('company.email')}</dt><dd><Value v={c.contact.email} /></dd>
          <dt>{t('company.web')}</dt><dd><Value v={c.contact.web} /></dd>
        </dl>
      </div>

      <h2>{t('company.active')}</h2>
      {active.length ? (
        <div className="grid">{active.map((p) => <ProjectCard key={p.id} project={p} />)}</div>
      ) : (
        <p className="not-found">{t('common.notFound')}</p>
      )}

      <h2>{t('company.done')}</h2>
      {done.length || c.pastProjects.length ? (
        <div className="grid">
          {done.map((p) => <ProjectCard key={p.id} project={p} />)}
          {c.pastProjects.map((pp, i) => (
            <div key={i} className="card">
              <span className="badge badge-completed">{t('status.completed')}</span>
              <h3>{pick(pp.name)}</h3>
              <p className="small muted">
                {t('company.handedOver', { date: pp.handover })} ·{' '}
                {pp.units ? t('company.units', { n: pp.units }) : t('common.notFound')}
              </p>
              <p className="small muted">{t('company.notOnMap')}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="not-found">{t('common.notFound')}</p>
      )}
    </section>
  );
}
