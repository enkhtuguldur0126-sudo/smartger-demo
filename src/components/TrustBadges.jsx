import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';

// Итгэлийн шошгууд. Бүх хуудсанд энэ хоёрыг л ашиглана, ингэснээр нэг загвартай харагдана.

// Баталгаажсан компани. compact: нэрийн хажуудах жижиг ногоон тэмдэг.
export function VerifiedBadge({ verified, compact = false }) {
  const { t } = useLang();
  if (compact) {
    return verified ? (
      <span className="verified-dot" title={t('common.verified')} aria-label={t('common.verified')}>✓</span>
    ) : null;
  }
  return verified ? (
    <span className="badge badge-ok trust-badge"><span aria-hidden="true">✓</span> {t('common.verified')}</span>
  ) : (
    <span className="badge badge-planning trust-badge">{t('company.notVerified')}</span>
  );
}

// Баталгааны түвшин 1–4. Demo-д 1–2 л ашиглагдана. Цэгүүд нь 4 түвшнээс хэд дэх нь болохыг харуулна.
export function LevelBadge({ level, link = true }) {
  const { t } = useLang();
  const body = (
    <>
      <span className="pips" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => <span key={n} className={n <= level ? 'pip on' : 'pip'} />)}
      </span>
      {t('verify.level', { n: level })}: {t(`verify.l${level}`)}
    </>
  );
  return link ? (
    <a className={`level-badge level-${level}`} href={href('how-it-works')} title={t('verify.learnMore')}>{body}</a>
  ) : (
    <span className={`level-badge level-${level}`}>{body}</span>
  );
}
