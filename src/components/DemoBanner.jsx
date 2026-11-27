import { useLang } from '../lib/i18n.jsx';

export default function DemoBanner() {
  const { t } = useLang();
  return (
    <div className="demo-banner" role="note">
      <strong>DEMO</strong> {t('demo.banner')}
    </div>
  );
}
