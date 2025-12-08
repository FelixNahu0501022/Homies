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
  Avatar,
  Pagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  TableContainer,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  CheckCircleOutline,
  Block,
  GridView,
  TableRows,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarPersonal,
  eliminarPersonal,
  editarPersonal,
} from "../../services/personal.service";
import { PersonalCrearForm } from "./PersonalCrearPage";
import { PersonalEditarForm } from "./PersonalEditarPage";
import { resolveFileUrl } from "../../utils/files";

/* 🔗 Genera URL absoluta de fotos o documentos */




export default function PersonalPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("cards");

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editId, setEditId] = useState(null);

  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const navigate = useNavigate();
  const isSmall = useMediaQuery("(max-width:600px)");

  /* 🧭 Cargar personal */
  const cargar = async () => {
    try {
      setLoading(true);
      const res = await listarPersonal({ page, limit, search });
      setRows(res?.data || []);
      const pages = Math.max(1, Math.ceil((res?.total || 0) / (res?.limit || limit)));
      setTotalPages(pages);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "Error al cargar el personal";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, [page, search]);

  const debouncedSearch = useMemo(
    () => debounce((v) => { setSearch(v); setPage(1); }, 400),
    []
  );

  /* 🗑 Eliminar */
  const onDelete = async (p) => {
    const confirm = await Swal.fire({
      title: `¿Eliminar a ${p.nombre} ${p.apellido}?`,
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
    });
    if (!confirm.isConfirmed) return;
    try {
      await eliminarPersonal(p.idpersonal);
      await cargar();
      setSnack({ open: true, message: "Registro eliminado", severity: "success" });
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };

  /* ♻️ Cambiar estado activo/inactivo */
  const onToggleActivo = async (p) => {
    const activar = p.activo === false;
    const confirm = await Swal.fire({
      title: activar ? `¿Activar a ${p.nombre}?` : `¿Inactivar a ${p.nombre}?`,
      text: activar
        ? "El personal podrá participar nuevamente."
        : "El personal será marcado como inactivo.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: activar ? "Activar" : "Inactivar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await editarPersonal(p.idpersonal, { activo: activar });
      await cargar();
      setSnack({
        open: true,
        message: activar ? "Personal activado" : "Personal inactivado",
        severity: activar ? "success" : "warning",
      });
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    }
  };

  /* ✅ Callbacks modales */
  const handleCreated = async () => {
    setOpenCreate(false);
    await cargar();
    setSnack({ open: true, message: "Personal creado correctamente", severity: "success" });
  };
  const handleEdited = async () => {
    setOpenEdit(false);
    setEditId(null);
    await cargar();
    setSnack({ open: true, message: "Cambios guardados", severity: "success" });
  };

  const fotoUrl = (p) => resolveFileUrl(p.foto);
  const docUrl = (p) => resolveFileUrl(p.filedocumento || p.fileDocumento);

  /* UI principal */
  return (
    <LayoutDashboard>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Personal</Typography>
          <Typography variant="body2" color="text.secondary">
            Gestión de voluntarios y personal operativo
          </Typography>
        </Box>

        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, v) => v && setView(v)}>
            <ToggleButton value="cards"><GridView fontSize="small" /></ToggleButton>
            <ToggleButton value="table"><TableRows fontSize="small" /></ToggleButton>
          </ToggleButtonGroup>

          <Button variant="outlined" onClick={() => navigate("/reportes/personal")}>Reportes</Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
            Nuevo
          </Button>
        </Box>
      </Box>

      {/* Buscador */}
      <TextField
        label="Buscar por nombre, CI, grado o cohorte"
        fullWidth
        margin="normal"
        onChange={(e) => debouncedSearch(e.target.value)}
        placeholder="Ej: Juan, 123456, Bombero I..."
      />

      {/* Listado */}
      <Paper sx={{ mt: 2, p: view === "table" ? 0 : 2, minHeight: 200 }}>
        {loading ? (
          <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
            Sin resultados
          </Box>
        ) : view === "table" ? (
          <>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Foto</TableCell>
                    <TableCell>Nombre</TableCell>
                    <TableCell>CI</TableCell>
                    <TableCell>Cohorte / Grado</TableCell>
                    <TableCell>Teléfono</TableCell>
                    <TableCell>Documento</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((p) => (
                    <TableRow key={p.idpersonal} hover>
                      <TableCell>
                        <Avatar
                          src={fotoUrl(p)}
                          alt={`${p.nombre} ${p.apellido}`}
                          sx={{ bgcolor: "primary.main", color: "#fff" }}
                          imgProps={{
                            onError: (e) => { e.currentTarget.src = ""; },
                            crossOrigin: "anonymous",
                          }}
                        >
                          {(p.nombre?.[0] || "?").toUpperCase()}
                        </Avatar>
                      </TableCell>
                      <TableCell><strong>{p.nombre} {p.apellido}</strong></TableCell>
                      <TableCell>{p.ci || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={`${p.clase_etiqueta || (p.clase_gestion ? `Clase ${p.clase_gestion}` : "-")}${p.grado_nombre ? ` / ${p.grado_nombre}` : ""}`}
                        />
                      </TableCell>
                      <TableCell>{p.telefono || "—"}</TableCell>
                      <TableCell>
                        {docUrl(p) ? (
                          <Button size="small" href={docUrl(p)} target="_blank" rel="noopener noreferrer">
                            Ver documento
                          </Button>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {p.activo !== false
                          ? <Chip size="small" color="success" label="Activo" />
                          : <Chip size="small" label="Inactivo" />}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Editar"><IconButton color="primary" onClick={() => { setEditId(p.idpersonal); setOpenEdit(true); }}><Edit /></IconButton></Tooltip>
                        <Tooltip title={p.activo !== false ? "Inactivar" : "Activar"}>
                          <IconButton color={p.activo !== false ? "warning" : "success"} onClick={() => onToggleActivo(p)}>
                            {p.activo !== false ? <Block /> : <CheckCircleOutline />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar"><IconButton color="error" onClick={() => onDelete(p)}><Delete /></IconButton></Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box mt={2} display="flex" justifyContent="center" pb={2}>
              <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
            </Box>
          </>
        ) : (
          <>
            <Grid container spacing={2}>
              {rows.map((p) => (
                <Grid key={p.idpersonal} item xs={12} sm={6} md={4} lg={3}>
                  <Card sx={{ height: "100%", display: "flex", flexDirection: "column", borderRadius: 3 }} elevation={3}>
                    <Box sx={{ display: "grid", placeItems: "center", pt: 2 }}>
                      <Avatar
                        src={fotoUrl(p)}
                        alt={`${p.nombre} ${p.apellido}`}
                        sx={{ width: 88, height: 88 }}
                        imgProps={{
                          onError: (e) => { e.currentTarget.src = ""; },
                          crossOrigin: "anonymous",
                        }}
                      >
                        {(p.nombre?.[0] || "?").toUpperCase()}
                      </Avatar>
                    </Box>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} textAlign="center">
                        {p.nombre} {p.apellido}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        {p.clase_etiqueta || (p.clase_gestion ? `Clase ${p.clase_gestion}` : "-")}
                        {p.grado_nombre ? ` / ${p.grado_nombre}` : ""}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        CI: {p.ci || "—"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Tel: {p.telefono || "—"}
                      </Typography>
                      <Box sx={{ mt: 1, textAlign: "center" }}>
                        {p.activo !== false
                          ? <Chip size="small" color="success" label="Activo" />
                          : <Chip size="small" label="Inactivo" />}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
                      <Box>
                        <Tooltip title="Editar"><IconButton color="primary" onClick={() => { setEditId(p.idpersonal); setOpenEdit(true); }}><Edit /></IconButton></Tooltip>
                        <Tooltip title={p.activo !== false ? "Inactivar" : "Activar"}>
                          <IconButton color={p.activo !== false ? "warning" : "success"} onClick={() => onToggleActivo(p)}>
                            {p.activo !== false ? <Block /> : <CheckCircleOutline />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Tooltip title="Eliminar"><IconButton color="error" onClick={() => onDelete(p)}><Delete /></IconButton></Tooltip>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>

            <Box mt={2} display="flex" justifyContent="center" pb={1}>
              <Pagination count={totalPages} page={page} onChange={(_, v) => setPage(v)} />
            </Box>
          </>
        )}
      </Paper>

      {/* Modales */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullScreen={isSmall} maxWidth="md" fullWidth>
        <DialogTitle>Nuevo Personal</DialogTitle>
        <DialogContent dividers><PersonalCrearForm onSuccess={handleCreated} /></DialogContent>
        <DialogActions><Button onClick={() => setOpenCreate(false)}>Cerrar</Button></DialogActions>
      </Dialog>

      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} fullScreen={isSmall} maxWidth="md" fullWidth>
        <DialogTitle>Editar Personal</DialogTitle>
        <DialogContent dividers>{editId && <PersonalEditarForm id={editId} onSuccess={handleEdited} />}</DialogContent>
        <DialogActions><Button onClick={() => setOpenEdit(false)}>Cerrar</Button></DialogActions>
      </Dialog>

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
