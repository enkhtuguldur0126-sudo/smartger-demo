import { useLang } from '../lib/i18n.jsx';
import { projectById, companyById, phasesOf } from '../lib/data.js';
import { href } from '../lib/router.js';
import Placeholder from './Placeholder.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Sourced from '../components/Sourced.jsx';

export default function Project({ id }) {
  const { t, pick, locale } = useLang();
  const project = projectById(id);
  if (!project) return <Placeholder titleKey="page.notFound" />;
  const company = companyById(project.companyId);
  const num = (v) => Number(v).toLocaleString(locale);

  return (
    <Placeholder titleKey="page.project">
      <div className="card">
        <StatusBadge status={project.status} />
        <h2>{pick(project.name)}</h2>
        <p className="muted">
          <a href={href('company', company.id)}>{pick(company.name)}</a> · {pick(project.address)}
        </p>
        <dl className="facts">
          <dt>{t('project.totalUnits')}</dt>
          <dd><Sourced field={project.totalUnits} format={num} /></dd>
          <dt>{t('project.totalArea')}</dt>
          <dd><Sourced field={project.totalArea} format={(v) => `${num(v)} ${t('unit.m2')}`} /></dd>
          <dt>{t('project.greenArea')}</dt>
          <dd><Sourced field={project.greenArea} format={(v) => `${num(v)} ${t('unit.m2')}`} /></dd>
          <dt>{t('project.phases')}</dt>
          <dd>{phasesOf(project.id).length}</dd>
        </dl>
      </div>
    </Placeholder>
  );
}
