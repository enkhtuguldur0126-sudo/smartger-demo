// Нэвтрэх ба бүртгүүлэх хуудас. Шинэ бүртгэлийг админ компанид холбосны дараа л мэдээлэл оруулна.
import { useState } from 'react';
import { useLang } from '../lib/i18n.jsx';
import { useAuth, signIn, signUp, signOut, sendReset, updatePassword } from '../lib/auth.jsx';
import { backendConfigured } from '../lib/backend.js';
import { href } from '../lib/router.js';
import { Loading } from '../components/States.jsx';

function NotConfigured() {
  const { t } = useLang();
  return (
    <div className="card empty">
      <h2>{t('auth.notConfiguredTitle')}</h2>
      <p>{t('auth.notConfigured')}</p>
    </div>
  );
}

function Account() {
  const { t } = useLang();
  const { user, profile, role } = useAuth();
  const [pw, setPw] = useState('');
  const [msg, setMsg] = useState(null);
  const change = async (e) => {
    e.preventDefault();
    if (pw.length < 10) return setMsg({ bad: true, k: 'auth.pwShort' });
    const { error } = await updatePassword(pw);
    setMsg(error ? { bad: true, k: 'auth.failed' } : { k: 'auth.pwChanged' });
    if (!error) setPw('');
  };
  return (
    <div className="stack">
      <div className="card stack-sm">
        <h2>{t('auth.account')}</h2>
        <p>{user.email}</p>
        <p><span className="badge">{t(`role.${role}`)}</span>{profile?.company_id && <span className="small muted"> · {profile.company_id}</span>}</p>
        {role === 'none' && <p className="small muted">{t('auth.noRole')}</p>}
        <div className="card-row">
          {(role === 'company' || role === 'admin') && <a className="btn btn-primary" href={href('workspace')}>{t('nav.workspace')}</a>}
          {role === 'admin' && <a className="btn btn-primary" href={href('admin')}>{t('nav.admin')}</a>}
          <button className="btn btn-secondary" onClick={() => signOut()}>{t('auth.signOut')}</button>
        </div>
      </div>
      <form className="card stack-sm" onSubmit={change}>
        <h2>{t('auth.newPassword')}</h2>
        <div className="field">
          <label htmlFor="pw-new">{t('auth.password')}</label>
          <input id="pw-new" className="input" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} />
          <span className="small muted">{t('auth.pwRule')}</span>
        </div>
        {msg && <p className={`small ${msg.bad ? 'text-bad' : 'text-ok'}`} role="status">{t(msg.k)}</p>}
        <div><button className="btn btn-secondary" type="submit">{t('auth.savePassword')}</button></div>
      </form>
    </div>
  );
}

export default function Login() {
  const { t } = useLang();
  const { ready, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const [mode, setMode] = useState('signin');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);

  if (!backendConfigured) return <section className="stack"><h1>{t('auth.title')}</h1><NotConfigured /></section>;
  if (!ready) return <Loading />;
  if (user) return <section className="stack"><h1>{t('auth.account')}</h1><Account /></section>;

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (mode === 'signup') {
      if (password.length < 10) return setMsg({ bad: true, k: 'auth.pwShort' });
      if (!company.trim()) return setMsg({ bad: true, k: 'auth.needCompany' });
      if (!agree) return setMsg({ bad: true, k: 'auth.needAgree' });
      setBusy(true);
      const { data, error } = await signUp(email.trim(), password, company.trim(), phone.trim());
      setBusy(false);
      if (error) return setMsg({ bad: true, k: /already|registered/i.test(error.message) ? 'auth.exists' : 'auth.failed' });
      if (!data.session) setMsg({ k: 'auth.checkEmail' });
      return;
    }
    setBusy(true);
    const { error } = await signIn(email.trim(), password);
    setBusy(false);
    if (error) setMsg({ bad: true, k: /confirm/i.test(error.message) ? 'auth.notConfirmed' : 'auth.wrong' });
  };
  const switchMode = (m) => { setMode(m); setMsg(null); };
  const reset = async () => {
    if (!email.trim()) return setMsg({ bad: true, k: 'auth.needEmail' });
    await sendReset(email.trim());
    setMsg({ k: 'auth.resetSent' });
  };

  return (
    <section className="stack narrow">
      <h1>{t(mode === 'signup' ? 'auth.signUpTitle' : 'auth.title')}</h1>
      <div className="segmented" role="group">
        <button aria-pressed={mode === 'signin'} onClick={() => switchMode('signin')}>{t('auth.signIn')}</button>
        <button aria-pressed={mode === 'signup'} onClick={() => switchMode('signup')}>{t('auth.signUp')}</button>
      </div>
      <form className="card stack" onSubmit={submit}>
        <p className="small muted">{t(mode === 'signup' ? 'auth.signUpIntro' : 'auth.intro')}</p>
        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="company">{t('auth.companyName')} *</label>
            <input id="company" className="input" autoComplete="organization" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="email">{t('auth.email')}{mode === 'signup' && ' *'}</label>
          <input id="email" className="input" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="phone">{t('auth.phone')}</label>
            <input id="phone" className="input" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        )}
        <div className="field">
          <label htmlFor="pw">{t('auth.password')}{mode === 'signup' && ' *'}</label>
          <input id="pw" className="input" type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} required />
          {mode === 'signup' && <span className="small muted">{t('auth.pwRule')}</span>}
        </div>
        {mode === 'signup' && (
          <label className="check small">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>{t('auth.agree')} <a href={href('terms')}>{t('nav.terms')}</a>, <a href={href('privacy')}>{t('nav.privacy')}</a></span>
          </label>
        )}
        {msg && <p className={`small ${msg.bad ? 'text-bad' : 'text-ok'}`} role="status">{t(msg.k)}</p>}
        <div className="card-row">
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? t('state.loading') : t(mode === 'signup' ? 'auth.signUp' : 'auth.signIn')}</button>
          {mode === 'signin' && <button className="btn btn-secondary" type="button" onClick={reset}>{t('auth.forgot')}</button>}
        </div>
      </form>
    </section>
  );
}
