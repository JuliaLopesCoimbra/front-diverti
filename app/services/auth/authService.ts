// /services/authService.ts

import axios from 'axios';
import { LoginResponse } from '@/app/types/types';
import api from './axiosConfig';
import { getApiUrl } from '@/app/utils/apiUrlHelper';

const API_URL = getApiUrl();

// Tipos para login normal
interface LoginData {
  email: string;
  password: string;
  remember_me?: boolean;
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
  birth_date: string;
  cpf: string;
  gender: "male" | "female" | "other" | "prefer_not_to_say";
  lgpd_accepted: boolean;
  age_terms_accepted: boolean;
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
          detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
          message?: string;
        };
        status?: number;
      };
      message?: string;
    };

    // Verificar se precisa verificar idade ou completar perfil - verificar primeiro antes de processar outros erros
    const detail = err.response?.data?.detail;
    if (detail) {
      // Se detail é string, tentar parsear como JSON
      if (typeof detail === 'string') {
        try {
          const parsedDetail = JSON.parse(detail);
          
          // Verificar se precisa completar perfil
          if (parsedDetail.requires_profile_completion && parsedDetail.temp_token) {
            const specialError: any = new Error("PROFILE_COMPLETION_REQUIRED");
            specialError.tempToken = parsedDetail.temp_token;
            throw specialError;
          }
          
          // Verificar se precisa verificar idade
          if (parsedDetail.requires_age_verification && parsedDetail.temp_token) {
            const specialError: any = new Error("AGE_VERIFICATION_REQUIRED");
            specialError.tempToken = parsedDetail.temp_token;
            throw specialError;
          }
        } catch (parseError: any) {
          // Se for o erro especial que criamos, relançar
          if (parseError.message === "PROFILE_COMPLETION_REQUIRED" || parseError.message === "AGE_VERIFICATION_REQUIRED") {
            throw parseError;
          }
          // Se não for JSON válido ou não for o erro especial, continua
        }
      }
    }

    // Extrair mensagem de erro normal
    let message = "Erro ao fazer login";

    // Tratar erros de validação do Pydantic (status 422)
    if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
      const validationErrors = err.response.data.detail as Array<{ loc: string[]; msg: string; type: string }>;
      const emailError = validationErrors.find(
        (error) => error.loc.includes('email') || error.type.includes('email')
      );
      
      if (emailError) {
        // Traduzir erro de email inválido
        if (emailError.type.includes('email') || emailError.msg.includes('email')) {
          message = "Forneça um email válido";
        } else {
          message = emailError.msg;
        }
      } else if (validationErrors.length > 0) {
        // Usar a primeira mensagem de erro de validação
        message = validationErrors[0].msg;
      }
    } else {
      // Tratar outros tipos de erro
      const detailValue = err.response?.data?.detail;
      
      if (typeof detailValue === 'string') {
        message = detailValue;
      } else if (Array.isArray(detailValue) && detailValue.length > 0) {
        // Se for array mas não foi tratado acima
        const firstError = detailValue[0];
        if (typeof firstError === 'object' && 'msg' in firstError) {
          message = firstError.msg;
        } else {
          message = String(firstError);
        }
      } else {
        message = 
          err.response?.data?.message ||
          err.message ||
          "Erro ao fazer login";
      }

      // Tentar parsear se for JSON (pode conter informações estruturadas)
      if (typeof message === 'string') {
        try {
          const parsed = JSON.parse(message);
          if (typeof parsed === 'object' && parsed.message) {
            message = parsed.message;
          }
        } catch {
          // Não é JSON, usar mensagem original
        }
      }
    }

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
): Promise<{ needsEmailUpdate?: boolean }> => {
  try {
    await axios.post(`${API_URL}/auth/register`, data);
    return {};
  } catch (error: unknown) {
    const err = error as {
      response?: {
        data?: {
          detail?: string | Array<{ loc: string[]; msg: string; type: string }>;
          message?: string;
        };
        status?: number;
      };
      message?: string;
    };

    // Tratar erro 428 - CPF existe mas email não verificado
    if (err.response?.status === 428) {
      const detailValue = err.response?.data?.detail;
      const message = typeof detailValue === 'string' ? detailValue : "CPF já cadastrado. O email cadastrado ainda não foi verificado.";
      const customError = new Error(message) as Error & { needsEmailUpdate?: boolean };
      customError.needsEmailUpdate = true;
      throw customError;
    }

    // Extrair mensagem de erro
    let message = "Erro ao realizar cadastro";

    // Tratar erros de validação do Pydantic (status 422)
    if (err.response?.status === 422 && Array.isArray(err.response?.data?.detail)) {
      const validationErrors = err.response.data.detail as Array<{ loc: string[]; msg: string; type: string }>;
      const emailError = validationErrors.find(
        (error) => error.loc.includes('email') || error.type.includes('email')
      );
      
      if (emailError) {
        // Traduzir erro de email inválido
        if (emailError.type.includes('email') || emailError.msg.includes('email')) {
          message = "Forneça um email válido";
        } else {
          message = emailError.msg;
        }
      } else if (validationErrors.length > 0) {
        // Usar a primeira mensagem de erro de validação
        message = validationErrors[0].msg;
      }
    } else {
      // Tratar outros tipos de erro
      const detailValue = err.response?.data?.detail;
      
      if (typeof detailValue === 'string') {
        message = detailValue;
      } else if (Array.isArray(detailValue) && detailValue.length > 0) {
        // Se for array mas não foi tratado acima
        const firstError = detailValue[0];
        if (typeof firstError === 'object' && 'msg' in firstError) {
          message = firstError.msg;
        } else {
          message = String(firstError);
        }
      } else {
        message = 
          err.response?.data?.message ||
          err.message ||
          "Erro ao realizar cadastro";
      }
    }

    throw new Error(message);
  }
};

export const updateEmailByCpf = async (
  cpf: string,
  email: string
): Promise<void> => {
  try {
    await axios.post(`${API_URL}/auth/update-email-by-cpf`, { cpf, email });
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
      "Erro ao atualizar email";

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

// ---------------------------
// VERIFICAÇÃO DE IDADE
// ---------------------------
export const verifyAge = async (
  birthDate: string,
  confirmed: boolean,
  token?: string
): Promise<{ requires_profile_completion?: boolean; temp_token?: string }> => {
  try {
    const headers: any = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await axios.post<{
      message: string;
      requires_profile_completion?: boolean;
      temp_token?: string;
    }>(
      `${API_URL}/auth/verify-age`,
      { confirmed, birth_date: birthDate },
      { headers }
    );
    
    return {
      requires_profile_completion: response.data.requires_profile_completion,
      temp_token: response.data.temp_token,
    };
  } catch (error: any) {
    const message =
      error.response?.data?.detail ||
      error.message ||
      "Erro ao verificar idade";
    throw new Error(message);
  }
};
