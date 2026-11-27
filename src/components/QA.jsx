import { useLang } from '../lib/i18n.jsx';
import { qaOf, qaStats } from '../lib/data.js';

// Асуулт-хариултын загвар. Зөвхөн дэлгэц: өгөгдөл хадгалахгүй, шинэ асуулт илгээхгүй.
export default function QA({ projectId }) {
  const { t, pick } = useLang();
  const list = qaOf(projectId);
  const s = qaStats(projectId);
  return (
    <div className="stack">
      <div className="card demo-note">
        <strong>{t('qa.demoTitle')}</strong> {t('qa.demoText')}
      </div>

      <div className="card stats">
        <div>
          <span className="stat-value">{s.rate == null ? '—' : `${s.rate}%`}</span>
          <span className="small muted">{t('qa.rate', { a: s.answered, n: s.total })}</span>
        </div>
        <div>
          <span className="stat-value">{s.avgDays == null ? '—' : t('qa.days', { n: s.avgDays })}</span>
          <span className="small muted">{t('qa.avg')}</span>
        </div>
      </div>

      {list.length === 0 && <p className="muted">{t('qa.none')}</p>}
      {list.map((q) => (
        <div key={q.id} className="card qa-item">
          <p className="qa-q"><strong>{t('qa.q')}</strong> {pick(q.question)}</p>
          <p className="sourced-meta">{t('qa.asked', { date: q.askedOn })}</p>
          {q.answer ? (
            <div className="qa-a">
              <p><strong>{t('qa.a')}</strong> {pick(q.answer)}</p>
              <p className="sourced-meta">{t('qa.answered', { date: q.answeredOn })} · {t(`source.${q.answeredBy}`)}</p>
            </div>
          ) : (
            <span className="badge tiny badge-warn">{t('qa.unanswered')}</span>
          )}
        </div>
      ))}

      <div className="card stack">
        <label className="stack-sm">
          <span className="small muted">{t('qa.askLabel')}</span>
          <textarea rows="3" disabled placeholder={t('qa.placeholder')} />
        </label>
        <button className="btn btn-primary" disabled>{t('qa.send')}</button>
        <p className="small muted">{t('qa.sendNote')}</p>
      </div>
    </div>
  );
}
