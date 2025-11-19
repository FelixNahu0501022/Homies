// src/pages/Inventario/InventarioMovimientosPage.jsx
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Paper, Table, TableBody, TableCell, TableHead,
  TablePagination, TableRow, TextField, Tooltip, Typography, CircularProgress
} from "@mui/material";
import { Add, Refresh } from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import { useNavigate } from "react-router-dom";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarMovimientos,
  crearMovimiento,
  listarItems
} from "../../services/inventario.service";

const TIPO_MOV_OPTIONS = [
  { value: "IN", label: "Entrada" },
  { value: "OUT", label: "Salida" },
];
const tipoMovToLabel = (v) =>
  v === "IN" ? "Entrada" : v === "OUT" ? "Salida" : (v ?? "");

export default function InventarioMovimientosPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [movs, setMovs] = useState([]);
  const [filtered, setFiltered] = useState([]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);

  // Modal nuevo movimiento
  const [openNew, setOpenNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    idItem: null,
    tipo: "IN",
    cantidad: "",
    motivo: ""
  });

  // === Cargar data inicial ===
  const cargarTodo = async () => {
    try {
      setLoading(true);
      const [its, m] = await Promise.all([
        listarItems(),
        listarMovimientos()
      ]);
      setItems(its || []);
      setMovs(m || []);
      setFiltered(m || []);
      setPage(0);
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { cargarTodo(); }, []);

  // === Helpers ===
  const itemNombre = (idItem) =>
    items.find(i => (i.iditem ?? i.idItem) === idItem)?.nombre || "";

  const fmtFecha = (f) => {
    try {
      const d = new Date(f);
      if (Number.isNaN(d.getTime())) return String(f ?? "");
      return d.toLocaleString();
    } catch { return String(f ?? ""); }
  };

  // === Filtro ===
  const applyFilter = useMemo(
    () => debounce((value, source) => {
      const v = (value || "").toLowerCase().trim();
      if (!v) { setFiltered(source); setPage(0); return; }
      const res = (source || []).filter((mv) => {
        const it = items.find(i => (i.iditem ?? i.idItem) === (mv.idItem ?? mv.iditem));
        const nombreItem = it?.nombre || "";
        const fecha = fmtFecha(mv.fecha || mv.createdAt || mv.fechahora);
        const campos = [
          nombreItem,
          tipoMovToLabel(mv.tipo || ""),
          String(mv.cantidad ?? ""),
          mv.motivo ?? "",
          fecha
        ].join(" ").toLowerCase();
        return campos.includes(v);
      });
      setFiltered(res);
      setPage(0);
    }, 300),
    [items]
  );
  useEffect(() => { applyFilter(search, movs); }, [search, movs, applyFilter]);

  // === Crear movimiento ===
  const abrirNuevo = () => {
    setForm({ idItem: null, tipo: "IN", cantidad: "", motivo: "" });
    setOpenNew(true);
  };
  const cerrarNuevo = () => { if (!saving) setOpenNew(false); };

  const onCrear = async () => {
    const idItem = form.idItem?.iditem ?? form.idItem?.idItem ?? form.idItem ?? null;
    const tipo = String(form.tipo || "").toUpperCase();
    const cantidad = Number(form.cantidad);
    const itemSel = items.find(i => (i.iditem ?? i.idItem) === idItem);

    if (!idItem) return Swal.fire("Valida", "Selecciona un ítem", "info");
    if (!["IN", "OUT"].includes(tipo)) return Swal.fire("Valida", "Selecciona el tipo de movimiento", "info");
    if (!Number.isFinite(cantidad) || cantidad <= 0) return Swal.fire("Valida", "Cantidad debe ser mayor a 0", "info");

    // Validar stock en caso de salida
    const stockActual = Number(itemSel?.cantidad ?? 0);
    if (tipo === "OUT" && cantidad > stockActual) {
      return Swal.fire("Stock insuficiente", `Solo hay ${stockActual} unidades disponibles`, "warning");
    }

    const payload = {
      tipo,
      motivo: (form.motivo || "").trim() || null,
      lineas: [{ idItem, cantidad }]
    };

    const confirm = await Swal.fire({
      title: "¿Confirmar movimiento?",
      text: `${tipoMovToLabel(tipo)} de ${cantidad} unidad(es) de ${itemSel?.nombre || "ítem"}.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirmar",
      cancelButtonText: "Cancelar"
    });
    if (!confirm.isConfirmed) return;

    try {
      setSaving(true);
      await crearMovimiento(payload);
      setOpenNew(false);
      await cargarTodo();
      Swal.fire("Éxito", "Movimiento registrado correctamente", "success");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const pageRows = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // === UI ===
  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", height: "60vh" }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h5">Movimientos de Inventario</Typography>
        <Box display="flex" gap={1}>
          <Button variant="outlined" onClick={() => navigate("/inventario")}>
            Volver al inventario
          </Button>
          <Tooltip title="Recargar">
            <IconButton onClick={cargarTodo}><Refresh /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Add />} onClick={abrirNuevo}>
            Nuevo movimiento
          </Button>
        </Box>
      </Box>

      <TextField
        label="Buscar (ítem, tipo, motivo, fecha)"
        fullWidth
        margin="normal"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Paper sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Ítem</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Cantidad</TableCell>
              <TableCell>Motivo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((mv) => {
              const idMov = mv.idMovimiento ?? mv.idmovimiento ?? `${mv.idItem}-${mv.fecha}`;
              const tipo = mv.tipo || "";
              return (
                <TableRow key={idMov} hover>
                  <TableCell>{fmtFecha(mv.fecha || mv.createdAt || mv.fechahora)}</TableCell>
                  <TableCell>{itemNombre(mv.idItem ?? mv.iditem) || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={tipoMovToLabel(tipo)}
                      color={tipo === "IN" ? "success" : "warning"}
                    />
                  </TableCell>
                  <TableCell>{mv.cantidad ?? 0}</TableCell>
                  <TableCell>{mv.motivo || "—"}</TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>Sin resultados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* === Nuevo Movimiento === */}
      <Dialog open={openNew} onClose={cerrarNuevo} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo movimiento</DialogTitle>
        <DialogContent sx={{ pt: 2, display: "grid", gap: 2 }}>
          <Autocomplete
            options={items || []}
            getOptionLabel={(opt) => opt?.nombre || ""}
            value={form.idItem}
            onChange={(_, val) => setForm((s) => ({ ...s, idItem: val }))}
            renderOption={(props, option) => (
              <li {...props} key={option.iditem || option.idItem}>
                {option.nombre} — stock: {option.cantidad ?? 0}
              </li>
            )}
            renderInput={(params) => <TextField {...params} label="Ítem" />}
          />

          {form.idItem && (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Stock actual: <b>{form.idItem?.cantidad ?? 0}</b> unidad(es)
            </Typography>
          )}

          <TextField
            select
            label="Tipo de movimiento"
            value={form.tipo}
            onChange={(e) => setForm((s) => ({ ...s, tipo: e.target.value }))}
            fullWidth
          >
            {TIPO_MOV_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Cantidad"
            type="number"
            inputProps={{ min: 1 }}
            value={form.cantidad}
            onChange={(e) => setForm((s) => ({ ...s, cantidad: e.target.value }))}
            fullWidth
          />

          <TextField
            label="Motivo (opcional)"
            value={form.motivo}
            onChange={(e) => setForm((s) => ({ ...s, motivo: e.target.value }))}
            fullWidth
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarNuevo} disabled={saving}>Cancelar</Button>
          <Button onClick={onCrear} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
