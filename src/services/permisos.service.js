// src/services/permisos.service.js
import api from "./axios";

export async function listarPermisos() {
  const { data } = await api.get("/permisos");
  return data; // [{ idpermiso, nombre, descripcion }]
}

export async function verPermisosDeRol(idRol) {
  const { data } = await api.get(`/permisos/rol/${idRol}`);
  return data; // [{ idpermiso, nombre, descripcion }]
}

export async function asignarPermisoARol({ idRol, idPermiso }) {
  const { data } = await api.post("/permisos/asignar", { idRol, idPermiso });
  return data;
}

export async function quitarPermisoDeRol({ idRol, idPermiso }) {
  const { data } = await api.post("/permisos/quitar", { idRol, idPermiso });
  return data;
}
