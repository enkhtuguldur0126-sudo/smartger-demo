import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';

// Буруу холбоосоор орсон үед харагдах хуудас.
export default function Placeholder({ titleKey = 'page.notFound' }) {
  const { t } = useLang();
  return (
    <section className="stack">
      <h1>{t(titleKey)}</h1>
      <p className="card muted">{t('page.notFoundText')}</p>
      <a className="btn btn-primary" href={href()}>{t('nav.home')}</a>
    </section>
  );
}
