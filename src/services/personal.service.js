// src/services/personal.service.js
import api from "./axios";

/** GET /personal -> array */
export async function listarPersonal({ page = 1, limit = 10, search = "" } = {}) {
  const { data } = await api.get("/personal", { params: { page, limit, search } });
  return data;
}

/** GET /personal/:id */
export async function obtenerPersonal(id) {
  const { data } = await api.get(`/personal/${id}`);
  return data;
}

/** Helper: arma FormData solo con campos definidos
 * - Convierte números a string para evitar problemas con multipart
 * - Acepta File / Blob en foto y fileDocumento
 */
function toFormData(obj = {}) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    // Si es boolean/number, enviar como string
    if (typeof v === "number" || typeof v === "boolean") {
      fd.append(k, String(v));
    } else {
      fd.append(k, v);
    }
  });
  return fd;
}

export async function crearPersonal(payload) {
  const formData = toFormData(payload);
  const { data } = await api.post("/personal", formData);
  return data;
}

export async function editarPersonal(id, payload) {
  const formData = toFormData(payload);
  const { data } = await api.patch(`/personal/${id}`, formData);
  return data;
}

/** DELETE /personal/:id */
export async function eliminarPersonal(id) {
  const { data } = await api.delete(`/personal/${id}`);
  return data;
}

/* ============ REPORTES (SOLO LECTURA) ============ */
export async function rptLegajo({ page = 1, limit = 10, search = "", idClase, idGrado, activo } = {}) {
  const { data } = await api.get("/personal/reportes/legajo", { params: { page, limit, search, idClase, idGrado, activo } });
  return data; // { data, total, page, limit }
}
export async function rptDistribucionClase() {
  const { data } = await api.get("/personal/reportes/distribucion/clase");
  return data;
}
export async function rptDistribucionGrado() {
  const { data } = await api.get("/personal/reportes/distribucion/grado");
  return data;
}
export async function rptCompletitud({ soloIncompletos = false } = {}) {
  const { data } = await api.get("/personal/reportes/completitud", { params: { soloIncompletos } });
  return data;
}
// Capacitaciones
export async function rptCapParticipacion({ inicio, fin } = {}) {
  const { data } = await api.get("/personal/reportes/capacitaciones/participacion", { params: { inicio, fin } });
  return data;
}
export async function rptCapCobertura({ inicio, fin } = {}) {
  const { data } = await api.get("/personal/reportes/capacitaciones/cobertura", { params: { inicio, fin } });
  return data; // { total_personal, con_capacitacion, cobertura }
}
// Emergencias
export async function rptEmParticipacion({ inicio, fin, idTipoEmergencia } = {}) {
  const { data } = await api.get("/personal/reportes/emergencias/participacion", { params: { inicio, fin, idTipoEmergencia } });
  return data;
}
export async function rptEmSinParticipacion({ inicio, fin, idTipoEmergencia } = {}) {
  const { data } = await api.get("/personal/reportes/emergencias/sin-participacion", { params: { inicio, fin, idTipoEmergencia } });
  return data;
}
