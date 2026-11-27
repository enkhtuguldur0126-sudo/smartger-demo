import { useLang } from '../lib/i18n.jsx';
import { href } from '../lib/router.js';
import { VerifiedBadge, LevelBadge } from '../components/TrustBadges.jsx';
import PinLegend from '../components/PinLegend.jsx';

// "Хэрхэн ажилладаг": баталгаажуулалт, явцын түвшин, үнийн ангилал, "олдоогүй" гэдгийг энгийнээр тайлбарлана.
function Section({ title, children }) {
  return (
    <div className="card stack">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

export default function HowItWorks() {
  const { t } = useLang();
  return (
    <section className="stack">
      <a className="back" href={href()}>← {t('common.back')}</a>
      <h1>{t('page.how')}</h1>
      <p>{t('how.intro')}</p>

      <Section title={t('how.company.title')}>
        <div className="card-row"><VerifiedBadge verified /> <VerifiedBadge verified={false} /></div>
        <p>{t('how.company.text')}</p>
      </Section>

      <Section title={t('how.levels.title')}>
        <p>{t('how.levels.text')}</p>
        <ol className="levels">
          {[1, 2, 3, 4].map((n) => (
            <li key={n}>
              <LevelBadge level={n} link={false} />
              <p>{t(`how.levels.l${n}`)}</p>
              {n >= 3 && <span className="badge tiny badge-planning">{t('how.later')}</span>}
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t('how.sources.title')}>
        <ul className="plain">
          <li><span className="src-tag src-company">{t('claim.company')}</span> {t('how.sources.company')}</li>
          <li><span className="src-tag src-smartger">{t('claim.smartger')}</span> {t('how.sources.smartger')}</li>
          <li><span className="src-tag src-document">{t('claim.document')}</span> {t('how.sources.document')}</li>
        </ul>
      </Section>

      <Section title={t('how.prices.title')}>
        <ol className="plain-ol">
          <li><strong>{t('price.cat.developer')}.</strong> {t('how.prices.developer')}</li>
          <li><strong>{t('price.cat.listing')}.</strong> {t('how.prices.listing')}</li>
          <li><strong>{t('price.cat.deal')}.</strong> {t('how.prices.deal')}</li>
        </ol>
        <p className="small muted">{t('price.disclaimer')}</p>
      </Section>

      <Section title={t('how.notFound.title')}>
        <div className="card-row">
          <span className="not-found">{t('common.notFound')}</span>
          <span className="not-found">{t('common.priceNotPublished')}</span>
        </div>
        <p>{t('how.notFound.text')}</p>
      </Section>

      <Section title={t('how.promise.title')}>
        <p>{t('how.promise.text')}</p>
      </Section>

      <Section title={t('how.map.title')}>
        <PinLegend />
        <p>{t('how.map.text')}</p>
      </Section>
    </section>
  );
}
