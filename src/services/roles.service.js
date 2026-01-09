import api from './axios';

const ROLES_URL = '/roles';
const PERMISOS_URL = '/permisos';

const rolesService = {
    /**
     * Obtener lista de roles con permisos
     */
    getRoles: async () => {
        try {
            const response = await api.get(ROLES_URL);
            return response.data;
        } catch (error) {
            console.error('Error al obtener roles:', error);
            throw error;
        }
    },

    /**
     * Obtener todos los permisos disponibles
     */
    getPermisos: async () => {
        try {
            const response = await api.get(PERMISOS_URL);
            return response.data;
        } catch (error) {
            console.error('Error al obtener permisos:', error);
            throw error;
        }
    },

    updateRole: async (id, data) => {
        try {
            const response = await api.put(`${ROLES_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar role:', error);
            throw error;
        }
    }
};

export default rolesService;
