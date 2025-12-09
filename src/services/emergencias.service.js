// src/services/emergencias.service.js
import api from "./axios";

/** =============== CRUD PRINCIPAL =============== **/
export async function listarEmergencias() {
  const { data } = await api.get("/emergencias");
  return data;
}

export async function obtenerEmergencia(id) {
  const { data } = await api.get(`/emergencias/${id}`);
  return data;
}

function toFormData(obj = {}) {
  const fd = new FormData();
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
}

export async function crearEmergencia(payload = {}, file /* File? */) {
  if (file) {
    const form = toFormData(payload);
    form.append("documentoSolvencia", file);
    const { data } = await api.post("/emergencias", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  const { data } = await api.post("/emergencias", payload);
  return data;
}

export async function editarEmergencia(id, payload = {}, file /* File? */) {
  if (file) {
    const form = toFormData(payload);
    form.append("documentoSolvencia", file);
    const { data } = await api.patch(`/emergencias/${id}`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  }
  const { data } = await api.patch(`/emergencias/${id}`, payload);
  return data;
}

export async function eliminarEmergencia(id) {
  const { data } = await api.delete(`/emergencias/${id}`);
  return data;
}

/** =============== CATÁLOGOS =============== **/
export async function listarTiposEmergencia() {
  const { data } = await api.get("/emergencias/tipos");
  return data; // [{ idTipoEmergencia, nombre }, ...]
}

export async function listarDescripciones({ typeId = null, q = "" } = {}) {
  const params = new URLSearchParams();
  if (typeId) params.append("type_id", typeId); // 👈 backend espera type_id
  if (q) params.append("q", q);
  const { data } = await api.get(`/emergencias/descripciones?${params.toString()}`);
  return data; // [{ idDescripcion, texto }, ...]
}

export async function crearDescripcion({ texto, idTipoEmergencia = null }) {
  const { data } = await api.post(`/emergencias/descripciones`, {
    texto,
    idTipoEmergencia,
  });
  return data;
}

/** =============== VEHÍCULOS =============== **/
export async function listarVehiculosDeEmergencia(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/vehiculos`);
  return data;
}

// 👇 NUEVO: vehículos realmente disponibles para asignar a ESTA emergencia
export async function listarVehiculosDisponibles(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/vehiculos-disponibles`);
  return data;
}

export async function asignarVehiculos(idEmergencia, idsVehiculos /* number[] */) {
  const { data } = await api.post(`/emergencias/${idEmergencia}/vehiculos`, {
    idsVehiculos,
  });
  return data;
}

export async function quitarVehiculo(idEmergencia, idVehiculo) {
  const { data } = await api.delete(`/emergencias/${idEmergencia}/vehiculos/${idVehiculo}`);
  return data;
}

/** =============== PERSONAL =============== **/
export async function listarPersonalDeEmergencia(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/personal`);
  return data;
}

export async function asignarPersonal(idEmergencia, idsPersonal /* number[] */) {
  const { data } = await api.post(`/emergencias/${idEmergencia}/personal`, {
    idsPersonal,
  });
  return data;
}

export async function quitarPersonal(idEmergencia, idPersonal) {
  const { data } = await api.delete(`/emergencias/${idEmergencia}/personal/${idPersonal}`);
  return data;
}

/** =============== INVENTARIO (USO EN EMERGENCIA) =============== **/
export async function listarInventarioDeEmergencia(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/inventario`);
  return data;
}

export async function registrarInventarioUsoLote(idEmergencia, registros /* [{idItem,idVehiculo,cantidadUsada,dadoDeBaja}] */) {
  const { data } = await api.post(`/emergencias/${idEmergencia}/inventario`, {
    registros,
  });
  return data;
}

export async function quitarInventarioUso(idEmergencia, idItem, idVehiculo) {
  const { data } = await api.delete(`/emergencias/${idEmergencia}/inventario/${idItem}/${idVehiculo}`);
  return data;
}
/** =============== REPORTES =============== **/
export async function reporteResumen({ inicio = null, fin = null, tipoId = null } = {}) {
  const { data } = await api.get("/emergencias/reportes/resumen", { params: { inicio, fin, tipoId } });
  return data;
}

export async function reporteMateriales({ inicio = null, fin = null, tipoId = null } = {}) {
  const { data } = await api.get("/emergencias/reportes/materiales", { params: { inicio, fin, tipoId } });
  return data;
}

export async function reporteSerieDiaria({ inicio = null, fin = null, tipoId = null } = {}) {
  const { data } = await api.get("/emergencias/reportes/serie-diaria", { params: { inicio, fin, tipoId } });
  return data;
}
export async function reporteBajasDetalle({ inicio = null, fin = null, tipoId = null, vehiculoId = null } = {}) {
  const { data } = await api.get("/emergencias/reportes/bajas-detalle", { params: { inicio, fin, tipoId, vehiculoId } });
  return data;
}
// --- NUEVOS REPORTES --- //

/** Participantes por emergencia */
export async function reporteParticipantesPorEmergencia(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/participantes`);
  return data; // [{ idpersonal, nombre, apellido, ci, idemergencia, fechahora, ubicacion, tipo, descripcion }]
}

/** Emergencias de un personal */
export async function reporteEmergenciasDePersonal({
  idPersonal,
  inicio = null,
  fin = null,
  idTipo = null,
} = {}) {
  const { data } = await api.get(`/emergencias/reportes/emergencias/de-personal`, {
    params: { idPersonal, inicio, fin, idTipo },
  });
  return data; // [{ idemergencia, fechahora, ubicacion, tipo, descripcion }]
}

/** Listado detallado por tipo */
export async function reporteEmergenciasPorTipo({
  idTipo,
  inicio = null,
  fin = null,
} = {}) {
  const { data } = await api.get(`/emergencias/reportes/emergencias/por-tipo`, {
    params: { idTipo, inicio, fin },
  });
  return data; // [{ idemergencia, fechahora, ubicacion, tipo, descripcion }]
}
// Opciones para selects
export async function opcionesEmergencias() {
  const { data } = await api.get(`/emergencias/opciones`);
  return data; // [{ id, label }]
}
export async function opcionesPersonal() {
  const { data } = await api.get(`/emergencias/opciones/personal`);
  return data; // [{ id, label }]
}

/** =============== CHOFERES =============== **/
/**
 * Obtiene todos los choferes asignados a una emergencia
 * @param {number} idEmergencia - ID de la emergencia
 * @returns {Promise<Array>} Lista de choferes con datos de personal y vehículo
 */
export async function listarChoferesDeEmergencia(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/choferes`);
  return data;
}

/**
 * Asigna un chofer a un vehículo en una emergencia
 * @param {number} idEmergencia - ID de la emergencia
 * @param {Object} payload - Datos del chofer
 * @param {number} payload.idPersonal - ID del personal
 * @param {number} payload.idVehiculo - ID del vehículo
 * @param {string} [payload.observaciones] - Observaciones opcionales
 * @returns {Promise<Object>} Resultado de la asignación
 */
export async function asignarChofer(idEmergencia, { idPersonal, idVehiculo, observaciones }) {
  const { data } = await api.post(`/emergencias/${idEmergencia}/choferes`, {
    idPersonal,
    idVehiculo,
    observaciones,
  });
  return data;
}

/**
 * Desasigna un chofer (marca fechaDesasignacion)
 * @param {number} idEmergencia - ID de la emergencia
 * @param {number} idPersonal - ID del personal chofer
 * @param {number} idVehiculo - ID del vehículo
 * @param {Object} [payload] - Datos opcionales
 * @param {string} [payload.observaciones] - Observaciones
 * @returns {Promise<Object>} Resultado de la desasignación
 */
export async function desasignarChofer(idEmergencia, idPersonal, idVehiculo, { observaciones } = {}) {
  const { data } = await api.delete(`/emergencias/${idEmergencia}/choferes/${idPersonal}/${idVehiculo}`, {
    data: { observaciones },
  });
  return data;
}

/** =============== KARDEX Y RECURSOS =============== **/
/**
 * Obtiene el kardex completo (timeline) de todos los recursos de una emergencia
 * @param {number} idEmergencia - ID de la emergencia
 * @returns {Promise<Array>} Lista cronológica de acciones sobre recursos
 */
export async function obtenerKardexEmergencia(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/kardex`);
  return data;
}

/**
 * Obtiene resumen estadístico de recursos utilizados
 * @param {number} idEmergencia - ID de la emergencia
 * @returns {Promise<Object>} Estadísticas de recursos
 */
export async function obtenerResumenRecursos(idEmergencia) {
  const { data } = await api.get(`/emergencias/${idEmergencia}/resumen-recursos`);
  return data;
}

/** =============== FECHAS INICIO/FIN =============== **/
/**
 * Marca la fecha de inicio de una emergencia
 * @param {number} idEmergencia - ID de la emergencia
 * @param {Object} [payload] - Datos opcionales
 * @param {string} [payload.fechaInicio] - Fecha en formato ISO 8601 (usa NOW() si no se envía)
 * @returns {Promise<Object>} Emergencia actualizada
 */
export async function marcarFechaInicio(idEmergencia, { fechaInicio } = {}) {
  const { data } = await api.patch(`/emergencias/${idEmergencia}/inicio`, {
    fechaInicio,
  });
  return data;
}

/**
 * Marca la fecha de fin de una emergencia
 * @param {number} idEmergencia - ID de la emergencia
 * @param {Object} [payload] - Datos opcionales
 * @param {string} [payload.fechaFin] - Fecha en formato ISO 8601 (usa NOW() si no se envía)
 * @returns {Promise<Object>} Emergencia actualizada
 */
export async function marcarFechaFin(idEmergencia, { fechaFin } = {}) {
  const { data } = await api.patch(`/emergencias/${idEmergencia}/fin`, {
    fechaFin,
  });
  return data;
}

/** =============== REPORTES DE HORAS =============== **/
/**
 * Obtiene horas trabajadas como chofer
 * @param {number} idPersonal - ID del personal
 * @param {Object} [params] - Parámetros de filtro
 * @param {string} [params.fechaInicio] - Fecha inicio en ISO 8601
 * @param {string} [params.fechaFin] - Fecha fin en ISO 8601
 * @returns {Promise<Array>} Lista de emergencias con horas como chofer
 */
export async function obtenerHorasChofer(idPersonal, { fechaInicio, fechaFin } = {}) {
  const { data } = await api.get(`/personal/${idPersonal}/horas-chofer`, {
    params: { fechaInicio, fechaFin },
  });
  return data;
}

/**
 * Obtiene horas trabajadas en emergencias
 * @param {number} idPersonal - ID del personal
 * @param {Object} [params] - Parámetros de filtro
 * @param {string} [params.fechaInicio] - Fecha inicio en ISO 8601
 * @param {string} [params.fechaFin] - Fecha fin en ISO 8601
 * @returns {Promise<Array>} Lista de emergencias con horas trabajadas
 */
export async function obtenerHorasEmergencias(idPersonal, { fechaInicio, fechaFin } = {}) {
  const { data } = await api.get(`/personal/${idPersonal}/horas-emergencias`, {
    params: { fechaInicio, fechaFin },
  });
  return data;
}

/**
 * Resumen consolidado de horas de todo el personal
 * @param {Object} [params] - Parámetros de filtro
 * @param {string} [params.fechaInicio] - Fecha inicio en ISO 8601
 * @param {string} [params.fechaFin] - Fecha fin en ISO 8601
 * @returns {Promise<Array>} Lista de personal con horas consolidadas
 */
export async function obtenerResumenHorasTodos({ fechaInicio, fechaFin } = {}) {
  const { data } = await api.get(`/personal/reportes/horas/resumen`, {
    params: { fechaInicio, fechaFin },
  });
  return data;
}
