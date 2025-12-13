// /app/context/AuthContext.tsx

'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const login = (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);  // Armazena o access_token no localStorage
    document.cookie = `refresh_token=${refreshToken}; path=/; secure; HttpOnly`;  // Armazena o refresh_token em um cookie HTTP-only
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('access_token');  // Remove o access_token do localStorage
    document.cookie = 'refresh_token=; path=/; secure; HttpOnly; expires=Thu, 01 Jan 1970 00:00:00 GMT';  // Remove o refresh_token do cookie
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
