// src/pages/Personal/PersonalCrearPage.jsx
import {
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  CircularProgress,
  Backdrop,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { crearPersonal } from "../../services/personal.service";
import api from "../../services/axios";
import debounce from "lodash.debounce";

export function PersonalCrearForm({ onSuccess }) {
  // preview foto
  const [fotoPreview, setFotoPreview] = useState(null);

  // catálogos
  const [claseOptions, setClaseOptions] = useState([]); // { idclase, gestion, etiqueta }
  const [gradoOptions, setGradoOptions] = useState([]); // { idgrado, nombre }
  const [loadingClase, setLoadingClase] = useState(false);
  const [loadingGrado, setLoadingGrado] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
    setValue,
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
      // ⚠️ No incluimos "activo" aquí (es true por defecto en backend y se gestiona desde la lista)
    },
  });

  // foto preview
  const fotoFile = watch("foto");
  useEffect(() => {
    if (fotoFile instanceof File) {
      const url = URL.createObjectURL(fotoFile);
      setFotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFotoPreview(null);
  }, [fotoFile]);

  // ---- Fetchers de catálogos ----
  const fetchClases = async (q) => {
    setLoadingClase(true);
    try {
      const { data } = await api.get("/clases", { params: { search: q } });
      setClaseOptions(data || []);
    } catch {
      setClaseOptions([]);
    } finally {
      setLoadingClase(false);
    }
  };
  const fetchGrados = async (q) => {
    setLoadingGrado(true);
    try {
      const { data } = await api.get("/grados", { params: { search: q } });
      setGradoOptions(data || []);
    } catch {
      setGradoOptions([]);
    } finally {
      setLoadingGrado(false);
    }
  };
  const debouncedFetchClases = useMemo(() => debounce(fetchClases, 350), []);
  const debouncedFetchGrados = useMemo(() => debounce(fetchGrados, 350), []);

  useEffect(() => { fetchClases(""); }, []);
  useEffect(() => { fetchGrados(""); }, []);

  // ---- Submit ----
  const onSubmit = async (form) => {
    try {
      const { idClase, idGrado } = form;
      if (!Number.isInteger(idClase)) throw new Error("Seleccione una Clase (cohorte) válida");
      if (!Number.isInteger(idGrado)) throw new Error("Seleccione un Grado válido");

      const payload = {
        nombre: form.nombre,
        apellido: form.apellido,
        ci: form.ci,
        fechaNacimiento: form.fechaNacimiento, // YYYY-MM-DD
        idClase: Number(idClase),
        idGrado: Number(idGrado),
        telefono: form.telefono || "",
        foto: form.foto || null,               // File o null (services lo envían como FormData)
        fileDocumento: form.fileDocumento || null, // File o null
      };

      await crearPersonal(payload);

      // éxito -> reset + cerrar modal desde callback del padre
      Swal.fire({
        icon: "success",
        title: "Personal creado correctamente",
        timer: 1200,
        showConfirmButton: false,
      });
      reset();
      if (onSuccess) onSuccess();
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo crear el registro";
      Swal.fire("Error", msg, "error");
    }
  };

  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2 } }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          {/* Nombre */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="nombre"
              control={control}
              rules={{ required: "El nombre es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nombre"
                  fullWidth
                  autoFocus
                  error={!!errors.nombre}
                  helperText={errors.nombre?.message}
                />
              )}
            />
          </Grid>

          {/* Apellido */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="apellido"
              control={control}
              rules={{ required: "El apellido es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Apellido"
                  fullWidth
                  error={!!errors.apellido}
                  helperText={errors.apellido?.message}
                />
              )}
            />
          </Grid>

          {/* CI */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="ci"
              control={control}
              rules={{
                required: "El CI es obligatorio",
                pattern: { value: /^\d{5,20}$/, message: "Solo dígitos (5–20)" },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="CI"
                  fullWidth
                  error={!!errors.ci}
                  helperText={errors.ci?.message}
                />
              )}
            />
          </Grid>

          {/* Teléfono */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="telefono"
              control={control}
              rules={{
                pattern: { value: /^\+?\d{7,15}$/, message: "Formato válido: + y 7–15 dígitos" },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Teléfono"
                  fullWidth
                  error={!!errors.telefono}
                  helperText={errors.telefono?.message}
                />
              )}
            />
          </Grid>

          {/* Fecha Nacimiento */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="fechaNacimiento"
              control={control}
              rules={{ required: "La fecha de nacimiento es obligatoria" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Fecha de nacimiento"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!errors.fechaNacimiento}
                  helperText={errors.fechaNacimiento?.message}
                />
              )}
            />
          </Grid>

          {/* Clase (cohorte) */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="claseInput"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={claseOptions}
                  loading={loadingClase}
                  inputValue={field.value || ""}
                  onInputChange={(_, v) => {
                    field.onChange(v);
                    debouncedFetchClases(v);
                  }}
                  isOptionEqualToValue={(a, b) =>
                    a?.idclase && b?.idclase ? a.idclase === b.idclase : a === b
                  }
                  getOptionLabel={(opt) =>
                    typeof opt === "string"
                      ? opt
                      : opt?.etiqueta || (opt?.gestion ? `Clase ${opt.gestion}` : "")
                  }
                  onChange={(_, value) => {
                    if (!value) {
                      setValue("idClase", null, { shouldValidate: true });
                      field.onChange("");
                      return;
                    }
                    setValue("idClase", value.idclase, { shouldValidate: true });
                    field.onChange(value.etiqueta || `Clase ${value.gestion}`);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Clase (cohorte)"
                      placeholder="Busca una clase"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingClase ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Grado (rango) */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="gradoInput"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  options={gradoOptions}
                  loading={loadingGrado}
                  inputValue={field.value || ""}
                  onInputChange={(_, v) => {
                    field.onChange(v);
                    debouncedFetchGrados(v);
                  }}
                  isOptionEqualToValue={(a, b) =>
                    a?.idgrado && b?.idgrado ? a.idgrado === b.idgrado : a === b
                  }
                  getOptionLabel={(opt) =>
                    typeof opt === "string" ? opt : opt?.nombre || ""
                  }
                  onChange={(_, value) => {
                    if (!value) {
                      setValue("idGrado", null, { shouldValidate: true });
                      field.onChange("");
                      return;
                    }
                    setValue("idGrado", value.idgrado, { shouldValidate: true });
                    field.onChange(value.nombre);
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Grado (rango)"
                      placeholder="Busca un grado"
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingGrado ? <CircularProgress size={18} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                />
              )}
            />
          </Grid>

          {/* Foto */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={fotoPreview || undefined}
                alt="Foto"
                sx={{ width: 64, height: 64 }}
              />
              <Button variant="outlined" component="label">
                Subir foto
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setValue("foto", file, { shouldValidate: true });
                  }}
                />
              </Button>
            </Box>
          </Grid>

          {/* Documento */}
          <Grid item xs={12} sm={6}>
            <Button variant="outlined" component="label" fullWidth>
              Adjuntar documento (PDF/imagen)
              <input
                type="file"
                accept=".pdf,image/*"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setValue("fileDocumento", file, { shouldValidate: true });
                }}
              />
            </Button>
            <Box mt={1} sx={{ fontSize: 13, color: "text.secondary" }}>
              {watch("fileDocumento") instanceof File
                ? `Archivo: ${watch("fileDocumento").name}`
                : "Ningún archivo seleccionado"}
            </Box>
          </Grid>

          {/* Botón guardar */}
          <Grid item xs={12}>
            <Box textAlign="center" mt={1}>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Crear"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Overlay de envío */}
      <Backdrop
        open={isSubmitting}
        sx={{ color: "#fff", zIndex: (t) => t.zIndex.modal + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </Paper>
  );
}

export default PersonalCrearForm;
