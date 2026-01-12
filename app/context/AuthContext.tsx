"use client";
import { useCallback } from 'react';
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { jwtDecode } from "jwt-decode";
interface TokenPayload {
  sub: string;
  role: "admin" | "user";
  exp: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  role: "admin" | "user" | null;
  isAdmin: boolean;
  authReady: boolean;
  authVersion: number;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

function getInitialAuthState() {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, role: null };
  }

  const token = localStorage.getItem("access_token");
  if (!token) {
    return { isAuthenticated: false, role: null };
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return {
      isAuthenticated: true,
      role: decoded.role,
    };
  } catch {
    return { isAuthenticated: false, role: null };
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const initialState = getInitialAuthState();

  const [isAuthenticated, setIsAuthenticated] = useState(
    initialState.isAuthenticated
  );
  const [role, setRole] = useState<"admin" | "user" | null>(initialState.role);
  const [authReady, setAuthReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  /* Marca o contexto como pronto após o boot inicial */
  useEffect(() => {
    setAuthReady(true);
  }, []);
  
const login = useCallback(
  (accessToken: string, refreshToken: string) => {
    const decoded = jwtDecode<TokenPayload>(accessToken);

    // Salva tokens no localStorage e cookie
    localStorage.setItem("access_token", accessToken);
    document.cookie = `refresh_token=${refreshToken}; path=/; secure`;

    setRole(decoded.role);
    setIsAuthenticated(true);
  },
  []
);

  const logout = () => {
    localStorage.removeItem("access_token");
    document.cookie =
      "refresh_token=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setIsAuthenticated(false);
    setRole(null);

    setAuthVersion((v) => v + 1);
  };

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setIsAuthenticated(false);
      setRole(null);
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setRole(decoded.role);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setRole(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        role,
        isAdmin: role === "admin",
        authReady,
        authVersion,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
