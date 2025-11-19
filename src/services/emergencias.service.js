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
