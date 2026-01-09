// src/services/axios.js
import axios from 'axios';

// CONFIGURACIÓN DE PRODUCCIÓN
const BASE_URL = 'https://api.foxtrotalfa.org/api';

console.log('🔗 Axios configurado con baseURL:', BASE_URL);

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // Desactivado para evitar problemas de CORS con *
  timeout: 15000,
});

// Interceptor de token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token} `;
  }
  return config;
});

// Interceptor de respuesta (Manejo de errores globales)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token expirado o inválido
      localStorage.removeItem('token');
      // Redirigir al login (forzando recarga para limpiar estados)
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;