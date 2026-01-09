import api from './axios';

const INVENTARIO_URL = '/inventario';

const inventarioService = {
    /**
     * Obtener stock del usuario autenticado
     */
    getMiStock: async () => {
        try {
            const response = await api.get(`${INVENTARIO_URL}/mi-stock`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener mi stock:', error);
            throw error;
        }
    },

    /**
     * Obtener stock de un usuario específico (Admin)
     * @param {number} usuarioId 
     */
    getStockUsuario: async (usuarioId) => {
        try {
            const response = await api.get(`${INVENTARIO_URL}/usuario/${usuarioId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener stock de usuario:', error);
            throw error;
        }
    },

    /**
     * Asignar stock del inventario global a un usuario (Admin)
     * @param {Object} data - { usuario_id, items: [{ producto_id, cantidad }] }
     */
    asignarStock: async (data) => {
        try {
            const response = await api.post(`${INVENTARIO_URL}/asignar`, data);
            return response.data;
        } catch (error) {
            console.error('Error al asignar stock:', error);
            throw error;
        }
    },

    /**
     * Devolver stock de un usuario al inventario global (Admin)
     * @param {Object} data - { usuario_id, items: [{ producto_id, cantidad }] }
     */
    devolverStock: async (data) => {
        try {
            const response = await api.post(`${INVENTARIO_URL}/devolver`, data);
            return response.data;
        } catch (error) {
            console.error('Error al devolver stock:', error);
            throw error;
        }
    },

    /**
     * Obtener historial de movimientos
     * @param {Object} params - { usuario_id, limite, offset }
     */
    getMovimientos: async (params = {}) => {
        try {
            const response = await api.get(`${INVENTARIO_URL}/movimientos`, { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener movimientos:', error);
            throw error;
        }
    }
};

export default inventarioService;
