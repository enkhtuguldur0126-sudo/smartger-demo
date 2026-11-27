// Нууцлалын бодлого ба үйлчилгээний нөхцөл. Бичвэр нь хэлний файлд (privacy.N.h / privacy.N.p).
// Хуульчийн хариу (B1) ирэхээс өмнөх ТҮР ТӨСӨЛ.
import { useLang } from '../lib/i18n.jsx';

export default function Legal({ doc }) {
  const { t, has } = useLang();
  const sections = [];
  for (let i = 1; has(`${doc}.${i}.h`); i++) sections.push(i);
  return (
    <section className="stack narrow">
      <h1>{t(`${doc}.title`)}</h1>
      <p className="card small badge-warn" role="note">{t('legal.draft')}</p>
      <p className="small muted">{t('legal.updated')}</p>
      {sections.map((i) => (
        <div key={i} className="card stack-sm">
          <h2>{t(`${doc}.${i}.h`)}</h2>
          <p>{t(`${doc}.${i}.p`)}</p>
        </div>
      ))}
    </section>
  );
}
