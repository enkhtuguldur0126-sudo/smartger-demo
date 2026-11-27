// Нэвтрэлт: зочин (нэвтрээгүй), компани, Smartger админ.
// Компани сайт дээр өөрөө бүртгүүлнэ. Админ компанид холбох хүртэл юу ч өөрчлөх эрхгүй.
import { createContext, useContext, useEffect, useState } from 'react';
import { getClient, backendConfigured } from './backend.js';

const AuthContext = createContext({ ready: true, user: null, profile: null, role: 'guest' });

export function AuthProvider({ children }) {
  const [state, setState] = useState({ ready: !backendConfigured, user: null, profile: null });

  useEffect(() => {
    if (!backendConfigured) return;
    let sub;
    let alive = true;
    getClient().then(async (client) => {
      const apply = async (session) => {
        const user = session?.user || null;
        let profile = null;
        if (user) {
          const { data } = await client.from('profiles').select('id, email, role, company_id').eq('id', user.id).maybeSingle();
          profile = data || null;
        }
        if (alive) setState({ ready: true, user, profile });
      };
      const { data } = await client.auth.getSession();
      await apply(data.session);
      sub = client.auth.onAuthStateChange((_e, session) => { apply(session); }).data.subscription;
    });
    return () => { alive = false; sub?.unsubscribe(); };
  }, []);

  const role = !state.user ? 'guest' : state.profile?.role === 'admin' ? 'admin' : state.profile?.company_id ? 'company' : 'none';
  return <AuthContext.Provider value={{ ...state, role }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export async function signIn(email, password) {
  const client = await getClient();
  return client.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password, companyName, phone) {
  const client = await getClient();
  return client.auth.signUp({
    email,
    password,
    options: {
      data: { company_name: companyName, phone },
      emailRedirectTo: window.location.origin + window.location.pathname + '#/login'
    }
  });
}

export async function signOut() {
  const client = await getClient();
  await client?.auth.signOut();
}

export async function sendReset(email) {
  const client = await getClient();
  return client.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname + '#/login' });
}

export async function updatePassword(password) {
  const client = await getClient();
  return client.auth.updateUser({ password });
}
