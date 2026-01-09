import api from './axios';

const PAGOS_URL = '/pagos';

const pagosService = {
    /**
     * Obtener lista de pagos con filtros
     * @param {Object} params - filtros (estado, venta_id, limite, offset)
     */
    getPagos: async (params = {}) => {
        try {
            const response = await api.get(PAGOS_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener pagos:', error);
            throw error;
        }
    },

    /**
     * Obtener todos los pagos de una venta específica
     * @param {number|string} ventaId 
     */
    getPagosByVenta: async (ventaId) => {
        try {
            const response = await api.get(`${PAGOS_URL}/venta/${ventaId}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener pagos de la venta:', error);
            throw error;
        }
    },

    /**
     * Registrar nuevo pago con comprobante
     * @param {FormData} formData - venta_id, monto, metodo_pago, comprobante (file)
     */
    createPago: async (formData) => {
        try {
            const response = await api.post(PAGOS_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error al registrar pago:', error);
            throw error;
        }
    },

    /**
     * Aprobar pago (solo admins con permiso pagos.aprobar)
     * @param {number|string} id 
     */
    aprobarPago: async (id) => {
        try {
            const response = await api.patch(`${PAGOS_URL}/${id}/aprobar`);
            return response.data;
        } catch (error) {
            console.error('Error al aprobar pago:', error);
            throw error;
        }
    },

    /**
     * Rechazar pago (solo admins con permiso pagos.aprobar)
     * @param {number|string} id 
     */
    rechazarPago: async (id) => {
        try {
            const response = await api.patch(`${PAGOS_URL}/${id}/rechazar`);
            return response.data;
        } catch (error) {
            console.error('Error al rechazar pago:', error);
            throw error;
        }
    }
};

export default pagosService;
