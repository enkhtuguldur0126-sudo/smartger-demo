import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = ['system', 'light', 'dark'];
export const PALETTES = ['smartger', 'navy', 'sky', 'indigo', 'slate'];

const SettingsContext = createContext(null);

function readStored(key, allowed, fallback) {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
}

function store(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* үл тооно */
  }
}

export function SettingsProvider({ children }) {
  const [theme, setTheme] = useState(() => readStored('smartger.theme', THEMES, 'system'));
  const [palette, setPalette] = useState(() => readStored('smartger.palette', PALETTES, 'smartger'));

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    store('smartger.theme', theme);
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (palette === 'smartger') root.removeAttribute('data-palette');
    else root.setAttribute('data-palette', palette);
    store('smartger.palette', palette);
  }, [palette]);

  return (
    <SettingsContext.Provider value={{ theme, setTheme, palette, setPalette }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
