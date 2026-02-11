import api from "../auth/axiosConfig";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

export interface ProductEventImage {
  id: number;
  product_id: number;
  image_url: string;
  image_order: number;
  created_at: string;
}

export interface ProductEventResponse {
  id: number;
  name: string;
  description?: string;
  price: string; // Decimal como string
  status: string;
  stock: number;
  last_pieces: boolean;
  event_id: number;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
  updated_by_id?: number;
  deleted_at?: string;
  deleted_by_id?: number;
  images: ProductEventImage[];
}

export interface CreateProductEventData {
  name: string;
  description?: string;
  price: string;
  status?: string;
  stock?: number;
  last_pieces?: boolean;
  event_id: number;
  images?: File[];
}

export interface UpdateProductEventData {
  name?: string;
  description?: string;
  price?: string;
  status?: string;
  stock?: number;
  last_pieces?: boolean;
  event_id?: number;
  images?: File[];
  replace_images?: boolean;
  removed_image_ids?: number[];
}

export const getProductsEvent = async (
  eventId?: number,
  limit: number = 50,
  offset: number = 0
): Promise<ProductEventResponse[]> => {
  const params: any = { limit, offset };
  if (eventId) {
    params.event_id = eventId;
  }
  const response = await api.get<ProductEventResponse[]>("/admin/products-event", {
    params
  });
  return response.data;
};

export const getProductEventById = async (
  productId: number
): Promise<ProductEventResponse> => {
  const response = await api.get<ProductEventResponse>(
    `/admin/products-event/${productId}`
  );
  return response.data;
};

export const getProductsByEvent = async (
  eventId: number,
  limit: number = 4,
  offset: number = 0
): Promise<ProductEventResponse[]> => {
  const response = await api.get<ProductEventResponse[]>(
    `/admin/events/${eventId}/products-event`,
    {
      params: { limit, offset }
    }
  );
  return response.data;
};

export const createProductEvent = async (
  data: CreateProductEventData
): Promise<ProductEventResponse> => {
  const formData = new FormData();
  formData.append("name", data.name);
  if (data.description) formData.append("description", data.description);
  formData.append("price", data.price);
  formData.append("status", data.status || "active");
  formData.append("stock", String(data.stock || 0));
  formData.append("last_pieces", String(data.last_pieces || false));
  formData.append("event_id", String(data.event_id));
  
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append("images", image);
    });
  }

  const response = await api.post<ProductEventResponse>(
    "/admin/products-event",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const updateProductEvent = async (
  productId: number,
  data: UpdateProductEventData
): Promise<ProductEventResponse> => {
  const formData = new FormData();
  
  if (data.name !== undefined) formData.append("name", data.name);
  if (data.description !== undefined) formData.append("description", data.description || "");
  if (data.price !== undefined) formData.append("price", data.price);
  if (data.status !== undefined) formData.append("status", data.status);
  if (data.stock !== undefined) formData.append("stock", String(data.stock));
  if (data.last_pieces !== undefined) formData.append("last_pieces", String(data.last_pieces));
  if (data.event_id !== undefined) formData.append("event_id", String(data.event_id));
  if (data.replace_images !== undefined) formData.append("replace_images", String(data.replace_images));
  if (data.removed_image_ids && data.removed_image_ids.length > 0) {
    formData.append("removed_image_ids", data.removed_image_ids.join(","));
  }
  
  if (data.images && data.images.length > 0) {
    data.images.forEach((image) => {
      formData.append("images", image);
    });
  }

  const response = await api.put<ProductEventResponse>(
    `/admin/products-event/${productId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

export const deleteProductEvent = async (productId: number): Promise<void> => {
  await api.delete(`/admin/products-event/${productId}`);
};

// Export default para garantir compatibilidade
export default {
  getProductsEvent,
  getProductEventById,
  getProductsByEvent,
  createProductEvent,
  updateProductEvent,
  deleteProductEvent,
};

