import { useMemo, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { db, isSoldOut } from '../lib/data.js';
import ProjectMap from '../components/ProjectMap.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import PinLegend from '../components/PinLegend.jsx';

const FILTERS = ['all', 'planning', 'under_construction', 'completed'];

export default function Home() {
  const { t } = useLang();
  const [filter, setFilter] = useState('all');
  const [showSold, setShowSold] = useState(false);

  const shown = useMemo(
    () =>
      db.projects.filter(
        (p) => (filter === 'all' || p.status === filter) && (showSold || !isSoldOut(p.id))
      ),
    [filter, showSold]
  );
  const featured = db.projects.filter((p) => p.status === 'under_construction');
  const soldCount = db.projects.filter((p) => isSoldOut(p.id)).length;

  return (
    <>
      <section className="hero">
        <span className="badge badge-warn">{t('home.demoTag')}</span>
        <h1>{t('app.tagline')}</h1>
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
        <h2>{t('map.title')}</h2>
        <div className="filters" role="group" aria-label={t('home.filter')}>
          {FILTERS.map((f) => (
            <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {t(`status.${f}`)}
            </button>
          ))}
        </div>
        <label className="toggle small">
          <input type="checkbox" checked={showSold} onChange={(e) => setShowSold(e.target.checked)} />
          {t('home.showSold', { n: soldCount })}
        </label>
        <ProjectMap projects={shown} />
        <PinLegend />
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
