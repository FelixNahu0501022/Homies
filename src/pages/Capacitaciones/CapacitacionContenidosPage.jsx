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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import { Add, Delete, PictureAsPdf, Visibility } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerCapacitacion,
  listarContenidos,
  crearContenido,
  eliminarContenido,
} from "../../services/capacitaciones.service";
import api from "../../services/axios";

/* ---------- Utils ---------- */
function buildFileUrl(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = api?.defaults?.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/i, "")
    : "";
  const rel = p.startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}

/* ---------- Page ---------- */
export default function CapacitacionContenidosPage() {
  const { id } = useParams();
  const idCap = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [cap, setCap] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ descripcion: "", archivoPDF: null });
  const [saving, setSaving] = useState(false);

  /* ---------- Cargar capacitación y contenidos ---------- */
  const cargar = async () => {
    try {
      setLoading(true);
      const [c, list] = await Promise.all([
        obtenerCapacitacion(idCap),
        listarContenidos(idCap),
      ]);
      if (!c) {
        Swal.fire("Aviso", "Capacitación no encontrada", "warning");
        return navigate("/capacitaciones");
      }
      setCap(c);
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
      navigate("/capacitaciones");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Crear contenido ---------- */
  const onOpen = () => setOpen(true);
  const onClose = () => {
    setOpen(false);
    setForm({ descripcion: "", archivoPDF: null });
  };

  const onSubmit = async () => {
    if (!form.archivoPDF) {
      return Swal.fire("Valida", "Debes adjuntar un archivo PDF", "info");
    }
    try {
      setSaving(true);
      await crearContenido(idCap, form);
      Swal.fire("Éxito", "Contenido agregado correctamente", "success");
      onClose();
      await cargar();
    } catch (e) {
      const msg =
        e?.response?.data?.mensaje || e.message || "No se pudo crear el contenido";
      Swal.fire("Error", msg, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Eliminar contenido ---------- */
  const onDelete = async (m) => {
    const ok = await Swal.fire({
      title: "¿Eliminar contenido?",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await eliminarContenido(idCap, m.idcontenido || m.idContenido);
      Swal.fire("Listo", "Contenido eliminado correctamente", "success");
      await cargar();
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    }
  };

  /* ---------- Loading state ---------- */
  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  /* ---------- Render ---------- */
  return (
    <LayoutDashboard>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Contenidos de capacitación
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cap?.titulo || cap?.titulo_resuelto || "—"}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onOpen}
        >
          Agregar PDF
        </Button>
      </Box>

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          width: "100%",
        }}
        elevation={3}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Archivo PDF</TableCell>
              <TableCell align="right" sx={{ fontWeight: 700 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {rows.map((m) => (
              <TableRow key={m.idcontenido || m.idContenido} hover>
                <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                  {m.descripcion || "—"}
                </TableCell>
                <TableCell>
                  {m.archivopdf ? (
                    <Button
                      size="small"
                      href={buildFileUrl(m.archivopdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<PictureAsPdf />}
                    >
                      Ver PDF
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      — Sin archivo —
                    </Typography>
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => onDelete(m)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3}>
                  <Box py={3} textAlign="center" color="text.secondary">
                    No hay contenidos registrados
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* ---------- Diálogo para agregar contenido ---------- */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle>Nuevo contenido</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Descripción (opcional)"
              value={form.descripcion}
              onChange={(e) =>
                setForm((s) => ({ ...s, descripcion: e.target.value }))
              }
              fullWidth
            />

            <Button variant="outlined" component="label" startIcon={<PictureAsPdf />}>
              Adjuntar PDF
              <input
                type="file"
                accept="application/pdf,.pdf"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setForm((s) => ({ ...s, archivoPDF: file }));
                }}
              />
            </Button>

            <Typography variant="body2" color="text.secondary">
              {form.archivoPDF
                ? `Archivo seleccionado: ${form.archivoPDF.name}`
                : "Ningún archivo seleccionado"}
            </Typography>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            onClick={onSubmit}
            variant="contained"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
