import { useLang } from '../lib/i18n.jsx';
import { db, startingPrice, listingPricesOf, millions, missing } from '../lib/data.js';

// Үнийн гурван ангилал: хөгжүүлэгчийн санал, зарын үнэ / жишиг, баримтаар батлагдсан хэлцэл.
// AI таамаг, үнэлгээ, ашгийн тооцоо хийхгүй.
function Row({ title, value, source, date, state }) {
  const { t, locale } = useLang();
  return (
    <div className="price-row">
      <div className="price-title">{title}</div>
      {value == null ? (
        <span className="not-found">{t(state === 'not_published' ? 'common.priceNotPublished' : 'common.notFound')}</span>
      ) : (
        <div>
          <strong>{t('price.perM2', { price: millions(value, locale) })}</strong>
          <div className="sourced-meta">
            {t(`source.${source}`)} · {date}
            {state && <span className={`badge badge-${state === 'current' ? 'ok' : 'warn'} tiny`}>{t(`price.state.${state}`)}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PriceCategories({ projectId }) {
  const { t, pick, locale } = useLang();
  const dev = startingPrice(projectId);
  const listings = listingPricesOf(projectId);
  const bench = db.benchmarks[0];

  return (
    <div className="card stack">
      <h2>{t('price.title')}</h2>
      <section>
        <h3 className="price-cat">1. {t('price.cat.developer')}</h3>
        <Row
          title={t('price.fromDeveloper')}
          value={missing(dev) ? null : dev.value}
          source={dev.source}
          date={dev.date}
          state={missing(dev) ? 'not_published' : 'current'}
        />
      </section>
      <section>
        <h3 className="price-cat">2. {t('price.cat.listing')}</h3>
        {listings.length ? (
          listings.map((l) => (
            <Row key={l.id} title={pick(l.label)} value={l.pricePerM2} source={l.source} date={l.date} state={l.state} />
          ))
        ) : (
          <Row title={t('price.listingProject')} value={null} />
        )}
        <div className="price-row">
          <div className="price-title">{pick(bench.label)}</div>
          <div>
            <strong>{t('price.perM2', { price: millions(bench.pricePerM2, locale) })}</strong>
            <div className="sourced-meta">{pick(bench.source)} · {bench.date} · {t('price.benchmarkNote')}</div>
          </div>
        </div>
      </section>
      <section>
        <h3 className="price-cat">3. {t('price.cat.deal')}</h3>
        <Row title={t('price.dealNote')} value={null} />
      </section>
      <p className="small muted">{t('price.disclaimer')}</p>
    </div>
  );
}
