import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';
import { db } from '../lib/data.js';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <p>{t('demo.footer')}</p>
      <p className="footer-links">
        <a href={href('privacy')}>{t('nav.privacy')}</a>
        <a href={href('terms')}>{t('nav.terms')}</a>
        <a href={href('login')}>{t('nav.login')}</a>
      </p>
      <p className="muted small">{t(db.source === 'database' ? 'data.fromDatabase' : 'data.fromJson')}</p>
      <p className="muted">{t('app.tagline')}</p>
    </footer>
  );
}
