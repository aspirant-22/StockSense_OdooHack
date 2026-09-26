import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('stocksense_token');
      const storedUser = localStorage.getItem('stocksense_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with backend
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('stocksense_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Session expired or invalid', err);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      const { token, ...userData } = res.data.data;
      localStorage.setItem('stocksense_token', token);
      localStorage.setItem('stocksense_user', JSON.stringify(userData));
      setUser(userData);
      return res.data;
    }
  };

  const register = async (name, email, password, role = 'manager') => {
    const res = await api.post('/auth/register', { name, email, password, role });
    if (res.data.success) {
      const { token, ...userData } = res.data.data;
      localStorage.setItem('stocksense_token', token);
      localStorage.setItem('stocksense_user', JSON.stringify(userData));
      setUser(userData);
      return res.data;
    }
  };

  const logout = () => {
    localStorage.removeItem('stocksense_token');
    localStorage.removeItem('stocksense_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
