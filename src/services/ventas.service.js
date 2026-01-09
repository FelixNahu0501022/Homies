import api from './axios';

const VENTAS_URL = '/ventas';

const ventasService = {
    /**
     * Obtener lista de ventas con filtros
     * @param {Object} params - filtros (estado, vendedor_id, comprador_id, limite, offset)
     */
    getVentas: async (params = {}) => {
        try {
            const response = await api.get(VENTAS_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener ventas:', error);
            throw error;
        }
    },

    /**
     * Obtener detalle completo de una venta con items
     * @param {number|string} id 
     */
    getVenta: async (id) => {
        try {
            const response = await api.get(`${VENTAS_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener venta:', error);
            throw error;
        }
    },

    /**
     * Obtener ventas del usuario autenticado
     */
    getMisVentas: async () => {
        try {
            const response = await api.get(`${VENTAS_URL}/mis-ventas`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener mis ventas:', error);
            throw error;
        }
    },

    /**
     * Crear nueva venta
     * @param {Object} data - { comprador_miembro_id, items: [{producto_id, cantidad}] }
     */
    createVenta: async (data) => {
        try {
            const response = await api.post(VENTAS_URL, data);
            return response.data;
        } catch (error) {
            console.error('Error al crear venta:', error);
            throw error;
        }
    },

    /**
     * Marcar venta como ENTREGADO
     * @param {number|string} id 
     */
    entregarVenta: async (id) => {
        try {
            const response = await api.patch(`${VENTAS_URL}/${id}/entregar`);
            return response.data;
        } catch (error) {
            console.error('Error al entregar venta:', error);
            throw error;
        }
    },

    /**
     * Anular venta (devuelve stock)
     * @param {number|string} id 
     */
    cancelarVenta: async (id) => {
        try {
            const response = await api.patch(`${VENTAS_URL}/${id}/cancelar`);
            return response.data;
        } catch (error) {
            console.error('Error al cancelar venta:', error);
            throw error;
        }
    }
};

export default ventasService;
