import { useLang } from '../lib/i18n.jsx';

// Pin хэлбэрийн тайлбар.
export default function PinLegend() {
  const { t } = useLang();
  const items = ['planning', 'under_construction', 'completed'];
  return (
    <ul className="legend small">
      {items.map((s) => (
        <li key={s}>
          <span className={`legend-hex pin-${s}`}><span className="pin-fill" /></span>
          {t(`status.${s}`)}
        </li>
      ))}
      <li><span className="legend-verified">✓</span>{t('common.verified')}</li>
      <li><span className="legend-hex pin-under_construction pin-stale"><span className="pin-fill" /></span>{t('map.legendStale')}</li>
    </ul>
  );
}
