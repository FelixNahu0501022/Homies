// src/services/credenciales.service.js
import api from "./axios";

// Listar (protegido)
export async function listarCredenciales() {
  const { data } = await api.get("/credenciales");
  return data;
}

// Crear (protegido) — SIN "numero": la BD lo genera automáticamente
export async function crearCredencial({ idPersonal, fechaInicio, fechaFin }) {
  const body = {
    idPersonal,
    fecha_inicio_vigencia: fechaInicio,
    fecha_fin_vigencia: fechaFin,
  };
  const { data } = await api.post("/credenciales", body);
  return data; // { mensaje, credencial, verifyUrl, pdfUrl }
}

// Actualizar estado (protegido) — "emitida" | "vigente" | "suspendida" | "revocada"
export async function actualizarEstadoCredencial(id, estado, motivo = null) {
  const { data } = await api.patch(`/credenciales/${id}`, { estado, motivo });
  return data; // { mensaje, credencial }
}

// Verificación pública (QR)
export async function verificarCredencial(codigoQR) {
  const { data } = await api.get(`/credenciales/verificar/${codigoQR}`);
  return data;
}

// Eliminar (soft-delete)
export async function eliminarCredencial(id) {
  const { data } = await api.delete(`/credenciales/${id}`);
  return data; // { ok: true, mensaje: 'Credencial eliminada (soft-delete)' }
}

/* =========================
   REPORTES
   ========================= */

export async function repResumen() {
  const { data } = await api.get(`/credenciales/reportes/resumen`);
  return data; // { total, por_estado: [...] }
}

export async function repEstado() {
  const { data } = await api.get(`/credenciales/reportes/estado`);
  return data; // { publico: [...], crudo: [...] }
}

export async function repClase() {
  const { data } = await api.get(`/credenciales/reportes/clase`);
  return data;
}

export async function repGrado() {
  const { data } = await api.get(`/credenciales/reportes/grado`);
  return data;
}

export async function repEmisionesMes() {
  const { data } = await api.get(`/credenciales/reportes/emisiones/mes`);
  return data;
}

export async function repEmisionesAnio() {
  const { data } = await api.get(`/credenciales/reportes/emisiones/anio`);
  return data;
}

export async function repProximasVencer(dias = 30) {
  const { data } = await api.get(`/credenciales/reportes/proximas-vencer`, {
    params: { dias },
  });
  return data; // { dias, resultados: [...] }
}

export async function repVencidas({ desde, hasta } = {}) {
  const { data } = await api.get(`/credenciales/reportes/vencidas`, {
    params: { desde, hasta },
  });
  return data; // { filtros: {...}, resultados: [...] }
}

export async function repUltimaPorPersona() {
  const { data } = await api.get(`/credenciales/reportes/ultima-por-persona`);
  return data;
}

export async function repHistorialCredencial(idCredencial) {
  const { data } = await api.get(`/credenciales/${idCredencial}/historial`);
  return data;
}

// =========================
// REPORTES DETALLADOS (NUEVOS)
// =========================

export async function repListadoDetalle(params = {}) {
  const { data } = await api.get(`/credenciales/reportes/listado`, { params });
  return data; // { total, count, params, results }
}

export async function repListadoPorEstado(estado, params = {}) {
  const { data } = await api.get(`/credenciales/reportes/listado/${estado}`, { params });
  return data; // { total, count, params, results }
}

export async function repUltimaPorPersonaV2(params = {}) {
  const { data } = await api.get(`/credenciales/reportes/ultima-por-persona-v2`, { params });
  return data; // { total, count, params, results }
}
