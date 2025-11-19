import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  Autocomplete,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  crearVehiculo,
  listarMarcas,
  crearMarca,
  listarTipos,
  crearTipo,
} from "../../services/vehiculos.service";

/**
 * ⚠️ Mantiene el nombre y export por pedido del usuario.
 * Este componente está optimizado para usarse DENTRO de un <Dialog> externo
 * (como hace PersonalPage). No incluye LayoutDashboard ni navegación.
 * Acepta onSuccess() para notificar al padre cuando se crea correctamente.
 */
export default function VehiculoCrearPage({ onSuccess }) {
  const [fotoPreview, setFotoPreview] = useState(null);
  const [loadingCat, setLoadingCat] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      placa: "",
      modelo: "",
      nominacion: "",
      estado: "Operativo",
      foto: null,
      idMarca: null,
      idTipo: null,
    },
  });

  // Catálogos + diálogos
  const [marcasOpt, setMarcasOpt] = useState([]);
  const [tiposOpt, setTiposOpt] = useState([]);
  const [dlgMarcaOpen, setDlgMarcaOpen] = useState(false);
  const [dlgTipoOpen, setDlgTipoOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [marcas, tipos] = await Promise.all([
          listarMarcas("", 50, 0),
          listarTipos("", 50, 0),
        ]);
        setMarcasOpt(marcas || []);
        setTiposOpt(tipos || []);
      } catch (e) {
        Swal.fire("Error", "No se pudieron cargar catálogos", "error");
      } finally {
        setLoadingCat(false);
      }
    })();
  }, []);

  // Preview de foto local
  const fotoFile = watch("foto");
  useEffect(() => {
    if (fotoFile instanceof File) {
      const url = URL.createObjectURL(fotoFile);
      setFotoPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setFotoPreview(null);
  }, [fotoFile]);

  const onSubmit = async (form) => {
    try {
      if (!form.idMarca) return Swal.fire("Valida", "Selecciona una Marca", "info");
      if (!form.idTipo) return Swal.fire("Valida", "Selecciona un Tipo", "info");

      await crearVehiculo({
        placa: form.placa,
        modelo: form.modelo,
        nominacion: form.nominacion,
        estado: form.estado,
        foto: form.foto || null,
        idMarca: form.idMarca,
        idTipo: form.idTipo,
      });

      Swal.fire("Éxito", "Vehículo creado correctamente", "success");
      reset();
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo crear el vehículo";
      Swal.fire("Error", msg, "error");
    }
  };

  if (loadingCat) {
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, boxShadow: 0 }}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Controller
              name="placa"
              control={control}
              rules={{ required: "La placa es obligatoria" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Placa"
                  fullWidth
                  autoFocus
                  error={!!errors.placa}
                  helperText={errors.placa?.message}
                />
              )}
            />
          </Grid>

          {/* Marca: selección + botón "+" */}
          <Grid item xs={12} sm={4}>
            <Controller
              name="idMarca"
              control={control}
              rules={{ required: "Selecciona una marca" }}
              render={({ field: { value, onChange } }) => (
                <Box display="flex" gap={1} alignItems="flex-start">
                  <Autocomplete
                    options={marcasOpt}
                    getOptionLabel={(opt) => opt?.nombre || ""}
                    isOptionEqualToValue={(opt, val) => opt.idmarca === val?.idmarca}
                    value={marcasOpt.find((o) => o.idmarca === value) || null}
                    onOpen={async () => {
                      try {
                        setMarcasOpt(await listarMarcas("", 50, 0));
                      } catch {}
                    }}
                    onChange={(_, opt) => onChange(opt ? opt.idmarca : null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Marca"
                        fullWidth
                        error={!!errors.idMarca}
                        helperText={errors.idMarca?.message}
                        inputProps={{ ...params.inputProps, readOnly: true }}
                      />
                    )}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setDlgMarcaOpen(true)}
                  >
                    Nueva
                  </Button>
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="modelo"
              control={control}
              rules={{ required: "El modelo es obligatorio" }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Modelo"
                  fullWidth
                  error={!!errors.modelo}
                  helperText={errors.modelo?.message}
                />
              )}
            />
          </Grid>

          {/* Tipo: selección + botón "+" */}
          <Grid item xs={12} sm={4}>
            <Controller
              name="idTipo"
              control={control}
              rules={{ required: "Selecciona un tipo" }}
              render={({ field: { value, onChange } }) => (
                <Box display="flex" gap={1} alignItems="flex-start">
                  <Autocomplete
                    options={tiposOpt}
                    getOptionLabel={(opt) => opt?.nombre || ""}
                    isOptionEqualToValue={(opt, val) => opt.idtipo === val?.idtipo}
                    value={tiposOpt.find((o) => o.idtipo === value) || null}
                    onOpen={async () => {
                      try {
                        setTiposOpt(await listarTipos("", 50, 0));
                      } catch {}
                    }}
                    onChange={(_, opt) => onChange(opt ? opt.idtipo : null)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Tipo"
                        fullWidth
                        error={!!errors.idTipo}
                        helperText={errors.idTipo?.message}
                        inputProps={{ ...params.inputProps, readOnly: true }}
                      />
                    )}
                    sx={{ flex: 1 }}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => setDlgTipoOpen(true)}
                  >
                    Nuevo
                  </Button>
                </Box>
              )}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <Controller
              name="nominacion"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Nominación"
                  fullWidth
                  placeholder="Ej: AB-1, AMB-2"
                />
              )}
            />
          </Grid>

          {/* Foto */}
          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar src={fotoPreview || undefined} alt="Foto" sx={{ width: 64, height: 64 }} />
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

          <Grid item xs={12}>
            <Box textAlign="center">
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Crear"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

      {/* Diálogos de catálogo con MUI Dialog */}
      <Dialog open={dlgMarcaOpen} onClose={() => setDlgMarcaOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nueva marca</DialogTitle>
        <DialogContent>
          <CrearCatalogoBody
            label="Nombre de la marca"
            onCancel={() => setDlgMarcaOpen(false)}
            onSave={async (nombre) => {
              try {
                const created = await crearMarca(nombre);
                const data = await listarMarcas("", 50, 0);
                setMarcasOpt(data || []);
                setValue("idMarca", created?.idmarca ?? null, { shouldValidate: true });
                setDlgMarcaOpen(false);
              } catch (e) {
                Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo crear", "error");
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dlgTipoOpen} onClose={() => setDlgTipoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Nuevo tipo</DialogTitle>
        <DialogContent>
          <CrearCatalogoBody
            label="Nombre del tipo"
            onCancel={() => setDlgTipoOpen(false)}
            onSave={async (nombre) => {
              try {
                const created = await crearTipo(nombre);
                const data = await listarTipos("", 50, 0);
                setTiposOpt(data || []);
                setValue("idTipo", created?.idtipo ?? null, { shouldValidate: true });
                setDlgTipoOpen(false);
              } catch (e) {
                Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "No se pudo crear", "error");
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </Paper>
  );
}

function CrearCatalogoBody({ label, onCancel, onSave }) {
  const [nombre, setNombre] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!nombre.trim()) return;
    try {
      setSaving(true);
      await onSave(nombre.trim());
      setNombre("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ pt: 1 }}>
      <TextField
        label={label}
        fullWidth
        autoFocus
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave();
        }}
        sx={{ mt: 1, mb: 2 }}
      />
      <Box display="flex" justifyContent="flex-end" gap={1}>
        <Button variant="text" onClick={onCancel}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar"}
        </Button>
      </Box>
    </Box>
  );
}
