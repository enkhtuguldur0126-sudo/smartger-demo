import { useLang } from '../lib/i18n.jsx';
import Button from '../components/Button.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import Sourced from '../components/Sourced.jsx';
import { Loading, ErrorState } from '../components/States.jsx';

// Нийтлэг хэсгүүдийг нэг дор харуулах шалгах хуудас (#/ui). Цэсэнд байхгүй.
export default function UiKit() {
  const { t } = useLang();
  return (
    <section className="stack">
      <h1>{t('ui.title')}</h1>

      <div className="card stack">
        <h2>{t('ui.buttons')}</h2>
        <div className="card-row">
          <Button>{t('ui.primary')}</Button>
          <Button variant="secondary">{t('ui.secondary')}</Button>
        </div>
      </div>

      <div className="card stack">
        <h2>{t('ui.badges')}</h2>
        <div className="card-row">
          <StatusBadge status="planning" />
          <StatusBadge status="under_construction" />
          <StatusBadge status="completed" />
          <span className="badge badge-ok">✓ {t('common.verified')}</span>
        </div>
        <h2>{t('ui.alerts')}</h2>
        <div className="card-row">
          <span className="badge badge-ok">{t('ui.ok')}</span>
          <span className="badge badge-warn">{t('ui.warn')}</span>
          <span className="badge badge-bad">{t('ui.bad')}</span>
        </div>
      </div>

      <div className="card stack">
        <h2>{t('ui.states')}</h2>
        <Sourced field={{ status: 'not_found' }} />
        <Sourced field={{ status: 'not_published' }} />
        <Sourced field={{ status: 'not_found' }} notFoundKey="common.planNotFound" />
        <Sourced field={{ value: 312, source: 'document', date: '2025-03-15' }} />
      </div>

      <Loading />
      <ErrorState onRetry={() => {}} />
    </section>
  );
}
