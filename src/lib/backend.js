// Өгөгдлийн сантай (Supabase) холбогдох цэг. Тохируулаагүй бол null буцаана, сайт JSON-оор ажиллана.
import config from '../config/backend.json';

const url = import.meta.env.VITE_SUPABASE_URL || config.url;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || config.anonKey;

export const backendConfigured = Boolean(url && anonKey);
export const photoBucket = config.photoBucket;

let clientPromise = null;
// Supabase санг зөвхөн хэрэгтэй үед ачаална (тохируулаагүй сайт хурдан хэвээр).
export function getClient() {
  if (!backendConfigured) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import('@supabase/supabase-js').then(({ createClient }) =>
      createClient(url, anonKey, { auth: { persistSession: true, detectSessionInUrl: true } })
    );
  }
  return clientPromise;
}

export const photoUrl = (path) =>
  path && backendConfigured ? `${url}/storage/v1/object/public/${photoBucket}/${path}` : null;
