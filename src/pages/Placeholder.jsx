import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';

// 1-р долоо хоногт хуудасны хүрээ. Агуулгыг дараагийн долоо хоногуудад нэмнэ.
export default function Placeholder({ titleKey, children }) {
  const { t } = useLang();
  return (
    <section>
      <a className="back" href={href()}>← {t('common.back')}</a>
      <h1>{t(titleKey)}</h1>
      {children}
      <p className="card muted">{t('common.comingSoon')}</p>
    </section>
  );
}
