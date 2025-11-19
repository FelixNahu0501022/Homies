// src/pages/Inventario/InventarioPage.jsx
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip, Button, Box, TextField, Chip, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, InputAdornment
} from "@mui/material";
import {
  Add, Edit, Delete, LocalShipping, ListAlt, Info, Assessment, PictureAsPdf,
  RemoveCircleOutline, HelpOutline
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarItems, eliminarItem, registrarConsumo,
  listarCategorias, listarUnidades, listarUbicaciones, listarProveedores,
  darDeBaja
} from "../../services/inventario.service";
import { exportTablePdf } from "../../utils/pdfExport";

export default function InventarioPage() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [cats, setCats] = useState([]);
  const [unis, setUnis] = useState([]);
  const [ubis, setUbis] = useState([]);
  const [provs, setProvs] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Consumo
  const [openConsumo, setOpenConsumo] = useState(false);
  const [itemSel, setItemSel] = useState(null);
  const [consumo, setConsumo] = useState({ cantidad: "", motivo: "" });
  const [savingConsumo, setSavingConsumo] = useState(false);

  // Baja parcial
  const [openBaja, setOpenBaja] = useState(false);
  const [baja, setBaja] = useState({ cantidad: "", motivo: "BAJA", srcUbicacion: "" });
  const [savingBaja, setSavingBaja] = useState(false);

  // Especificaciones
  const [openSpecs, setOpenSpecs] = useState(false);
  const [specsItem, setSpecsItem] = useState(null);
  const [specsKV, setSpecsKV] = useState([]);

  const navigate = useNavigate();

  // === CARGAR INVENTARIO ===
  const cargar = async () => {
    try {
      const [data, c, u, b, p] = await Promise.all([
        listarItems(),
        listarCategorias(),
        listarUnidades(),
        listarUbicaciones(),
        listarProveedores(),
      ]);
      setRows(data || []);
      setFiltered(data || []);
      setCats(c || []); setUnis(u || []); setUbis(b || []); setProvs(p || []);
      setPage(0);
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };
  useEffect(() => { cargar(); }, []);

  // === FUNCIONES AUX ===
  const getNombre = (arr, id, k = "id") => {
    if (!id) return "";
    const found = arr.find(x =>
      (x[k] ?? x[k?.toLowerCase?.()] ?? x[`id${k.replace(/^id/i, "")}`] ?? x[`id${k}`]) === id ||
      (x[k] ?? x[k?.toLowerCase?.()]) === Number(id)
    );
    return found?.nombre || "";
  };
  const nombreCategoria = (it) => getNombre(cats, it.idCategoria ?? it.idcategoria, "idCategoria");
  const nombreUnidad = (it) => getNombre(unis, it.idUnidad ?? it.idunidad, "idUnidad");
  const nombreUbicacion = (it) => getNombre(ubis, it.idUbicacion ?? it.idubicacion, "idUbicacion");
  const nombreProveedor = (it) => getNombre(provs, it.idProveedor ?? it.idproveedor, "idProveedor");

  // === FILTRO ===
  const applyFilter = useMemo(() => debounce((value, source) => {
    const v = (value || "").toLowerCase().trim();
    if (!v) { setFiltered(source); setPage(0); return; }
    setFiltered(
      source.filter((r) =>
        `${r.nombre ?? ""}`.toLowerCase().includes(v) ||
        `${r.descripcion ?? ""}`.toLowerCase().includes(v) ||
        `${r.estado ?? ""}`.toLowerCase().includes(v) ||
        `${nombreCategoria(r)}`.toLowerCase().includes(v) ||
        `${nombreUnidad(r)}`.toLowerCase().includes(v) ||
        `${nombreUbicacion(r)}`.toLowerCase().includes(v) ||
        `${nombreProveedor(r)}`.toLowerCase().includes(v)
      )
    );
    setPage(0);
  }, 300), [cats, unis, ubis, provs]);
  useEffect(() => { applyFilter(search, rows); }, [search, rows, applyFilter]);

  const cantidadChipColor = (it) => {
    const c = Number(it.cantidad ?? 0);
    if (c <= 0) return "error";
    if (c <= 3) return "warning";
    return "success";
  };

  const pageItems = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // === PARSER DE ESPECIFICACIONES ===
  const toKeyValues = (specs) => {
    if (!specs) return [];
    let obj = specs;
    try {
      if (typeof specs === "string") obj = JSON.parse(specs);
    } catch {
      obj = specs;
    }
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.entries(obj).map(([k, v]) => ({
        k,
        v: v == null ? "—" : Array.isArray(v) ? v.join(", ") : String(v),
      }));
    }
    return [{ k: "valor", v: String(obj) }];
  };

  // === EXPORTAR PDF ===
  const exportInventarioPdf = () => {
    if (!filtered || filtered.length === 0) return Swal.fire("Aviso", "No hay datos para exportar", "info");
    const rowsPdf = filtered.map(it => ({
      Nombre: it.nombre ?? "",
      Descripción: it.descripcion ?? "",
      Categoría: nombreCategoria(it) || "—",
      Unidad: nombreUnidad(it) || "—",
      Ubicación: nombreUbicacion(it) || "—",
      Proveedor: nombreProveedor(it) || "—",
      Cantidad: it.cantidad ?? 0,
      Estado: it.estado || "—",
    }));
    const columns = Object.keys(rowsPdf[0]).map(k => ({ header: k, dataKey: k }));
    exportTablePdf({
      title: "Inventario — Listado",
      subtitle: `Total ítems: ${rowsPdf.length}`,
      columns,
      rows: rowsPdf,
      filename: "inventario_listado.pdf",
      orientation: "landscape",
    });
  };

  // === CONSUMO ===
  const abrirConsumo = (it) => { setItemSel(it); setConsumo({ cantidad: "", motivo: "" }); setOpenConsumo(true); };
  const cerrarConsumo = () => setOpenConsumo(false);

  const confirmarConsumo = async () => {
    const cant = Number(consumo.cantidad);
    if (!itemSel?.iditem && !itemSel?.idItem) return;
    if (!cant || cant <= 0) return Swal.fire("Valida", "Cantidad inválida", "info");
    try {
      setSavingConsumo(true);
      await registrarConsumo({ idItem: itemSel.iditem || itemSel.idItem, cantidad: cant, motivo: consumo.motivo || undefined });
      setSavingConsumo(false);
      setOpenConsumo(false);
      await cargar();
      Swal.fire("Éxito", "Consumo registrado", "success");
    } catch (err) {
      setSavingConsumo(false);
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };

  // === ESPECIFICACIONES ===
  const abrirSpecs = (it) => {
    setSpecsItem(it);
    const kv = toKeyValues(it.especificaciones);
    setSpecsKV(kv);
    setOpenSpecs(true);
  };
  const cerrarSpecs = () => setOpenSpecs(false);

  // === BAJA PARCIAL ===
  const abrirBaja = (it) => {
    setItemSel(it);
    setBaja({
      cantidad: "",
      motivo: "BAJA",
      srcUbicacion: it?.idubicacion || it?.idUbicacion || "",
    });
    setOpenBaja(true);
  };
  const cerrarBaja = () => setOpenBaja(false);

  const confirmarBaja = async () => {
    if (!itemSel?.iditem && !itemSel?.idItem) return;
    const cant = Number(baja.cantidad);
    if (!cant || cant <= 0) return Swal.fire("Valida", "Cantidad inválida", "info");

    try {
      setSavingBaja(true);
      await darDeBaja({
        idItem: itemSel.iditem || itemSel.idItem,
        cantidad: cant,
        motivo: baja.motivo || "BAJA",
        srcUbicacion: baja.srcUbicacion || undefined,
      });
      setSavingBaja(false);
      setOpenBaja(false);
      await cargar();
      Swal.fire("Éxito", "Baja registrada correctamente", "success");
    } catch (err) {
      setSavingBaja(false);
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };

  const stockDisponible = Number(itemSel?.cantidad ?? 0);
  const cantidadBaja = Number(baja.cantidad || 0);
  const stockResultante = isFinite(stockDisponible - cantidadBaja)
    ? (stockDisponible - cantidadBaja)
    : stockDisponible;

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Inventario</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" startIcon={<Assessment />} onClick={() => navigate("/inventario/reportes")}>Reportes</Button>
          <Button variant="outlined" startIcon={<PictureAsPdf />} onClick={exportInventarioPdf}>Exportar PDF</Button>
          <Button variant="outlined" onClick={() => navigate("/inventario/movimientos")}>Movimientos</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/inventario/crear")}>Nuevo ítem</Button>
        </Box>
      </Box>

      <TextField
        label="Buscar (nombre, descripción, estado, catálogos)"
        fullWidth
        margin="normal"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Unidad</TableCell>
              <TableCell>Ubicación</TableCell>
              <TableCell>Proveedor</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map((it) => (
              <TableRow key={it.iditem || it.idItem} hover>
                <TableCell><strong>{it.nombre}</strong></TableCell>
                <TableCell>{it.descripcion || "—"}</TableCell>
                <TableCell>{nombreCategoria(it) || "—"}</TableCell>
                <TableCell>{nombreUnidad(it) || "—"}</TableCell>
                <TableCell>{nombreUbicacion(it) || "—"}</TableCell>
                <TableCell>{nombreProveedor(it) || "—"}</TableCell>
                <TableCell>
                  <Chip size="small" color={cantidadChipColor(it)} label={it.cantidad ?? 0} />
                </TableCell>
                <TableCell><Chip size="small" label={it.estado || "—"} /></TableCell>
                <TableCell align="right">
                  <Tooltip title="Ver especificaciones"><IconButton onClick={() => abrirSpecs(it)}><Info /></IconButton></Tooltip>
                  <Tooltip title="Asignar a vehículos">
                    <IconButton onClick={() => navigate(`/inventario/${it.iditem || it.idItem}/asignaciones`)}><LocalShipping /></IconButton>
                  </Tooltip>
                  <Tooltip title="Consumo general"><IconButton onClick={() => abrirConsumo(it)}><ListAlt /></IconButton></Tooltip>
                  <Tooltip title="Dar de baja (parcial)"><IconButton color="warning" onClick={() => abrirBaja(it)}><RemoveCircleOutline /></IconButton></Tooltip>
                  <Tooltip title="Editar"><IconButton color="primary" onClick={() => navigate(`/inventario/editar/${it.iditem || it.idItem}`)}><Edit /></IconButton></Tooltip>
                  <Tooltip title="Eliminar"><IconButton color="error" onClick={() => eliminarItem(it.iditem || it.idItem).then(cargar)}><Delete /></IconButton></Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (<TableRow><TableCell colSpan={9}>Sin resultados</TableCell></TableRow>)}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* === Consumo === */}
      <Dialog open={openConsumo} onClose={cerrarConsumo} fullWidth maxWidth="sm">
        <DialogTitle>Registrar consumo — {itemSel?.nombre}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
          <TextField label="Cantidad" type="number" inputProps={{ min: 1 }}
            value={consumo.cantidad} onChange={(e) => setConsumo(s => ({ ...s, cantidad: e.target.value }))} />
          <TextField label="Motivo (opcional)" multiline minRows={2}
            value={consumo.motivo} onChange={(e) => setConsumo(s => ({ ...s, motivo: e.target.value }))} />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarConsumo}>Cancelar</Button>
          <Button onClick={confirmarConsumo} variant="contained" disabled={savingConsumo}>
            {savingConsumo ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* === Baja parcial === */}
      <Dialog open={openBaja} onClose={cerrarBaja} fullWidth maxWidth="sm">
        <DialogTitle>Dar de baja — {itemSel?.nombre}</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField label="Stock disponible" value={stockDisponible} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
            <TextField label="Stock tras la baja" value={stockResultante} InputProps={{ readOnly: true }} sx={{ flex: 1 }} />
          </Box>
          <TextField label="Cantidad a dar de baja" type="number" inputProps={{ min: 1 }}
            value={baja.cantidad} onChange={(e) => setBaja(s => ({ ...s, cantidad: e.target.value }))} required
            helperText="No elimina el ítem, solo descuenta del stock." />
          <TextField label="Motivo" value={baja.motivo} onChange={(e) => setBaja(s => ({ ...s, motivo: e.target.value }))}
            helperText="Ejemplo: BAJA, DAÑO, PÉRDIDA, VENCIMIENTO"
            InputProps={{ endAdornment: (<InputAdornment position="end"><Tooltip title="El motivo queda en el historial de movimientos"><HelpOutline fontSize="small" /></Tooltip></InputAdornment>) }} />
          <TextField label="Ubicación (origen)"
            value={baja.srcUbicacion ? `${getNombre(ubis, Number(baja.srcUbicacion), "idUbicacion")} (ID: ${baja.srcUbicacion})` : "—"}
            InputProps={{ readOnly: true }} helperText="Se toma automáticamente la ubicación actual del ítem." />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarBaja}>Cancelar</Button>
          <Button onClick={confirmarBaja} variant="contained" disabled={savingBaja}>
            {savingBaja ? "Guardando..." : "Dar de baja"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* === Especificaciones === */}
      <Dialog open={openSpecs} onClose={cerrarSpecs} fullWidth maxWidth="sm">
        <DialogTitle>Especificaciones — {specsItem?.nombre}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 1 }}>
          {(!specsKV || specsKV.length === 0)
            ? <Typography variant="body2">Sin especificaciones</Typography>
            : specsKV.map(({ k, v }) => (
                <Box key={k} sx={{ display: "flex", gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 180 }}>{k}:</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{v}</Typography>
                </Box>
              ))
          }
        </DialogContent>
        <DialogActions><Button onClick={cerrarSpecs}>Cerrar</Button></DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
