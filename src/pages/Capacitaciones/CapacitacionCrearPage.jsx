// src/pages/capacitaciones/CapacitacionCrearPage.jsx
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import {
  School as SchoolIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  Person as PersonIcon,
  InsertDriveFile as InsertDriveFileIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  crearCapacitacion,
  listarCursosCatalogo,
  crearCursoCatalogo,
  listarTemasCatalogo,
  crearTemaCatalogo,
} from "../../services/capacitaciones.service";
import api from "../../services/axios";

export default function CapacitacionCrearPage({ onFinish }) {
  const navigate = useNavigate();

  const [usuarios, setUsuarios] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [temas, setTemas] = useState([]);
  const [openCurso, setOpenCurso] = useState(false);
  const [openTema, setOpenTema] = useState(false);
  const [nuevoCurso, setNuevoCurso] = useState({ nombre: "", version: "" });
  const [nuevoTema, setNuevoTema] = useState({ nombre: "" });
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm({
    defaultValues: {
      idCurso: "",
      idTema: "",
      fechasolicitud: "",
      fechainicio: "",
      fechafin: "",
      idUsuario: "",
      documentoSolicitud: null,
    },
  });

  // Watch para preview
  const wCurso = watch("idCurso");
  const wTema = watch("idTema");
  const wFechaSol = watch("fechasolicitud");
  const wFechaIni = watch("fechainicio");
  const wFechaFin = watch("fechafin");
  const wUsuario = watch("idUsuario");
  const wDoc = watch("documentoSolicitud");

  const cursoSel = useMemo(() => cursos.find((c) => String(c.idcurso) === String(wCurso)), [cursos, wCurso]);
  const temaSel = useMemo(() => temas.find((t) => String(t.idtema) === String(wTema)), [temas, wTema]);
  const usuarioSel = useMemo(() => usuarios.find((u) => String(u.idusuario) === String(wUsuario)), [usuarios, wUsuario]);

  useEffect(() => {
    (async () => {
      try {
        const [cur, tem] = await Promise.all([listarCursosCatalogo(), listarTemasCatalogo()]);
        setCursos(cur || []);
        setTemas(tem || []);
      } catch {
        Swal.fire("Error", "No se pudo cargar catálogos", "error");
      }

      try {
        const { data } = await api.get("/usuarios", { params: { page: 1, limit: 1000, search: "" } });
        setUsuarios(data?.data || []);
      } catch (err) {
        console.error(err);
      }
    })();
  }, []);

  const onSubmit = async (form) => {
    try {
      if (form.fechainicio && form.fechafin && form.fechainicio > form.fechafin) {
        return Swal.fire("Valida", "La fecha de fin no puede ser anterior al inicio", "info");
      }

      const payload = {
        ...form,
        idCurso: form.idCurso ? Number(form.idCurso) : null,
        idTema: form.idTema ? Number(form.idTema) : null,
        idUsuario: form.idUsuario ? Number(form.idUsuario) : null,
      };
      if (!payload.idCurso) return Swal.fire("Valida", "Selecciona un curso", "info");
      if (!payload.idTema) return Swal.fire("Valida", "Selecciona un tema", "info");
      if (!payload.idUsuario) return Swal.fire("Valida", "Selecciona el solicitante", "info");

      await crearCapacitacion(payload);
      Swal.fire({ title: "Éxito", text: "Capacitación creada correctamente", icon: "success", timer: 1500, showConfirmButton: false });

      if (typeof onFinish === "function") {
        reset();
        onFinish();
      } else {
        navigate("/capacitaciones");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo crear la capacitación";
      Swal.fire("Error", msg, "error");
      setSnack({ open: true, message: msg, severity: "error" });
    }
  };

  const handleCrearCurso = async () => {
    try {
      if (!nuevoCurso.nombre.trim()) {
        return Swal.fire("Valida", "Ingresa el nombre del curso", "info");
      }
      const creado = await crearCursoCatalogo(nuevoCurso);
      setCursos((prev) => [...prev, creado]);
      setValue("idCurso", creado.idcurso);
      setOpenCurso(false);
      setNuevoCurso({ nombre: "", version: "" });
      setSnack({ open: true, message: "Curso creado", severity: "success" });
    } catch (e) {
      Swal.fire("Error", e.message || "No se pudo crear el curso", "error");
    }
  };

  const handleCrearTema = async () => {
    try {
      if (!nuevoTema.nombre.trim()) {
        return Swal.fire("Valida", "Ingresa el nombre del tema", "info");
      }
      const creado = await crearTemaCatalogo(nuevoTema);
      setTemas((prev) => [...prev, creado]);
      setValue("idTema", creado.idtema);
      setOpenTema(false);
      setNuevoTema({ nombre: "" });
      setSnack({ open: true, message: "Tema creado", severity: "success" });
    } catch (e) {
      Swal.fire("Error", e.message || "No se pudo crear el tema", "error");
    }
  };

  return (
  <Box
    sx={{
      p: { xs: 1, sm: 2, md: 3 },
      width: "100%",
      maxWidth: "1000px",
      mx: "auto",
    }}
  >
    <Typography variant="h6" fontWeight={600} gutterBottom>
      Nueva Capacitación
    </Typography>

    {/* Formulario */}
    <Paper
      elevation={2}
      sx={{
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        width: "100%",
        bgcolor: "background.paper",
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          {/* Curso */}
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="idCurso"
              control={control}
              rules={{ required: "Selecciona un curso" }}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Curso"
                  value={field.value || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "_crear") return setOpenCurso(true);
                    field.onChange(v);
                  }}
                  error={!!errors.idCurso}
                  helperText={errors.idCurso?.message}
                >
                  {cursos.map((c) => (
                    <MenuItem key={c.idcurso} value={c.idcurso}>
                      {c.nombre}
                      {c.version ? ` — v${c.version}` : ""}
                    </MenuItem>
                  ))}
                  <MenuItem value="_crear">+ Crear curso…</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          {/* Tema */}
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="idTema"
              control={control}
              rules={{ required: "Selecciona un tema" }}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Tema"
                  value={field.value || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "_crear") return setOpenTema(true);
                    field.onChange(v);
                  }}
                  error={!!errors.idTema}
                  helperText={errors.idTema?.message}
                >
                  {temas.map((t) => (
                    <MenuItem key={t.idtema} value={t.idtema}>
                      {t.nombre}
                    </MenuItem>
                  ))}
                  <MenuItem value="_crear">+ Crear tema…</MenuItem>
                </TextField>
              )}
            />
          </Grid>

          {/* Fecha solicitud */}
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="fechasolicitud"
              control={control}
              render={({ field }) => (
                <TextField
                  type="date"
                  fullWidth
                  label="Fecha de solicitud"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          {/* Fechas inicio / fin */}
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="fechainicio"
              control={control}
              render={({ field }) => (
                <TextField
                  type="date"
                  fullWidth
                  label="Fecha de inicio"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="fechafin"
              control={control}
              render={({ field }) => (
                <TextField
                  type="date"
                  fullWidth
                  label="Fecha de fin"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              )}
            />
          </Grid>

          {/* Solicitante */}
          <Grid item xs={12} sm={6} md={4}>
            <Controller
              name="idUsuario"
              control={control}
              rules={{ required: "Seleccione el solicitante" }}
              render={({ field }) => (
                <TextField
                  select
                  fullWidth
                  label="Solicitante"
                  value={field.value || ""}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  error={!!errors.idUsuario}
                  helperText={errors.idUsuario?.message}
                >
                  {usuarios.map((u) => (
                    <MenuItem key={u.idusuario} value={u.idusuario}>
                      {u.nombreusuario}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          {/* Documento */}
          <Grid item xs={12} sm={6} md={8}>
            <Button variant="outlined" component="label" fullWidth>
              Adjuntar documento (PDF)
              <input
                type="file"
                accept=".pdf"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setValue("documentoSolicitud", file, { shouldValidate: true });
                }}
              />
            </Button>
            <Box mt={1} sx={{ fontSize: 13, color: "text.secondary" }}>
              {wDoc instanceof File ? `Archivo: ${wDoc.name}` : "Ningún archivo seleccionado"}
            </Box>
          </Grid>

          {/* Botón */}
          <Grid item xs={12}>
            <Box textAlign="right" mt={2}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Crear capacitación"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>

    {/* Resumen debajo, ocupando 100% del ancho */}
    <Card
      elevation={2}
      sx={{
        mt: 3,
        borderRadius: 3,
        width: "100%",
        bgcolor: "background.paper",
      }}
    >
      <CardHeader title="Resumen" subheader="Vista previa de la capacitación" />
      <CardContent>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <ResumenItem
              icon={<SchoolIcon />}
              title="Curso"
              text={
                cursoSel
                  ? `${cursoSel.nombre}${cursoSel.version ? ` — v${cursoSel.version}` : ""}`
                  : "—"
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ResumenItem icon={<CategoryIcon />} title="Tema" text={temaSel ? temaSel.nombre : "—"} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ResumenItem
              icon={<EventIcon />}
              title="Fechas"
              custom={
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip size="small" label={`Solicitud: ${wFechaSol || "—"}`} />
                  <Chip size="small" label={`Inicio: ${wFechaIni || "—"}`} />
                  <Chip size="small" label={`Fin: ${wFechaFin || "—"}`} />
                </Stack>
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <ResumenItem
              icon={<PersonIcon />}
              title="Solicitante"
              text={usuarioSel ? usuarioSel.nombreusuario : "—"}
            />
          </Grid>
          <Grid item xs={12}>
            <ResumenItem
              icon={<InsertDriveFileIcon />}
              title="Documento"
              text={wDoc instanceof File ? wDoc.name : "—"}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    {/* Dialogs */}
    <Dialog open={openCurso} onClose={() => setOpenCurso(false)} fullWidth maxWidth="sm">
      <DialogTitle>Crear curso</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Nombre"
          fullWidth
          margin="dense"
          value={nuevoCurso.nombre}
          onChange={(e) => setNuevoCurso({ ...nuevoCurso, nombre: e.target.value })}
        />
        <TextField
          label="Versión (opcional)"
          fullWidth
          margin="dense"
          value={nuevoCurso.version}
          onChange={(e) => setNuevoCurso({ ...nuevoCurso, version: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenCurso(false)}>Cancelar</Button>
        <Button onClick={handleCrearCurso} variant="contained">
          Crear
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={openTema} onClose={() => setOpenTema(false)} fullWidth maxWidth="sm">
      <DialogTitle>Crear tema</DialogTitle>
      <DialogContent dividers>
        <TextField
          label="Nombre del tema"
          fullWidth
          margin="dense"
          value={nuevoTema.nombre}
          onChange={(e) => setNuevoTema({ nombre: e.target.value })}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenTema(false)}>Cancelar</Button>
        <Button onClick={handleCrearTema} variant="contained">
          Crear
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
  </Box>
);

}

function ResumenItem({ icon, title, text, custom }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1}>
        {icon}
        <Typography variant="subtitle2">{title}</Typography>
      </Stack>
      {custom || (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {text}
        </Typography>
      )}
    </Box>
  );
}
