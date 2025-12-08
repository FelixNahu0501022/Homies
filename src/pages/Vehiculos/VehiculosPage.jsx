import {
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Box,
  TextField,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  CircularProgress,
  Grid,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Build,
  Inventory2,
  SwapHoriz,
  Refresh,
} from "@mui/icons-material";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarVehiculos,
  eliminarVehiculo,
  cambiarEstadoVehiculo,
} from "../../services/vehiculos.service";
import VehiculoCrearPage from "./VehiculoCrearPage";
import VehiculoEditarPage from "./VehiculoEditarPage";
import { resolveFileUrl } from "../../utils/files";

const ESTADOS = ["Operativo", "Fuera de servicio", "En emergencia"];

const estadoColor = (estado) => {
  if (estado === "Operativo") return "success";
  if (estado === "Fuera de servicio") return "warning";
  if (estado === "En emergencia") return "error";
  return "default";
};

export default function VehiculosPage() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [vehiculoMenu, setVehiculoMenu] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:600px)");

  const cargar = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarVehiculos();
      setRows(data || []);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar vehículos";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const debouncedFilter = useMemo(() => debounce((texto, estadoSel, source) => {
    const q = (texto || "").toLowerCase().trim();
    let base = source.filter((x) => (estadoSel ? x.estado === estadoSel : true));
    if (q) {
      base = base.filter((x) =>
        `${x.placa ?? ""}`.toLowerCase().includes(q) ||
        `${x.marca ?? ""} ${x.modelo ?? ""}`.toLowerCase().includes(q) ||
        `${x.tipo ?? ""}`.toLowerCase().includes(q) ||
        `${x.nominacion ?? ""}`.toLowerCase().includes(q)
      );
    }
    setFiltered(base);
    setPage(1);
  }, 300), []);

  useEffect(() => { debouncedFilter(search, estado, rows); }, [search, estado, rows, debouncedFilter]);

  const openEstadoMenu = (event, v) => { setAnchorEl(event.currentTarget); setVehiculoMenu(v); };
  const closeEstadoMenu = () => { setAnchorEl(null); setVehiculoMenu(null); };

  const onCambiarEstado = async (nuevoEstado) => {
    if (!vehiculoMenu) return;
    try {
      setWorkingId(vehiculoMenu.idvehiculo);
      await cambiarEstadoVehiculo(vehiculoMenu.idvehiculo, nuevoEstado);
      await cargar();
      setSnack({ open: true, message: `Estado cambiado a ${nuevoEstado}`, severity: "success" });
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    } finally {
      setWorkingId(null);
      closeEstadoMenu();
    }
  };

  const onDelete = async (v) => {
    const confirm = await Swal.fire({
      title: `¿Eliminar vehículo ${v.placa}?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;
    try {
      setWorkingId(v.idvehiculo);
      await eliminarVehiculo(v.idvehiculo);
      await cargar();
      setSnack({ open: true, message: "Vehículo eliminado", severity: "success" });
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    } finally {
      setWorkingId(null);
    }
  };

  const fotoUrl = (v) => resolveFileUrl(v.foto);
  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const pageItems = filtered.slice((page - 1) * limit, page * limit);

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Vehículos</Typography>
          <Typography variant="body2" color="text.secondary">Gestión de vehículos operativos y su estado actual</Typography>
        </Box>
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Button variant="outlined" startIcon={<Refresh />} onClick={cargar} disabled={loading}>{loading ? "Actualizando..." : "Actualizar"}</Button>
          <Button variant="outlined" onClick={() => navigate("/vehiculos/reportes")}>Reportes</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>Nuevo</Button>
        </Box>
      </Box>

      {/* Filtros */}
      <Paper sx={{ mt: 2, p: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField label="Buscar (placa, marca, tipo o nominación)" fullWidth onChange={(e) => setSearch(e.target.value)} placeholder="Ej: ABC-123, Toyota, Autobomba..." />
          <TextField label="Estado" select value={estado} onChange={(e) => setEstado(e.target.value)} sx={{ minWidth: 220 }}>
            <MenuItem value="">(Todos)</MenuItem>
            {ESTADOS.map((e) => (<MenuItem key={e} value={e}>{e}</MenuItem>))}
          </TextField>
          <Button variant="text" onClick={() => { setSearch(""); setEstado(""); }}>Limpiar</Button>
        </Stack>
      </Paper>

      {/* Listado */}
      <Paper sx={{ mt: 2, p: 2, minHeight: 200 }}>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>Sin resultados</Box>
        ) : (
          <>
            <Grid container spacing={2}>
              {pageItems.map((v) => (
                <Grid key={v.idvehiculo} item xs={12} sm={6} md={4} lg={3}>
                  <Paper elevation={3} sx={{ p: 2, borderRadius: 3, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <Box sx={{ textAlign: "center" }}>
                      <Avatar src={fotoUrl(v)} alt={v.placa} sx={{ width: 90, height: 90, mx: "auto", mb: 1 }} imgProps={{ onError: (e) => { e.currentTarget.src = ""; } }}>
                        {(v.placa?.[0] || v.marca?.[0] || "?").toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight={700}>{v.placa}</Typography>
                      <Typography variant="body2" color="text.secondary">{v.marca} {v.modelo}</Typography>
                      <Typography variant="body2" color="text.secondary">{v.tipo || "—"}</Typography>
                      <Typography variant="body2" color="text.secondary">{v.nominacion || "—"}</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip label={v.estado || "—"} color={estadoColor(v.estado)} icon={<SwapHoriz fontSize="small" />} variant="outlined" onClick={(e) => openEstadoMenu(e, v)} disabled={workingId === v.idvehiculo} />
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
                      <Box>
                        <Tooltip title="Mantenimientos"><span><IconButton onClick={() => navigate(`/vehiculos/${v.idvehiculo}/mantenimientos`)} disabled={workingId === v.idvehiculo}><Build /></IconButton></span></Tooltip>
                        <Tooltip title="Inventario asignado"><span><IconButton onClick={() => navigate(`/vehiculos/${v.idvehiculo}/inventario`)} disabled={workingId === v.idvehiculo}><Inventory2 /></IconButton></span></Tooltip>
                      </Box>
                      <Box>
                        <Tooltip title="Editar"><span><IconButton color="primary" onClick={() => { setEditId(v.idvehiculo); setOpenEdit(true); }} disabled={workingId === v.idvehiculo}><Edit /></IconButton></span></Tooltip>
                        <Tooltip title="Eliminar"><span><IconButton color="error" onClick={() => onDelete(v)} disabled={workingId === v.idvehiculo}><Delete /></IconButton></span></Tooltip>
                      </Box>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box mt={2} display="flex" justifyContent="center" pb={1}><Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} /></Box>
          </>
        )}
      </Paper>

      {/* Modal Crear */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullScreen={isSmall} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Vehículo</DialogTitle>
        <DialogContent dividers>
          <VehiculoCrearPage onSuccess={async () => { setOpenCreate(false); await cargar(); setSnack({ open: true, message: "Vehículo creado", severity: "success" }); }} />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenCreate(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* Modal Editar */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullScreen={isSmall} maxWidth="md" fullWidth>
        <DialogTitle>Editar Vehículo</DialogTitle>
        <DialogContent dividers>{editId && <VehiculoEditarPage id={editId} onSuccess={async () => { setOpenEdit(false); setEditId(null); await cargar(); setSnack({ open: true, message: "Cambios guardados", severity: "success" }); }} />}</DialogContent>
        <DialogActions><Button onClick={() => setOpenEdit(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      {/* Menú cambio estado */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeEstadoMenu}>
        {ESTADOS.map((e) => (<MenuItem key={e} selected={vehiculoMenu?.estado === e} onClick={() => onCambiarEstado(e)} disabled={workingId === vehiculoMenu?.idvehiculo}>{e}</MenuItem>))}
      </Menu>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert severity={snack.severity} variant="filled" sx={{ width: "100%" }}>{snack.message}</Alert>
      </Snackbar>
    </LayoutDashboard>
  );
}