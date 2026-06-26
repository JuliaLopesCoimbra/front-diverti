// /services/auth/authAdminService.ts

import api from './axiosConfig';

// Tipos
interface InviteAdminData {
  name: string;
  email: string;
}

export interface UserInfo {
  id: number;
  name: string | null;
  email: string;
}

export interface UserResponse {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  invited_by_id: number | null;
  invited_by: UserInfo | null;
  deactivated_by_id: number | null;
  deactivated_by: UserInfo | null;
  deactivated_at: string | null;
  reactivated_by_id: number | null;
  reactivated_by: UserInfo | null;
  reactivated_at: string | null;
  created_at: string;
  is_email_verified: boolean;
}

interface FirstAccessData {
  token: string;
  password: string;
}

interface ResendAdminInviteData {
  email: string;
}

// ---------------------------
// INVITE ADMIN (legacy - cria admin direto)
// ---------------------------
export const inviteAdmin = async (data: InviteAdminData): Promise<void> => {
  try {
    await api.post("/auth/invite-admin", data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao convidar administrador");
  }
};

// ---------------------------
// FIRST ACCESS
// ---------------------------
export const firstAccess = async (data: FirstAccessData): Promise<void> => {
  try {
    await api.post("/auth/first-access", data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao definir senha");
  }
};

// ---------------------------
// RESEND ADMIN INVITE
// ---------------------------
export const resendAdminInvite = async (data: ResendAdminInviteData): Promise<void> => {
  try {
    await api.post("/auth/resend-admin-invite", data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao reenviar convite");
  }
};

// ---------------------------
// INVITE ADMIN USER (convida um novo admin)
// ---------------------------
export const inviteAdminUser = async (data: InviteAdminData): Promise<void> => {
  try {
    await api.post("/auth/invite-admin-user", data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao convidar admin");
  }
};

// ---------------------------
// INVITE PATROCINADOR
// ---------------------------
export const invitePatrocinador = async (data: InviteAdminData): Promise<void> => {
  try {
    await api.post("/auth/invite-patrocinador", data);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao convidar patrocinador");
  }
};

// ---------------------------
// REVOKE PATROCINADOR ACCESS
// ---------------------------
export const revokePatrocinadorAccess = async (patrocinadorId: number): Promise<void> => {
  try {
    await api.post(`/auth/revoke-patrocinador/${patrocinadorId}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao revogar acesso do patrocinador");
  }
};

// ---------------------------
// REVOKE ADMIN ACCESS
// ---------------------------
export const revokeAdminAccess = async (adminId: number): Promise<void> => {
  try {
    await api.post(`/auth/revoke-admin/${adminId}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao revogar acesso do admin");
  }
};

// ---------------------------
// REVOKE USER ACCESS
// ---------------------------
export const revokeUserAccess = async (userId: number): Promise<void> => {
  try {
    await api.post(`/auth/revoke-user/${userId}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao revogar acesso do usuário");
  }
};

// ---------------------------
// REACTIVATE PATROCINADOR ACCESS
// ---------------------------
export const reactivatePatrocinadorAccess = async (patrocinadorId: number): Promise<void> => {
  try {
    await api.post(`/auth/reactivate-patrocinador/${patrocinadorId}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao reativar acesso do patrocinador");
  }
};

// ---------------------------
// REACTIVATE ADMIN ACCESS
// ---------------------------
export const reactivateAdminAccess = async (adminId: number): Promise<void> => {
  try {
    await api.post(`/auth/reactivate-admin/${adminId}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao reativar acesso do admin");
  }
};

// ---------------------------
// REACTIVATE USER ACCESS
// ---------------------------
export const reactivateUserAccess = async (userId: number): Promise<void> => {
  try {
    await api.post(`/auth/reactivate-user/${userId}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao reativar acesso do usuário");
  }
};

// ---------------------------
// LIST ADMINS
// ---------------------------
export const listAdmins = async (limit?: number, offset?: number): Promise<UserResponse[]> => {
  try {
    const params: Record<string, number> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    const response = await api.get<UserResponse[]>("/auth/admins", { params });
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao listar admins");
  }
};

export const listPatrocinadores = async (limit?: number, offset?: number): Promise<UserResponse[]> => {
  try {
    const params: Record<string, number> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    const response = await api.get<UserResponse[]>("/auth/patrocinadores", { params });
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao listar patrocinadores");
  }
};

export const listUsers = async (limit?: number, offset?: number): Promise<UserResponse[]> => {
  try {
    const params: Record<string, number> = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    const response = await api.get<UserResponse[]>("/auth/users", { params });
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao listar usuários");
  }
};

// ---------------------------
// OPERADORES
// ---------------------------

export interface OperadorResponse {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
  restaurant_id: number | null;
  created_at: string;
}

export const createOperador = async (data: { name: string; email: string; password: string; restaurant_id?: number | null }): Promise<OperadorResponse> => {
  try {
    const response = await api.post<OperadorResponse>("/auth/admin/operadores", data);
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao criar operador");
  }
};

export const listOperadores = async (): Promise<OperadorResponse[]> => {
  try {
    const response = await api.get<OperadorResponse[]>("/auth/admin/operadores");
    return response.data;
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao listar operadores");
  }
};

export const deleteOperador = async (id: number): Promise<void> => {
  try {
    await api.delete(`/auth/admin/operadores/${id}`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { detail?: string; message?: string } }; message?: string };
    throw new Error(err.response?.data?.detail || err.response?.data?.message || err.message || "Erro ao remover operador");
  }
};
