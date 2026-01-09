// src/services/auth.service.js
import api from './axios';

/**
 * Servicio de Autenticación para HOMIES
 * Base URL: http://localhost:3000/api
 */

/**
 * Iniciar sesión
 * POST /api/auth/login
 * Rate Limit: 5 intentos / 15 minutos
 */
export const login = async (nombre_usuario, password) => {
    try {
        const response = await api.post('/auth/login', {
            nombre_usuario,
            password
        });
        return response.data;
    } catch (error) {
        // Si es error 429 (Too Many Requests)
        if (error.response?.status === 429) {
            throw new Error('Demasiados intentos de inicio de sesión. Por favor, intenta nuevamente en 15 minutos.');
        }
        // Otros errores
        throw error.response?.data || error;
    }
};

/**
 * Obtener datos del usuario autenticado
 * GET /api/auth/me
 * Requiere: Bearer Token
 */
export const getMe = async () => {
    try {
        const response = await api.get('/auth/me');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Cerrar sesión
 * POST /api/auth/logout
 * Requiere: Bearer Token
 * Nota: El token se invalida principalmente en el frontend
 */
export const logout = async () => {
    try {
        const response = await api.post('/auth/logout');
        return response.data;
    } catch (error) {
        // Incluso si falla, limpiamos el token localmente
        throw error.response?.data || error;
    }
};

export default {
    login,
    getMe,
    logout
};
