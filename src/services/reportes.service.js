import api from './axios';

const REPORTES_URL = '/reportes';

const reportesService = {
    /**
     * Obtener todas las estadísticas para el dashboard
     */
    getDashboard: async () => {
        try {
            const response = await api.get(`${REPORTES_URL}/dashboard`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener dashboard:', error);
            throw error;
        }
    },

    /**
     * Estadísticas generales de ventas
     */
    getVentasEstadisticas: async () => {
        try {
            const response = await api.get(`${REPORTES_URL}/ventas/estadisticas`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener estadísticas de ventas:', error);
            throw error;
        }
    },

    /**
     * Rendimiento por vendedor (Solo Admin/RPP)
     */
    getVendedoresRendimiento: async () => {
        try {
            const response = await api.get(`${REPORTES_URL}/vendedores/rendimiento`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener rendimiento de vendedores:', error);
            throw error;
        }
    },

    /**
     * Estado del inventario
     */
    getInventarioEstado: async () => {
        try {
            const response = await api.get(`${REPORTES_URL}/inventario/estado`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener estado de inventario:', error);
            throw error;
        }
    },

    /**
     * Flujo de caja (Solo Admin)
     * @param {string} fechaInicio (YYYY-MM-DD)
     * @param {string} fechaFin (YYYY-MM-DD)
     */
    getFlujoCaja: async (fechaInicio, fechaFin) => {
        try {
            const params = {};
            if (fechaInicio) params.fecha_inicio = fechaInicio;
            if (fechaFin) params.fecha_fin = fechaFin;

            const response = await api.get(`${REPORTES_URL}/finanzas/flujo-caja`, { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener flujo de caja:', error);
            throw error;
        }
    },

    /**
     * Top productos más vendidos
     * @param {number} limite
     */
    getProductosMasVendidos: async (limite = 10) => {
        try {
            const response = await api.get(`${REPORTES_URL}/productos/mas-vendidos`, { params: { limite } });
            return response.data;
        } catch (error) {
            console.error('Error al obtener productos más vendidos:', error);
            throw error;
        }
    }
};

export default reportesService;
