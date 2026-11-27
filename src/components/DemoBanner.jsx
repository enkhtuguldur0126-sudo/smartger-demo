import { useLang } from '../lib/i18n.jsx';

export default function DemoBanner() {
  const { t } = useLang();
  return (
    <div className="demo-banner" role="note">
      <strong>{t('demo.label')}</strong> {t('demo.banner')}
    </div>
  );
}
