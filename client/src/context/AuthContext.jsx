import { createContext, useContext, useState } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  function persist(nextUser, nextToken) {
    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('token', nextToken);
    setUser(nextUser);
    setToken(nextToken);
  }

  async function login(email, password) {
    const { user: u, token: t } = await authApi.login({ email, password });
    persist(u, t);
  }

  async function register(email, password, name) {
    const { user: u, token: t } = await authApi.register({ email, password, name });
    persist(u, t);
  }

  function logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
