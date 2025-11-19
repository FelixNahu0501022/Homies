import { Box, Button, CircularProgress, Grid, Paper, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { crearRol } from "../../services/roles.service";
import Swal from "sweetalert2";

export default function RolCrearPage({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm({
    defaultValues: { nombre: "", descripcion: "" },
  });

  const onSubmit = async (form) => {
    try {
      await crearRol(form);
      onSuccess?.();
      reset();
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.error || "No se pudo crear el rol", "error");
    }
  };

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
                {isSubmitting ? "Guardando..." : "Crear rol"}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
}
