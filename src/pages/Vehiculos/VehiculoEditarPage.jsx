import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  CircularProgress,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import Swal from "sweetalert2";
import {
  obtenerVehiculo,
  editarVehiculo,
  listarMarcas,
  crearMarca,
  listarTipos,
  crearTipo,
} from "../../services/vehiculos.service";

/**
 * 🚀 Versión optimizada para usarse como modal dentro de VehiculosPage.
 * Mantiene el nombre original para compatibilidad con rutas y referencias.
 */
export default function VehiculoEditarPage({ id, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoActual, setFotoActual] = useState(null);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
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

  const [marcasOpt, setMarcasOpt] = useState([]);
  const [tiposOpt, setTiposOpt] = useState([]);
  const [dlgMarcaOpen, setDlgMarcaOpen] = useState(false);
  const [dlgTipoOpen, setDlgTipoOpen] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [marcas, tipos, v] = await Promise.all([
          listarMarcas("", 50, 0),
          listarTipos("", 50, 0),
          obtenerVehiculo(id),
        ]);
        if (!v) {
          Swal.fire("Aviso", "Vehículo no encontrado", "warning");
          return;
        }
        setMarcasOpt(marcas || []);
        setTiposOpt(tipos || []);
        reset({
          placa: v.placa ?? "",
          modelo: v.modelo ?? "",
          nominacion: v.nominacion ?? "",
          estado: v.estado ?? "Operativo",
          foto: null,
          idMarca: v.idmarca ?? null,
          idTipo: v.idtipo ?? null,
        });
        setFotoActual(v.foto || null);
      } catch (err) {
        const msg =
          err?.response?.data?.mensaje ||
          err?.response?.data?.error ||
          err?.message ||
          "No se pudieron cargar los datos";
        Swal.fire("Error", msg, "error");
      } finally {
        setLoading(false);
      }
    };
    if (id) cargar();
  }, [id, reset]);

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

      await editarVehiculo(id, {
        placa: form.placa,
        modelo: form.modelo,
        nominacion: form.nominacion,
        estado: form.estado,
        foto: form.foto || null,
        idMarca: form.idMarca,
        idTipo: form.idTipo,
      });

      Swal.fire("Éxito", "Vehículo actualizado correctamente", "success");
      onSuccess?.();
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo actualizar el vehículo";
      Swal.fire("Error", msg, "error");
    }
  };

  if (loading) {
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
                  error={!!errors.placa}
                  helperText={errors.placa?.message}
                />
              )}
            />
          </Grid>

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

          <Grid item xs={12} sm={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                src={fotoPreview || fotoActual || undefined}
                alt="Foto"
                sx={{ width: 64, height: 64 }}
              />
              <Button variant="outlined" component="label">
                Reemplazar foto
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
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>

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
