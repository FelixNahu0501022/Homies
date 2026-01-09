import api from './axios';

const USUARIOS_URL = '/usuarios';

const usuariosService = {
    /**
     * Obtener lista de usuarios
     */
    getUsuarios: async () => {
        try {
            const response = await api.get(USUARIOS_URL);
            return response.data;
        } catch (error) {
            console.error('Error al obtener usuarios:', error);
            throw error;
        }
    },

    /**
     * Crear nuevo usuario
     * @param {Object} data - { miembro_id, nombre_usuario, password, roles: [id] }
     */
    createUsuario: async (data) => {
        try {
            const response = await api.post(USUARIOS_URL, data);
            return response.data;
        } catch (error) {
            console.error('Error al crear usuario:', error);
            throw error;
        }
    },

    /**
     * Cambiar contraseña
     * @param {number|string} id 
     * @param {Object} data - { password_actual, password_nueva }
     */
    updatePassword: async (id, data) => {
        try {
            const response = await api.patch(`${USUARIOS_URL}/${id}/password`, data);
            return response.data;
        } catch (error) {
            console.error('Error al cambiar contraseña:', error);
            throw error;
        }
    },

    /**
     * Obtener usuario por ID
     * @param {number} id
     */
    getUsuario: async (id) => {
        try {
            const response = await api.get(`${USUARIOS_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener usuario:', error);
            throw error;
        }
    },

    /**
     * Actualizar usuario (Roles, Estado, Username)
     * @param {number} id
     * @param {Object} data
     */
    updateUsuario: async (id, data) => {
        try {
            const response = await api.put(`${USUARIOS_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            throw error;
        }
    },

    /**
     * Remover un rol de un usuario
     * DELETE /api/usuarios/:id/roles/:rolId
     */
    removeRol: async (userId, rolId) => {
        try {
            const response = await api.delete(`${USUARIOS_URL}/${userId}/roles/${rolId}`);
            return response.data;
        } catch (error) {
            console.error('Error al remover rol:', error);
            throw error;
        }
    },

    /**
     * Asignar rol a usuario (Inferido: Si existe DELETE, debería existir POST)
     * POST /api/usuarios/:id/roles
     * Body: { rolId: number }
     */
    addRol: async (userId, rolId) => {
        try {
            const response = await api.post(`${USUARIOS_URL}/${userId}/roles`, { rolId });
            return response.data;
        } catch (error) {
            console.error('Error al asignar rol:', error);
            throw error;
        }
    }
};

export default usuariosService;
