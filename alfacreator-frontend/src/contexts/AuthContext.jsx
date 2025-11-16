// src/contexts/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser, registerUser, getCurrentUserProfile } from '../api/apiClient';
import Loader from '../components/Loader';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      if (token) {
        try {
          const { data } = await getCurrentUserProfile();
          setUser(data);
        } catch (error) {
          console.error("Невалидный токен, выход из системы.");
          logout();
        }
      }
      setLoading(false);
    };
    validateToken();
  }, [token]);

  const login = async (email, password) => {
    const { data } = await loginUser(email, password);
    localStorage.setItem('authToken', data.access_token);
    setToken(data.access_token);
  };

  const register = async (email, password) => {
    await registerUser(email, password);
    await login(email, password);
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUserData) => {
    setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
  };

  if (loading) {
    // Оборачиваем в div для лучшего отображения
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <Loader />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);