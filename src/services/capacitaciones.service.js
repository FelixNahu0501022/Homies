// src/services/capacitaciones.service.js
import api from "./axios";

// ---------- Utils ----------
const isDate = (v) => Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v);
const toYMD = (d) => d.toISOString().slice(0, 10);

// FormData solo con claves definidas (convierte Date a Y-M-D, números a string)
const toFD = (obj = {}) => {
  const fd = new FormData();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null) return;

    // archivos
    if (v instanceof File || v instanceof Blob) {
      fd.append(k, v);
      return;
    }
    // fechas
    if (isDate(v)) {
      fd.append(k, toYMD(v));
      return;
    }
    // números
    if (typeof v === "number") {
      fd.append(k, String(v));
      return;
    }
    // strings (evitar cadenas vacías)
    if (typeof v === "string") {
      if (v.trim() !== "") fd.append(k, v);
      return;
    }
    // arrays/objetos -> JSON
    if (Array.isArray(v) || typeof v === "object") {
      fd.append(k, JSON.stringify(v));
      return;
    }
    // fallback
    fd.append(k, v);
  });
  return fd;
};

// ===== Base pública (quita /api para construir /public) =====
function publicBase() {
  const base = api.defaults.baseURL || "";
  // quita .../api o .../api/
  return base.replace(/\/api\/?$/i, "");
}

// ========================================
//               CAPACITACIONES
// ========================================
export async function listarCapacitaciones() {
  const { data } = await api.get("/capacitaciones");
  return Array.isArray(data) ? data
       : Array.isArray(data?.data) ? data.data
       : Array.isArray(data?.rows) ? data.rows
       : [];
}

export async function obtenerCapacitacion(id) {
  const { data } = await api.get(`/capacitaciones/${id}`);
  return data;
}

export async function crearCapacitacion(payload) {
  // payload puede tener: { idCurso?, idTema?, titulo?, tema?, idUsuario, fechasolicitud?, fechainicio?, fechafin?, fecha?, documentoSolicitud?(File) }
  const fd = toFD(payload);
  const { data } = await api.post("/capacitaciones", fd);
  return data;
}

export async function editarCapacitacion(id, payload) {
  const fd = toFD(payload); // documentoSolicitud opcional
  const { data } = await api.patch(`/capacitaciones/${id}`, fd);
  return data;
}

export async function eliminarCapacitacion(id) {
  const { data } = await api.delete(`/capacitaciones/${id}`);
  return data;
}

// ========================================
//                 CONTENIDOS
// ========================================
export async function listarContenidos(idCapacitacion) {
  const { data } = await api.get(`/capacitaciones/${idCapacitacion}/contenidos`);
  return data; // [{ idcontenido, descripcion, archivopdf, idcapacitacion }]
}

export async function crearContenido(idCapacitacion, { descripcion, archivoPDF }) {
  const fd = new FormData();
  if (descripcion) fd.append("descripcion", descripcion);
  if (archivoPDF)  fd.append("archivoPDF", archivoPDF);
  const { data } = await api.post(`/capacitaciones/${idCapacitacion}/contenidos`, fd);
  return data;
}

export async function eliminarContenido(idCapacitacion, idContenido) {
  const { data } = await api.delete(`/capacitaciones/${idCapacitacion}/contenidos/${idContenido}`);
  return data;
}

// ========================================
//           PERSONAL (Interno)
// ========================================
export async function listarPersonalAsignado(idCapacitacion) {
  const { data } = await api.get(`/capacitaciones/${idCapacitacion}/personal`);
  return data;
}

export async function listarPersonalCatalogoCapacitacion(idCapacitacion) {
  const { data } = await api.get(`/capacitaciones/${idCapacitacion}/personal/catalogo`);
  return data;
}

export async function asignarPersonal(idCapacitacion, idsPersonal) {
  const { data } = await api.post(`/capacitaciones/${idCapacitacion}/personal`, { idsPersonal });
  return data; // { mensaje, asignados: [...] }
}

export async function quitarPersonal(idCapacitacion, idPersonal) {
  const { data } = await api.delete(`/capacitaciones/${idCapacitacion}/personal/${idPersonal}`);
  return data;
}

// ========================================
//           PERSONAS EXTERNAS
// ========================================
export async function listarPersonasExternas(idCapacitacion) {
  const { data } = await api.get(`/capacitaciones/${idCapacitacion}/personas`);
  return data;
}

export async function crearOAsignarPersona(idCapacitacion, payload) {
  // payload: { idPersona? } | { nombre, ci, correo? }
  const { data } = await api.post(`/capacitaciones/${idCapacitacion}/personas`, payload);
  return data;
}

export async function quitarPersona(idCapacitacion, idPersona) {
  const { data } = await api.delete(`/capacitaciones/${idCapacitacion}/personas/${idPersona}`);
  return data;
}

// ========================================
//              INSTITUCIONES
// ========================================
export async function listarInstituciones(idCapacitacion) {
  const { data } = await api.get(`/capacitaciones/${idCapacitacion}/instituciones`);
  return data;
}

export async function crearOAsignarInstitucion(idCapacitacion, payload) {
  // payload: { idInstitucion? } | { nombre, personaResponsable?, idPersonaResponsable?, contacto?, direccion? }
  const { data } = await api.post(`/capacitaciones/${idCapacitacion}/instituciones`, payload);
  return data;
}

export async function quitarInstitucion(idCapacitacion, idInstitucion) {
  const { data } = await api.delete(`/capacitaciones/${idCapacitacion}/instituciones/${idInstitucion}`);
  return data;
}

// ========================================
//                CATÁLOGOS
// ========================================
export async function listarCursosCatalogo() {
  const { data } = await api.get(`/capacitaciones/catalogos/cursos`);
  return data; // [{ idcurso, nombre, version, activo }]
}
export async function crearCursoCatalogo(payload) {
  const { data } = await api.post(`/capacitaciones/catalogos/cursos`, payload);
  return data;
}

export async function listarTemasCatalogo() {
  const { data } = await api.get(`/capacitaciones/catalogos/temas`);
  return data; // [{ idtema, nombre, activo }]
}
export async function crearTemaCatalogo(payload) {
  const { data } = await api.post(`/capacitaciones/catalogos/temas`, payload);
  return data;
}

// ========================================
//     CATÁLOGOS (personas/instituciones)
// ========================================
export async function buscarPersonasCatalogo({ search = "", limit = 20, offset = 0 } = {}) {
  const { data } = await api.get("/capacitaciones/catalogo/personas", {
    params: { search, limit, offset },
  });
  return data || [];
}
export async function crearPersonaCatalogo(payload) {
  const { data } = await api.post("/capacitaciones/catalogo/personas", payload);
  return data;
}

export async function buscarInstitucionesCatalogo({ search = "", limit = 20, offset = 0 } = {}) {
  const { data } = await api.get("/capacitaciones/catalogo/instituciones", { params: { search, limit, offset } });
  return data;
}
export async function crearInstitucionCatalogo(payload) {
  const { data } = await api.post("/capacitaciones/catalogo/instituciones", payload);
  return data;
}

// ========================================
//               CERTIFICADOS
// ========================================
export async function listarCertificados(idCapacitacion) {
  const { data } = await api.get(`/capacitaciones/${idCapacitacion}/certificados`);
  return data;
}

export async function listarPlantillasCert() {
  const { data } = await api.get(`/capacitaciones/catalogos/plantillas`);
  return data;
}
// Alias por compatibilidad con código previo
export const listarPlantillasCertificados = listarPlantillasCert;

export async function emitirCertificados({ idCapacitacion, idPlantilla, participantes = [], camposExtra = {} }) {
  const payload = { idCapacitacion, idPlantilla, participantes, camposExtra };
  const { data } = await api.post(`/capacitaciones/${idCapacitacion}/certificados/emitir`, payload);
  return data; // { mensaje, data: [...], total }
}

export async function anularCertificado(idCertificado) {
  try {
    const { data } = await api.patch(`/capacitaciones/certificados/${idCertificado}/anular`);
    return data;
  } catch (err) {
    // fallback a POST (rutas toleran POST y PATCH) o global
    if (err?.response?.status === 404) {
      try {
        const { data } = await api.post(`/capacitaciones/certificados/${idCertificado}/anular`);
        return data;
      } catch (_) {
        const { data } = await api.patch(`/certificados/${idCertificado}/anular`);
        return data;
      }
    }
    throw err;
  }
}

// URL segura (con token) para descargar
export function descargarCertificadoUrl(idCertificado) {
  const base = api.defaults.baseURL?.replace(/\/$/, "") || "";
  return `${base}/capacitaciones/certificados/${idCertificado}/descargar`;
}
// Alias de compatibilidad
export const urlDescargarCertificado = descargarCertificadoUrl;

// Descarga con axios + fallback público (/public)
export async function descargarCertificado(idCertificado) {
  const doDownload = (res) => {
    const dispo = res.headers?.["content-disposition"] || res.headers?.get?.("content-disposition");
    let filename = `certificado-${idCertificado}.pdf`;
    if (dispo) {
      const m = /filename\*?=(?:UTF-8''|")?([^;"']+)/i.exec(dispo);
      if (m && m[1]) filename = decodeURIComponent(m[1].replace(/"/g, ""));
    }
    const blobUrl = URL.createObjectURL(res.data || res.blob);
    const a = document.createElement("a");
    a.href = blobUrl; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(blobUrl);
  };

  try {
    const res = await api.get(`/capacitaciones/certificados/${idCertificado}/descargar`, { responseType: "blob" });
    return doDownload(res);
  } catch (err) {
    const status = err?.response?.status;
    if (status === 404 || status === 401 || status === 403) {
      const pubUrl = `${publicBase()}/public/certificados/download/${idCertificado}`;
      const res = await fetch(pubUrl);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Error ${res.status} al descargar certificado`);
      }
      const blob = await res.blob();
      const dispo = res.headers.get("content-disposition") || "";
      let filename = `certificado-${idCertificado}.pdf`;
      const m = /filename\*?=(?:UTF-8''|")?([^;"']+)/i.exec(dispo);
      if (m && m[1]) filename = decodeURIComponent(m[1].replace(/"/g, ""));
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(blobUrl);
      return;
    }
    throw err;
  }
}

// URL pública para VER inline (sin token)
export function urlVerCertificadoPublic(idCertificado) {
  return `${publicBase()}/public/certificados/view/${idCertificado}`;
}

// Forzar descarga pública (sin token)
export async function descargarCertificadoPublic(idCertificado) {
  const url = `${publicBase()}/public/certificados/download/${idCertificado}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Error ${res.status} al descargar certificado`);
  }
  const blob = await res.blob();

  const dispo = res.headers.get("content-disposition") || "";
  let filename = `certificado-${idCertificado}.pdf`;
  const m = /filename\*?=(?:UTF-8''|")?([^;"']+)/i.exec(dispo);
  if (m && m[1]) filename = decodeURIComponent(m[1].replace(/"/g, ""));

  const blobUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(blobUrl);
}

// ========================================
//               PLANTILLAS
// ========================================
export async function obtenerPlantilla(idPlantilla) {
  const { data } = await api.get(`/capacitaciones/plantillas/${idPlantilla}`);
  return data;
}

export async function actualizarCamposPlantilla(idPlantilla, campos) {
  const { data } = await api.put(`/capacitaciones/plantillas/${idPlantilla}`, { campos });
  return data;
}

export async function crearPlantilla({ nombre, archivo, campos }) {
  const fd = new FormData();
  fd.append("nombre", nombre);
  if (archivo) fd.append("archivo", archivo);
  if (campos)  fd.append("campos", JSON.stringify(campos));
  const { data } = await api.post(`/capacitaciones/plantillas`, fd);
  return data;
}

// ========================================
//               REPORTES
// ========================================
function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null) return;
    if (isDate(v)) {
      p.set(k, toYMD(v));
      return;
    }
    const s = String(v);
    if (s.trim() === "") return;
    p.set(k, s);
  });
  return p.toString();
}

// Internos
export async function repParticipacionInternos({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/participacion?${qs({ inicio, fin })}`);
  return data;
}
export async function repCoberturaInternos({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/cobertura?${qs({ inicio, fin })}`);
  return data;
}
export async function repInternosPorClase({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/participacion/clase?${qs({ inicio, fin })}`);
  return data;
}
export async function repInternosPorGrado({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/participacion/grado?${qs({ inicio, fin })}`);
  return data;
}
export async function repBrechasInternos({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/brechas?${qs({ inicio, fin })}`);
  return data;
}

// Externos
export async function repExternosRanking({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/externos/ranking?${qs({ inicio, fin })}`);
  return data;
}

// Instituciones
export async function repInstitucionesRanking({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/instituciones/ranking?${qs({ inicio, fin })}`);
  return data;
}

// Capacitaciones (agregados)
export async function repDistribucionPorTitulo({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/cursos/distribucion?${qs({ inicio, fin })}`);
  return data;
}
export async function repDistribucionPorTema({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/temas/distribucion?${qs({ inicio, fin })}`);
  return data;
}
export async function repTopCapacitaciones({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/capacitaciones/top?${qs({ inicio, fin })}`);
  return data;
}
export async function repSinAsistentes({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/capacitaciones/sin-asistentes?${qs({ inicio, fin })}`);
  return data;
}
export async function repContenidosPorCapacitacion({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/capacitaciones/contenidos?${qs({ inicio, fin })}`);
  return data;
}
export async function repSeriesMensuales({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/series?${qs({ inicio, fin })}`);
  return data;
}
// Historial por institución (reportes)
// Historial por institución (reportes)
export async function repHistorialInstitucion(idInstitucion, { inicio, fin } = {}) {
  try {
    const { data } = await api.get(
      `/capacitaciones/reportes/instituciones/${idInstitucion}/historial`,
      { params: { inicio, fin } }
    );
    // si backend devuelve 200 con algo "falsy", normaliza:
    return Array.isArray(data) ? data : (data ? [data] : []);
  } catch (err) {
    const status = err?.response?.status;
    // si backend devuelve 404/204/422, tratamos como "sin datos"
    if (status === 404 || status === 204 || status === 422) return [];
    // por si algunos controladores devuelven 200 pero data = null
    if (status === 200 && !err?.response?.data) return [];
    throw err;
  }
}


// Certificados
export async function repCertificadosEmitidos({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/certificados/emitidos?${qs({ inicio, fin })}`);
  return data;
}
export async function repCertificadosPorTipo({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/certificados/tipo?${qs({ inicio, fin })}`);
  return data;
}
export async function repCertificadosPorCapacitacion({ inicio, fin } = {}) {
  const { data } = await api.get(`/capacitaciones/reportes/certificados/por-capacitacion?${qs({ inicio, fin })}`);
  return data;
}
export async function repCertificadoBuscarPorSerie(nroSerie) {
  const { data } = await api.get(`/capacitaciones/reportes/certificados/buscar`, { params: { nroSerie } });
  return data;
}
export async function repHistorialPersona(tipo, id, { inicio, fin } = {}) {
  const { data } = await api.get("/capacitaciones/reportes/persona", { params: { tipo, id, inicio, fin } });
  return data || [];
}

export async function buscarPersonalCatalogo({ search = "", limit = 20, offset = 0 } = {}) {
  // Asume que tu backend /personal soporta paginado/búsqueda:
  // GET /personal?search=...&limit=...&offset=...
  const { data } = await api.get("/personal", { params: { search, limit, offset } });
  // normaliza: data?.data (paginado) o lista directa
  const arr = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return arr;
}