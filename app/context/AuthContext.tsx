"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { jwtDecode } from "jwt-decode";
interface TokenPayload {
  sub: string;
  role: "admin_master" | "admin" | "patrocinador" | "user";
  name?: string | null;
  exp: number;
}

type UserRole = "admin_master" | "admin" | "patrocinador" | "user" | null;

interface AuthContextType {
  isAuthenticated: boolean;
  role: UserRole;
  userName: string | null;
  isAdminMaster: boolean;
  isAdmin: boolean; // admin_master ou admin
  isPatrocinador: boolean;
  canCreatePost: boolean;
  canApprovePost: boolean;
  canCreateEvent: boolean;
  canInviteAdmin: boolean;
  canInvitePatrocinador: boolean;
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
    return { isAuthenticated: false, role: null, userName: null };
  }

  const token = localStorage.getItem("circuito_access_token");
  if (!token) {
    return { isAuthenticated: false, role: null, userName: null };
  }

  try {
    const decoded = jwtDecode<TokenPayload>(token);
    return {
      isAuthenticated: true,
      role: decoded.role,
      userName: decoded.name ?? null,
    };
  } catch {
    return { isAuthenticated: false, role: null, userName: null };
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const initialState = getInitialAuthState();

  const [isAuthenticated, setIsAuthenticated] = useState(
    initialState.isAuthenticated
  );
  const [role, setRole] = useState<UserRole>(initialState.role);
  const [userName, setUserName] = useState<string | null>(initialState.userName);
  const [authReady, setAuthReady] = useState(false);
  const [authVersion, setAuthVersion] = useState(0);

  // Computed permissions
  const isAdminMaster = role === "admin_master";
  const isAdmin = role === "admin_master" || role === "admin";
  const isPatrocinador = role === "patrocinador";
  const canCreatePost = role === "admin_master" || role === "admin" || role === "patrocinador";
  const canApprovePost = role === "admin_master" || role === "admin";
  const canCreateEvent = role === "admin_master" || role === "admin";
  const canInviteAdmin = role === "admin_master";
  const canInvitePatrocinador = role === "admin_master" || role === "admin";

  /* Marca o contexto como pronto após o boot inicial */
  useEffect(() => {
    setAuthReady(true);
  }, []);

  /* Escuta evento do interceptor axios para logout sem hard reload */
  useEffect(() => {
    const handleForceLogout = () => {
      localStorage.removeItem("circuito_access_token");
      document.cookie = "refresh_token=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      setIsAuthenticated(false);
      setRole(null);
      setAuthVersion((v) => v + 1);
      // Não usa router.replace aqui — pages protegidas detectam isAuthenticated=false e redirecionam
    };
    window.addEventListener("auth:force-logout", handleForceLogout);
    return () => window.removeEventListener("auth:force-logout", handleForceLogout);
  }, []);
  
const login = useCallback(
  (accessToken: string, refreshToken: string) => {
    try {
      const decoded = jwtDecode<TokenPayload>(accessToken);

      // Salva tokens no localStorage e cookie
      localStorage.setItem("circuito_access_token", accessToken);
      document.cookie = `refresh_token=${refreshToken}; path=/; secure`;

      // Garante que o role seja definido (pode ser undefined em tokens antigos)
      const userRole = decoded.role || null;
      setRole(userRole);
      setUserName(decoded.name ?? null);
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

  const logout = useCallback(() => {
    localStorage.removeItem("circuito_access_token");
    document.cookie =
      "refresh_token=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    setIsAuthenticated(false);
    setRole(null);
    setUserName(null);

    setAuthVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("circuito_access_token");

    if (!token) {
      setIsAuthenticated(false);
      setRole(null);
      setAuthReady(true);
      return;
    }

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      setRole(decoded.role || null);
      setUserName(decoded.name ?? null);
      setIsAuthenticated(true);
    } catch {
      setIsAuthenticated(false);
      setRole(null);
      setUserName(null);
    } finally {
      setAuthReady(true);
    }
  }, []);

  

  const contextValue = useMemo(() => ({
    isAuthenticated,
    role,
    userName,
    isAdminMaster,
    isAdmin,
    isPatrocinador,
    canCreatePost,
    canApprovePost,
    canCreateEvent,
    canInviteAdmin,
    canInvitePatrocinador,
    authReady,
    authVersion,
    login,
    logout,
  }), [
    isAuthenticated,
    role,
    userName,
    isAdminMaster,
    isAdmin,
    isPatrocinador,
    canCreatePost,
    canApprovePost,
    canCreateEvent,
    canInviteAdmin,
    canInvitePatrocinador,
    authReady,
    authVersion,
    login,
    logout,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
