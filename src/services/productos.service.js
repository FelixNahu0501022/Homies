import api from './axios';

const PRODUCTOS_URL = '/productos';

const productosService = {
    /**
     * Obtener lista de productos con filtros
     * @param {Object} params - filtros (tipo, habilitado_venta, busqueda, limite, offset)
     */
    getProductos: async (params = {}) => {
        try {
            const response = await api.get(PRODUCTOS_URL, { params });
            return response.data;
        } catch (error) {
            console.error('Error al obtener productos:', error);
            throw error;
        }
    },

    /**
     * Obtener un producto por ID
     * @param {number|string} id 
     */
    getProducto: async (id) => {
        try {
            const response = await api.get(`${PRODUCTOS_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener producto:', error);
            throw error;
        }
    },

    /**
     * Crear un nuevo producto
     * @param {FormData} formData 
     */
    createProducto: async (formData) => {
        try {
            const response = await api.post(PRODUCTOS_URL, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error al crear producto:', error);
            throw error;
        }
    },

    /**
     * Actualizar un producto existente
     * @param {number|string} id 
     * @param {FormData} formData 
     */
    updateProducto: async (id, formData) => {
        try {
            const response = await api.put(`${PRODUCTOS_URL}/${id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            throw error;
        }
    },

    /**
     * Actualizar stock manualmente
     * @param {number|string} id 
     * @param {number} nuevoStock 
     */
    updateStock: async (id, nuevoStock) => {
        try {
            const response = await api.patch(`${PRODUCTOS_URL}/${id}/stock`, {
                stock_actual: nuevoStock
            });
            return response.data;
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            throw error;
        }
    },

    /**
     * Habilitar o deshabilitar producto para venta
     * @param {number|string} id 
     * @param {boolean} habilitar 
     */
    toggleEstado: async (id, habilitar) => {
        try {
            const accion = habilitar ? 'habilitar' : 'deshabilitar';
            const response = await api.patch(`${PRODUCTOS_URL}/${id}/${accion}`);
            return response.data;
        } catch (error) {
            console.error(`Error al ${habilitar ? 'habilitar' : 'deshabilitar'} producto:`, error);
            throw error;
        }
    }
};

export default productosService;
