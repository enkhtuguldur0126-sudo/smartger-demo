import { useLang } from '../lib/i18n.jsx';

export default function StatusBadge({ status }) {
  const { t } = useLang();
  return <span className={`badge badge-${status}`}>{t(`status.${status}`)}</span>;
}
