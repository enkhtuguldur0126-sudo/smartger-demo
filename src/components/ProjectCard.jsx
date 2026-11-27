import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';
import { companyById, availableCount, nextHandover, isDelayed } from '../lib/data.js';
import StatusBadge from './StatusBadge.jsx';

export default function ProjectCard({ project }) {
  const { t, pick } = useLang();
  const company = companyById(project.companyId);
  const count = availableCount(project.id);
  const handover = nextHandover(project.id);

  return (
    <a className="card project-card" href={href('project', project.id)}>
      <div className="card-row">
        <StatusBadge status={project.status} />
        {isDelayed(project.id) && <span className="badge badge-delay">⚠ {t('home.delayed')}</span>}
      </div>
      <h3>{pick(project.name)}</h3>
      <p className="muted">
        {pick(company?.name)}
        {company?.verified && (
          <span className="verified" title={t('common.verified')} aria-label={t('common.verified')}> ✓</span>
        )}
      </p>
      <p className="muted small">{pick(project.address)}</p>
      <div className="card-row small">
        <span>{t('home.availableUnits', { n: count })}</span>
        {handover && <span>{t('home.handover', { date: handover })}</span>}
      </div>
      <p className="muted small">{t('home.updated', { date: project.lastUpdate })}</p>
    </a>
  );
}
