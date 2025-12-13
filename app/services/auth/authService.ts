// /services/authService.ts

import axios from 'axios';
import { LoginResponse } from '@/app/types/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Tipos para login normal
interface LoginData {
  email: string;
  password: string;
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
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro inesperado');
    }
    throw new Error('Erro inesperado');
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
// LOGIN VIA INSTAGRAM
// ---------------------------
export const initInstagramLogin = async (): Promise<string> => {
  try {
    const response = await axios.get(`${API_URL}/auth/instagram/init`);
    return (response.data as { auth_url: string }).auth_url;
  } catch {
    throw new Error('Erro ao iniciar login com Instagram');
  }
};

// ---------------------------
// REGISTER
// ---------------------------
export const registerUser = async (data: RegisterData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/register`, data);
    return response.data;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Erro inesperado');
    }
    throw new Error('Erro inesperado');
  }
};

export const getMe = async (): Promise<MeResponse> => {
  const response = await axios.get("/auth/me");
  return response.data as MeResponse;
};