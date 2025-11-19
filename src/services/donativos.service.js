// src/services/donativos.service.js
import api from "./axios";

/**
 * =========================================================
 * Donativos — Servicios (retrocompatibles + mejoras)
 * - Soporta filtros (detalle=2, fechas, donante)
 * - Soporta CRUD de Donantes dentro del mismo módulo
 * - Reportes V2 con filtros (desde, hasta, idDonante)
 * - Mantiene endpoints legacy que ya usas
 * =========================================================
 */

// =====================
// ===== Donativos =====
// =====================

// Lista (LEGACY): detalle=1 (vista clásica)
export async function listarDonativos() {
  const { data } = await api.get("/donativos", { params: { detalle: 1 } });
  return data;
}

/**
 * Lista con filtros y detalle=2 (incluye donante y filtros por fecha/idDonante).
 * @param {Object} params
 * @param {'1'|'2'} [params.detalle='2']
 * @param {string}  [params.desde]     - 'YYYY-MM-DD'
 * @param {string}  [params.hasta]     - 'YYYY-MM-DD'
 * @param {number}  [params.idDonante] - id del donante
 */
export async function listarDonativosV2(params = {}) {
  const { detalle = '2', desde = null, hasta = null, idDonante = null } = params;
  const { data } = await api.get("/donativos", {
    params: {
      detalle, // '2' usa vw_donativos_detalle_v2
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(idDonante ? { idDonante } : {}),
    },
  });
  return data;
}

// Obtener (puedes pasar detalle=1 para vista clásica)
export async function obtenerDonativo(id, extraParams = {}) {
  const { data } = await api.get(`/donativos/${id}`, { params: { detalle: 1, ...extraParams } });
  return data; // debe incluir donantes / donante_principal si aplicamos el backend
}


/**
 * Crear donativo
 * payload puede incluir:
 * - { idtipodonativo, tipo?, tipoCodigo?, descripcion, cantidad?, fecha?, estado? }
 * - { idItem } (legacy: suma stock al item existente)
 * - { idDonante } o { donanteData: {...} } (crea/asegura y vincula)
 * - { vinculoDonante: { principal?, aporte_monto?, aporte_desc? } }
 * - { inventarioData: {...} } (cuando es MATERIAL nuevo: crea ítem completo)
 */
export async function crearDonativo(payload) {
  const { data } = await api.post("/donativos", payload);
  return data;
}

export async function editarDonativo(id, payload) {
  const { data } = await api.patch(`/donativos/${id}`, payload);
  return data;
}

export async function eliminarDonativo(id) {
  const { data } = await api.delete(`/donativos/${id}`);
  return data;
}

// =============================
// ===== Catálogo de Tipos =====
// =============================
export async function listarTiposDonativo(soloActivos = true) {
  const qs = soloActivos ? "?soloActivos=1" : "";
  const { data } = await api.get(`/donativos/tipos/listar/all${qs}`);
  return data; // [{ idtipodonativo, codigo, nombre, descripcion, activo, created_at }]
}

export async function crearTipoDonativo(payload) {
  // payload: { codigo?, nombre, descripcion?, activo? }
  const { data } = await api.post("/donativos/tipos", payload);
  return data; // { mensaje, tipo }
}

export async function editarTipoDonativo(idtipodonativo, payload) {
  const { data } = await api.patch(`/donativos/tipos/${idtipodonativo}`, payload);
  return data; // { mensaje, tipo }
}

export async function desactivarTipoDonativo(idtipodonativo) {
  const { data } = await api.delete(`/donativos/tipos/${idtipodonativo}`);
  return data; // { mensaje, tipo }
}

// =====================
// ===== Reportes  =====
// =====================
// (Legacy, sin filtros de donante)
export async function reporteDonativosPorTipo() {
  const { data } = await api.get("/donativos/reportes/por-tipo");
  return data;
}

export async function reporteDonativosPorEstado() {
  const { data } = await api.get("/donativos/reportes/por-estado");
  return data;
}

export async function reporteDonativosPorMes() {
  const { data } = await api.get("/donativos/reportes/por-mes");
  return data;
}

export async function reporteInventarioPorDonativos() {
  const { data } = await api.get("/donativos/reportes/inventario");
  return data;
}

export async function resumenDonativos(desde, hasta) {
  const { data } = await api.get("/donativos/reportes/resumen", { params: { desde, hasta } });
  return data;
}

// ========================
// ===== Reportes V2  =====
// ========================
/**
 * Todos aceptan filtros: { desde, hasta, idDonante }
 */
export async function reporteDonativosPorTipoV2({ desde = null, hasta = null, idDonante = null } = {}) {
  const { data } = await api.get("/donativos/reportes-v2/por-tipo", {
    params: { ...(desde && { desde }), ...(hasta && { hasta }), ...(idDonante && { idDonante }) },
  });
  return data;
}

export async function reporteDonativosPorEstadoV2({ desde = null, hasta = null, idDonante = null } = {}) {
  const { data } = await api.get("/donativos/reportes-v2/por-estado", {
    params: { ...(desde && { desde }), ...(hasta && { hasta }), ...(idDonante && { idDonante }) },
  });
  return data;
}

export async function reporteDonativosPorMesV2({ desde = null, hasta = null, idDonante = null } = {}) {
  const { data } = await api.get("/donativos/reportes-v2/por-mes", {
    params: { ...(desde && { desde }), ...(hasta && { hasta }), ...(idDonante && { idDonante }) },
  });
  return data;
}

export async function resumenDonativosV2({ desde = null, hasta = null, idDonante = null } = {}) {
  const { data } = await api.get("/donativos/reportes-v2/resumen", {
    params: { ...(desde && { desde }), ...(hasta && { hasta }), ...(idDonante && { idDonante }) },
  });
  return data;
}

// =====================
// ===== Donantes  =====
// =====================

// Listar donantes (búsqueda paginada)
export async function listarDonantes({ q, activo = true, limit = 20, offset = 0 } = {}) {
  const params = {};
  if (q) params.q = q;
  if (activo !== null && activo !== undefined) params.activo = activo ? 1 : 0;
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  const { data } = await api.get("/donativos/donantes", { params });
  return data;
}

export async function obtenerDonante(iddonante) {
  const { data } = await api.get(`/donativos/donantes/${iddonante}`);
  return data;
}

export async function crearDonante(payload) {
  const { data } = await api.post("/donativos/donantes", payload);
  return data; // { mensaje, donante }
}

export async function editarDonante(iddonante, payload) {
  const { data } = await api.patch(`/donativos/donantes/${iddonante}`, payload);
  return data; // { mensaje, donante }
}

export async function desactivarDonante(iddonante) {
  const { data } = await api.delete(`/donativos/donantes/${iddonante}`);
  return data; // { mensaje, donante }
}

// ===== Vínculos Donativo ↔ Donante (N:N) =====
export async function listarDonantesPorDonativo(id) {
  const { data } = await api.get(`/donativos/${id}/donantes`);
  return data; // [{ iddonante, principal, ... }]
}

/**
 * payload: { iddonante? , donanteData? , principal? , aporte_monto? , aporte_desc? }
 */
export async function vincularDonante(iddonativo, payload) {
  const { data } = await api.post(`/donativos/${iddonativo}/donantes`, payload);
  return data; // { mensaje: 'Donante vinculado al donativo' }
}

export async function desvincularDonante(iddonativo, iddonante) {
  const { data } = await api.delete(`/donativos/${iddonativo}/donantes/${iddonante}`);
  return data; // { mensaje: 'Donante desvinculado del donativo' }
}

export async function setDonantePrincipal(id, idDonante) {
  const { data } = await api.post(`/donativos/${id}/donantes/principal`, { idDonante });
  return data;
}
// Reporte por donante (quién dona y qué donó)
export async function reporteDonativosPorDonante(iddonante, { desde, hasta } = {}) {
  const params = { iddonante };
  if (desde) params.desde = desde;
  if (hasta) params.hasta = hasta;
  const { data } = await api.get("/donativos/reportes/por-donante", { params });
  return data;
}
export async function reportePorDonante({ iddonante, desde = null, hasta = null }) {
  const { data } = await api.get("/donativos/reportes/por-donante", {
    params: { iddonante, desde, hasta },
  });
  return data; // [{ iddonativo, fecha, descripcion, cantidad, estado, tipo, tipo_codigo, iditem, item_nombre }]
}