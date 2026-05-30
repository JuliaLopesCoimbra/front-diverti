// /services/axiosConfig.ts

import axios from "axios";
import { getApiUrl } from "@/app/utils/apiUrlHelper";

const API_URL = getApiUrl();

const api = axios.create({
  baseURL: API_URL,
});
interface RefreshResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

/* ================================
   Helpers
================================ */

const getCookie = (name: string): string | null => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()!.split(";").shift() || null;
  }
  return null;
};

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

/* ================================
   REQUEST INTERCEPTOR
================================ */

api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const accessToken = localStorage.getItem("circuito_access_token");
      if (accessToken) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================================
   RESPONSE INTERCEPTOR (REFRESH)
================================ */

api.interceptors.response.use(
  (response) => response,
  async (error: any) => {
    const originalRequest = error.config as any & {
      _retry?: boolean;
    };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      const refreshToken = getCookie("refresh_token");

      if (!refreshToken) {
        localStorage.removeItem("circuito_access_token");
        if (!originalRequest._background) {
          window.dispatchEvent(new CustomEvent("auth:force-logout"));
        }
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject,
          });
        });
      }

      isRefreshing = true;

      try {
        const response = await axios.post<RefreshResponse>(
  `${API_URL}/auth/refresh`,
  {
    refresh_token: refreshToken,
  }
);


        const { access_token, refresh_token } = response.data;

        localStorage.setItem("circuito_access_token", access_token);
        document.cookie = `refresh_token=${refresh_token}; path=/; secure`;

        processQueue(null, access_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);

        localStorage.removeItem("circuito_access_token");
        document.cookie =
          "refresh_token=; path=/; secure; expires=Thu, 01 Jan 1970 00:00:00 GMT";

        if (!originalRequest._background) {
          window.dispatchEvent(new CustomEvent("auth:force-logout"));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
