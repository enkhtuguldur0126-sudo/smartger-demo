import { useLang } from '../lib/i18n.jsx';
import { db, projectsOf } from '../lib/data.js';
import { href } from '../lib/router.js';
import CompanyLogo from '../components/CompanyLogo.jsx';

export default function Companies() {
  const { t, pick } = useLang();
  return (
    <section className="stack">
      <h1>{t('page.companies')}</h1>
      <div className="grid">
        {db.companies.map((c) => {
          const list = projectsOf(c.id);
          const active = list.filter((p) => p.status !== 'completed').length;
          const done = list.filter((p) => p.status === 'completed').length + c.pastProjects.length;
          return (
            <a key={c.id} className="card company-card" href={href('company', c.id)}>
              <CompanyLogo company={c} size={48} />
              <div>
                <h3>{pick(c.name)}</h3>
                {c.verified ? (
                  <span className="badge badge-ok">✓ {t('common.verified')}</span>
                ) : (
                  <span className="badge badge-planning">{t('company.notVerified')}</span>
                )}
                <p className="muted small">
                  {t('company.activeCount', { n: active })} · {t('company.doneCount', { n: done })}
                </p>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
