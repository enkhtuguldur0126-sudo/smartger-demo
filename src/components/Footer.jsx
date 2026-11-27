import { useLang } from '../lib/i18n.jsx';

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="footer">
      <p>{t('demo.footer')}</p>
      <p className="muted">{t('app.tagline')}</p>
    </footer>
  );
}
