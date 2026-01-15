// /services/authService.ts

import axios from 'axios';
import { LoginResponse } from '@/app/types/types';
import api from './axiosConfig';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Tipos para login normal
interface LoginData {
  email: string;
  password: string;
}
interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}
interface RegisterData {
  name: string;
  email: string;
  password: string;
}
export interface MeResponse {
  id: number;
  name: string;
  photo_url?: string;
  current_environment: {
    id: number;
    name: string;
  };
}
// ---------------------------
// LOGIN NORMAL
// ---------------------------
export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data as LoginResponse;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        data?: {
          detail?: string;
          message?: string;
        };
      };
      message?: string;
    };

    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Erro ao fazer login";

    throw new Error(message);
  }
};

export const refreshAuthToken = async (
  refreshToken: string
): Promise<RefreshResponse> => {
  try {
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });

    return response.data as RefreshResponse;
  } catch {
    throw new Error("Sessão expirada");
  }
};
// ---------------------------
// LOGIN VIA GOOGLE
// ---------------------------
export const initGoogleLogin = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/auth/google/init`);
    return (response.data as { auth_url: string }).auth_url; // retorna URL de autenticação
  } catch {
    throw new Error('Erro ao iniciar login com Google');
  }
};
// ---------------------------
// LOGIN VIA FACEBOOK
// ---------------------------
export const initFacebookLogin = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/auth/facebook/init`);
    return (response.data as { auth_url: string }).auth_url;
  } catch {
    throw new Error('Erro ao iniciar login com Facebook');
  }
};

// ---------------------------
// REGISTER
// ---------------------------
export const registerUser = async (
  data: RegisterData
): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/register`, data);
  } catch (error: unknown) {
    const err = error as {
      response?: {
        data?: {
          detail?: string;
          message?: string;
        };
      };
      message?: string;
    };

    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Erro ao realizar cadastro";

    throw new Error(message);
  }
};

export const verifyEmail = async (token: string) => {
  const response = await api.post("/auth/verify-email", { token });
  return response.data;
};

export const resendVerificationEmail = async (email: string): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/resend-verification`, { email });
  } catch (error: unknown) {
    const err = error as {
      response?: {
        data?: {
          detail?: string;
          message?: string;
        };
        status?: number;
      };
      message?: string;
    };

    const message =
      err.response?.data?.detail ||
      err.response?.data?.message ||
      err.message ||
      "Erro ao reenviar email de verificação";

    throw new Error(message);
  }
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await api.get<MeResponse>("/auth/me");
  return response.data;
};
