import { useState } from 'react';
import { useLang, LANGUAGES } from '../lib/i18n.jsx';
import { useSettings, THEMES, PALETTES } from '../lib/settings.jsx';
import { href } from '../lib/router.js';

const NAV = [
  ['nav.home', ''],
  ['nav.companies', 'companies'],
  ['nav.compare', 'compare'],
  ['nav.how', 'how-it-works'],
  ['nav.report', 'report']
];

export default function Header({ active }) {
  const { t, lang, setLang } = useLang();
  const { theme, setTheme, palette, setPalette } = useSettings();
  const [open, setOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-bar">
        <a className="brand" href={href()}>
          <img src={`${import.meta.env.BASE_URL}logo-mark.png`} alt="" width="32" height="32" />
          <span>{t('app.name')}</span>
        </a>
        <div className="header-actions">
          <div className="segmented" role="group" aria-label={t('settings.language')}>
            {LANGUAGES.map((l) => (
              <button key={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            className="icon-btn"
            aria-label={t('nav.menu')}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <nav className={`nav ${open ? 'open' : ''}`}>
        {NAV.map(([key, path]) => (
          <a
            key={key}
            href={href(...(path ? [path] : []))}
            aria-current={active === path ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {t(key)}
          </a>
        ))}
        <div className="nav-settings">
          <label>
            <span>{t('settings.theme')}</span>
            <div className="segmented">
              {THEMES.map((th) => (
                <button key={th} aria-pressed={theme === th} onClick={() => setTheme(th)}>
                  {t(`settings.theme.${th}`)}
                </button>
              ))}
            </div>
          </label>
          <label>
            <span>{t('settings.palette')}</span>
            <div className="swatches">
              {PALETTES.map((p) => (
                <button
                  key={p}
                  className={`swatch swatch-${p}`}
                  aria-pressed={palette === p}
                  aria-label={t(`palette.${p}`)}
                  title={t(`palette.${p}`)}
                  onClick={() => setPalette(p)}
                />
              ))}
            </div>
          </label>
        </div>
      </nav>
    </header>
  );
}
