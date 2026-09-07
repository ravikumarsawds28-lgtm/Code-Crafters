import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('fitness_log_token') || null);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fitness_log_user');
    return saved ? JSON.parse(saved) : null;
  });

  const loginUser = (newToken, userData) => {
    localStorage.setItem('fitness_log_token', newToken);
    if (userData) {
      localStorage.setItem('fitness_log_user', JSON.stringify(userData));
    }
    setToken(newToken);
    setUser(userData);
  };

  const logoutUser = () => {
    localStorage.removeItem('fitness_log_token');
    localStorage.removeItem('fitness_log_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated: !!token,
        login: loginUser,
        logout: logoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
