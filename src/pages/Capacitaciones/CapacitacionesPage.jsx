import * as React from "react";
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Button,
  Box,
  TextField,
  Chip,
  TablePagination,
  Stack,
  TableContainer,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  useMediaQuery,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Description,
  People,
  School,
  Business,
  Visibility,
  PictureAsPdf,
  Assessment,
  Refresh,
  Close,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarCapacitaciones,
  eliminarCapacitacion,
  obtenerCapacitacion,
} from "../../services/capacitaciones.service";
import { resolveFileUrl } from "../../utils/files";
import CapacitacionCrearPage from "./CapacitacionCrearPage";
import CapacitacionEditarPage from "./CapacitacionEditarPage";

/* ---------- Helpers ---------- */
const toArray = (x) => {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.data)) return x.data;
  if (x && Array.isArray(x.rows)) return x.rows;
  if (x && Array.isArray(x.results)) return x.results;
  if (x && Array.isArray(x.items)) return x.items;
  return [];
};
const getId = (c) => c.idcapacitacion ?? c.idCapacitacion ?? c.id;
const fmtFecha = (f) => (f ? String(f).slice(0, 10) : "—");
function deriveTitulo(c) {
  const cursoNom = c.curso_nombre ?? c.cursoNombre;
  const cursoVer = c.curso_version ?? c.cursoVersion;
  const custom = c.titulopersonalizado ?? c.tituloPersonalizado;
  if (cursoNom) {
    const base = cursoVer ? `${cursoNom} (v${cursoVer})` : cursoNom;
    return custom ? `${base} — ${custom}` : base;
  }
  if (custom) return custom;
  if (c.titulo) return c.titulo;
  if (c.idcurso ?? c.idCurso) return `Curso #${c.idcurso ?? c.idCurso}`;
  return "—";
}
function deriveTemas(c) {
  const arr = c.temas_nombres ?? c.temasNombres ?? c.temas;
  if (Array.isArray(arr) && arr.length) return arr.map(String);
  if (typeof c.tema === "string" && c.tema.trim()) return [c.tema.trim()];
  return [];
}

/* ---------- Página principal ---------- */
export default function CapacitacionesPage() {
  const navigate = useNavigate();
  const fullScreen = useMediaQuery("(max-width: 768px)");

  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [modo, setModo] = useState(null); // "crear" | "editar"
  const [capacitacionActual, setCapacitacionActual] = useState(null);

  /* ---------- Carga ---------- */
  const cargar = async (showSnack = true) => {
    try {
      setLoading(true);
      const data = await listarCapacitaciones();
      const arr = toArray(data);
      setRows(arr);
      setFiltered(arr);
      setPage(0);
      if (showSnack)
        setSnack({
          open: true,
          message: "Capacitaciones actualizadas",
          severity: "success",
        });
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.message ||
        "No se pudo cargar capacitaciones";
      Swal.fire("Error", msg, "error");
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar(false);
  }, []);

  /* ---------- Filtro ---------- */
  const applyFilter = useMemo(
    () =>
      debounce((value, source) => {
        const src = toArray(source);
        const v = (value || "").toLowerCase().trim();
        if (!v) {
          setFiltered(src);
          setPage(0);
          return;
        }
        const res = src.filter((c) => {
          const titulo = deriveTitulo(c).toLowerCase();
          const temas = deriveTemas(c).join(" ").toLowerCase();
          const resp = String(
            c.nombreusuario ?? c.nombreUsuario ?? ""
          ).toLowerCase();
          const fechas = [
            fmtFecha(c.fecha),
            fmtFecha(c.fechasolicitud),
            fmtFecha(c.fechainicio),
            fmtFecha(c.fechafin),
          ].join(" ");
          return (
            titulo.includes(v) ||
            temas.includes(v) ||
            resp.includes(v) ||
            fechas.includes(v)
          );
        });
        setFiltered(res);
        setPage(0);
      }, 250),
    []
  );

  useEffect(() => {
    applyFilter(search, rows);
  }, [search, rows, applyFilter]);

  /* ---------- Acciones ---------- */
  const onDelete = async (c) => {
    const title = deriveTitulo(c);
    const confirm = await Swal.fire({
      title: `¿Eliminar capacitación "${title}"?`,
      text: "Se eliminarán sus relaciones (contenidos, asignaciones).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await eliminarCapacitacion(getId(c));
      await cargar(false);
      setSnack({
        open: true,
        message: "Capacitación eliminada",
        severity: "success",
      });
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje || err?.message || "No se pudo eliminar";
      Swal.fire("Error", msg, "error");
      setSnack({ open: true, message: msg, severity: "error" });
    }
  };

  const handleEditar = async (id) => {
    try {
      setLoading(true);
      const data = await obtenerCapacitacion(id);
      if (!data || !(data.idcapacitacion || data.idCapacitacion)) {
        Swal.fire("Aviso", "No se encontró la capacitación", "warning");
        return;
      }
      setCapacitacionActual(data);
      setModo("editar");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message;
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const cerrarModal = (recargar = false) => {
    const debeRecargar = recargar || modo === "crear" || modo === "editar";
    setModo(null);
    setCapacitacionActual(null);
    if (debeRecargar) {
      setTimeout(() => {
        cargar(false);
      }, 400);
    }
  };

  /* ---------- Paginación ---------- */
  const list = toArray(filtered);
  const start = page * rowsPerPage;
  const end = start + rowsPerPage;
  const pageItems = list.slice(start, end);

  /* ---------- Render ---------- */
  return (
    <LayoutDashboard>
      {/* Header */}
      <Box mb={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Capacitaciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de cursos, participantes e instituciones
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => navigate("/capacitaciones/reportes")}
          >
            Reportes
          </Button>
          <Button component={RouterLink} to="/capacitaciones/plantillas" variant="outlined">
            Plantillas
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setModo("crear")}>
            Nueva
          </Button>
          <Tooltip title="Refrescar">
            <span>
              <IconButton onClick={() => cargar()} disabled={loading}>
                <Refresh />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Box>

      {/* Buscador */}
      <Box sx={{ mb: 1 }}>
        <TextField
          label="Buscar…"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="curso, tema, responsable o fecha"
          sx={{ width: { xs: "100%", sm: 360 } }}
        />
      </Box>

      {/* Tabla */}
      <Paper sx={{ mt: 1, borderRadius: 3, overflow: "hidden", width: "100%" }} elevation={3}>
        {loading && list.length === 0 ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Curso / Título</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Temas</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Solicitud</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Inicio</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Fin</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Solicitante</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Documento</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pageItems.map((c) => {
                  const id = getId(c);
                  const titulo = deriveTitulo(c);
                  const temas = deriveTemas(c);
                  const doc = c.documentosolicitud ?? c.documentoSolicitud ?? null;

                  return (
                    <TableRow key={id} hover>
                      <TableCell>{titulo}</TableCell>
                      <TableCell>
                        {temas.length ? (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {temas.slice(0, 4).map((t, i) => (
                              <Chip key={`${id}-tema-${i}`} label={t} size="small" />
                            ))}
                          </Box>
                        ) : (
                          <Chip label="—" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={fmtFecha(c.fechasolicitud || c.fecha)} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={fmtFecha(c.fechainicio)} />
                      </TableCell>
                      <TableCell>
                        <Chip size="small" label={fmtFecha(c.fechafin)} />
                      </TableCell>
                      <TableCell>{c.nombreusuario ?? c.nombreUsuario ?? "—"}</TableCell>
                      <TableCell>
                        <Tooltip title={doc ? "Ver documento de solicitud" : "Sin documento"}>
                          <span>
                            <IconButton
                              color="secondary"
                              disabled={!doc}
                              onClick={() => doc && window.open(resolveFileUrl(doc), "_blank")}
                            >
                              <Visibility />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Contenidos">
                          <IconButton onClick={() => navigate(`/capacitaciones/${id}/contenidos`)}>
                            <Description />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Participantes (Personal)">
                          <IconButton onClick={() => navigate(`/capacitaciones/${id}/personal`)}>
                            <People />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Personas externas">
                          <IconButton onClick={() => navigate(`/capacitaciones/${id}/personas`)}>
                            <School />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Instituciones">
                          <IconButton onClick={() => navigate(`/capacitaciones/${id}/instituciones`)}>
                            <Business />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Certificados">
                          <IconButton onClick={() => navigate(`/capacitaciones/${id}/certificados`)}>
                            <PictureAsPdf />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton color="primary" onClick={() => handleEditar(id)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar">
                          <IconButton color="error" onClick={() => onDelete(c)}>
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {list.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Box py={4} textAlign="center" color="text.secondary">
                        No hay capacitaciones para mostrar.
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={list.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* MODAL Crear / Editar */}
      <Dialog
        open={!!modo}
        onClose={() => cerrarModal(false)}
        fullScreen={fullScreen}
        keepMounted
        sx={{
          "& .MuiDialog-container": {
            alignItems: "flex-start",
            justifyContent: "center",
            mt: { sm: 8 },
          },
        }}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "85%", md: "75%", lg: "70%" },
            maxWidth: "1200px",
            maxHeight: "90vh",
            borderRadius: { xs: 0, sm: 3 },
            overflow: "hidden",
            ml: { sm: 7 },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pr: 1,
          }}
        >
          {modo === "crear" ? "Nueva Capacitación" : "Editar Capacitación"}
          <IconButton onClick={() => cerrarModal(false)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent dividers sx={{ p: 2, bgcolor: "background.default" }}>
          <Box sx={{ overflow: "auto", maxHeight: "70vh" }}>
            {modo === "crear" && <CapacitacionCrearPage onFinish={() => cerrarModal(true)} />}
            {modo === "editar" && capacitacionActual && (
              <CapacitacionEditarPage
                idCapacitacion={getId(capacitacionActual)}
                onFinish={() => cerrarModal(true)}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1 }}>
          <Button onClick={() => cerrarModal(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </LayoutDashboard>
  );
}
