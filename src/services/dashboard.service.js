// src/services/dashboard.service.js
import api from './axios';

/**
 * Servicio para obtener métricas del dashboard
 */
const dashboardService = {
    /**
     * Obtiene alertas de stock bajo
     * @param {number} umbral - Umbral de cantidad (default: 10)
     * @returns {Promise} Respuesta con alertas de stock
     */
    getAlertasStock: async (umbral = 10) => {
        try {
            const response = await api.get('/dashboard/alertas-stock', {
                params: { umbral }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener alertas de stock:', error);
            throw error;
        }
    },

    /**
     * Obtiene usuarios activos
     * @returns {Promise} Respuesta con resumen de usuarios
     */
    getUsuariosActivos: async () => {
        try {
            const response = await api.get('/dashboard/usuarios-activos');
            return response.data;
        } catch (error) {
            console.error('Error al obtener usuarios activos:', error);
            throw error;
        }
    },

    /**
     * Obtiene emergencias del día
     * @returns {Promise} Respuesta con emergencias de hoy
     */
    getEmergenciasHoy: async () => {
        try {
            const response = await api.get('/dashboard/emergencias-hoy');
            return response.data;
        } catch (error) {
            console.error('Error al obtener emergencias del día:', error);
            throw error;
        }
    },

    /**
     * Obtiene inventario bajo en vehículos
     * @param {number} umbral - Umbral de cantidad (default: 5)
     * @returns {Promise} Respuesta con alertas de inventario de vehículos
     */
    getInventarioVehiculos: async (umbral = 5) => {
        try {
            const response = await api.get('/dashboard/inventario-vehiculos', {
                params: { umbral }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener inventario de vehículos:', error);
            throw error;
        }
    },

    /**
     * Obtiene resumen general de todas las métricas
     * @param {number} umbralStock - Umbral para stock (default: 10)
     * @param {number} umbralVehiculos - Umbral para vehículos (default: 5)
     * @returns {Promise} Respuesta con todas las métricas
     */
    getResumenGeneral: async (umbralStock = 10, umbralVehiculos = 5) => {
        try {
            const response = await api.get('/dashboard/resumen', {
                params: {
                    umbralStock,
                    umbralVehiculos
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error al obtener resumen general:', error);
            throw error;
        }
    }
};

export default dashboardService;
