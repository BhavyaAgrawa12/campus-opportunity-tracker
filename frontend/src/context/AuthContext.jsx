import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getAuthToken, setAuthToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await api.getMe();
        setUser(profile);
      } catch (err) {
        console.error('Failed to load current user:', err);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setAuthToken(data.access_token);
    const profile = await api.getMe();
    setUser(profile);
    return profile;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    setAuthToken(data.access_token);
    const profile = await api.getMe();
    setUser(profile);
    return profile;
  };

  const updateProfile = async (payload) => {
    const updated = await api.updateProfile(payload);
    setUser(updated);
    return updated;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );

}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
