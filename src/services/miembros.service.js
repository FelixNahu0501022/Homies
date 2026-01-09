// src/services/miembros.service.js
import api from './axios';

/**
 * Servicio de Miembros para HOMIES
 * Permisos requeridos: miembros.gestion
 */

/**
 * Listar miembros con filtros y paginación
 * GET /api/miembros
 * 
 * @param {Object} params - Parámetros de filtro
 * @param {boolean} params.estado - true = activos, false = inactivos
 * @param {string} params.busqueda - Buscar por nombre, apellido o CI
 * @param {number} params.limite - Items por página (default: 50, max: 100)
 * @param {number} params.offset - Offset de paginación (default: 0)
 */
export const getMiembros = async (params = {}) => {
    try {
        const response = await api.get('/miembros', { params });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Obtener un miembro por ID
 * GET /api/miembros/:id
 */
export const getMiembroById = async (id) => {
    try {
        const response = await api.get(`/miembros/${id}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Obtener miembro por UUID de credencial (para escaneo QR)
 * GET /api/miembros/credencial/:uuid
 * Auth: No requerida
 */
export const getMiembroPorCredencial = async (uuid) => {
    try {
        const response = await api.get(`/miembros/credencial/${uuid}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Crear nuevo miembro
 * POST /api/miembros
 * Content-Type: multipart/form-data
 * 
 * @param {FormData} formData - Datos del miembro con foto opcional
 */
export const createMiembro = async (formData) => {
    try {
        const response = await api.post('/miembros', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Actualizar miembro
 * PUT /api/miembros/:id
 * Content-Type: multipart/form-data
 */
export const updateMiembro = async (id, formData) => {
    try {
        const response = await api.put(`/miembros/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Dar de baja a un miembro (soft delete)
 * PATCH /api/miembros/:id/baja
 */
export const darDeBajaMiembro = async (id) => {
    try {
        const response = await api.patch(`/miembros/${id}/baja`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Reactivar un miembro dado de baja
 * PATCH /api/miembros/:id/reactivar
 */
export const reactivarMiembro = async (id) => {
    try {
        const response = await api.patch(`/miembros/${id}/reactivar`);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export default {
    getMiembros,
    getMiembroById,
    getMiembroPorCredencial,
    createMiembro,
    updateMiembro,
    darDeBajaMiembro,
    reactivarMiembro,
};
