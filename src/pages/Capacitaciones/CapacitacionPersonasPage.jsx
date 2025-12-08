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
  Tabs,
  Tab,
} from "@mui/material";
import { Add, Delete, PersonAddAlt1 } from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerCapacitacion,
  listarPersonasExternas,
  crearOAsignarPersona,
  quitarPersona,
  buscarPersonasCatalogo,
  crearPersonaCatalogo,
} from "../../services/capacitaciones.service";
import { resolveFileUrl } from "../../utils/files";

/* 🔗 Reutilizamos resolveUrl del módulo Personal */


export default function CapacitacionPersonasPage() {
  const { id } = useParams();
  const idCap = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [cap, setCap] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // diálogo
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);

  // catálogo
  const [catalogo, setCatalogo] = useState([]);
  const [search, setSearch] = useState("");
  const [seleccion, setSeleccion] = useState([]);
  const [saving, setSaving] = useState(false);

  // crear nueva
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoCI, setNuevoCI] = useState("");
  const [nuevoCorreo, setNuevoCorreo] = useState("");

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* -------- Carga inicial -------- */
  const cargar = async () => {
    try {
      if (!Number.isInteger(idCap) || idCap <= 0) {
        Swal.fire("Aviso", "ID inválido", "warning");
        return navigate("/capacitaciones");
      }
      setLoading(true);
      const [c, list] = await Promise.all([
        obtenerCapacitacion(idCap),
        listarPersonasExternas(idCap),
      ]);
      if (!c) {
        Swal.fire("Aviso", "Capacitación no encontrada", "warning");
        return navigate("/capacitaciones");
      }
      if (!mountedRef.current) return;
      setCap(c);
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      if (!mountedRef.current) return;
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
      navigate("/capacitaciones");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idCap]);

  /* -------- Búsqueda en catálogo -------- */
  const doSearch = useMemo(
    () =>
      debounce(async (q) => {
        try {
          const data = await buscarPersonasCatalogo({ search: q, limit: 20, offset: 0 });
          if (!mountedRef.current) return;
          setCatalogo(Array.isArray(data) ? data : []);
        } catch {
          if (!mountedRef.current) return;
          Swal.fire("Error", "No se pudo cargar el catálogo de personas", "error");
        }
      }, 300),
    []
  );

  useEffect(() => () => doSearch.cancel?.(), [doSearch]);

  const onOpen = () => {
    setOpen(true);
    setTab(0);
    setSeleccion([]);
    setSearch("");
    setCatalogo([]);
    doSearch("");
    setNuevoNombre("");
    setNuevoCI("");
    setNuevoCorreo("");
  };

  const onClose = () => {
    setOpen(false);
    setSeleccion([]);
    setSearch("");
    setCatalogo([]);
    setNuevoNombre("");
    setNuevoCI("");
    setNuevoCorreo("");
    setTab(0);
  };

  /* -------- Asignar o crear -------- */
  const onAsignarSeleccionados = async () => {
    if (seleccion.length === 0) {
      return Swal.fire("Valida", "Selecciona al menos una persona", "info");
    }
    setSaving(true);
    try {
      await Promise.all(
        seleccion.map((p) => crearOAsignarPersona(idCap, { idPersona: p.idpersona }))
      );
      onClose();
      await cargar();
      Swal.fire("Éxito", "Personas asignadas correctamente", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const onCrearYAsignar = async () => {
    if (!nuevoNombre.trim() || !nuevoCI.trim()) {
      return Swal.fire("Valida", "Nombre y CI son obligatorios", "info");
    }
    setSaving(true);
    try {
      const creada = await crearPersonaCatalogo({
        nombre: nuevoNombre.trim(),
        ci: nuevoCI.trim(),
        correo: (nuevoCorreo || "").trim() || undefined,
      });
      await crearOAsignarPersona(idCap, { idPersona: creada.idpersona });
      onClose();
      await cargar();
      Swal.fire("Éxito", "Persona creada y asignada correctamente", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* -------- Quitar persona -------- */
  const onQuitar = async (p) => {
    const ok = await Swal.fire({
      title: `¿Quitar a ${p.nombre}?`,
      text: p.ci ? `CI: ${p.ci}` : "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await quitarPersona(idCap, p.idpersona);
      await cargar();
      Swal.fire("Listo", "Persona quitada", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    }
  };

  /* -------- Render -------- */
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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Personas Externas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {cap?.titulo_resuelto || cap?.titulo || "—"}
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<Add />} onClick={onOpen}>
          Agregar
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        {rows.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
            Sin personas asignadas
          </Box>
        ) : (
          <Grid container spacing={2}>
            {rows.map((p) => (
              <Grid key={p.idpersona} item xs={12} sm={6} md={4} lg={3}>
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
                      alt={p.nombre}
                      sx={{
                        width: 90,
                        height: 90,
                        mb: 1,
                        mx: "auto",
                        fontSize: 24,
                        bgcolor: "grey.200",
                        color: "text.primary",
                      }}
                      imgProps={{ onError: (e) => (e.currentTarget.src = "") }}
                    >
                      {(p.nombre?.[0] || "?").toUpperCase()}
                    </Avatar>

                    <Typography variant="subtitle1" fontWeight={700}>
                      {p.nombre}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      CI: {p.ci || "—"}
                    </Typography>
                    {p.correo && (
                      <Typography variant="body2" color="text.secondary">
                        {p.correo}
                      </Typography>
                    )}
                  </Box>

                  <Box mt={2}>
                    <Tooltip title="Quitar">
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

      {/* Modal */}
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddAlt1 /> <span>Agregar personas externas</span>
          </Stack>
        </DialogTitle>
        <Divider />

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="Desde el catálogo" />
          <Tab label="Crear nueva" />
        </Tabs>

        <DialogContent sx={{ pt: 2 }}>
          {tab === 0 ? (
            <>
              <TextField
                label="Buscar por nombre, CI o correo"
                fullWidth
                value={search}
                onChange={(e) => {
                  const v = e.target.value;
                  setSearch(v);
                  doSearch(v);
                }}
                sx={{ mb: 2 }}
              />
              <Autocomplete
                multiple
                options={catalogo}
                value={seleccion}
                onChange={(_, val) => setSeleccion(val)}
                getOptionLabel={(p) =>
                  `${p.nombre} — CI: ${p.ci}${p.correo ? ` — ${p.correo}` : ""}`
                }
                renderOption={(props, option) => (
                  <li {...props} key={option.idpersona}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar
                        src={resolveFileUrl(option.foto)}
                        alt={option.nombre}
                        sx={{
                          width: 28,
                          height: 28,
                          fontSize: 14,
                          bgcolor: "grey.200",
                        }}
                        imgProps={{ onError: (e) => (e.currentTarget.src = "") }}
                      >
                        {(option.nombre?.[0] || "?").toUpperCase()}
                      </Avatar>
                      <span>
                        {option.nombre} — CI: {option.ci}
                        {option.correo ? ` — ${option.correo}` : ""}
                      </span>
                    </Stack>
                  </li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Selecciona personas" fullWidth />
                )}
                isOptionEqualToValue={(o, v) => o.idpersona === v.idpersona}
                noOptionsText={search ? "Sin coincidencias" : "Escribe para buscar"}
              />
            </>
          ) : (
            <Box display="grid" gap={2}>
              <TextField
                label="Nombre completo"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                fullWidth
              />
              <TextField
                label="CI"
                value={nuevoCI}
                onChange={(e) => setNuevoCI(e.target.value)}
                fullWidth
              />
              <TextField
                label="Correo (opcional)"
                value={nuevoCorreo}
                onChange={(e) => setNuevoCorreo(e.target.value)}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Cancelar</Button>
          {tab === 0 ? (
            <Button onClick={onAsignarSeleccionados} variant="contained" disabled={saving}>
              {saving ? "Guardando..." : "Asignar seleccionados"}
            </Button>
          ) : (
            <Button onClick={onCrearYAsignar} variant="contained" disabled={saving}>
              {saving ? "Guardando..." : "Crear y asignar"}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
