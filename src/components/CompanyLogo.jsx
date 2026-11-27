import { useLang } from '../lib/i18n.jsx';

// Компанийн лого. Лого байхгүй бол нэрийн эхний үсэг ба "олдоогүй" гэсэн тайлбар.
export default function CompanyLogo({ company, size = 56 }) {
  const { t, pick } = useLang();
  if (company.logo) return <img className="company-logo" src={company.logo} alt="" width={size} height={size} />;
  const initial = (pick(company.name) || '?').trim().charAt(0);
  return (
    <span className="company-logo placeholder" style={{ width: size, height: size }} title={t('company.logoNotFound')}>
      {initial}
    </span>
  );
}
