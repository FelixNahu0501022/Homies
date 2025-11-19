// src/pages/Credenciales/CredencialesPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Box,
  LinearProgress,
  TableContainer,
  Skeleton,
  Pagination,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slide,
} from "@mui/material";
import {
  Refresh,
  Add,
  CheckCircleOutline,
  Block,
  GppBad,
  PictureAsPdf,
  Delete,
  Assessment,
  Search,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarCredenciales,
  actualizarEstadoCredencial,
  eliminarCredencial,
} from "../../services/credenciales.service";
import { resolveFileUrl } from "../../utils/files";
import Swal from "sweetalert2";
import ReportesCredencialesDialog from "./ReportesCredencialesDialog";
import CredencialCrearPage from "./CredencialCrearPage";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const estadoColor = (e) => {
  switch (e) {
    case "vigente":
      return "success";
    case "emitida":
      return "info";
    case "vencida":
      return "default";
    case "suspendida":
      return "warning";
    case "revocada":
      return "error";
    default:
      return "default";
  }
};

function formatISO(dateLike) {
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

export default function CredencialesPage() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [search, setSearch] = useState("");
  const [openReportes, setOpenReportes] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);

  // paginación client-side
  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  async function load() {
    try {
      setLoading(true);
      const data = await listarCredenciales();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    return (rows || []).filter((r) => {
      const okEstado = !filtroEstado || r.estado_publico === filtroEstado;
      const tokens = [
        r.numero,
        r.codigoqr,
        r?.personal?.nombre,
        r?.personal?.apellido,
        r?.personal?.ci,
        r?.personal?.grado_nombre,
        r?.personal?.clase_etiqueta,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");
      const okSearch = !q || tokens.includes(q);
      return okEstado && okSearch;
    });
  }, [rows, filtroEstado, search]);

  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page]);

  async function cambiarEstado(idcredencial, estado) {
    try {
      const { isConfirmed } = await Swal.fire({
        title: "¿Confirmar?",
        text: `Cambiar estado a "${estado}"`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await actualizarEstadoCredencial(idcredencial, estado);
      await load();
      Swal.fire("Listo", "Estado actualizado", "success");
    } catch (e) {
      Swal.fire("Error", e?.message || "No se pudo actualizar el estado", "error");
    }
  }

  function verPdf(cred) {
    const url = resolveFileUrl(`/uploads/credenciales/pdf/credencial-${cred.idcredencial}.pdf`);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function eliminar(cred) {
    try {
      const { isConfirmed } = await Swal.fire({
        title: "¿Eliminar credencial?",
        html: `<div style="text-align:left">Se realizará <b>soft-delete</b> (no se pierde historial ni archivos).<br/>Persona: <b>${cred?.personal?.nombre || ""} ${cred?.personal?.apellido || ""}</b><br/>Número: <b>${cred?.numero || "—"}</b></div>`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
      });
      if (!isConfirmed) return;

      await eliminarCredencial(cred.idcredencial);
      await load();
      Swal.fire("Listo", "Credencial eliminada", "success");
    } catch (e) {
      Swal.fire("Error", e?.message || "No se pudo eliminar la credencial", "error");
    }
  }

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Gestión de Credenciales
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Administra las credenciales del personal y sus estados
          </Typography>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Assessment />}
            onClick={() => setOpenReportes(true)}
          >
            Reportes
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCrear(true)}
          >
            Nueva
          </Button>
        </Box>
      </Box>

      {/* Filtros y búsqueda */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ mb: 2 }}
        alignItems={{ xs: "stretch", md: "center" }}
      >
        <TextField
          variant="outlined"
          placeholder="Buscar por número, CI, nombre..."
          fullWidth
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          size="small"
          select
          label="Estado"
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">Todos</MenuItem>
          <MenuItem value="vigente">Vigente</MenuItem>
          <MenuItem value="emitida">Emitida</MenuItem>
          <MenuItem value="vencida">Vencida</MenuItem>
          <MenuItem value="suspendida">Suspendida</MenuItem>
          <MenuItem value="revocada">Revocada</MenuItem>
        </TextField>

        <Tooltip title="Actualizar">
          <span>
            <IconButton onClick={load} disabled={loading}>
              <Refresh />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>

      {/* Tabla principal */}
      <Paper
        sx={{
          width: "100%",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        {loading && <LinearProgress />}

        <TableContainer sx={{ maxHeight: { xs: 420, sm: 520, md: 620 } }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Personal</TableCell>
                <TableCell>CI</TableCell>
                <TableCell>Grado / Clase</TableCell>
                <TableCell>Número</TableCell>
                <TableCell>Emisión</TableCell>
                <TableCell>Vigencia</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton width={j === 1 ? 120 : 60} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : paginated.map((r) => (
                    <TableRow key={r.idcredencial} hover>
                      <TableCell>{r.idcredencial}</TableCell>
                      <TableCell>
                        {r.personal?.nombre} {r.personal?.apellido}
                      </TableCell>
                      <TableCell>{r.personal?.ci || "—"}</TableCell>
                      <TableCell>
                        {r.personal?.grado_nombre || "—"} / {r.personal?.clase_etiqueta || "—"}
                      </TableCell>
                      <TableCell>{r.numero || "—"}</TableCell>
                      <TableCell>{formatISO(r.fechaemision)}</TableCell>
                      <TableCell>
                        {r.fecha_inicio_vigencia} → {r.fecha_fin_vigencia}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={r.estado_publico}
                          color={estadoColor(r.estado_publico)}
                          size="small"
                          sx={{
                            color: "#fff",
                            fontWeight: 700,
                            textTransform: "capitalize",
                            "& .MuiChip-icon": { color: "inherit" },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="Ver PDF">
                            <IconButton size="small" onClick={() => verPdf(r)}>
                              <PictureAsPdf fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Marcar Vigente">
                            <IconButton size="small" onClick={() => cambiarEstado(r.idcredencial, "vigente")}>
                              <CheckCircleOutline fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Suspender">
                            <IconButton size="small" onClick={() => cambiarEstado(r.idcredencial, "suspendida")}>
                              <Block fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Revocar">
                            <IconButton size="small" onClick={() => cambiarEstado(r.idcredencial, "revocada")}>
                              <GppBad fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => eliminar(r)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}

              {!loading && paginated.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Box sx={{ p: 3, textAlign: "center", color: "text.secondary" }}>
                      Sin resultados
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && filtered.length > rowsPerPage && (
          <Box p={2} display="flex" justifyContent="center">
            <Pagination
              count={Math.ceil(filtered.length / rowsPerPage)}
              page={page}
              onChange={(_, v) => setPage(v)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Diálogo de creación */}
      <Dialog
        open={openCrear}
        onClose={() => setOpenCrear(false)}
        fullWidth
        maxWidth="md"
        TransitionComponent={Transition}
      >
        <DialogTitle>Nueva Credencial</DialogTitle>
        <DialogContent dividers>
          <CredencialCrearPage
            open
            onClose={() => setOpenCrear(false)}
            onSuccess={load}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCrear(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de reportes */}
      <ReportesCredencialesDialog
        open={openReportes}
        onClose={() => setOpenReportes(false)}
      />
    </LayoutDashboard>
  );
}
