import { useLang } from '../lib/i18n.jsx';
import { db, projectsOf } from '../lib/data.js';
import { href } from '../lib/router.js';
import Placeholder from './Placeholder.jsx';

export default function Companies() {
  const { t, pick } = useLang();
  return (
    <Placeholder titleKey="page.companies">
      <div className="grid">
        {db.companies.map((c) => (
          <a key={c.id} className="card" href={href('company', c.id)}>
            <h3>
              {pick(c.name)}
              {c.verified && <span className="verified" title={t('common.verified')}> ✓</span>}
            </h3>
            <p className="muted small">{t('home.count', { n: projectsOf(c.id).length })}</p>
          </a>
        ))}
      </div>
    </Placeholder>
  );
}
