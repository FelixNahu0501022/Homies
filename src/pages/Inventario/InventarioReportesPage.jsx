// src/pages/Inventario/InventarioReportesPage.jsx
import {
  Box, Button, Grid, IconButton, MenuItem, Paper, Tab, Tabs, TextField, Tooltip, Typography
} from "@mui/material";
import { Refresh, PictureAsPdf } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useNavigate } from "react-router-dom";
import Autocomplete from "@mui/material/Autocomplete";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";

import {
  listarItems, listarUbicaciones, listarCategorias, listarUnidades, listarProveedores,
  rptStock, rptStockPorCategoria, rptStockPorUbicacion, rptStockPorProveedor, rptBajoStock, rptAgotados,
  rptMovimientos, rptKardex, rptResumenDiario, rptTopConsumidos, rptMotivos, rptMovPorUbicacion,
  rptAsignacionesItemVehiculo, rptInventarioPorVehiculo,
  rptConsumosDirectos, rptConsumosConsolidado, rptTopConsumos,
  rptEspecificacionesKV, rptEspecificacionesCobertura, rptDatosFaltantes, rptPosiblesDuplicados,
  listarVehiculosCatalogo,
  rptBajas, rptBajasResumen, rptTopBajas,
} from "../../services/inventario.service";

import { exportTablePdf } from "../../utils/pdfExport";

/* =============== Tabla simple =============== */
function SimpleTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <Typography variant="body2" sx={{ p: 2 }}>Sin datos</Typography>;
  }
  const cols = Object.keys(rows[0] || {});
  return (
    <Box sx={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c} style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #eee" }}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} style={{ borderBottom: "1px solid #f5f5f5" }}>
              {cols.map(c => (
                <td key={c} style={{ padding: "8px", verticalAlign: "top" }}>
                  {Array.isArray(r[c]) ? r[c].join(", ") : String(r[c] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
}

/* =============== Helpers & mapping =============== */
function firstNonEmpty(...vals) {
  for (const v of vals) {
    if (v === 0) return 0;
    if (v !== null && v !== undefined && v !== "" && !Number.isNaN(v)) return v;
  }
  return undefined;
}
function yesNo(v) { return v ? "Sí" : "No"; }

function buildMap(arr, preferIdKeyStartsWith = "id") {
  const map = new Map();
  (arr || []).forEach((o) => {
    const keys = Object.keys(o || {});
    const idKey = keys.find(k => k.toLowerCase().startsWith(preferIdKeyStartsWith)) || keys.find(k => /^id/i.test(k));
    const id = idKey ? o[idKey] : undefined;
    const nombre = o.nombre ?? o.descripcion ?? o.etiqueta ?? o.alias ?? null;
    if (id != null && nombre) map.set(Number(id), String(nombre));
  });
  return map;
}

function useCatalogMaps({ items, categorias, unidades, ubicaciones, proveedores }) {
  const mItems = useMemo(() => buildMap(items, "iditem"), [items]);
  const mCats  = useMemo(() => buildMap(categorias, "idcategoria"), [categorias]);
  const mUnis  = useMemo(() => buildMap(unidades, "idunidad"), [unidades]);
  const mUbis  = useMemo(() => buildMap(ubicaciones, "idubicacion"), [ubicaciones]);
  const mProvs = useMemo(() => buildMap(proveedores, "idproveedor"), [proveedores]);

  const itName  = (id, fallback) => (id == null ? (fallback ?? "—") : (mItems.get(Number(id))  ?? (fallback ?? "—")));
  const catName = (id, fallback) => (id == null ? (fallback ?? "—") : (mCats.get(Number(id))   ?? (fallback ?? "—")));
  const uniName = (id, fallback) => (id == null ? (fallback ?? "—") : (mUnis.get(Number(id))   ?? (fallback ?? "—")));
  const ubiName = (id, fallback) => (id == null ? (fallback ?? "—") : (mUbis.get(Number(id))   ?? (fallback ?? "—")));
  const prvName = (id, fallback) => (id == null ? (fallback ?? "—") : (mProvs.get(Number(id))  ?? (fallback ?? "—")));
  return { itName, catName, uniName, ubiName, prvName };
}

// IDs/labels robustos para los Autocomplete
const itemIdOf  = (o) => Number(o?.iditem ?? o?.idItem ?? o?.id ?? o?.itemId ?? o?.inventarioId);
const itemLabel = (o) =>
  [o?.nombre, o?.descripcion, o?.etiqueta, o?.alias, o?.item, o?.producto]
    .find((v) => v && String(v).trim()) || "";

const ubiIdOf   = (o) => Number(o?.idubicacion ?? o?.idUbicacion ?? o?.id ?? o?.ubicacionId);
const ubiLabel  = (o) => [o?.nombre, o?.etiqueta, o?.alias].find(v => v && String(v).trim()) || "";

function vehLabelFromRecord(r) {
  if (!r || typeof r !== "object") return "Vehículo";
  const kNom = Object.keys(r).find(k => /nomin|nomen|denomin/i.test(k));
  if (kNom && r[kNom]) return String(r[kNom]);
  const alt = r.nombrevehiculo ?? r.nombreVehiculo ?? r.alias ?? r.codigo ?? r.nombre;
  if (alt) return String(alt);
  const kPlaca  = Object.keys(r).find(k => /placa/i.test(k));
  const kMarca  = Object.keys(r).find(k => /marca/i.test(k));
  const kModelo = Object.keys(r).find(k => /modelo/i.test(k));
  const composed = [r[kPlaca], r[kMarca], r[kModelo]].filter(Boolean).join(" ");
  if (composed) return composed;
  return "Vehículo";
}
function buildVehMap(vehiculos) {
  const map = new Map();
  (vehiculos || []).forEach(v => {
    const idKey = Object.keys(v).find(k => /^id.?vehiculo$/i.test(k)) || "idvehiculo";
    const id = v[idKey];
    if (id == null) return;
    map.set(Number(id), vehLabelFromRecord(v));
  });
  return map;
}

const tipoLabel = (t) => {
  const T = String(t || "").toUpperCase();
  if (T === "IN") return "Entrada";
  if (T === "OUT") return "Salida";
  return t ?? "—";
};

/* =============== Transformadores =============== */
const tr = {
  stock: (rows, { catName, uniName, ubiName, prvName }) =>
    (rows || []).map(r => ({
      Ítem: firstNonEmpty(r.nombre, r.item, r.producto, "—"),
      Descripción: firstNonEmpty(r.descripcion, r.descripcion_item, "—"),
      Categoría: catName(r.idcategoria ?? r.idCategoria, firstNonEmpty(r.categoria, r.nombre_categoria)),
      Unidad:    uniName(r.idunidad ?? r.idUnidad, firstNonEmpty(r.unidad, r.nombre_unidad)),
      Ubicación: ubiName(r.idubicacion ?? r.idUbicacion, firstNonEmpty(r.ubicacion, r.nombre_ubicacion)),
      Proveedor: prvName(r.idproveedor ?? r.idProveedor, firstNonEmpty(r.proveedor, r.nombre_proveedor)),
      Cantidad: firstNonEmpty(r.cantidad, r.stock, 0),
      Estado: firstNonEmpty(r.estado, "—"),
    })),

  stockAgrupado: (rows, label, mapFn) =>
    (rows || []).map(r => {
      const idCat = r.idcategoria ?? r.idCategoria;
      const idUbi = r.idubicacion ?? r.idUbicacion;
      const idPrv = r.idproveedor ?? r.idProveedor;
      const etiqueta = firstNonEmpty(
        mapFn(idCat ?? idUbi ?? idPrv, undefined),
        r[label.toLowerCase()], r.nombre, r.etiqueta, r.categoria, r.ubicacion, r.proveedor, "—"
      );
      return {
        [label]: etiqueta,
        Ítems: firstNonEmpty(r.items, r.total_items, r.totalItems, r.materiales, 0),
        "Total Cantidad": firstNonEmpty(r.total_cantidad, r.totalCantidad, r.cantidad_total, r.cantidad, 0),
      };
    }),

  bajoAgotados: (rows) =>
    (rows || []).map(r => ({
      Ítem: firstNonEmpty(r.nombre, r.item, "—"),
      Descripción: firstNonEmpty(r.descripcion, "—"),
      Cantidad: firstNonEmpty(r.cantidad, r.stock, 0),
      Estado: firstNonEmpty(r.estado, "—"),
    })),

  movimientosFlat: (rows, { itName, ubiName }) =>
    (rows || []).map(r => ({
      Fecha: r.fecha,
      Tipo: tipoLabel(r.tipo),
      Ítem: itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
      Cantidad: firstNonEmpty(r.cantidad, 0),
      "Ubicación Origen": ubiName(r.srcubicacion ?? r.srcUbicacion, r.ubicacion_origen ?? r.origen ?? r.srcNombre),
      "Ubicación Destino": ubiName(r.dstubicacion ?? r.dstUbicacion, r.ubicacion_destino ?? r.destino ?? r.dstNombre),
      Motivo: firstNonEmpty(r.motivo, "—"),
      Referencia: firstNonEmpty(r.referencia, "Sin referencia"),
    })),

  kardex: (rows, { itName, ubiName }) =>
    (rows || []).map(r => ({
      Fecha: r.fecha,
      Tipo: tipoLabel(r.tipo),
      Ítem: itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
      Cantidad: firstNonEmpty(r.cantidad, 0),
      "Ubicación Origen": ubiName(r.srcubicacion ?? r.srcUbicacion, r.ubicacion_origen ?? r.origen ?? r.srcNombre),
      "Ubicación Destino": ubiName(r.dstubicacion ?? r.dstUbicacion, r.ubicacion_destino ?? r.destino ?? r.dstNombre),
      Motivo: firstNonEmpty(r.motivo, "—"),
    })),

  // <- Cambiado: detecta iditem en cada fila; si no hay, usa etiqueta global
  resumenDiario: (rows, maps, itemNameFallback) =>
    (rows || []).map(r => {
      const itemFromRow = r.iditem ?? r.idItem;
      const etiqueta = itemFromRow != null
        ? maps.itName(itemFromRow)
        : (itemNameFallback ?? "Todos los ítems");
      return {
        Día: firstNonEmpty(r.dia, r.fecha, ""),
        Ítem: etiqueta,
        Entradas: firstNonEmpty(r.total_in, r.entradas, 0),
        Salidas: firstNonEmpty(r.total_out, r.salidas, 0),
        Movimientos: firstNonEmpty(r.movimientos, 0),
      };
    }),

  topConsumidos: (rows, { itName }) =>
    (rows || []).map(r => ({
      Ítem: itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
      "Total de salidas": firstNonEmpty(r.total_out, r.total_consumido, r.salidas, 0),
    })),

  // <- Cambiado: detecta por fila; si trae iditem lo nombra, si no usa fallback
  motivos: (rows, maps, itemNameFallback) =>
    (rows || []).map(r => {
      const itemFromRow = r.iditem ?? r.idItem; // si el SQL trae iditem en el grupo
      const etiqueta = itemFromRow != null
        ? maps.itName(itemFromRow)
        : (itemNameFallback ?? "Todos los ítems");
      return {
        Ítem: etiqueta,
        Motivo: firstNonEmpty(r.motivo, "—"),
        Tipo: tipoLabel(r.tipo),
        Movimientos: firstNonEmpty(r.movimientos, 0),
        Cantidad: firstNonEmpty(r.total_cantidad, r.cantidad, 0),
      };
    }),

  movPorUbi: (rows, { ubiName }) =>
    (rows || []).map(r => ({
      Ubicación: ubiName(r.idubicacion ?? r.idUbicacion, r.ubicacion ?? r.nombre_ubicacion),
      "Entradas en la ubicación": firstNonEmpty(r.in_en_ubi, r.entradas, 0),
      "Salidas desde la ubicación": firstNonEmpty(r.out_desde_ubi, r.salidas, 0),
      Movimientos: firstNonEmpty(r.movimientos, 0),
    })),

  // ---- ASIGNACIONES ----
  asignacionesItemVeh_grouped: (rows, vehMap) => {
    const acc = new Map();
    for (const r of (rows || [])) {
      const idVeh = firstNonEmpty(r.idvehiculo, r.idVehiculo, r.vehiculo_id, r.id);
      const etiqueta = idVeh != null ? (vehMap.get(Number(idVeh)) || vehLabelFromRecord(r)) : vehLabelFromRecord(r);
      const key = etiqueta;
      const prev = acc.get(key) || { Vehículo: etiqueta, Cantidad: 0, _items: new Set() };
      const cant = Number(firstNonEmpty(r.cantidad, r.total_cantidad, 0));
      if (Number.isFinite(cant)) prev.Cantidad += cant;
      const idItem = Number(firstNonEmpty(r.iditem, r.idItem));
      if (Number.isFinite(idItem)) prev._items.add(idItem);
      acc.set(key, prev);
    }
    return Array.from(acc.values()).map(v => ({ Vehículo: v.Vehículo, Cantidad: v.Cantidad, "Ítems distintos": v._items.size }));
  },

  invPorVeh_grouped_from: (rowsPv, rowsIv, vehMap) => {
    const acc = new Map();
    for (const r of (rowsIv || [])) {
      const idVeh = firstNonEmpty(r.idvehiculo, r.idVehiculo, r.vehiculo_id, r.id);
      const etiqueta = idVeh != null ? (vehMap.get(Number(idVeh)) || vehLabelFromRecord(r)) : vehLabelFromRecord(r);
      const key = etiqueta;
      const prev = acc.get(key) || { Vehículo: etiqueta, Ítems: new Set(), "Total Cantidad": 0 };
      const idItem = Number(firstNonEmpty(r.iditem, r.idItem));
      if (Number.isFinite(idItem)) prev.Ítems.add(idItem);
      const cant = Number(firstNonEmpty(r.cantidad, r.total_cantidad, 0));
      if (Number.isFinite(cant)) prev["Total Cantidad"] += cant;
      acc.set(key, prev);
    }
    if (acc.size === 0) {
      for (const r of (rowsPv || [])) {
        const idVeh = firstNonEmpty(r.idvehiculo, r.idVehiculo, r.vehiculo_id, r.id);
        const etiqueta = idVeh != null ? (vehMap.get(Number(idVeh)) || vehLabelFromRecord(r)) : vehLabelFromRecord(r);
        const key = etiqueta;
        const prev = acc.get(key) || { Vehículo: etiqueta, Ítems: new Set(), "Total Cantidad": 0 };
        const items = Number(firstNonEmpty(r.items, r.total_items, r.totalItems, r.materiales, 0));
        const cant = Number(firstNonEmpty(r.total_cantidad, r.totalCantidad, r.cantidad_total, r.cantidad, 0));
        if (Number.isFinite(items) && items > 0) prev.Ítems = { size: items };
        if (Number.isFinite(cant)) prev["Total Cantidad"] += cant;
        acc.set(key, prev);
      }
    }
    return Array.from(acc.values()).map(v => ({
      Vehículo: v.Vehículo,
      Ítems: v.Ítems.size ?? 0,
      "Total Cantidad": v["Total Cantidad"],
    }));
  },

  // ---- BAJAS ----
  bajasDetalle: (rows, { itName, ubiName }) =>
    (rows || []).map(r => ({
      Fecha: r.fecha,
      Ítem: itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
      Cantidad: firstNonEmpty(r.cantidad, 0),
      "Ubicación Origen": ubiName(r.srcubicacion ?? r.srcUbicacion, r.ubicacion_origen ?? r.origen ?? r.srcNombre),
      Motivo: firstNonEmpty(r.motivo, "—"),
      Referencia: firstNonEmpty(r.referencia, "Sin referencia"),
    })),

  bajasResumen: (rows, maps, fallback) =>
    (rows || []).map(r => ({
      Día: firstNonEmpty(r.dia, ""),
      Ítem: (r.iditem != null ? maps.itName(r.iditem) : (fallback ?? "Todos los ítems")),
      "Bajas (cantidad)": firstNonEmpty(r.total_bajas, r.cantidad, 0),
      Registros: firstNonEmpty(r.lineas, r.registros, 0),
    })),

  topBajas: (rows, { itName }) =>
    (rows || []).map(r => ({
      Ítem: itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
      "Total de bajas": firstNonEmpty(r.total_bajas, r.cantidad, 0),
    })),

  especificacionesKV: (rows, { itName }, itemNombreForzado) =>
    (rows || []).map(r => ({
      Ítem: itemNombreForzado || itName(r.iditem ?? r.idItem, r.nombre_item) || "Ítem",
      Atributo: firstNonEmpty(r.atributo, r.key, "—"),
      Valor: firstNonEmpty(r.valor, r.value, "—"),
    })),

  coberturaEspec: (rowOrArr) => {
    const rows = Array.isArray(rowOrArr) ? rowOrArr : [rowOrArr];
    return rows.map(r => ({
      "Ítems con especificaciones": firstNonEmpty(r.items_con_especificaciones, 0),
      "Ítems sin especificaciones": firstNonEmpty(r.items_sin_especificaciones, 0),
      "Ítems totales": firstNonEmpty(r.items_totales, 0),
      "% con especificaciones": firstNonEmpty(r.porcentaje_con_especificaciones, 0),
    }));
  },

  datosFaltantes: (rows, { itName }) =>
    (rows || []).map(r => ({
      Ítem: itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
      "Sin categoría": yesNo(firstNonEmpty(r.sin_categoria, false)),
      "Sin unidad": yesNo(firstNonEmpty(r.sin_unidad, false)),
      "Sin ubicación": yesNo(firstNonEmpty(r.sin_ubicacion, false)),
      "Sin proveedor": yesNo(firstNonEmpty(r.sin_proveedor, false)),
    })),

  posiblesDuplicados: (rows, { catName, uniName, ubiName, prvName }) =>
    (rows || []).map(r => ({
      Ítem: firstNonEmpty(r.nombre, r.item, "—"),
      Descripción: firstNonEmpty(r.descripcion, "—"),
      Categoría: catName(r.idcategoria ?? r.idCategoria, firstNonEmpty(r.categoria, r.nombre_categoria)),
      Unidad:    uniName(r.idunidad ?? r.idUnidad, firstNonEmpty(r.unidad, r.nombre_unidad)),
      Ubicación: ubiName(r.idubicacion ?? r.idUbicacion, firstNonEmpty(r.ubicacion, r.nombre_ubicacion)),
      Proveedor: prvName(r.idproveedor ?? r.idProveedor, firstNonEmpty(r.proveedor, r.nombre_proveedor)),
      Cantidad: firstNonEmpty(r.cantidad, 0),
      Estado: firstNonEmpty(r.estado, "—"),
    })),
};

function makePdfColumns(rows) {
  if (!rows || rows.length === 0) return [];
  return Object.keys(rows[0]).map(k => ({ header: k, dataKey: k }));
}
function exportPdfAuto({ title, subtitle, rows, filename = "reporte.pdf", orientation = "portrait" }) {
  if (!rows || rows.length === 0) {
    Swal.fire("Aviso", "No hay datos para exportar", "info");
    return;
  }
  const columns = makePdfColumns(rows);
  exportTablePdf({ title, subtitle, columns, rows, filename, orientation });
}

/* =============== Componente principal =============== */
const TABS = [
  { key: "stock", label: "Stock" },
  { key: "mov", label: "Movimientos" },
  { key: "cons", label: "Consumos" },
  { key: "asig", label: "Asignaciones" },
  { key: "calidad", label: "Calidad & Especificaciones" },
  { key: "bajas", label: "Bajas" },
];

const TIPO_OPTIONS = [
  { value: "",  label: "Todos" },
  { value: "IN",  label: "Entrada" },
  { value: "OUT", label: "Salida" },
];

export default function InventarioReportesPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("stock");

  // Catálogos
  const [items, setItems] = useState([]);
  const [ubis, setUbis] = useState([]);
  const [cats, setCats] = useState([]);
  const [unis, setUnis] = useState([]);
  const [provs, setProvs] = useState([]);
  const catalogsReady = !!(items.length && ubis.length && cats.length && unis.length && provs.length);

  // Vehículos
  const [vehList, setVehList] = useState([]);
  const vehMap = useMemo(() => buildVehMap(Array.isArray(vehList) ? vehList : []), [vehList]);

  // Filtros
  const [tipo, setTipo] = useState("");
  const [itemSel, setItemSel] = useState(null);
  const [ubiSel, setUbiSel] = useState(null);
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");

  // Datos
  const [dataStock, setDataStock] = useState({ stock: [], porCategoria: [], porUbicacion: [], porProveedor: [], bajo: [], agotados: [] });
  const [dataMov, setDataMov] = useState({ movimientos: [], kardex: [], resumen: [], top: [], motivos: [], movUbi: [] });
  const [dataCons, setDataCons] = useState({ directos: [], consolidado: [], top: [] });
  const [dataAsig, setDataAsig] = useState({ itemVeh: [], porVeh: [] });
  const [dataCalidad, setDataCalidad] = useState({ kv: [], cobertura: [], faltantes: [], duplicados: [] });
  const [dataBajas, setDataBajas] = useState({ detalle: [], resumen: [], top: [] });

  /* -------- Carga catálogos -------- */
  useEffect(() => {
    (async () => {
      try {
        const [its, ubic, c, u, p, vehs] = await Promise.all([
          listarItems(), listarUbicaciones(), listarCategorias(), listarUnidades(), listarProveedores(), listarVehiculosCatalogo(),
        ]);
        setItems(its || []); setUbis(ubic || []); setCats(c || []); setUnis(u || []); setProvs(p || []); setVehList(vehs || []);
      } catch (e) {
        const msg = e?.response?.data?.mensaje || e?.message || "No se pudo cargar catálogos";
        Swal.fire("Error", msg, "error");
      }
    })();
  }, []);

  // Autocompletar ubicación por ítem
  useEffect(() => {
    if (!itemSel) return;
    const idUbiItem = Number(itemSel?.idubicacion ?? itemSel?.idUbicacion ?? itemSel?.ubicacionId ?? itemSel?.idUbi);
    if (!idUbiItem) return;
    const found = (ubis || []).find(u => Number(ubiIdOf(u)) === idUbiItem);
    if (found) setUbiSel(found);
  }, [itemSel, ubis]);

  // Limpiar ubicación/tipo si se borra el ítem
  useEffect(() => {
    if (!itemSel) { setUbiSel(null); setTipo(""); }
  }, [itemSel]);

  // Maps nombres
  const maps = useCatalogMaps({ items, categorias: cats, unidades: unis, ubicaciones: ubis, proveedores: provs });

  // Selección
  const idItem = itemSel ? itemIdOf(itemSel) : undefined;
  const itemNameSelected = itemLabel(itemSel);
  const itemFilterName = (itemNameSelected && itemNameSelected.trim()) || (idItem != null ? maps.itName(idItem) : null) || "Todos los ítems";
  const idUbicacion = ubiSel ? ubiIdOf(ubiSel) : undefined;

  /* -------- Cargas por pestaña -------- */
  const cargarStock = async () => {
    try {
      const [st, cat, ubi, prov, bajo, agot] = await Promise.all([
        rptStock(), rptStockPorCategoria(), rptStockPorUbicacion(), rptStockPorProveedor(), rptBajoStock(), rptAgotados()
      ]);
      setDataStock({
        stock: tr.stock(st, maps),
        porCategoria: tr.stockAgrupado(cat, "Categoría", maps.catName),
        porUbicacion: tr.stockAgrupado(ubi, "Ubicación", maps.ubiName),
        porProveedor: tr.stockAgrupado(prov, "Proveedor", maps.prvName),
        bajo: tr.bajoAgotados(bajo),
        agotados: tr.bajoAgotados(agot),
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo cargar Stock", "error");
    }
  };

  const fetchMovimientosConFallback = async (qBase) => {
    let movs = await rptMovimientos(qBase);
    if (!movs || movs.length === 0) {
      const qSinUbi = { ...qBase }; delete qSinUbi.idUbicacion;
      movs = await rptMovimientos(qSinUbi);
    }
    return movs;
  };

  const cargarMov = async () => {
    try {
      const qBase = {
        ...(tipo ? { tipo } : {}),
        ...(idItem ? { idItem } : {}),
        ...(idUbicacion ? { idUbicacion } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      };
      const [movs, kdx, res, top, mot, mubi] = await Promise.all([
        fetchMovimientosConFallback(qBase),
        rptKardex(qBase),
        rptResumenDiario({ desde, hasta, ...(idItem ? { idItem } : {}) }),
        rptTopConsumidos({ limit: 20 }),
        rptMotivos({ ...(idItem ? { idItem } : {}), ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) }),
        rptMovPorUbicacion()
      ]);
      setDataMov({
        movimientos: tr.movimientosFlat(movs, maps),
        kardex: tr.kardex(kdx, maps),
        resumen: tr.resumenDiario(res, maps, itemFilterName),
        top: tr.topConsumidos(top, maps),
        motivos: tr.motivos(mot, maps, itemFilterName),
        movUbi: tr.movPorUbi(mubi, maps),
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo cargar Movimientos", "error");
    }
  };

  const fetchConsumosConFallback = async (qBase) => {
    let dir = await rptConsumosDirectos(qBase);
    if (!dir || dir.length === 0) {
      const qSinUbi = { ...qBase }; delete qSinUbi.idUbicacion;
      dir = await rptConsumosDirectos(qSinUbi);
    }
    return dir;
  };

  const cargarCons = async () => {
    try {
      const qBase = {
        ...(idItem ? { idItem } : {}),
        ...(idUbicacion ? { idUbicacion } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      };
      const [dir, con, top] = await Promise.all([
        fetchConsumosConFallback(qBase),
        rptConsumosConsolidado({ ...(idItem ? { idItem } : {}), ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) }),
        rptTopConsumos({ limit: 20 })
      ]);
      setDataCons({
        directos: dir.map(r => ({
          Fecha: r.fecha,
          Ítem: maps.itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
          Cantidad: firstNonEmpty(r.cantidad, 0),
          Motivo: firstNonEmpty(r.motivo, "—"),
        })),
        consolidado: con.map(r => ({
          Fecha: r.fecha,
          Ítem: maps.itName(r.iditem ?? r.idItem, r.nombre_item ?? r.item),
          Fuente: r.fuente === "CG" ? "Consumo Directo" : "Salida",
          Cantidad: firstNonEmpty(r.cantidad, 0),
          Motivo: firstNonEmpty(r.motivo, "—"),
        })),
        top: tr.topConsumidos(top, maps),
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo cargar Consumos", "error");
    }
  };

  const cargarAsig = async () => {
    try {
      const [iv, pv] = await Promise.all([
        rptAsignacionesItemVehiculo(idItem ? { idItem } : undefined),
        rptInventarioPorVehiculo()
      ]);
      setDataAsig({
        itemVeh: tr.asignacionesItemVeh_grouped(iv, vehMap),
        porVeh: tr.invPorVeh_grouped_from(pv, iv, vehMap),
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo cargar Asignaciones", "error");
    }
  };

  const cargarCalidad = async () => {
    try {
      const [kv, cob, falt, dup] = await Promise.all([
        rptEspecificacionesKV(idItem ? { idItem } : undefined),
        rptEspecificacionesCobertura(),
        rptDatosFaltantes(),
        rptPosiblesDuplicados()
      ]);
      const itemNombreForzado = itemLabel(itemSel) || (idItem ? maps.itName(idItem) : undefined);
      setDataCalidad({
        kv: tr.especificacionesKV(kv, maps, itemNombreForzado),
        cobertura: tr.coberturaEspec(cob),
        faltantes: tr.datosFaltantes(falt, maps),
        duplicados: tr.posiblesDuplicados(dup, maps),
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo cargar Calidad", "error");
    }
  };

  const cargarBajas = async () => {
    try {
      const params = {
        ...(idItem ? { idItem } : {}),
        ...(idUbicacion ? { idUbicacion } : {}),
        ...(desde ? { desde } : {}),
        ...(hasta ? { hasta } : {}),
      };
      const [detalle, resumen, top] = await Promise.all([
        rptBajas(params),
        rptBajasResumen({ desde: params?.desde, hasta: params?.hasta, ...(params?.idItem ? { idItem: params.idItem } : {}) }),
        rptTopBajas({ limit: 20 })
      ]);
      setDataBajas({
        detalle: tr.bajasDetalle(detalle || [], maps),
        resumen: tr.bajasResumen(resumen || [], maps, itemFilterName),
        top: tr.topBajas(top || [], maps),
      });
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo cargar Bajas", "error");
    }
  };

  const cargarPorTab = async (t) => {
    if (t === "stock")   return cargarStock();
    if (t === "mov")     return cargarMov();
    if (t === "cons")    return cargarCons();
    if (t === "asig")    return cargarAsig();
    if (t === "calidad") return cargarCalidad();
    if (t === "bajas")   return cargarBajas();
  };

  // Primera carga cuando catálogos están listos
  useEffect(() => {
    if (catalogsReady) cargarPorTab(tab);
    // eslint-disable-next-line
  }, [catalogsReady, tab]);

  // Re-carga con filtros
  const recargarDebounced = useMemo(() => debounce(() => {
    if (!catalogsReady) return;
    if (tab === "mov")     cargarMov();
    if (tab === "cons")    cargarCons();
    if (tab === "asig")    cargarAsig();
    if (tab === "calidad") cargarCalidad();
    if (tab === "bajas")   cargarBajas();
  }, 350), [tab, tipo, idItem, idUbicacion, desde, hasta, vehMap, catalogsReady, itemFilterName]);

  useEffect(() => {
    recargarDebounced();
    return () => recargarDebounced.cancel();
  }, [tipo, idItem, idUbicacion, desde, hasta, vehMap, itemFilterName, recargarDebounced]);

  /* -------- UI -------- */
  const handleClearFilters = () => {
    setTipo(""); setItemSel(null); setUbiSel(null); setDesde(""); setHasta("");
  };

  const Filtros = (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid item xs={12} sm={3}>
        <Autocomplete
          options={items}
          getOptionLabel={itemLabel}
          isOptionEqualToValue={(opt, val) => itemIdOf(opt) === itemIdOf(val)}
          value={itemSel}
          onChange={(_, v) => setItemSel(v)}
          renderInput={(p) => <TextField {...p} label="Ítem (opcional)" />}
          clearOnEscape
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <Autocomplete
          options={ubis}
          getOptionLabel={ubiLabel}
          isOptionEqualToValue={(opt, val) => ubiIdOf(opt) === ubiIdOf(val)}
          value={ubiSel}
          onChange={(_, v) => setUbiSel(v)}
          renderInput={(p) => <TextField {...p} label="Ubicación (opcional)" />}
          clearOnEscape
        />
      </Grid>
      <Grid item xs={6} sm={3} md={2}>
        <TextField fullWidth type="date" label="Desde" InputLabelProps={{ shrink: true }} value={desde} onChange={(e) => setDesde(e.target.value)} />
      </Grid>
      <Grid item xs={6} sm={3} md={2}>
        <TextField fullWidth type="date" label="Hasta" InputLabelProps={{ shrink: true }} value={hasta} onChange={(e) => setHasta(e.target.value)} />
      </Grid>
      {tab === "mov" && (
        <Grid item xs={12} sm={2}>
          <TextField select fullWidth label="Tipo de movimiento" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPO_OPTIONS.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
          </TextField>
        </Grid>
      )}
      <Grid item xs={12} sm="auto">
        <Button variant="outlined" onClick={handleClearFilters}>Limpiar filtros</Button>
      </Grid>
    </Grid>
  );

  const TabStock = (
    <Box>
      <Box display="flex" gap={1} justifyContent="flex-end" mb={1}>
        <Tooltip title="Recargar"><IconButton onClick={cargarStock}><Refresh /></IconButton></Tooltip>
        <Tooltip title="Exportar PDF: Stock general">
          <IconButton onClick={() => exportPdfAuto({ title: "Stock general", rows: dataStock.stock, filename: "stock.pdf" })}>
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Stock general</Typography>
        <SimpleTable rows={dataStock.stock} />
      </Paper>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Por categoría</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Stock por categoría", rows: dataStock.porCategoria, filename: "stock_por_categoria.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataStock.porCategoria} />
          </Paper>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Agotados / Baja</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Agotados / Baja", rows: dataStock.agotados, filename: "agotados_baja.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataStock.agotados} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Por ubicación</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Stock por ubicación", rows: dataStock.porUbicacion, filename: "stock_por_ubicacion.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataStock.porUbicacion} />
          </Paper>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Bajo stock</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Bajo stock", rows: dataStock.bajo, filename: "bajo_stock.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataStock.bajo} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Por proveedor</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Stock por proveedor", rows: dataStock.porProveedor, filename: "stock_por_proveedor.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataStock.porProveedor} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const TabMov = (
    <Box>
      {Filtros}
      <Box display="flex" gap={1} justifyContent="flex-end" mb={1}>
        <Tooltip title="Recargar"><IconButton onClick={cargarMov}><Refresh /></IconButton></Tooltip>
        <Tooltip title="Exportar PDF: Movimientos (tabla plana)">
          <IconButton onClick={() => exportPdfAuto({ title: "Movimientos (tabla plana)", rows: dataMov.movimientos, filename: "movimientos.pdf", orientation: "landscape" })}>
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      </Box>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>Movimientos (tabla plana)</Typography>
        <SimpleTable rows={dataMov.movimientos} />
      </Paper>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Kárdex</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Kárdex", rows: dataMov.kardex, filename: "kardex.pdf", orientation: "landscape" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataMov.kardex} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Movimientos por ubicación</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Movimientos por ubicación", rows: dataMov.movUbi, filename: "mov_por_ubicacion.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataMov.movUbi} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Resumen diario</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Resumen diario", rows: dataMov.resumen, filename: "resumen_diario.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataMov.resumen} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Motivos</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Motivos de movimiento", rows: dataMov.motivos, filename: "motivos_movimiento.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataMov.motivos} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const TabCons = (
    <Box>
      {Filtros}
      <Box display="flex" gap={1} justifyContent="flex-end" mb={1}>
        <Tooltip title="Recargar"><IconButton onClick={cargarCons}><Refresh /></IconButton></Tooltip>
        <Tooltip title="Exportar PDF: Consumos consolidados">
          <IconButton onClick={() => exportPdfAuto({ title: "Consumos consolidados", rows: dataCons.consolidado, filename: "consumos_consolidado.pdf" })}>
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Consumos directos</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Consumos directos", rows: dataCons.directos, filename: "consumos_directos.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataCons.directos} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Consumos consolidados (Salidas + Directos)</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Consumos consolidados (Salidas + Directos)", rows: dataCons.consolidado, filename: "consumos_consolidados.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataCons.consolidado} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Top consumos (consolidado)</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Top consumos (consolidado)", rows: dataCons.top, filename: "top_consumos_consolidado.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataCons.top} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const TabAsig = (
    <Box>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={items}
            getOptionLabel={itemLabel}
            isOptionEqualToValue={(opt, val) => itemIdOf(opt) === itemIdOf(val)}
            value={itemSel}
            onChange={(_, v) => setItemSel(v)}
            renderInput={(p) => <TextField {...p} label="Ítem (para ver asignaciones)" />}
          />
        </Grid>
      </Grid>
      <Box display="flex" gap={1} justifyContent="flex-end" mb={1}>
        <Tooltip title="Recargar"><IconButton onClick={cargarAsig}><Refresh /></IconButton></Tooltip>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Asignaciones por Ítem → Vehículo</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Asignaciones por Ítem → Vehículo", rows: dataAsig.itemVeh, filename: "asignaciones_item_vehiculo.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataAsig.itemVeh} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Inventario agregado por Vehículo</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Inventario agregado por Vehículo", rows: dataAsig.porVeh, filename: "inventario_por_vehiculo.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataAsig.porVeh} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const TabCalidad = (
    <Box>
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={12} sm={6}>
          <Autocomplete
            options={items}
            getOptionLabel={itemLabel}
            isOptionEqualToValue={(opt, val) => itemIdOf(opt) === itemIdOf(val)}
            value={itemSel}
            onChange={(_, v) => setItemSel(v)}
            renderInput={(p) => <TextField {...p} label="Ítem (para ver especificaciones KV)" />}
          />
        </Grid>
      </Grid>
      <Box display="flex" gap={1} justifyContent="flex-end" mb={1}>
        <Tooltip title="Recargar"><IconButton onClick={cargarCalidad}><Refresh /></IconButton></Tooltip>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Especificaciones (KV)</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Especificaciones (KV)", rows: dataCalidad.kv, filename: "especificaciones_kv.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataCalidad.kv} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Posibles duplicados</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Posibles duplicados", rows: dataCalidad.duplicados, filename: "posibles_duplicados.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataCalidad.duplicados} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Cobertura de especificaciones</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Cobertura de especificaciones", rows: Array.isArray(dataCalidad.cobertura) ? dataCalidad.cobertura : [dataCalidad.cobertura], filename: "cobertura_especificaciones.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={Array.isArray(dataCalidad.cobertura) ? dataCalidad.cobertura : [dataCalidad.cobertura]} />
          </Paper>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Datos faltantes (catálogos)</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Datos faltantes", rows: dataCalidad.faltantes, filename: "datos_faltantes.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataCalidad.faltantes} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const TabBajas = (
    <Box>
      {Filtros}
      <Box display="flex" gap={1} justifyContent="flex-end" mb={1}>
        <Tooltip title="Recargar"><IconButton onClick={cargarBajas}><Refresh /></IconButton></Tooltip>
        <Tooltip title="Exportar PDF: Bajas (detalle)">
          <IconButton onClick={() => exportPdfAuto({ title: "Bajas — Detalle", rows: dataBajas.detalle, filename: "bajas_detalle.pdf", orientation: "landscape" })}>
            <PictureAsPdf />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper sx={{ p:2, mb:2 }}>
        <Typography variant="subtitle1" gutterBottom>Detalle de bajas</Typography>
        <SimpleTable rows={dataBajas.detalle} />
      </Paper>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Resumen diario</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Bajas — Resumen diario", rows: dataBajas.resumen, filename: "bajas_resumen_diario.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataBajas.resumen} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p:2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle1">Top ítems dados de baja</Typography>
              <Tooltip title="PDF"><IconButton onClick={() => exportPdfAuto({ title: "Bajas — Top Ítems", rows: dataBajas.top, filename: "bajas_top_items.pdf" })}><PictureAsPdf/></IconButton></Tooltip>
            </Box>
            <SimpleTable rows={dataBajas.top} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h5">Reportes de Inventario</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => navigate("/inventario")}>Volver a Inventario</Button>
        </Box>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          {TABS.map(t => <Tab key={t.key} value={t.key} label={t.label} />)}
        </Tabs>
      </Paper>

      {tab === "stock"   && <>{TabStock}</>}
      {tab === "mov"     && <>{TabMov}</>}
      {tab === "cons"    && <>{TabCons}</>}
      {tab === "asig"    && <>{TabAsig}</>}
      {tab === "calidad" && <>{TabCalidad}</>}
      {tab === "bajas"   && <>{TabBajas}</>}
    </LayoutDashboard>
  );
}
