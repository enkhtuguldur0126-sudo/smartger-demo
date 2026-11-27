import { useLang } from '../lib/i18n.jsx';
import { companyById } from '../lib/data.js';
import Placeholder from './Placeholder.jsx';

export default function Company({ id }) {
  const { t, pick } = useLang();
  const c = companyById(id);
  if (!c) return <Placeholder titleKey="page.notFound" />;
  return (
    <Placeholder titleKey="page.company">
      <div className="card">
        <h2>
          {pick(c.name)}
          {c.verified && <span className="verified" title={t('common.verified')}> ✓</span>}
        </h2>
        <p>{pick(c.about)}</p>
      </div>
    </Placeholder>
  );
}
