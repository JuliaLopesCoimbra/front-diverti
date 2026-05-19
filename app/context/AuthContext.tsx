"use client";
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  role: "admin_master" | "subadmin" | "colunista" | "user" | "admin"; // Mantém "admin" para compatibilidade
  exp: number;
}

type UserRole = "admin_master" | "subadmin" | "colunista" | "user" | "admin" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  isAdminMaster: boolean;
  isSubadmin: boolean;
  isColunista: boolean;
  isAdmin: boolean; // Mantido para compatibilidade (admin_master ou subadmin)
  canCreatePost: boolean;
  canApprovePost: boolean;
  canCreateEvent: boolean;
  canInviteSubadmin: boolean;
  canInviteColunista: boolean;
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
  const router = useRouter();
  const initialState = getInitialAuthState();

  const [isAuthenticated, setIsAuthenticated] = useState(
    initialState.isAuthenticated
  );
  const [role, setRole] = useState<UserRole>(initialState.role);
  const [authReady, setAuthReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  // Computed permissions
  const isAdminMaster = role === "admin_master";
  const isSubadmin = role === "subadmin";
  const isColunista = role === "colunista";
  const isAdmin = role === "admin_master" || role === "subadmin" || role === "admin"; // Compatibilidade
  const canCreatePost = role === "admin_master" || role === "subadmin" || role === "colunista";
  const canApprovePost = role === "admin_master" || role === "subadmin";
  const canCreateEvent = role === "admin_master" || role === "subadmin";
  const canInviteSubadmin = role === "admin_master";
  const canInviteColunista = role === "admin_master" || role === "subadmin";

  /* Marca o contexto como pronto após o boot inicial */
  useEffect(() => {
    setAuthReady(true);
  }, []);

  /* Escuta evento do interceptor axios para logout sem hard reload */
  useEffect(() => {
    const handleForceLogout = () => {
      localStorage.removeItem("access_token");
      document.cookie = "refresh_token=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setIsAuthenticated(false);
      setRole(null);
      setAuthVersion((v) => v + 1);
      router.replace("/");
    };
    window.addEventListener("auth:force-logout", handleForceLogout);
    return () => window.removeEventListener("auth:force-logout", handleForceLogout);
  }, [router]);
  
const login = useCallback(
  (accessToken: string, refreshToken: string) => {
    try {
      const decoded = jwtDecode<TokenPayload>(accessToken);

      // Salva tokens no localStorage e cookie
      localStorage.setItem("access_token", accessToken);
      document.cookie = `refresh_token=${refreshToken}; path=/; secure`;

      // Garante que o role seja definido (pode ser undefined em tokens antigos)
      const userRole = decoded.role || null;
      setRole(userRole);
      setIsAuthenticated(true);
      
      // Força atualização do contexto
      setAuthVersion((v) => v + 1);
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      setIsAuthenticated(false);
      setRole(null);
    }
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
      setAuthReady(true);
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setRole(decoded.role || null);
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
        isAdminMaster,
        isSubadmin,
        isColunista,
        isAdmin,
        canCreatePost,
        canApprovePost,
        canCreateEvent,
        canInviteSubadmin,
        canInviteColunista,
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
