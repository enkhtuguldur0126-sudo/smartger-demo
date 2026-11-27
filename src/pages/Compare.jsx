import { useEffect, useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { db, unitById, unitContext, millions, missing } from '../lib/data.js';
import { href } from '../lib/router.js';

const MAX = 3;
const DEFAULT = ['u-kt-a-2', 'u-kt-a-3'];
const KEY = 'smartger.compare';

function readSaved() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return Array.isArray(v) ? v.filter(unitById) : null;
  } catch {
    return null;
  }
}

// Байрны 2–3 төрлийг зэрэгцүүлнэ. Үнэлгээ, тооцоолол хийхгүй, зөвхөн өгөгдлийг харуулна.
export default function Compare({ add }) {
  const { t, pick, locale } = useLang();
  const [ids, setIds] = useState(() => readSaved() || DEFAULT);

  // Төслийн хуудаснаас "Харьцуулахад нэмэх" дарж ирсэн бол нэмнэ.
  useEffect(() => {
    if (add && unitById(add)) setIds((cur) => (cur.includes(add) ? cur : [...cur, add].slice(-MAX)));
  }, [add]);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(ids)); } catch { /* үл тооно */ }
  }, [ids]);

  const toggle = (id) =>
    setIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length < MAX ? [...cur, id] : cur));

  const units = ids.map(unitById).filter(Boolean);
  const nf = <span className="not-found">{t('common.notFound')}</span>;
  const rows = [
    ['compare.project', (u) => <a href={href('project', unitContext(u).project.id, 'units')}>{pick(unitContext(u).project.name)}</a>],
    ['compare.phaseBlock', (u) => `${t('unit.phase', { n: unitContext(u).phase.number })} · ${t('unit.block', { name: unitContext(u).block.name })}`],
    ['unit.roomsLabel', (u) => u.rooms],
    ['unit.areaLabel', (u) => `${u.area} ${t('unit.m2')}`],
    ['price.cat.developer', (u) =>
      missing(u.price) ? <span className="not-found">{t('common.priceNotPublished')}</span> : (
        <>
          {t('price.total', { price: millions(u.price, locale) })}
          <div className="sourced-meta">{t(`source.${u.priceSource}`)} · {u.priceDate}</div>
        </>
      )],
    ['price.perM2Label', (u) => (missing(u.pricePerM2) ? <span className="not-found">{t('common.priceNotPublished')}</span> : millions(u.pricePerM2, locale))],
    ['unit.floors', (u) => u.floors],
    ['unit.balcony', (u) => t(u.balcony ? 'common.yes' : 'common.no')],
    ['unit.orientation', (u) => (missing(u.orientation) ? nf : t(`dir.${u.orientation}`))],
    ['unit.statusLabel', (u) => t(`unit.status.${u.status}`)],
    ['unit.payment', (u) => (missing(u.payment) ? nf : pick(u.payment))]
  ];

  return (
    <section className="stack">
      <a className="back" href={href()}>← {t('common.back')}</a>
      <h1>{t('page.compare')}</h1>
      <p className="muted small">{t('compare.intro', { n: MAX })}</p>

      {units.length >= 2 ? (
        <div className="table-wrap card">
          <table className="table compare-table">
            <thead>
              <tr>
                {units.map((u) => (
                  <th key={u.id}>
                    {t('unit.rooms', { n: u.rooms })}, {u.area} {t('unit.m2')}
                    <button className="link-btn small" onClick={() => toggle(u.id)}>{t('compare.remove')}</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(([k, f]) => [
                <tr key={`${k}-label`} className="label-row">
                  <th scope="colgroup" colSpan={units.length}>{t(k)}</th>
                </tr>,
                <tr key={k}>
                  {units.map((u) => <td key={u.id}>{f(u)}</td>)}
                </tr>
              ])}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="card muted">{t('compare.pickMore')}</p>
      )}

      <div className="card stack">
        <h2>{t('compare.choose')}</h2>
        {db.projects.map((p) => {
          const list = db.unitTypes.filter((u) => unitContext(u).project?.id === p.id);
          if (!list.length) return null;
          return (
            <fieldset key={p.id} className="choose">
              <legend>{pick(p.name)}</legend>
              {list.map((u) => (
                <label key={u.id} className="toggle">
                  <input
                    type="checkbox"
                    checked={ids.includes(u.id)}
                    disabled={!ids.includes(u.id) && ids.length >= MAX}
                    onChange={() => toggle(u.id)}
                  />
                  {t('compare.option', {
                    phase: unitContext(u).phase.number,
                    block: unitContext(u).block.name,
                    rooms: u.rooms,
                    area: u.area
                  })}
                </label>
              ))}
            </fieldset>
          );
        })}
      </div>
    </section>
  );
}
