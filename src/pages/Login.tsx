import React, { useEffect, useState } from 'react';
import { Lock, Mail } from 'lucide-react';
import { FocusProvider, useSectionFocus } from '../lib/focus/FocusContext';
import { login } from '../lib/api';

interface LoginPageProps {
  onSuccess: () => void;
}

const LoginInner: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('admin@streamit.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await login(email, password);
      const token = typeof response === 'string'
        ? response
        : response?.token || response?.access_token || response?.data?.token || response?.data?.access_token;
      if (!token) throw new Error('No token');
      localStorage.setItem('tv_auth_token', String(token));
      onSuccess();
    } catch {
      setError('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const { isActive: emailActive, activate: activateEmail, setRef: setEmailRef } = useSectionFocus('login-email', {
    itemCount: 1,
    onDown: () => activatePassword(0),
    onEnter: () => void submit(),
  });

  const { isActive: passActive, activate: activatePassword, setRef: setPassRef } = useSectionFocus('login-password', {
    itemCount: 1,
    onUp: () => activateEmail(0),
    onDown: () => activateSubmit(0),
    onEnter: () => void submit(),
  });

  const { isActive: submitActive, activate: activateSubmit, setRef: setSubmitRef } = useSectionFocus('login-submit', {
    itemCount: 1,
    onUp: () => activatePassword(0),
    onEnter: () => void submit(),
  });

  useEffect(() => { activateEmail(0); }, []);

  // Focus the actual input when section becomes active
  useEffect(() => {
    if (emailActive) (document.querySelector('#input-email') as HTMLInputElement)?.focus();
  }, [emailActive]);

  useEffect(() => {
    if (passActive) (document.querySelector('#input-password') as HTMLInputElement)?.focus();
  }, [passActive]);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle at top, rgba(35,79,255,0.25), transparent 45%), #000' }}>
      <div style={{ width: 'min(92vw, 560px)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '24px', padding: '40px 36px', background: 'rgba(9,13,24,0.88)', boxShadow: '0 24px 70px rgba(0,0,0,0.45)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--color-tv-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Lock size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '30px' }}>Sign in to JET STREAM</h1>
            <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.64)' }}>Use the TV remote or keyboard to continue.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.78)' }}>
            <span>Email</span>
            <div
              ref={(el) => setEmailRef(el, 0)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${emailActive ? 'var(--color-tv-accent)' : 'rgba(255,255,255,0.16)'}`, borderRadius: '12px', padding: '0 14px', background: 'rgba(255,255,255,0.05)' }}
            >
              <Mail size={18} color="rgba(255,255,255,0.6)" />
              <input
                id="input-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'white', padding: '14px 0', fontSize: '16px' }}
              />
            </div>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: 'rgba(255,255,255,0.78)' }}>
            <span>Password</span>
            <div
              ref={(el) => setPassRef(el, 0)}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `1px solid ${passActive ? 'var(--color-tv-accent)' : 'rgba(255,255,255,0.16)'}`, borderRadius: '12px', padding: '0 14px', background: 'rgba(255,255,255,0.05)' }}
            >
              <Lock size={18} color="rgba(255,255,255,0.6)" />
              <input
                id="input-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', color: 'white', padding: '14px 0', fontSize: '16px' }}
              />
            </div>
          </label>

          <button
            ref={(el) => setSubmitRef(el, 0)}
            onClick={() => void submit()}
            style={{ marginTop: '8px', border: 'none', borderRadius: '12px', padding: '14px 18px', background: submitActive ? 'white' : 'var(--color-tv-accent)', color: submitActive ? 'black' : 'white', fontSize: '16px', fontWeight: 700, cursor: 'pointer', outline: submitActive ? '3px solid white' : 'none', outlineOffset: '2px' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        {error && <p style={{ marginTop: '16px', color: '#fca5a5' }}>{error}</p>}
        <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.48)', fontSize: '13px' }}>Hint: Use admin credentials from the API collection.</p>
      </div>
    </div>
  );
};

const LoginPage: React.FC<LoginPageProps> = (props) => (
  <FocusProvider>
    <LoginInner {...props} />
  </FocusProvider>
);

export default LoginPage;
