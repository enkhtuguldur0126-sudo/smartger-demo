import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';
import { companyById, availableCount, nextHandover, isDelayed, isStale, isSoldOut, startingPrice, millions } from '../lib/data.js';
import StatusBadge from './StatusBadge.jsx';
import Sourced from './Sourced.jsx';
import { VerifiedBadge } from './TrustBadges.jsx';

export default function ProjectCard({ project }) {
  const { t, pick, locale } = useLang();
  const company = companyById(project.companyId);
  const count = availableCount(project.id);
  const handover = nextHandover(project.id);
  const stale = isStale(project);

  return (
    <a className={`card project-card ${stale ? 'is-stale' : ''}`} href={href('project', project.id)}>
      <div className="card-row">
        <StatusBadge status={project.status} />
        {isDelayed(project.id) && <span className="badge badge-delay">⚠ {t('home.delayed')}</span>}
        {isSoldOut(project.id) && <span className="badge badge-planning">{t('home.soldOut')}</span>}
      </div>
      <h3>{pick(project.name)}</h3>
      <p className="muted">
        {pick(company?.name)}
        {' '}<VerifiedBadge verified={company?.verified} compact />
      </p>
      <p className="muted small">{pick(project.address)}</p>
      <p className="small">
        <Sourced
          field={startingPrice(project.id)}
          format={(v) => t('map.fromPrice', { price: millions(v, locale) })}
        />
      </p>
      <div className="card-row small">
        <span>{t('home.availableUnits', { n: count })}</span>
        {handover && <span>{t('home.handover', { date: handover })}</span>}
      </div>
      <p className={`small ${stale ? 'stale-note' : 'muted'}`}>
        {stale ? t('map.stale', { date: project.lastUpdate }) : t('home.updated', { date: project.lastUpdate })}
      </p>
    </a>
  );
}
