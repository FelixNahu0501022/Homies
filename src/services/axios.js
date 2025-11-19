// src/services/axios.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api', // backend local
  withCredentials: true,
  timeout: 15000,
});

// Interceptor de token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
