// Компанийн самбарын ерөнхий маягт. Талбаруудыг src/lib/forms.js-ээс авна.
import { useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { KINDS, SOURCES, validate, today } from '../lib/forms.js';

function Field({ f, value, onChange, error }) {
  const { t } = useLang();
  const label = t(`field.${f.name}`) + (f.required ? ' *' : '');
  const id = `f-${f.name}`;
  let input;
  if (f.type === 'i18n') {
    input = (
      <div className="field-pair">
        {['mn', 'en'].map((l) => (
          <input key={l} id={l === 'mn' ? id : undefined} className="input" placeholder={l.toUpperCase()} aria-label={`${label} ${l.toUpperCase()}`}
            value={value?.[l] || ''} onChange={(e) => onChange({ ...value, [l]: e.target.value })} />
        ))}
      </div>
    );
  } else if (f.type === 'select') {
    input = (
      <select id={id} className="input" value={value || ''} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {f.options.map((o) => <option key={o} value={o}>{t(`${f.optionKey}.${o}`)}</option>)}
      </select>
    );
  } else if (f.type === 'checkbox') {
    input = <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />;
  } else if (f.type === 'sourced') {
    const notFound = !value || 'status' in value;
    input = (
      <div className="stack-sm">
        <label className="check">
          <input type="checkbox" checked={notFound}
            onChange={(e) => onChange(e.target.checked ? { status: 'not_found' } : { value: '', source: '', date: today() })} />
          <span>{t('form.notFound')}</span>
        </label>
        {!notFound && (
          <div className="field-pair">
            <input id={id} className="input" type="number" step="any" placeholder={t('form.value')} aria-label={label}
              value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value })} />
            <select className="input" aria-label={t('common.source')} value={value.source || ''} onChange={(e) => onChange({ ...value, source: e.target.value })}>
              <option value="">{t('common.source')}</option>
              {SOURCES.map((s) => <option key={s} value={s}>{t(`source.${s}`)}</option>)}
            </select>
            <input className="input" type="date" aria-label={t('doc.date')} value={value.date || ''} onChange={(e) => onChange({ ...value, date: e.target.value })} />
          </div>
        )}
      </div>
    );
  } else {
    const type = f.type === 'text' ? 'text' : f.type;
    input = (
      <input id={id} className="input" type={type} step={f.step} min={f.min} max={f.max}
        value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    );
  }
  return (
    <div className={`field ${error ? 'field-error' : ''}`}>
      <label htmlFor={id}>{label}</label>
      {input}
      {f.hint && <span className="small muted">{t(f.hint)}</span>}
      {error && <span className="small text-bad" role="alert">{t(error)}</span>}
    </div>
  );
}

// parents: [{id, label}] эцэг мөрийн сонголт. extra: маягтын доод хэсэгт нэмэлт (зураг гэх мэт).
export default function RecordForm({ kind, initial, parents, onSave, onCancel, extra, busy }) {
  const { t } = useLang();
  const def = KINDS[kind];
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (name) => (v) => setValues((s) => ({ ...s, [name]: v }));

  const submit = (e) => {
    e.preventDefault();
    const { errors: errs, value } = validate(kind, values);
    if (def.parent && !values[def.parent.field]) errs[def.parent.field] = 'form.required';
    setErrors(errs);
    if (Object.keys(errs).length === 0) onSave(value);
  };

  return (
    <form className="card stack" onSubmit={submit} noValidate>
      {def.parent && (
        <div className={`field ${errors[def.parent.field] ? 'field-error' : ''}`}>
          <label htmlFor="f-parent">{t(`field.${def.parent.field}`)} *</label>
          <select id="f-parent" className="input" value={values[def.parent.field] || ''} onChange={(e) => set(def.parent.field)(e.target.value)}>
            <option value="">—</option>
            {parents.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          {errors[def.parent.field] && <span className="small text-bad" role="alert">{t(errors[def.parent.field])}</span>}
        </div>
      )}
      {def.fields.map((f) => (
        <Field key={f.name} f={f} value={values[f.name]} onChange={set(f.name)} error={errors[f.name]} />
      ))}
      {extra}
      {Object.keys(errors).length > 0 && <p className="text-bad small" role="alert">{t('form.fixErrors')}</p>}
      <p className="small muted">{t('form.pendingNote')}</p>
      <div className="card-row">
        <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? t('state.loading') : t('form.save')}</button>
        <button className="btn btn-secondary" type="button" onClick={onCancel}>{t('form.cancel')}</button>
      </div>
    </form>
  );
}
