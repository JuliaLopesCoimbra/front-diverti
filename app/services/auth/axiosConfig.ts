// /services/axiosConfig.ts

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = document.cookie.replace(/(?:(?:^|.*;\s*)refresh_token\s*=\s*([^;]*).*$)|^.*$/, "$1");

  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (!accessToken && refreshToken) {
    // Tente fazer o refresh do token
    const response = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });
    localStorage.setItem('access_token', response.data.access_token);  // Atualiza o access_token
    document.cookie = `refresh_token=${response.data.refresh_token}; path=/; secure; HttpOnly`;  // Atualiza o refresh_token no cookie
    config.headers['Authorization'] = `Bearer ${response.data.access_token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Redirecionar para login em caso de erro de autorização (token expirado, etc)
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
