import { useLang } from '../lib/i18n.jsx';

// Зохиомол план зураг (энгийн схем). Байхгүй бол "Төлөвлөлтийн зураг олдоогүй".
const PLANS = {
  'plan-2room': [
    [0, 0, 60, 50], [60, 0, 40, 50], [0, 50, 45, 30], [45, 50, 55, 30]
  ],
  'plan-3room': [
    [0, 0, 40, 45], [40, 0, 30, 45], [70, 0, 30, 45], [0, 45, 55, 35], [55, 45, 45, 35]
  ]
};

export default function FloorPlan({ plan }) {
  const { t } = useLang();
  const rooms = PLANS[plan];
  if (!rooms) return <span className="not-found">{t('common.planNotFound')}</span>;
  return (
    <figure className="plan">
      <svg viewBox="-2 -2 104 84" role="img" aria-label={t('unit.plan')}>
        {rooms.map(([x, y, w, h], i) => (
          <rect key={i} x={x} y={y} width={w} height={h} className="plan-room" />
        ))}
      </svg>
      <figcaption className="small muted">{t('unit.planFictional')}</figcaption>
    </figure>
  );
}
