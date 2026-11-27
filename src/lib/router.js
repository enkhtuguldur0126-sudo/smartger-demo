import { useEffect, useState } from 'react';

// Энгийн hash чиглүүлэлт (#/project/p-1). Үнэгүй статик хостинг дээр нэмэлт тохиргоогүй ажиллана.
function current() {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  // Урилга, нууц үг сэргээх холбоосоор ирэхэд (#access_token=...) нэвтрэх хуудсыг нээнэ.
  if (/(^|&)(access_token|error)=/.test(hash)) return ['login'];
  return hash.split('/').filter(Boolean);
}

export function useRoute() {
  const [parts, setParts] = useState(current);
  useEffect(() => {
    const onChange = () => {
      setParts(current());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return parts;
}

export const href = (...parts) => '#/' + parts.join('/');
