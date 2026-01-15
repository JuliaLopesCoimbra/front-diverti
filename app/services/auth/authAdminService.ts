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
  deactivated_at: string | null; // ISO datetime string
  reactivated_by_id: number | null;
  reactivated_by: UserInfo | null;
  reactivated_at: string | null; // ISO datetime string
  created_at: string; // ISO datetime string
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
// INVITE ADMIN
// ---------------------------
export const inviteAdmin = async (data: InviteAdminData): Promise<void> => {
  try {
    await api.post("/auth/invite-admin", data);
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
      "Erro ao convidar administrador";

    throw new Error(message);
  }
};

// ---------------------------
// FIRST ACCESS
// ---------------------------
export const firstAccess = async (data: FirstAccessData): Promise<void> => {
  try {
    await api.post("/auth/first-access", data);
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
      "Erro ao definir senha";

    throw new Error(message);
  }
};

// ---------------------------
// RESEND ADMIN INVITE
// ---------------------------
export const resendAdminInvite = async (
  data: ResendAdminInviteData
): Promise<void> => {
  try {
    await api.post("/auth/resend-admin-invite", data);
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
      "Erro ao reenviar convite";

    throw new Error(message);
  }
};

// ---------------------------
// INVITE SUBADMIN
// ---------------------------
export const inviteSubadmin = async (data: InviteAdminData): Promise<void> => {
  try {
    await api.post("/auth/invite-subadmin", data);
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
      "Erro ao convidar subadmin";

    throw new Error(message);
  }
};

// ---------------------------
// INVITE COLUNISTA
// ---------------------------
export const inviteColunista = async (data: InviteAdminData): Promise<void> => {
  try {
    await api.post("/auth/invite-colunista", data);
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
      "Erro ao convidar colunista";

    throw new Error(message);
  }
};

// ---------------------------
// REVOKE COLUNISTA ACCESS
// ---------------------------
export const revokeColunistaAccess = async (colunistaId: number): Promise<void> => {
  try {
    await api.post(`/auth/revoke-colunista/${colunistaId}`);
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
      "Erro ao revogar acesso do colunista";

    throw new Error(message);
  }
};

// ---------------------------
// REVOKE SUBADMIN ACCESS
// ---------------------------
export const revokeSubadminAccess = async (subadminId: number): Promise<void> => {
  try {
    await api.post(`/auth/revoke-subadmin/${subadminId}`);
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
      "Erro ao revogar acesso do subadmin";

    throw new Error(message);
  }
};

// ---------------------------
// REVOKE USER ACCESS
// ---------------------------
export const revokeUserAccess = async (userId: number): Promise<void> => {
  try {
    await api.post(`/auth/revoke-user/${userId}`);
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
      "Erro ao revogar acesso do usuário";

    throw new Error(message);
  }
};

// ---------------------------
// REACTIVATE COLUNISTA ACCESS
// ---------------------------
export const reactivateColunistaAccess = async (colunistaId: number): Promise<void> => {
  try {
    await api.post(`/auth/reactivate-colunista/${colunistaId}`);
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
      "Erro ao reativar acesso do colunista";

    throw new Error(message);
  }
};

// ---------------------------
// REACTIVATE SUBADMIN ACCESS
// ---------------------------
export const reactivateSubadminAccess = async (subadminId: number): Promise<void> => {
  try {
    await api.post(`/auth/reactivate-subadmin/${subadminId}`);
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
      "Erro ao reativar acesso do subadmin";

    throw new Error(message);
  }
};

// ---------------------------
// REACTIVATE USER ACCESS
// ---------------------------
export const reactivateUserAccess = async (userId: number): Promise<void> => {
  try {
    await api.post(`/auth/reactivate-user/${userId}`);
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
      "Erro ao reativar acesso do usuário";

    throw new Error(message);
  }
};

// ---------------------------
// LIST USERS
// ---------------------------
export const listSubadmins = async (limit?: number, offset?: number): Promise<UserResponse[]> => {
  try {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    
    const response = await api.get<UserResponse[]>("/auth/subadmins", { params });
    return response.data;
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
      "Erro ao listar subadmins";

    throw new Error(message);
  }
};

export const listColunistas = async (limit?: number, offset?: number): Promise<UserResponse[]> => {
  try {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    
    const response = await api.get<UserResponse[]>("/auth/colunistas", { params });
    return response.data;
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
      "Erro ao listar colunistas";

    throw new Error(message);
  }
};

export const listUsers = async (limit?: number, offset?: number): Promise<UserResponse[]> => {
  try {
    const params: any = {};
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    
    const response = await api.get<UserResponse[]>("/auth/users", { params });
    return response.data;
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
      "Erro ao listar usuários";

    throw new Error(message);
  }
};

