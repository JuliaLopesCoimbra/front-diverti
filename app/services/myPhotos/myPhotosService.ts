import api from "../auth/axiosConfig";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

export interface DownloadedPhoto {
  id: number;
  image_url: string;
  downloaded_at: string;
  event_id?: number;
  event_name?: string;
  similarity?: string;
}

export const getMyDownloadedPhotos = async (limit: number = 100, offset: number = 0): Promise<DownloadedPhoto[]> => {
  console.log("🔍 [myPhotosService] getMyDownloadedPhotos INICIADO", { limit, offset });
  
  const API_URL = getApiUrl();
  console.log("🔍 [myPhotosService] API_URL:", API_URL);
  
  if (!API_URL) {
    console.error("❌ [myPhotosService] API_URL está vazia!");
    throw new Error("URL da API não configurada");
  }
  
  const url = "/downloaded-photos";
  const fullUrl = `${API_URL}${url}`;
  console.log("🔍 [myPhotosService] URL completa:", fullUrl);
  console.log("🔍 [myPhotosService] Parâmetros:", { limit, offset });
  
  try {
    console.log("🔍 [myPhotosService] Fazendo requisição...");
    const response = await api.get<DownloadedPhoto[]>(url, {
      params: { limit, offset }
    });
    
    console.log("✅ [myPhotosService] Resposta recebida:", {
      status: response.status,
      dataLength: response.data?.length || 0,
      data: response.data
    });
    
    return response.data;
  } catch (error: any) {
    console.error("❌ [myPhotosService] ERRO na requisição:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullError: error
    });
    throw error;
  }
};

