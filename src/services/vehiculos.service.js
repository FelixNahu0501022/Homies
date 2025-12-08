// src/services/vehiculos.service.js
import api from "./axios";

// ---------- Vehículos ----------
export async function listarVehiculos() {
  const { data } = await api.get("/vehiculos");
  return data;
}
export async function obtenerVehiculo(id) {
  const { data } = await api.get(`/vehiculos/${id}`);
  return data;
}

// Helper multipart
function toFormData(obj = {}) {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  return fd;
}

export async function crearVehiculo(payload) {
  // Solo enviamos lo necesario; backend exige idMarca/idTipo
  const fd = toFormData({
    placa: payload.placa,
    modelo: payload.modelo,
    nominacion: payload.nominacion,
    estado: payload.estado,
    foto: payload.foto || null,
    idMarca: payload.idMarca,
    idTipo: payload.idTipo,
  });
  const { data } = await api.post("/vehiculos", fd);
  return data;
}

export async function editarVehiculo(id, payload) {
  const fd = toFormData({
    placa: payload.placa,
    modelo: payload.modelo,
    nominacion: payload.nominacion,
    estado: payload.estado,
    foto: payload.foto || null,
    idMarca: payload.idMarca,
    idTipo: payload.idTipo,
  });
  const { data } = await api.patch(`/vehiculos/${id}`, fd);
  return data;
}

export async function eliminarVehiculo(id) {
  const { data } = await api.delete(`/vehiculos/${id}`);
  return data;
}

export async function cambiarEstadoVehiculo(id, estado) {
  const { data } = await api.patch(`/vehiculos/${id}/cambiar-estado`, { estado });
  return data;
}

// ---------- Mantenimientos ----------
export async function listarMantenimientos(idVehiculo) {
  const { data } = await api.get(`/vehiculos/${idVehiculo}/mantenimientos`);
  return data;
}
export async function crearMantenimiento(idVehiculo, { fecha, descripcion, archivoPDF }) {
  const fd = new FormData();
  if (fecha) fd.append("fecha", fecha);
  if (descripcion) fd.append("descripcion", descripcion);
  if (archivoPDF) fd.append("archivoPDF", archivoPDF);
  const { data } = await api.post(`/vehiculos/${idVehiculo}/mantenimientos`, fd);
  return data;
}
export async function eliminarMantenimiento(idVehiculo, idMantenimiento) {
  const { data } = await api.delete(`/vehiculos/${idVehiculo}/mantenimientos/${idMantenimiento}`);
  return data;
}

// ---------- Inventario asignado ----------
export async function verInventarioAsignado(idVehiculo) {
  const { data } = await api.get(`/vehiculos/${idVehiculo}/inventario`);
  return data;
}

// ---------- Reportes Vehículos ----------
export async function rptVehiculosListado(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "");
  const qs = new URLSearchParams(entries).toString();
  const { data } = await api.get(`/vehiculos/reportes/listado${qs ? `?${qs}` : ""}`);
  return data;
}
export async function rptDistribucionEstado() {
  const { data } = await api.get(`/vehiculos/reportes/distribucion-estado`);
  return data;
}
export async function rptDisponibles() {
  const { data } = await api.get(`/vehiculos/reportes/disponibles`);
  return data;
}
export async function rptEnEmergencia() {
  const { data } = await api.get(`/vehiculos/reportes/en-emergencia`);
  return data;
}
export async function rptDetalleVehiculo(idVehiculo) {
  const { data } = await api.get(`/vehiculos/${idVehiculo}/reportes/detalle`);
  return data;
}
export async function rptInventarioVehiculo(idVehiculo) {
  const { data } = await api.get(`/vehiculos/${idVehiculo}/reportes/inventario`);
  return data;
}
export async function rptTotalesItemFlota() {
  const { data } = await api.get(`/vehiculos/reportes/inventario/totales`);
  return data;
}
export async function rptVehiculosPorItem(idItem) {
  const { data } = await api.get(`/vehiculos/reportes/inventario/vehiculos-por-item/${idItem}`);
  return data;
}
export async function rptMantenimientosVehiculo(idVehiculo, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/vehiculos/${idVehiculo}/reportes/mantenimientos${qs ? `?${qs}` : ""}`);
  return data;
}
export async function rptRankingMantenimientos(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/vehiculos/reportes/mantenimientos/ranking${qs ? `?${qs}` : ""}`);
  return data;
}
export async function rptParticipacionEmergencias(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/vehiculos/reportes/emergencias/participacion${qs ? `?${qs}` : ""}`);
  return data;
}
export async function rptDisponiblesPorTipoEmergencia(params = {}) {
  const qs = new URLSearchParams(params).toString();
  const { data } = await api.get(`/vehiculos/reportes/disponibles-por-tipo-emergencia${qs ? `?${qs}` : ""}`);
  return data;
}

// --- Catálogos (Marcas / Tipos) ---
export async function listarMarcas(search = "", limit = 50, offset = 0) {
  const params = new URLSearchParams({ search, limit, offset }).toString();
  const { data } = await api.get(`/vehiculos/marcas?${params}`);
  return data; // [{idmarca, nombre}]
}
export async function crearMarca(nombre) {
  const { data } = await api.post(`/vehiculos/marcas`, { nombre });
  return data; // {idmarca, nombre}
}
export async function listarTipos(search = "", limit = 50, offset = 0) {
  const params = new URLSearchParams({ search, limit, offset }).toString();
  const { data } = await api.get(`/vehiculos/tipos?${params}`);
  return data; // [{idtipo, nombre}]
}
export async function crearTipo(nombre) {
  const { data } = await api.post(`/vehiculos/tipos`, { nombre });
  return data; // {idtipo, nombre}
}
// --- Inventario (para combos/reportes que lo usen) ---
export async function listarInventarioItems() {
  // Ajusta la URL si en tu backend el endpoint es otro (ej. /inventario/items)
  const { data } = await api.get("/inventario");
  return data;
}
