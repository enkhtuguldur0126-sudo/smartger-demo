import { useLang } from '../lib/i18n.jsx';

// Ачаалж байх үеийн төлөв.
export function Loading() {
  const { t } = useLang();
  return (
    <div className="card state" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{t('state.loading')}</span>
    </div>
  );
}

// Алдааны төлөв. onRetry өгвөл "Дахин оролдох" товч гарна.
export function ErrorState({ onRetry }) {
  const { t } = useLang();
  return (
    <div className="card state state-error" role="alert">
      <span>{t('state.error')}</span>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          {t('state.retry')}
        </button>
      )}
    </div>
  );
}
