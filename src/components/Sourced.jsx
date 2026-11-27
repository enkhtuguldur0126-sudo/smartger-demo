import { useLang } from '../lib/i18n.jsx';
import { missing } from '../lib/data.js';

// Тоо бүрийн хажууд эх сурвалж, огноо. Байхгүй бол "олдоогүй".
export default function Sourced({ field, format = (v) => v, notFoundKey = 'common.notFound' }) {
  const { t } = useLang();
  if (missing(field)) {
    const key = field?.status === 'not_published' ? 'common.priceNotPublished' : notFoundKey;
    return <span className="not-found">{t(key)}</span>;
  }
  return (
    <span className="sourced">
      <span className="sourced-value">{format(field.value ?? field)}</span>
      {field.source && (
        <span className="sourced-meta">
          {t(`source.${field.source}`)}
          {field.date ? ` · ${field.date}` : ''}
        </span>
      )}
    </span>
  );
}
