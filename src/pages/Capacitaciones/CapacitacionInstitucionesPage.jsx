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
  CircularProgress,
  Autocomplete,
  TextField,
  Grid,
  Divider,
  Stack,
} from "@mui/material";
import { Add, Delete, Business } from "@mui/icons-material";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import debounce from "lodash.debounce";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerCapacitacion,
  listarInstituciones,
  crearOAsignarInstitucion,
  quitarInstitucion,
  buscarInstitucionesCatalogo,
  buscarPersonasCatalogo,
  crearPersonaCatalogo,
} from "../../services/capacitaciones.service";

export default function CapacitacionInstitucionesPage() {
  const { id } = useParams();
  const idCap = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [cap, setCap] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estado selector y creación
  const [openSel, setOpenSel] = useState(false);
  const [openCrear, setOpenCrear] = useState(false);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  // Catálogo instituciones
  const [catalogo, setCatalogo] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [seleccion, setSeleccion] = useState([]);

  // Formulario creación
  const [formCrear, setFormCrear] = useState({
    nombre: "",
    contacto: "",
    direccion: "",
  });

  // Responsable
  const [usarRespCatalogo, setUsarRespCatalogo] = useState(true);
  const [personasCat, setPersonasCat] = useState([]);
  const [busqPersona, setBusqPersona] = useState("");
  const [personaSel, setPersonaSel] = useState(null);
  const [personaNueva, setPersonaNueva] = useState({
    nombre: "",
    ci: "",
    correo: "",
  });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  /* -------- Cargar datos -------- */
  const cargar = async () => {
    try {
      if (!Number.isInteger(idCap) || idCap <= 0) {
        Swal.fire("Aviso", "ID inválido de capacitación", "warning");
        return navigate("/capacitaciones");
      }

      setLoading(true);
      const [c, list] = await Promise.all([
        obtenerCapacitacion(idCap),
        listarInstituciones(idCap),
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

  /* -------- Buscar instituciones -------- */
  const buscarInstituciones = useMemo(
    () =>
      debounce(async (val) => {
        try {
          const data = await buscarInstitucionesCatalogo({ search: val });
          if (!mountedRef.current) return;
          setCatalogo(Array.isArray(data) ? data : []);
        } catch {
          if (!mountedRef.current) return;
          setCatalogo([]);
        }
      }, 300),
    []
  );
  useEffect(() => () => buscarInstituciones.cancel?.(), [buscarInstituciones]);

  const abrirSelector = () => {
    setOpenSel(true);
    setBusqueda("");
    setSeleccion([]);
    buscarInstituciones("");
  };
  const cerrarSelector = () => setOpenSel(false);

  const onBuscarInst = (val) => {
    setBusqueda(val);
    buscarInstituciones(val);
  };

  const onAsignarSeleccion = async () => {
    if (seleccion.length === 0)
      return Swal.fire("Valida", "Selecciona al menos una institución", "info");
    setSaving(true);
    try {
      await Promise.all(
        seleccion.map((inst) =>
          crearOAsignarInstitucion(idCap, { idInstitucion: inst.idinstitucion })
        )
      );
      cerrarSelector();
      await cargar();
      Swal.fire("Éxito", "Instituciones asignadas correctamente", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const onQuitar = async (inst) => {
    const ok = await Swal.fire({
      title: `¿Quitar a ${inst.nombre}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await quitarInstitucion(idCap, inst.idinstitucion);
      await cargar();
      Swal.fire("Listo", "Institución quitada", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    }
  };

  /* -------- Crear institución + responsable -------- */
  const abrirCrear = () => {
    setFormCrear({ nombre: "", contacto: "", direccion: "" });
    setUsarRespCatalogo(true);
    setPersonaSel(null);
    setPersonaNueva({ nombre: "", ci: "", correo: "" });
    setOpenCrear(true);
  };
  const cerrarCrear = () => setOpenCrear(false);

  // Buscar personas para responsable
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await buscarPersonasCatalogo({ search: busqPersona });
        if (active && mountedRef.current)
          setPersonasCat(Array.isArray(data) ? data : []);
      } catch {
        if (active && mountedRef.current) setPersonasCat([]);
      }
    })();
    return () => {
      active = false;
    };
  }, [busqPersona]);

  const onCrear = async () => {
    const { nombre, contacto, direccion } = formCrear;
    if (!nombre?.trim()) {
      return Swal.fire("Valida", "El nombre de la institución es obligatorio", "info");
    }

    const payload = {
      nombre: nombre.trim(),
      contacto: (contacto || "").trim() || undefined,
      direccion: (direccion || "").trim() || undefined,
    };

    // Responsable
    if (usarRespCatalogo) {
      if (personaSel?.idpersona) payload.idPersonaResponsable = personaSel.idpersona;
    } else {
      const nn = personaNueva.nombre.trim();
      const ci = personaNueva.ci.trim();
      const co = personaNueva.correo.trim();
      if (nn && ci) {
        try {
          const creada = await crearPersonaCatalogo({
            nombre: nn,
            ci,
            correo: co || undefined,
          });
          payload.idPersonaResponsable = creada.idpersona;
        } catch {
          payload.personaResponsable = { nombre: nn, ci, correo: co || null };
        }
      }
    }

    setCreating(true);
    try {
      await crearOAsignarInstitucion(idCap, payload);
      cerrarCrear();
      cerrarSelector();
      await cargar();
      Swal.fire("Éxito", "Institución creada y asignada correctamente", "success");
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e.message, "error");
    } finally {
      setCreating(false);
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

  const tituloCap = cap?.titulo_resuelto || cap?.titulo || "Capacitación";

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        mb={2}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Instituciones
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tituloCap}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={abrirSelector}>
          Asignar / Crear
        </Button>
      </Box>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 3, overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Responsable</TableCell>
              <TableCell>Contacto</TableCell>
              <TableCell>Dirección</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((i) => (
              <TableRow key={i.idinstitucion} hover>
                <TableCell>{i.nombre}</TableCell>
                <TableCell>
                  {i.responsable ||
                    [i.responsable_nombre, i.responsable_ci]
                      .filter(Boolean)
                      .join(" — ") ||
                    "—"}
                </TableCell>
                <TableCell>{i.contacto || "—"}</TableCell>
                <TableCell>{i.direccion || "—"}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Quitar">
                    <IconButton color="error" onClick={() => onQuitar(i)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                  <Typography color="text.secondary">
                    No hay instituciones asignadas
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Selector de instituciones */}
      <Dialog open={openSel} onClose={cerrarSelector} fullWidth maxWidth="sm">
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Business /> <span>Asignar instituciones</span>
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Buscar institución por nombre o responsable"
            fullWidth
            value={busqueda}
            onChange={(e) => onBuscarInst(e.target.value)}
            margin="normal"
          />
          <Autocomplete
            multiple
            options={catalogo}
            getOptionLabel={(i) =>
              `${i.nombre}${i.responsable ? " — " + i.responsable : ""}`
            }
            isOptionEqualToValue={(o, v) => o.idinstitucion === v.idinstitucion}
            value={seleccion}
            onChange={(_, val) => setSeleccion(val)}
            renderInput={(params) => (
              <TextField {...params} label="Selecciona instituciones" />
            )}
            noOptionsText="No se encontraron instituciones"
          />
          <Box mt={2}>
            <Button variant="outlined" onClick={abrirCrear}>
              + Crear nueva institución
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarSelector}>Cancelar</Button>
          <Button onClick={onAsignarSeleccion} variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Asignar seleccionadas"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Crear institución */}
      <Dialog open={openCrear} onClose={cerrarCrear} fullWidth maxWidth="md">
        <DialogTitle>Nueva institución</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre de la institución"
                fullWidth
                value={formCrear.nombre}
                onChange={(e) =>
                  setFormCrear((s) => ({ ...s, nombre: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Contacto"
                fullWidth
                value={formCrear.contacto}
                onChange={(e) =>
                  setFormCrear((s) => ({ ...s, contacto: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                label="Dirección"
                fullWidth
                value={formCrear.direccion}
                onChange={(e) =>
                  setFormCrear((s) => ({ ...s, direccion: e.target.value }))
                }
              />
            </Grid>

            {/* Responsable */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 1, mb: 1 }}>
                Responsable de la institución
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                disabled={!usarRespCatalogo}
                options={personasCat}
                getOptionLabel={(p) =>
                  `${p.nombre} — CI: ${p.ci}${p.correo ? " — " + p.correo : ""}`
                }
                isOptionEqualToValue={(o, v) => o.idpersona === v.idpersona}
                value={usarRespCatalogo ? personaSel : null}
                onChange={(_, v) => setPersonaSel(v)}
                onInputChange={(_, v) => setBusqPersona(v)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Buscar responsable en catálogo"
                    helperText={
                      usarRespCatalogo
                        ? "Selecciona una persona existente"
                        : "Modo crear responsable desactivado"
                    }
                  />
                )}
              />
              <Box mt={1}>
                <Button
                  size="small"
                  onClick={() => setUsarRespCatalogo(true)}
                  variant={usarRespCatalogo ? "contained" : "text"}
                >
                  Usar catálogo
                </Button>
                <Button
                  size="small"
                  sx={{ ml: 1 }}
                  onClick={() => setUsarRespCatalogo(false)}
                  variant={!usarRespCatalogo ? "contained" : "text"}
                >
                  Crear nuevo
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Grid
                container
                spacing={2}
                sx={{ opacity: usarRespCatalogo ? 0.5 : 1 }}
              >
                <Grid item xs={12} sm={5}>
                  <TextField
                    label="Nombre (nuevo)"
                    fullWidth
                    disabled={usarRespCatalogo}
                    value={personaNueva.nombre}
                    onChange={(e) =>
                      setPersonaNueva((s) => ({
                        ...s,
                        nombre: e.target.value,
                      }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="CI (nuevo)"
                    fullWidth
                    disabled={usarRespCatalogo}
                    value={personaNueva.ci}
                    onChange={(e) =>
                      setPersonaNueva((s) => ({ ...s, ci: e.target.value }))
                    }
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="Correo (nuevo)"
                    fullWidth
                    disabled={usarRespCatalogo}
                    value={personaNueva.correo}
                    onChange={(e) =>
                      setPersonaNueva((s) => ({
                        ...s,
                        correo: e.target.value,
                      }))
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarCrear}>Cancelar</Button>
          <Button
            onClick={onCrear}
            variant="contained"
            disabled={creating}
          >
            {creating ? "Creando..." : "Crear y asignar"}
          </Button>
        </DialogActions>
      </Dialog>
    </LayoutDashboard>
  );
}
