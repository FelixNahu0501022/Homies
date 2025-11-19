import api from "./axios";

// ======================
// CRUD Inventario (igual)
// ======================
export async function listarItems() {
  const { data } = await api.get("/inventario");
  return data;
}
export async function obtenerItem(id) {
  const { data } = await api.get(`/inventario/${id}`);
  return data;
}
export async function crearItem(payload) {
  const { data } = await api.post("/inventario", payload);
  return data;
}
export async function editarItem(id, payload) {
  const { data } = await api.patch(`/inventario/${id}`, payload);
  return data;
}
export async function eliminarItem(id) {
  const { data } = await api.delete(`/inventario/${id}`);
  return data;
}

// Consumo general (se mantiene)
export async function registrarConsumo({ idItem, cantidad, motivo }) {
  const { data } = await api.post("/inventario/consumo", { idItem, cantidad, motivo });
  return data;
}

// Asignaciones a vehículos (se mantiene)
export async function listarVehiculosAsignados(idItem) {
  const { data } = await api.get(`/inventario/${idItem}/vehiculos`);
  return data;
}
export async function asignarItemAVehiculo(idItem, { idVehiculo, cantidad }) {
  const { data } = await api.post(`/inventario/${idItem}/asignar`, { idVehiculo, cantidad });
  return data;
}
export async function quitarItemDeVehiculo(idItem, idVehiculo) {
  const { data } = await api.delete(`/inventario/${idItem}/quitar/${idVehiculo}`);
  return data;
}

// ======================
// Catálogos de Inventario
// ======================
export async function listarCategorias() {
  const { data } = await api.get("/inv/catalogos/categorias");
  return data;
}
export async function crearCategoria(nombre) {
  const { data } = await api.post("/inv/catalogos/categorias", { nombre });
  return data;
}

export async function listarUnidades() {
  const { data } = await api.get("/inv/catalogos/unidades");
  return data;
}
export async function crearUnidad(nombre) {
  const { data } = await api.post("/inv/catalogos/unidades", { nombre });
  return data;
}

// Ubicaciones (opcional: { idPadre })
export async function listarUbicaciones(params) {
  const { data } = await api.get("/inv/catalogos/ubicaciones", { params });
  return data;
}
export async function crearUbicacion({ nombre, idPadre = null }) {
  const { data } = await api.post("/inv/catalogos/ubicaciones", { nombre, idPadre });
  return data;
}

export async function listarProveedores() {
  const { data } = await api.get("/inv/catalogos/proveedores");
  return data;
}
export async function crearProveedor(payload) {
  const { data } = await api.post("/inv/catalogos/proveedores", payload);
  return data;
}

// ======================
// Atributos por categoría
// ======================

// Listado de atributos SUGERIDOS por categoría
export async function listarAtributosCategoria(idCategoria) {
  if (!idCategoria) return [];
  const { data } = await api.get(`/inventario/metadata/categoria/${idCategoria}/atributos`);
  return data; // [{ nombre, tipo, opciones, ... }]
}

// Crear atributo de categoría
export async function crearAtributoCategoria({ idCategoria, nombre, tipo, opciones = null }) {
  let opcionesNorm = null;
  const t = String(tipo || "texto").toLowerCase();

  if (["opcion", "multivalor"].includes(t)) {
    if (Array.isArray(opciones)) {
      opcionesNorm = opciones;
    } else if (typeof opciones === "string") {
      try {
        const parsed = JSON.parse(opciones);
        opcionesNorm = Array.isArray(parsed)
          ? parsed
          : String(opciones).split(",").map(s => s.trim()).filter(Boolean);
      } catch {
        opcionesNorm = String(opciones).split(",").map(s => s.trim()).filter(Boolean);
      }
    } else if (opciones && typeof opciones === "object" && Array.isArray(opciones.lista)) {
      opcionesNorm = opciones.lista; // legacy { lista: [...] }
    } else {
      opcionesNorm = [];
    }
  }

  const { data } = await api.post("/inv/catalogos/atributocategoria", {
    idCategoria,
    nombre,
    tipo: t,
    ...(opcionesNorm ? { opciones: opcionesNorm } : { opciones: null }),
  });
  return data;
}

// ======================
// Movimientos (existentes)
// ======================
export async function crearMovimiento({ tipo, motivo, referencia, srcUbicacion, dstUbicacion, lineas }) {
  const { data } = await api.post("/inv/movimientos", { tipo, motivo, referencia, srcUbicacion, dstUbicacion, lineas });
  return data;
}
export async function listarMovimientos(params) {
  const { data } = await api.get("/inv/movimientos", { params });
  return data;
}

// ======================
// NUEVO: Baja por cantidad
// ======================

// Atajo directo para una sola línea
export async function darDeBaja({ idItem, cantidad, motivo, costoUnitario, srcUbicacion, idMotivoBaja, referencia }) {
  const lineas = [
    {
      idItem,
      cantidad,
      ...(costoUnitario !== undefined && costoUnitario !== null && costoUnitario !== ""
        ? { costoUnitario: Number(costoUnitario) }
        : {}),
    },
  ];
  const payload = {
    motivo: motivo || "BAJA",
    referencia: referencia || null,
    ...(srcUbicacion ? { srcUbicacion } : {}),
    ...(idMotivoBaja ? { idMotivoBaja } : {}),
    lineas,
  };
  const { data } = await api.post("/inv/movimientos/baja", payload);
  return data;
}

// Versión genérica (múltiples líneas)
export async function crearBaja({ motivo, referencia, srcUbicacion, idMotivoBaja, lineas }) {
  const { data } = await api.post("/inv/movimientos/baja", {
    motivo: motivo || "BAJA",
    referencia: referencia || null,
    ...(srcUbicacion ? { srcUbicacion } : {}),
    ...(idMotivoBaja ? { idMotivoBaja } : {}),
    lineas: Array.isArray(lineas) ? lineas : [],
  });
  return data;
}

// ======================
// Reportes Inventario
// Base: /inventario/reportes/*
// ======================

// Stock / existencias
export async function rptStock() {
  const { data } = await api.get("/inventario/reportes/stock");
  return data;
}
export async function rptStockPorCategoria() {
  const { data } = await api.get("/inventario/reportes/stock/categoria");
  return data;
}
export async function rptStockPorUbicacion() {
  const { data } = await api.get("/inventario/reportes/stock/ubicacion");
  return data;
}
export async function rptStockPorProveedor() {
  const { data } = await api.get("/inventario/reportes/stock/proveedor");
  return data;
}
export async function rptBajoStock() {
  const { data } = await api.get("/inventario/reportes/stock/bajo");
  return data;
}
export async function rptAgotados() {
  const { data } = await api.get("/inventario/reportes/stock/agotados");
  return data;
}

// Movimientos / tendencias
export async function rptMovimientos(params) {
  const { data } = await api.get("/inventario/reportes/movimientos", { params });
  return data;
}
export async function rptKardex(params) {
  const { data } = await api.get("/inventario/reportes/kardex", { params });
  return data;
}
export async function rptResumenDiario(params) {
  const { data } = await api.get("/inventario/reportes/resumen-diario", { params });
  return data;
}
export async function rptTopConsumidos(params) {
  const { data } = await api.get("/inventario/reportes/top-consumidos", { params });
  return data;
}
export async function rptMotivos(params) {
  const { data } = await api.get("/inventario/reportes/motivos", { params });
  return data;
}
export async function rptValorizado() {
  const { data } = await api.get("/inventario/reportes/valorizado");
  return data;
}
export async function rptMovPorUbicacion() {
  const { data } = await api.get("/inventario/reportes/mov-por-ubicacion");
  return data;
}

// Asignaciones a vehículos
export async function rptAsignacionesItemVehiculo(params) {
  const { data } = await api.get("/inventario/reportes/asignaciones", { params });
  return data;
}
export async function rptInventarioPorVehiculo(params) {
  const { data } = await api.get("/inventario/reportes/por-vehiculo", { params });
  return data;
}

// Consumos directos y consolidado
export async function rptConsumosDirectos(params) {
  const { data } = await api.get("/inventario/reportes/consumos-directos", { params });
  return data;
}
export async function rptConsumosConsolidado(params) {
  const { data } = await api.get("/inventario/reportes/consumos", { params });
  return data;
}
export async function rptTopConsumos(params) {
  const { data } = await api.get("/inventario/reportes/top-consumos", { params });
  return data;
}

// Especificaciones / calidad de datos
export async function rptEspecificacionesKV(params) {
  const { data } = await api.get("/inventario/reportes/especificaciones-kv", { params });
  return data;
}
export async function rptEspecificacionesCobertura() {
  const { data } = await api.get("/inventario/reportes/especificaciones");
  return data;
}
export async function rptDatosFaltantes() {
  const { data } = await api.get("/inventario/reportes/datos-faltantes");
  return data;
}
export async function rptPosiblesDuplicados() {
  const { data } = await api.get("/inventario/reportes/posibles-duplicados");
  return data;
}

// ==== Catálogo de Vehículos (para reportes) ====
export async function listarVehiculosCatalogo() {
  const { data } = await api.get("/vehiculos", { params: { limit: 10000 } });
  return data;
}

// ======================
// NUEVO: Reportes de BAJAS
// ======================
export async function rptBajas(params) {
  const { data } = await api.get("/inventario/reportes/bajas", { params });
  return data;
}
export async function rptBajasResumen(params) {
  const { data } = await api.get("/inventario/reportes/bajas/resumen", { params });
  return data;
}
export async function rptBajasValorizado() {
  const { data } = await api.get("/inventario/reportes/bajas/valorizado");
  return data;
}
export async function rptTopBajas(params) {
  const { data } = await api.get("/inventario/reportes/bajas/top", { params });
  return data;
}
