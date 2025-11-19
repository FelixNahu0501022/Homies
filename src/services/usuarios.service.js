// src/services/usuarios.service.js
import api from "./axios";

/**
 * GET /usuarios?page&limit&search
 * Backend responde: { data, total, page, limit }
 */
export async function listarUsuarios({ page = 1, limit = 10, search = "" } = {}) {
  try {
    const { data } = await api.get("/usuarios", { params: { page, limit, search } });
    return data; // { data, total, page, limit }
  } catch (error) {
    throw parseError(error);
  }
}

/**
 * PATCH /usuarios/:id/activar  |  PATCH /usuarios/:id/desactivar
 */
export async function cambiarEstadoUsuario(id, activar) {
  try {
    const url = activar ? `/usuarios/${id}/activar` : `/usuarios/${id}/desactivar`;
    const { data } = await api.patch(url);
    return data;
  } catch (error) {
    throw parseError(error);
  }
}

/**
 * GET /usuarios/:id
 */
export async function obtenerUsuario(id) {
  try {
    const { data } = await api.get(`/usuarios/${id}`);
    return data;
  } catch (error) {
    throw parseError(error);
  }
}

/**
 * POST /usuarios
 * Body esperado (nuevo): { nombreUsuario, contraseña, roles: number[], idPersonal }
 * Compatibilidad: si no mandas roles, aún puedes mandar idRol.
 */
export async function crearUsuario(payload) {
  try {
    const body = {
      nombreUsuario: payload.nombreUsuario,
      // admite diferentes nombres desde la UI
      contraseña: payload.contraseña ?? payload.contrasena ?? payload.password,
      idPersonal: payload.idPersonal,
    };

    if (Array.isArray(payload.roles) && payload.roles.length > 0) {
      body.roles = payload.roles.map(Number); // 👈 multi-rol
    } else if (payload.idRol != null) {
      body.idRol = Number(payload.idRol);     // 👈 legacy
    }

    const { data } = await api.post("/usuarios", body);
    return data;
  } catch (error) {
    throw parseError(error);
  }
}

/**
 * PATCH /usuarios/:id
 * Body (nuevo): { nombreUsuario, roles: number[], idPersonal }
 * Compatibilidad: si no mandas roles, puedes mandar idRol.
 */
export async function editarUsuario(id, payload) {
  try {
    const body = {
      nombreUsuario: payload.nombreUsuario,
      idPersonal: payload.idPersonal,
    };

    if (Array.isArray(payload.roles) && payload.roles.length > 0) {
      body.roles = payload.roles.map(Number); // 👈 multi-rol
    } else if (payload.idRol != null) {
      body.idRol = Number(payload.idRol);     // 👈 legacy
    }

    const { data } = await api.patch(`/usuarios/${id}`, body);
    return data;
  } catch (error) {
    throw parseError(error);
  }
}

/** Helper: normaliza mensajes de error para la UI */
function parseError(error) {
  const msg =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Error de red";
  const e = new Error(msg);
  e.status = error?.response?.status || 0;
  e.data = error?.response?.data;
  return e;
}


// --- REPORTES (Usuarios) ---

export async function repResumenUsuarios() {
  try {
    const { data } = await api.get("/usuarios/reportes/resumen");
    return data; // {total_usuarios, activos, inactivos, usuarios_con_roles, usuarios_sin_roles, roles_distintos}
  } catch (error) {
    throw parseError(error);
  }
}

export async function repUsuariosPorRol() {
  try {
    const { data } = await api.get("/usuarios/reportes/usuarios-por-rol");
    return data; // [{idrol, rol_nombre, total_usuarios}]
  } catch (error) {
    throw parseError(error);
  }
}

export async function repUsuariosDeRol(idRol, { page = 1, limit = 10, search = "" } = {}) {
  try {
    const { data } = await api.get(`/usuarios/reportes/usuarios-de-rol/${idRol}`, {
      params: { page, limit, search }
    });
    return data; // { data, total, page, limit }
  } catch (error) {
    throw parseError(error);
  }
}

export async function repUsuariosSinRol({ page = 1, limit = 10, search = "" } = {}) {
  try {
    const { data } = await api.get("/usuarios/reportes/usuarios-sin-rol", {
      params: { page, limit, search }
    });
    return data; // { data, total, page, limit }
  } catch (error) {
    throw parseError(error);
  }
}

export async function repUsuariosMultiRol({ page = 1, limit = 10, search = "" } = {}) {
  try {
    const { data } = await api.get("/usuarios/reportes/usuarios-multi-rol", {
      params: { page, limit, search }
    });
    return data; // { data, total, page, limit }
  } catch (error) {
    throw parseError(error);
  }
}

export async function repRolesSinUsuarios() {
  try {
    const { data } = await api.get("/usuarios/reportes/roles-sin-usuarios");
    return data; // [{idrol, nombre, descripcion}]
  } catch (error) {
    throw parseError(error);
  }
}

export async function repRolesConDetalle() {
  try {
    const { data } = await api.get("/usuarios/reportes/roles-con-detalle");
    return data; // [{idrol, rol_nombre, descripcion, total_usuarios, usuarios_resumen: [{idusuario, nombreusuario}]}]
  } catch (error) {
    throw parseError(error);
  }
}

export async function repPermisosDeRol(idRol) {
  try {
    const { data } = await api.get(`/usuarios/reportes/permisos/rol/${idRol}`);
    return data; // [{idpermiso, nombre, descripcion}]
  } catch (error) {
    throw parseError(error);
  }
}

export async function repPermisosMatriz() {
  try {
    const { data } = await api.get("/usuarios/reportes/permisos/matriz");
    return data; // {roles:[], permisos:[], asignaciones:[]}
  } catch (error) {
    throw parseError(error);
  }
}

export async function repPermisosSinRol() {
  try {
    const { data } = await api.get("/usuarios/reportes/permisos-sin-rol");
    return data; // [{idpermiso, nombre, descripcion}]
  } catch (error) {
    throw parseError(error);
  }
}
