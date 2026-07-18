import { createContext, useContext, useState, useEffect } from 'react';
import api, { getToken, setToken, removeToken } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: restore session for this tab using the tab's active role
  useEffect(() => {
    const token = getToken();
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data.user);
          setProfile(res.data.profile);
        })
        .catch(() => removeToken())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    // Namespace the token by role so multiple roles can coexist in localStorage
    setToken(res.data.token, res.data.user.role);
    setUser(res.data.user);
    try {
      const me = await api.get('/auth/me');
      setProfile(me.data.profile);
    } catch (_) {}
    return { ...res.data, role: res.data.user.role };
  };

  const registerStudent = async (data) => {
    const res = await api.post('/auth/register/student', data);
    setToken(res.data.token, 'STUDENT');
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const registerCompany = async (data) => {
    const res = await api.post('/auth/register/company', data);
    setToken(res.data.token, 'COMPANY');
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const registerSupervisor = async (data) => {
    const res = await api.post('/auth/register/supervisor', data);
    setToken(res.data.token, 'SUPERVISOR');
    setUser(res.data.user);
    setProfile(res.data.profile);
    return res.data;
  };

  const refreshProfile = async () => {
    try {
      const me = await api.get('/auth/me');
      setProfile(me.data.profile);
    } catch (_) {}
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, registerStudent, registerCompany, registerSupervisor, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
