import { Box, Button, CircularProgress, Grid, Paper, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { obtenerRol, editarRol } from "../../services/roles.service";
import Swal from "sweetalert2";

export default function RolEditarPage({ idRol, onClose, onSuccess }) {
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const rol = await obtenerRol(idRol);
        setValue("nombre", rol.nombre || "");
        setValue("descripcion", rol.descripcion || "");
      } catch (err) {
        Swal.fire("Error", "No se pudo cargar el rol", "error");
        onClose?.();
      } finally {
        setLoading(false);
      }
    })();
  }, [idRol, onClose, setValue]);

  const onSubmit = async (form) => {
    try {
      await editarRol(idRol, form);
      onSuccess?.();
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.error || "No se pudo actualizar el rol", "error");
    }
  };

  if (loading)
    return (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Paper sx={{ p: 2 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Nombre del rol"
              fullWidth
              {...register("nombre", { required: "Campo obligatorio" })}
              error={!!errors.nombre}
              helperText={errors.nombre?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              {...register("descripcion")}
            />
          </Grid>

          <Grid item xs={12}>
            <Box textAlign="center">
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                startIcon={isSubmitting && <CircularProgress size={20} />}
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
