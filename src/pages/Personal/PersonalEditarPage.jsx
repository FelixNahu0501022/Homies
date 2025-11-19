import {
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  CircularProgress,
  Backdrop,
  DialogContentText,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import { obtenerPersonal, editarPersonal } from "../../services/personal.service";
import api from "../../services/axios";
import CreateClaseDialog from "../../components/CreateClaseDialog";
import CreateGradoDialog from "../../components/CreateGradoDialog";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useNavigate, useParams } from "react-router-dom";

/* 🔗 Genera URL absoluta de fotos/documentos */
const resolveUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("blob:")) return path;
  const base = import.meta.env.VITE_API_URL || api.defaults.baseURL || "http://localhost:3000";
  const clean = path.replace(/^\/?api\/?/, "").replace(/^\/?uploads\/?/, "");
  return `${base.replace(/\/+$/, "")}/uploads/${clean}`;
};

/** ====== Formulario re-usable (modal o página) ====== */
export function PersonalEditarForm({ id, onSuccess }) {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoActual, setFotoActual] = useState(null);
  const [docActual, setDocActual] = useState(null);
  const [claseOptions, setClaseOptions] = useState([]);
  const [gradoOptions, setGradoOptions] = useState([]);
  const [loadingClase, setLoadingClase] = useState(false);
  const [loadingGrado, setLoadingGrado] = useState(false);
  const [loading, setLoading] = useState(true);
  const [openClase, setOpenClase] = useState(false);
  const [openGrado, setOpenGrado] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      nombre: "",
      apellido: "",
      ci: "",
      fechaNacimiento: "",
      idClase: null,
      idGrado: null,
      claseInput: "",
      gradoInput: "",
      telefono: "",
      foto: null,
      fileDocumento: null,
    },
  });

  const fotoFile = watch("foto");
  useEffect(() => {
    if (fotoFile instanceof File) {
      const url = URL.createObjectURL(fotoFile);
      setFotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFotoPreview(null);
  }, [fotoFile]);

  const fetchClases = async (q = "") => {
    setLoadingClase(true);
    try {
      const { data } = await api.get("/clases", { params: { search: q } });
      setClaseOptions(data || []);
    } finally {
      setLoadingClase(false);
    }
  };
  const fetchGrados = async (q = "") => {
    setLoadingGrado(true);
    try {
      const { data } = await api.get("/grados", { params: { search: q } });
      setGradoOptions(data || []);
    } finally {
      setLoadingGrado(false);
    }
  };
  const debouncedFetchClases = useMemo(() => debounce(fetchClases, 400), []);
  const debouncedFetchGrados = useMemo(() => debounce(fetchGrados, 400), []);

  /* 🧭 Carga inicial */
  useEffect(() => {
    const cargar = async () => {
      try {
        const p = await obtenerPersonal(id);
        setFotoActual(p.foto || null);
        setDocActual(p.filedocumento || p.fileDocumento || null);

        const [clasesRes, gradosRes] = await Promise.all([api.get("/clases"), api.get("/grados")]);
        const clases = clasesRes.data || [];
        const grados = gradosRes.data || [];
        setClaseOptions(clases);
        setGradoOptions(grados);

        const claseSel = clases.find((c) => c.idclase === p.idclase) || null;
        const gradoSel = grados.find((g) => g.idgrado === p.idgrado) || null;

        reset({
          nombre: p.nombre ?? "",
          apellido: p.apellido ?? "",
          ci: p.ci ?? "",
          fechaNacimiento: p.fechanacimiento ? String(p.fechanacimiento).slice(0, 10) : "",
          idClase: claseSel?.idclase ?? null,
          idGrado: gradoSel?.idgrado ?? null,
          claseInput:
            claseSel?.etiqueta ||
            (p.clase_etiqueta || (p.clase_gestion ? `Clase ${p.clase_gestion}` : "")),
          // ⬇️ Corregido: evitar mezclar || con ?? sin paréntesis
          gradoInput: (gradoSel?.nombre ?? p.grado_nombre) || "",
          telefono: p.telefono ?? "",
        });
      } catch (err) {
        Swal.fire("Error", err?.response?.data?.mensaje || err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    if (id) cargar();
  }, [id, reset]);

  const onSubmit = async (form) => {
    try {
      if (!Number.isInteger(form.idClase)) throw new Error("Seleccione una Clase válida");
      if (!Number.isInteger(form.idGrado)) throw new Error("Seleccione un Grado válido");

      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        ci: form.ci,
        fechaNacimiento: form.fechaNacimiento,
        idClase: Number(form.idClase),
        idGrado: Number(form.idGrado),
        telefono: form.telefono || "",
        foto: form.foto || null,
        fileDocumento: form.fileDocumento || null,
      };

      await editarPersonal(id, payload);
      Swal.fire({ icon: "success", title: "Cambios guardados", timer: 1200, showConfirmButton: false });
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo actualizar el registro";
      Swal.fire("Error", msg, "error");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="div" sx={{ position: "relative" }}>
      <Backdrop open={isSubmitting} sx={{ color: "#fff", zIndex: (t) => t.zIndex.drawer + 2 }}>
        <CircularProgress color="inherit" />
      </Backdrop>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <DialogContentText>Modifica los datos del personal.</DialogContentText>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="nombre"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <TextField {...field} label="Nombre *" fullWidth error={!!errors.nombre} helperText={errors.nombre?.message} />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="apellido"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <TextField {...field} label="Apellido *" fullWidth error={!!errors.apellido} helperText={errors.apellido?.message} />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="ci"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <TextField {...field} label="CI *" fullWidth error={!!errors.ci} helperText={errors.ci?.message} />
              )}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller name="telefono" control={control} render={({ field }) => <TextField {...field} label="Teléfono" fullWidth />} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Controller
              name="fechaNacimiento"
              control={control}
              rules={{ required: "Campo obligatorio" }}
              render={({ field }) => (
                <TextField {...field} type="date" label="Fecha de nacimiento *" fullWidth InputLabelProps={{ shrink: true }} />
              )}
            />
          </Grid>

          {/* Clase */}
          <Grid item xs={12} sm={8}>
            <Controller
              name="claseInput"
              control={control}
              render={() => (
                <Autocomplete
                  options={claseOptions}
                  loading={loadingClase}
                  value={claseOptions.find((c) => c.idclase === watch("idClase")) || null}
                  getOptionLabel={(opt) =>
                    typeof opt === "string" ? opt : opt?.etiqueta || `Clase ${opt?.gestion || ""}`
                  }
                  isOptionEqualToValue={(a, b) => a?.idclase === b?.idclase}
                  onChange={(_, value) => {
                    if (!value) return setValue("idClase", null);
                    setValue("idClase", value.idclase);
                    setValue("claseInput", value.etiqueta || `Clase ${value.gestion}`);
                  }}
                  renderInput={(params) => <TextField {...params} label="Clase (cohorte) *" />}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button fullWidth variant="outlined" onClick={() => setOpenClase(true)}>
              Nueva Clase
            </Button>
          </Grid>

          {/* Grado */}
          <Grid item xs={12} sm={8}>
            <Controller
              name="gradoInput"
              control={control}
              render={() => (
                <Autocomplete
                  options={gradoOptions}
                  loading={loadingGrado}
                  value={gradoOptions.find((g) => g.idgrado === watch("idGrado")) || null}
                  getOptionLabel={(opt) => (typeof opt === "string" ? opt : opt?.nombre || "")}
                  isOptionEqualToValue={(a, b) => a?.idgrado === b?.idgrado}
                  onChange={(_, value) => {
                    if (!value) return setValue("idGrado", null);
                    setValue("idGrado", value.idgrado);
                    setValue("gradoInput", value.nombre);
                  }}
                  renderInput={(params) => <TextField {...params} label="Grado (rango) *" />}
                />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button fullWidth variant="outlined" onClick={() => setOpenGrado(true)}>
              Nuevo Grado
            </Button>
          </Grid>

          {/* Foto actual y reemplazo */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={fotoPreview || resolveUrl(fotoActual)}
                sx={{ width: 64, height: 64 }}
                imgProps={{ onError: (e) => (e.currentTarget.src = "") }}
              />
              <Button variant="outlined" component="label">
                Reemplazar foto
                <input type="file" accept="image/*" hidden onChange={(e) => setValue("foto", e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Grid>

          {/* Documento actual y reemplazo */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" flexDirection="column" gap={1}>
              {docActual && (
                <Button variant="text" href={resolveUrl(docActual)} target="_blank" rel="noopener noreferrer">
                  Ver documento actual
                </Button>
              )}
              <Button variant="outlined" component="label">
                Reemplazar documento
                <input type="file" accept=".pdf,image/*" hidden onChange={(e) => setValue("fileDocumento", e.target.files?.[0] || null)} />
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} textAlign="center">
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar cambios"}
            </Button>
          </Grid>
        </Grid>
      </form>

      {/* Diálogos */}
      <CreateClaseDialog
        open={openClase}
        onClose={() => setOpenClase(false)}
        onCreated={(c) => {
          setClaseOptions((prev) => [c, ...prev]);
          setValue("idClase", c.idclase);
          setValue("claseInput", c.etiqueta || `Clase ${c.gestion}`);
        }}
      />
      <CreateGradoDialog
        open={openGrado}
        onClose={() => setOpenGrado(false)}
        onCreated={(g) => {
          setGradoOptions((prev) => [g, ...prev]);
          setValue("idGrado", g.idgrado);
          setValue("gradoInput", g.nombre);
        }}
      />
    </Box>
  );
}

/** ====== Página (para rutas /personal/editar/:id) ====== */
export default function PersonalEditarPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const idNum = Number(id);
  return (
    <LayoutDashboard>
      <Box sx={{ mb: 2 }}>
        <DialogContentText>
          Editar personal. Este formulario coincide con el usado en el modal.
        </DialogContentText>
      </Box>
      <PersonalEditarForm id={idNum} onSuccess={() => navigate("/personal")} />
    </LayoutDashboard>
  );
}
