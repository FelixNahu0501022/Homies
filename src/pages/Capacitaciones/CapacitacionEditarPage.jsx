import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardHeader,
  CardContent,
  Divider,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  School as SchoolIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  Person as PersonIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import {
  obtenerCapacitacion,
  editarCapacitacion,
  listarCursosCatalogo,
  listarTemasCatalogo,
} from "../../services/capacitaciones.service";
import api from "../../services/axios";

/* Utilidad para armar URLs absolutas */
function buildFileUrl(p) {
  if (!p) return null;
  if (/^https?:\/\//i.test(p)) return p;
  const base = api?.defaults?.baseURL
    ? api.defaults.baseURL.replace(/\/api\/?$/i, "")
    : "";
  const rel = p.startsWith("/") ? p : `/${p}`;
  return `${base}${rel}`;
}

export default function CapacitacionEditarPage({ idCapacitacion, onFinish }) {
  const [cursos, setCursos] = useState([]);
  const [temas, setTemas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cursoManual, setCursoManual] = useState(false);
  const [temaManual, setTemaManual] = useState(false);
  const [loading, setLoading] = useState(true);
  const [docActual, setDocActual] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm({
    defaultValues: {
      fechasolicitud: "",
      fechainicio: "",
      fechafin: "",
      idUsuario: "",
      documentoSolicitud: null,
      idCurso: "",
      idTema: "",
      titulo: "",
      tema: "",
    },
  });

  const wIdCurso = watch("idCurso");
  const wIdTema = watch("idTema");
  const wTitulo = watch("titulo");
  const wTemaTxt = watch("tema");
  const wFechaSol = watch("fechasolicitud");
  const wFechaIni = watch("fechainicio");
  const wFechaFin = watch("fechafin");
  const wIdUsuario = watch("idUsuario");
  const wDocNuevo = watch("documentoSolicitud");

  const cursoSel = useMemo(
    () => cursos.find((c) => Number(c.idcurso) === Number(wIdCurso)),
    [cursos, wIdCurso]
  );
  const temaSel = useMemo(
    () => temas.find((t) => Number(t.idtema) === Number(wIdTema)),
    [temas, wIdTema]
  );
  const usuarioSel = useMemo(
    () => usuarios.find((u) => Number(u.idusuario) === Number(wIdUsuario)),
    [usuarios, wIdUsuario]
  );

  /* Carga de datos */
  useEffect(() => {
    const cargarDatos = async () => {
      if (!idCapacitacion || isNaN(Number(idCapacitacion))) {
        // 👇 Evita romper el modal: muestra loader indefinido hasta que se pase id válido
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const [cap, catCursos, catTemas, usuariosRes] = await Promise.all([
          obtenerCapacitacion(Number(idCapacitacion)),
          listarCursosCatalogo(),
          listarTemasCatalogo(),
          api.get("/usuarios", { params: { page: 1, limit: 1000, search: "" } }),
        ]);

        if (!cap) {
          Swal.fire("Aviso", "No se encontró la capacitación", "warning");
          return;
        }

        setCursos(catCursos || []);
        setTemas(catTemas || []);
        setUsuarios(usuariosRes?.data?.data || []);

        const fechaSolicitud = cap.fechasolicitud?.slice(0, 10) || "";
        const fechaInicio = cap.fechainicio?.slice(0, 10) || "";
        const fechaFin = cap.fechafin?.slice(0, 10) || "";
        const idUsuario = Number(cap.idusuario ?? cap.idUsuario ?? 0) || "";
        const idCurso = Number(cap.idcurso ?? cap.idCurso ?? 0) || "";
        const idTema = Number(cap.idtema ?? cap.idTema ?? 0) || "";
        const titulo = cap.titulo ?? "";
        const tema = cap.tema ?? "";

        setCursoManual(!idCurso && !!titulo);
        setTemaManual(!idTema && !!tema);
        setDocActual(cap.documentosolicitud || cap.documentoSolicitud || null);

        reset({
          fechasolicitud: fechaSolicitud,
          fechainicio: fechaInicio,
          fechafin: fechaFin,
          idUsuario,
          idCurso: idCurso || "",
          idTema: idTema || "",
          titulo,
          tema,
          documentoSolicitud: null,
        });
      } catch (err) {
        const msg = err?.response?.data?.mensaje || err?.message || "No se pudieron cargar los datos";
        Swal.fire("Error", msg, "error");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [idCapacitacion, reset]);

  const onSubmit = async (form) => {
    try {
      if (form.fechainicio && form.fechafin && form.fechainicio > form.fechafin) {
        return Swal.fire("Valida", "La fecha de fin no puede ser anterior al inicio", "info");
      }

      const payload = {
        fechasolicitud: form.fechasolicitud || undefined,
        fechainicio: form.fechainicio || undefined,
        fechafin: form.fechafin || undefined,
        idUsuario: Number(form.idUsuario) || undefined,
        documentoSolicitud: form.documentoSolicitud || null,
      };

      if (!cursoManual) payload.idCurso = Number(form.idCurso) || undefined;
      else payload.titulo = form.titulo?.trim() || undefined;

      if (!temaManual) payload.idTema = Number(form.idTema) || undefined;
      else payload.tema = form.tema?.trim() || undefined;

      await editarCapacitacion(Number(idCapacitacion), payload);

      Swal.fire({
        title: "Éxito",
        text: "Capacitación actualizada correctamente",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      if (typeof onFinish === "function") onFinish();
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo actualizar";
      Swal.fire("Error", msg, "error");
      setSnack({ open: true, message: msg, severity: "error" });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
        <CircularProgress />
      </Box>
    );
  }

  const documentoHref = buildFileUrl(docActual);

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, width: "100%", maxWidth: "1000px", mx: "auto" }}>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Editar Capacitación
      </Typography>

      {/* Formulario */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3 }}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Grid container spacing={2}>
            {/* Curso */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={cursoManual} onChange={(e) => setCursoManual(e.target.checked)} />}
                label={cursoManual ? "Curso manual" : "Curso catálogo"}
              />
              {!cursoManual ? (
                <Controller
                  name="idCurso"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label="Curso" {...field}>
                      {cursos.map((c) => (
                        <MenuItem key={c.idcurso} value={c.idcurso}>
                          {c.nombre}
                          {c.version ? ` — v${c.version}` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              ) : (
                <Controller name="titulo" control={control} render={({ field }) => <TextField label="Título del curso" fullWidth {...field} />} />
              )}
            </Grid>

            {/* Tema */}
            <Grid item xs={12} sm={6} md={4}>
              <FormControlLabel
                control={<Switch checked={temaManual} onChange={(e) => setTemaManual(e.target.checked)} />}
                label={temaManual ? "Tema manual" : "Tema catálogo"}
              />
              {!temaManual ? (
                <Controller
                  name="idTema"
                  control={control}
                  render={({ field }) => (
                    <TextField select fullWidth label="Tema" {...field}>
                      {temas.map((t) => (
                        <MenuItem key={t.idtema} value={t.idtema}>
                          {t.nombre}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              ) : (
                <Controller name="tema" control={control} render={({ field }) => <TextField label="Tema" fullWidth {...field} />} />
              )}
            </Grid>

            {/* Fechas */}
            {["fechasolicitud", "fechainicio", "fechafin"].map((name, i) => (
              <Grid item xs={12} sm={4} key={i}>
                <Controller
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <TextField
                      type="date"
                      fullWidth
                      label={
                        name === "fechasolicitud"
                          ? "Fecha de solicitud"
                          : name === "fechainicio"
                          ? "Fecha de inicio"
                          : "Fecha de fin"
                      }
                      InputLabelProps={{ shrink: true }}
                      {...field}
                    />
                  )}
                />
              </Grid>
            ))}

            {/* Solicitante */}
            <Grid item xs={12} sm={6} md={4}>
              <Controller
                name="idUsuario"
                control={control}
                render={({ field }) => (
                  <TextField select fullWidth label="Solicitante" {...field}>
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
              {documentoHref ? (
                <Button
                  variant="text"
                  startIcon={<VisibilityIcon />}
                  href={documentoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ mb: 1 }}
                >
                  Ver documento actual
                </Button>
              ) : (
                <Box sx={{ fontSize: 13, color: "text.secondary", mb: 1 }}>Sin documento actual</Box>
              )}

              <Button variant="outlined" component="label" fullWidth>
                Reemplazar documento (PDF)
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
                {wDocNuevo instanceof File ? `Archivo nuevo: ${wDocNuevo.name}` : "Ningún archivo seleccionado"}
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box textAlign="right">
                <Button type="submit" variant="contained" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Resumen horizontal */}
      <Card elevation={2} sx={{ mt: 3, borderRadius: 3 }}>
        <CardHeader title="Resumen" subheader="Vista previa de la capacitación" />
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <ResumenItem icon={<SchoolIcon />} title="Curso" text={cursoManual ? wTitulo : cursoSel?.nombre || "—"} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ResumenItem icon={<CategoryIcon />} title="Tema" text={temaManual ? wTemaTxt : temaSel?.nombre || "—"} />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }} />
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
              <ResumenItem icon={<PersonIcon />} title="Solicitante" text={usuarioSel?.nombreusuario || "—"} />
            </Grid>
            <Grid item xs={12}>
              <ResumenItem
                icon={<InsertDriveFileIcon />}
                title="Documento"
                text={
                  wDocNuevo instanceof File
                    ? wDocNuevo.name
                    : documentoHref
                    ? "Usando documento actual"
                    : "—"
                }
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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

/* Reutilizable para ítems del resumen */
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
