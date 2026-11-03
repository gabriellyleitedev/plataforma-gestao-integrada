import { useEffect, useState } from 'react';
import { api } from '../services/api.js';
import { AuthContext } from '../hooks/useAuth.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    if (sessionStorage.getItem('pgi-token')) {
      api('/auth/me').then((value) => { if (!cancelled) setUser(value); })
        .catch(() => sessionStorage.removeItem('pgi-token')).finally(() => { if (!cancelled) setLoading(false); });
    } else Promise.resolve().then(() => { if (!cancelled) setLoading(false); });
    const expire = () => { sessionStorage.removeItem('pgi-token'); setUser(null); };
    window.addEventListener('pgi-session-expired', expire);
    return () => { cancelled = true; window.removeEventListener('pgi-session-expired', expire); };
  }, []);
  async function signIn(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: { email, password } });
    sessionStorage.setItem('pgi-token', result.token);
    setUser(result.user);
  }
  async function signOut() {
    try { await api('/auth/logout', { method: 'POST' }); }
    finally { sessionStorage.removeItem('pgi-token'); setUser(null); }
  }
  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}
