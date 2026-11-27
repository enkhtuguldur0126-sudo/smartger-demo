import { useLang } from '../lib/i18n.jsx';
import { db, projectById, unitById, unitContext, progressOf, snapshotOf, millions, isStale } from '../lib/data.js';
import { href } from '../lib/router.js';
import { LevelBadge } from '../components/TrustBadges.jsx';

// Хөндийрсөн (гадаадад байгаа) худалдан авагчийн сарын тайлангийн ЖИШЭЭ.
// Бодит илгээлт, бүртгэл байхгүй. Бүх тоо зохиомол.
export default function Report() {
  const { t, pick, locale } = useLang();
  const r = db.reports[0];
  const project = projectById(r.projectId);
  const unit = unitById(r.unitTypeId);
  const { phase, block } = unitContext(unit);
  const [latest, prev] = progressOf(project.id);
  const changes = (snapshotOf(project.id)?.history || []).filter((h) => h.date >= '2026-01-01');
  const pay = r.payment;
  const late = typeof phase.currentEstimate === 'string' && phase.currentEstimate > phase.promisedHandover;

  return (
    <section className="stack report">
      <a className="back" href={href()}>← {t('common.back')}</a>
      <div className="card demo-note">
        <strong>{t('report.demoTitle')}</strong> {t('report.demoText')}
      </div>

      <div className="card">
        <p className="small muted">{t('report.kicker', { month: r.month })}</p>
        <h1>{pick(project.name)}</h1>
        <p className="muted">
          {pick(r.buyer)} · {pick(r.location)}
          <br />
          {t('unit.phase', { n: phase.number })} · {t('unit.block', { name: block.name })} · {t('unit.rooms', { n: unit.rooms })}, {unit.area} {t('unit.m2')}
        </p>
      </div>

      <div className="card stack">
        <h2>{t('report.progress')}</h2>
        {latest ? (
          <>
            <p><strong>{latest.percent}%</strong> · {pick(latest.of)} <span className="sourced-meta">{latest.date}</span></p>
            <div className="bar"><span style={{ width: `${latest.percent}%` }} /></div>
            <LevelBadge level={latest.verificationLevel} />
            {prev && <p className="small muted">{t('report.prev', { p: prev.percent, date: prev.date })}</p>}
          </>
        ) : (
          <span className="not-found">{t('progress.none')}</span>
        )}
        {isStale(project) && <p className="stale-note">{t('report.noUpdate', { date: project.lastUpdate })}</p>}
      </div>

      <div className="card stack">
        <h2>{t('report.schedule')}</h2>
        <dl className="facts">
          <dt>{t('promise.promised')}</dt><dd>{phase.promisedHandover}</dd>
          <dt>{t('promise.current')}</dt><dd>{typeof phase.currentEstimate === 'string' ? phase.currentEstimate : t('common.notFound')}</dd>
        </dl>
        {late && <span className="badge badge-bad tiny">{t('report.lateWarn')}</span>}
        {changes.map((h, i) => (
          <p key={i} className="small">
            {h.date}: {t(`promise.field.${h.field}`)} <s>{h.from}</s> → <strong>{h.to}</strong>
          </p>
        ))}
      </div>

      <div className="card stack">
        <h2>{t('report.payment')}</h2>
        <dl className="facts">
          <dt>{t('report.next')}</dt><dd><strong>{pay.nextDate}</strong> · {t('price.total', { price: millions(pay.amount, locale) })}</dd>
          <dt>{t('report.paid')}</dt><dd>{t('price.total', { price: millions(pay.paidSoFar, locale) })} / {t('price.total', { price: millions(pay.total, locale) })}</dd>
        </dl>
        <div className="bar"><span style={{ width: `${Math.round((pay.paidSoFar / pay.total) * 100)}%` }} /></div>
        <p className="small muted">{t('report.payNote')}</p>
      </div>

      <div className="card stack">
        <h2>{t('report.next.title')}</h2>
        <ul className="plain">
          <li>{t('report.tip1')}</li>
          <li>{t('report.tip2')}</li>
        </ul>
        <a className="btn btn-secondary" href={href('project', project.id, 'promises')}>{t('report.open')}</a>
      </div>
    </section>
  );
}
