// Нийтлэг товч. href өгвөл холбоос, үгүй бол товч болно.
export default function Button({ variant = 'primary', href, children, ...rest }) {
  const className = `btn btn-${variant}`;
  return href ? (
    <a className={className} href={href} {...rest}>{children}</a>
  ) : (
    <button className={className} {...rest}>{children}</button>
  );
}
