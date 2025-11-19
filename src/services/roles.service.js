import api from "./axios";

export async function listarRoles() {
  const { data } = await api.get("/roles"); // sin paginación en backend
  return data; // [{ idrol, nombre, descripcion }]
}

export async function obtenerRol(id) {
  const { data } = await api.get(`/roles/${id}`);
  return data;
}

export async function crearRol(payload) {
  const { data } = await api.post("/roles", payload); // { nombre, descripcion }
  return data;
}

export async function editarRol(id, payload) {
  const { data } = await api.patch(`/roles/${id}`, payload);
  return data;
}

export async function eliminarRol(id) {
  const { data } = await api.delete(`/roles/${id}`);
  return data; // { mensaje, eliminado }
}
