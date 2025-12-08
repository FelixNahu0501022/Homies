import {
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Button,
  Box,
  Avatar,
  Grid,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Autocomplete,
  Divider,
} from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerCapacitacion,
  listarPersonalAsignado,
  listarPersonalCatalogoCapacitacion,
  asignarPersonal,
  quitarPersonal,
} from "../../services/capacitaciones.service";
import { resolveFileUrl } from "../../utils/files";

/* 🔗 Igual que en PersonalPage */


const toArr = (x) => (Array.isArray(x) ? x : []);
const nombreCompleto = (p) => `${p?.nombre || ""} ${p?.apellido || ""}`.trim();

/* ---------- Página principal ---------- */
export default function CapacitacionPersonalPage() {
  const { id } = useParams();
  const idCap = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [cap, setCap] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [catalogo, setCatalogo] = useState([]);
  const [seleccion, setSeleccion] = useState([]);
  const [saving, setSaving] = useState(false);

  /* ---------- Carga inicial ---------- */
  const cargar = async () => {
    try {
      if (!Number.isInteger(idCap) || idCap <= 0) {
        Swal.fire("Aviso", "ID inválido", "warning");
        return navigate("/capacitaciones");
      }
      setLoading(true);
      const [c, list] = await Promise.all([
        obtenerCapacitacion(idCap),
        listarPersonalAsignado(idCap),
      ]);
      if (!c) {
        Swal.fire("Aviso", "Capacitación no encontrada", "warning");
        return navigate("/capacitaciones");
      }
      setCap(c);
      setRows(toArr(list));
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

  /* ---------- Modal asignar ---------- */
  const onOpen = async () => {
    try {
      const data = await listarPersonalCatalogoCapacitacion(idCap);
      setCatalogo(toArr(data));
      setSeleccion([]);
      setOpen(true);
    } catch (e) {
      Swal.fire("Error", "No se pudo cargar el catálogo de personal", "error");
    }
  };
  const onClose = () => {
    setOpen(false);
    setSeleccion([]);
  };

  const onAsignar = async () => {
    if (seleccion.length === 0)
      return Swal.fire("Valida", "Selecciona al menos una persona", "info");

    setSaving(true);
    try {
      const ids = seleccion
        .map((p) => p.idpersonal)
        .filter((n) => Number.isInteger(n) && n > 0);
      await asignarPersonal(idCap, ids);
      onClose();
      await cargar();
      Swal.fire("Éxito", "Personal asignado correctamente", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Quitar ---------- */
  const onQuitar = async (p) => {
    const nom = nombreCompleto(p) || "esta persona";
    const ok = await Swal.fire({
      title: `¿Quitar a ${nom}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await quitarPersonal(idCap, p.idpersonal);
      await cargar();
      Swal.fire("Listo", "Persona quitada", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    }
  };

  /* ---------- Loading ---------- */
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
            Participantes (Personal)
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cap?.titulo_resuelto || cap?.titulo || "—"}
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<Add />} onClick={onOpen}>
          Asignar
        </Button>
      </Box>

      {/* Grid de participantes */}
      <Paper sx={{ p: 2, borderRadius: 3 }}>
        {rows.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            No hay personal asignado
          </Box>
        ) : (
          <Grid container spacing={2}>
            {rows.map((p) => (
              <Grid key={p.idpersonal} item xs={12} sm={6} md={4} lg={3}>
                <Paper
                  elevation={3}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "center",
                  }}
                >
                  <Box>
                    <Avatar
                      src={resolveFileUrl(p.foto)}
                      alt={nombreCompleto(p)}
                      sx={{
                        width: 90,
                        height: 90,
                        mb: 1,
                        mx: "auto",
                        fontSize: 24,
                        bgcolor: "grey.200",
                        color: "text.primary",
                      }}
                      imgProps={{
                        onError: (e) => {
                          e.currentTarget.src = "";
                        },
                        crossOrigin: "anonymous",
                      }}
                    >
                      {(p.nombre?.[0] || "?").toUpperCase()}
                    </Avatar>

                    <Typography variant="subtitle1" fontWeight={700}>
                      {nombreCompleto(p) || "—"}
                    </Typography>

                    <Stack spacing={0.3} sx={{ mt: 0.5 }}>
                      <Typography variant="body2" color="text.secondary">
                        CI: {p?.ci || "—"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {p?.clase_nombre || "—"}
                        {p?.grado_nombre ? ` / ${p.grado_nombre}` : ""}
                      </Typography>
                      {p?.unidad_nombre && (
                        <Typography variant="body2" color="text.secondary">
                          {p.unidad_nombre}
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  <Box mt={2}>
                    <Tooltip title="Quitar de la capacitación">
                      <IconButton color="error" onClick={() => onQuitar(p)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Modal Asignar */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>Asignar personal</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Autocomplete
            multiple
            options={catalogo}
            value={seleccion}
            onChange={(_, val) => setSeleccion(val)}
            getOptionLabel={(p) => {
              const name = nombreCompleto(p) || "(sin nombre)";
              return p?.ci ? `${name} — CI: ${p.ci}` : name;
            }}
            renderOption={(props, option) => (
              <li {...props} key={option.idpersonal}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    src={resolveFileUrl(option.foto)}
                    alt={nombreCompleto(option)}
                    sx={{
                      width: 28,
                      height: 28,
                      fontSize: 14,
                      bgcolor: "grey.200",
                    }}
                    imgProps={{ onError: (e) => (e.currentTarget.src = "") }}
                  >
                    {(option.nombre?.[0] ||
                      option.apellido?.[0] ||
                      "?"
                    ).toUpperCase()}
                  </Avatar>
                  <span>
                    {nombreCompleto(option) || "(sin nombre)"}{" "}
                    {option.ci ? `— CI: ${option.ci}` : ""}
                  </span>
                </Stack>
              </li>
            )}
            renderInput={(params) => (
              <TextField {...params} label="Selecciona personal" fullWidth />
            )}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          <Button onClick={onAsignar} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Asignar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
