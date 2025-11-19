// src/pages/vehiculos/VehiculoMantenimientosPage.jsx
import {
  Typography,
  Paper,
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
  Chip,
  Grid,
  Snackbar,
  Alert,
} from "@mui/material";
import {
  Add,
  Delete,
  PictureAsPdf,
  Refresh,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerVehiculo,
  listarMantenimientos,
  crearMantenimiento,
  eliminarMantenimiento,
} from "../../services/vehiculos.service";

// 🔗 Normaliza las rutas de archivos (PDF, fotos, etc.)
const resolveUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;

  // limpia rutas locales tipo "C:\\...\\archivo.pdf"
  if (path.includes(":\\") || path.includes(":/")) {
    path = path.split(/[/\\]/).pop();
  }

  // elimina prefijos residuales
  const clean = path.replace(/^\/?api\/?/, "").replace(/^\/?uploads\/?/, "");

  const base =
    import.meta.env.VITE_API_URL?.replace(/\/+$/, "") ||
    "http://localhost:3000";

  return `${base}/uploads/${clean}`;
};

// 🔧 Estado a color
const estadoColor = (estado) => {
  if (estado === "Operativo") return "success";
  if (estado === "Fuera de servicio") return "warning";
  if (estado === "En emergencia") return "error";
  return "default";
};

export default function VehiculoMantenimientosPage() {
  const { id } = useParams();
  const idVehiculo = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [vehiculo, setVehiculo] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Formulario modal
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fecha: "", descripcion: "", archivoPDF: null });
  const [saving, setSaving] = useState(false);

  // Snackbar
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const cargar = async () => {
    try {
      setLoading(true);
      if (!id || Number.isNaN(idVehiculo)) {
        Swal.fire("Aviso", "ID inválido", "warning");
        return navigate("/vehiculos");
      }
      const [v, ms] = await Promise.all([
        obtenerVehiculo(idVehiculo),
        listarMantenimientos(idVehiculo),
      ]);
      if (!v) {
        Swal.fire("Aviso", "Vehículo no encontrado", "warning");
        return navigate("/vehiculos");
      }
      setVehiculo(v);
      setRows(ms || []);
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudieron cargar mantenimientos";
      Swal.fire("Error", msg, "error");
      navigate("/vehiculos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line

  // Crear mantenimiento
  const onSubmit = async () => {
    try {
      if (!form.fecha) return Swal.fire("Valida", "La fecha es obligatoria", "info");
      setSaving(true);
      await crearMantenimiento(idVehiculo, form);
      setOpen(false);
      setForm({ fecha: "", descripcion: "", archivoPDF: null });
      await cargar();
      setSnack({ open: true, message: "Mantenimiento registrado correctamente", severity: "success" });
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo crear el mantenimiento";
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  // Eliminar mantenimiento
  const onDelete = async (m) => {
    const confirm = await Swal.fire({
      title: "¿Eliminar mantenimiento?",
      text: `${m.descripcion || ""} (${m.fecha?.slice(0, 10) || "-"})`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      await eliminarMantenimiento(idVehiculo, m.idmantenimiento);
      await cargar();
      setSnack({ open: true, message: "Mantenimiento eliminado", severity: "success" });
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo eliminar";
      setSnack({ open: true, message: msg, severity: "error" });
    }
  };

  // Estado de carga
  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Mantenimientos — {vehiculo?.placa}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Historial de intervenciones y servicios técnicos
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={cargar}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpen(true)}
          >
            Nuevo
          </Button>
        </Box>
      </Box>

      {/* Estado del vehículo */}
      <Box mt={1} mb={2}>
        <Chip
          label={vehiculo?.estado || "—"}
          color={estadoColor(vehiculo?.estado)}
          sx={{ fontWeight: 500 }}
        />
      </Box>

      {/* Listado de mantenimientos */}
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
          No hay mantenimientos registrados
        </Box>
      ) : (
        <Grid container spacing={2}>
          {rows.map((m) => (
            <Grid key={m.idmantenimiento} item xs={12} sm={6} md={4}>
              <Paper
                elevation={3}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {m.fecha ? String(m.fecha).slice(0, 10) : "—"}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                  >
                    {m.descripcion || "Sin descripción"}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    mt: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  {m.archivopdf ? (
                    <Button
                      size="small"
                      href={resolveUrl(m.archivopdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<PictureAsPdf />}
                    >
                      Ver PDF
                    </Button>
                  ) : (
                    <Typography variant="body2" color="text.disabled">
                      Sin archivo
                    </Typography>
                  )}

                  <Tooltip title="Eliminar">
                    <IconButton color="error" onClick={() => onDelete(m)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Modal de nuevo mantenimiento */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Nuevo mantenimiento</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Box display="grid" gap={2}>
            <TextField
              label="Fecha"
              type="date"
              margin="dense"
              value={form.fecha}
              onChange={(e) => setForm((s) => ({ ...s, fecha: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Descripción"
              multiline
              minRows={3}
              margin="dense"
              value={form.descripcion}
              onChange={(e) =>
                setForm((s) => ({ ...s, descripcion: e.target.value }))
              }
              placeholder="Detalle del mantenimiento efectuado"
              fullWidth
            />
            <Box display="flex" alignItems="center" gap={1}>
              <Button variant="outlined" component="label">
                Adjuntar PDF
                <input
                  type="file"
                  accept="application/pdf"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setForm((s) => ({ ...s, archivoPDF: file }));
                  }}
                />
              </Button>
              {form.archivoPDF && (
                <Chip label={form.archivoPDF.name} color="primary" />
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={onSubmit} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
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
