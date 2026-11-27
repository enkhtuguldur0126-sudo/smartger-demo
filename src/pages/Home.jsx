import { useMemo, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { db } from '../lib/data.js';
import ProjectMap from '../components/ProjectMap.jsx';
import ProjectCard from '../components/ProjectCard.jsx';

const FILTERS = ['all', 'planning', 'under_construction', 'completed'];

export default function Home() {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');

  const shown = useMemo(
    () => db.projects.filter((p) => filter === 'all' || p.status === filter),
    [filter]
  );
  const featured = db.projects.filter((p) => p.status === 'under_construction');

  return (
    <>
      <section className="hero">
        <h1>{t('app.tagline')}</h1>
      </section>

      <section>
        <div className="filters" role="group" aria-label={t('home.filter')}>
          {FILTERS.map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {t(`status.${f}`)}
            </button>
          ))}
        </div>
        <ProjectMap projects={shown} />
      </section>

      <section>
        <h2>{t('home.featured')}</h2>
        <div className="grid">
          {featured.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      </section>

      <section>
        <h2>
          {t('home.list')} <span className="muted small">({t('home.count', { n: shown.length })})</span>
        </h2>
        {shown.length === 0 ? (
          <p className="muted">{t('home.noProjects')}</p>
        ) : (
          <div className="grid">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
