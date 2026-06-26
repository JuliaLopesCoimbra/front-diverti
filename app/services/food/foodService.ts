import api from "../auth/axiosConfig";

export interface Restaurant {
  id: number;
  event_id: number;
  name: string;
  description?: string | null;
  image_url?: string | null;
  is_active: boolean;
}

export interface MenuItem {
  id: number;
  restaurant_id: number;
  name: string;
  description?: string | null;
  price: number;
  category?: string | null;
  image_url?: string | null;
  is_available: boolean;
}

export interface FoodOrderItem {
  id: number;
  menu_item_id?: number | null;
  item_name: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

export interface FoodOrder {
  id: number;
  user_id: number;
  restaurant_id: number;
  event_id: number;
  delivery_spot?: string | null;
  notes?: string | null;
  status: string;
  total: number;
  created_at: string;
  updated_at?: string | null;
  restaurant_name?: string | null;
  user_name?: string | null;
  user_cpf?: string | null;
  items: FoodOrderItem[];
}

export interface CreateOrderPayload {
  restaurant_id: number;
  event_id: number;
  delivery_spot?: string;
  notes?: string;
  items: { menu_item_id: number; quantity: number }[];
}

// ── User ──────────────────────────────────────────────────────────────────────

export const getUserRestaurants = (eventId: number) =>
  api.get<Restaurant[]>(`/user/events/${eventId}/restaurants`).then((r) => r.data);

export const getMenuItems = (restaurantId: number) =>
  api.get<MenuItem[]>(`/user/restaurants/${restaurantId}/menu-items`).then((r) => r.data);

export const createFoodOrder = (payload: CreateOrderPayload) =>
  api.post<FoodOrder>("/user/food-orders", payload).then((r) => r.data);

export const getMyFoodOrders = () =>
  api.get<FoodOrder[]>("/user/food-orders").then((r) => r.data);

// ── Admin ─────────────────────────────────────────────────────────────────────

export const getAdminRestaurants = (eventId: number) =>
  api.get<Restaurant[]>(`/admin/events/${eventId}/restaurants`).then((r) => r.data);

export const createRestaurant = (data: Omit<Restaurant, "id" | "is_active"> & { is_active?: boolean }) =>
  api.post<Restaurant>("/admin/restaurants", data).then((r) => r.data);

export const updateRestaurant = (id: number, data: Partial<Restaurant>) =>
  api.put<Restaurant>(`/admin/restaurants/${id}`, data).then((r) => r.data);

export const deleteRestaurant = (id: number) => api.delete(`/admin/restaurants/${id}`);

export const getAdminMenuItems = (restaurantId: number) =>
  api.get<MenuItem[]>(`/admin/restaurants/${restaurantId}/menu-items`).then((r) => r.data);

export const createMenuItem = (data: Omit<MenuItem, "id" | "is_available"> & { is_available?: boolean }) =>
  api.post<MenuItem>("/admin/menu-items", data).then((r) => r.data);

export const updateMenuItem = (id: number, data: Partial<MenuItem>) =>
  api.put<MenuItem>(`/admin/menu-items/${id}`, data).then((r) => r.data);

export const deleteMenuItem = (id: number) => api.delete(`/admin/menu-items/${id}`);

export const uploadRestaurantImage = (id: number, file: File) => {
  const form = new FormData();
  form.append("image", file);
  return api.patch<Restaurant>(`/admin/restaurants/${id}/image`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};

export const uploadMenuItemImage = (id: number, file: File) => {
  const form = new FormData();
  form.append("image", file);
  return api.patch<MenuItem>(`/admin/menu-items/${id}/image`, form, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
};

// ── Kitchen / Waiter ──────────────────────────────────────────────────────────

export interface RestaurantWithMenu extends Restaurant {
  menu_items: MenuItem[];
}

export const getOperationRestaurants = () =>
  api.get<Restaurant[]>("/operation/restaurants").then((r) => r.data);

export const getOperationRestaurantDetails = (restaurantId: number) =>
  api.get<RestaurantWithMenu>(`/operation/restaurant/${restaurantId}`).then((r) => r.data);

export const getKitchenOrders = (restaurantId: number) =>
  api.get<FoodOrder[]>(`/kitchen/restaurants/${restaurantId}/orders`).then((r) => r.data);

export const kitchenUpdateStatus = (orderId: number, status: string) =>
  api.patch<FoodOrder>(`/kitchen/orders/${orderId}/status`, { status }).then((r) => r.data);

export const getWaiterOrders = (restaurantId: number) =>
  api.get<FoodOrder[]>(`/waiter/restaurants/${restaurantId}/orders`).then((r) => r.data);

export const waiterDeliver = (orderId: number) =>
  api.patch<FoodOrder>(`/waiter/orders/${orderId}/delivered`).then((r) => r.data);
