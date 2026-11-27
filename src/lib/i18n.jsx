import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import mn from '../i18n/mn.json';
import en from '../i18n/en.json';
import zh from '../i18n/zh.json';

const dictionaries = { mn, en, zh };
// Хятад хэлний файл бэлэн боловч хоосон тул сэлгэгчид харуулахгүй.
export const LANGUAGES = ['mn', 'en'];

const LangContext = createContext(null);

function readStored(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = readStored('smartger.lang', 'mn');
    return dictionaries[stored] ? stored : 'mn';
  });

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('smartger.lang', lang);
    } catch {
      /* хадгалах боломжгүй бол үл тооно */
    }
  }, [lang]);

  const value = useMemo(() => {
    const dict = dictionaries[lang];
    // Түлхүүрээр бичвэр авна. Хоосон бол Англи, тэгээд Монгол руу буцна.
    const t = (key, vars) => {
      let s = dict[key] || en[key] || mn[key] || key;
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, v);
      return s;
    };
    // Өгөгдлийн {mn, en} талбараас тухайн хэлийг сонгоно.
    const pick = (obj) => {
      if (obj == null) return null;
      if (typeof obj === 'string') return obj;
      return obj[lang] || obj.en || obj.mn || null;
    };
    const locale = lang === 'mn' ? 'mn-MN' : lang === 'zh' ? 'zh-CN' : 'en-GB';
    return { lang, setLang, t, pick, locale };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}
