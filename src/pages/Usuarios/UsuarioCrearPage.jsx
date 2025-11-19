import {
  Typography,
  TextField,
  MenuItem,
  Button,
  Box,
  Grid,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import { crearUsuario } from "../../services/usuarios.service";
import api from "../../services/axios";

function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.data)) return x.data;
  if (x && Array.isArray(x.rows)) return x.rows;
  if (x && Array.isArray(x.results)) return x.results;
  return [];
}

/**
 * Este componente puede funcionar:
 * - De forma independiente (página completa)
 * - O dentro de un modal (recibiendo props onClose / onSuccess)
 */
export default function UsuarioCrearPage({ onClose, onSuccess }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm({
    defaultValues: {
      nombreUsuario: "",
      contraseña: "",
      roles: [],
      idPersonal: "",
    },
  });

  const [roles, setRoles] = useState([]);
  const [personales, setPersonales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [resRoles, resPersonal] = await Promise.all([
          api.get("/roles"),
          api.get("/personal"),
        ]);
        setRoles(toArray(resRoles.data));
        setPersonales(toArray(resPersonal.data));
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setRoles([]);
        setPersonales([]);
        setSnackbar({
          open: true,
          message: "Error al cargar roles o personal",
          severity: "error",
        });
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar({ ...snackbar, open: false });
  };

  const onSubmit = async (form) => {
    setLoading(true);
    try {
      const payload = {
        nombreUsuario: form.nombreUsuario,
        contraseña: form.contraseña,
        roles: (form.roles || []).map(Number),
        idPersonal: Number(form.idPersonal),
      };

      await crearUsuario(payload);

      setSnackbar({
        open: true,
        message: "Usuario creado correctamente",
        severity: "success",
      });

      reset();

      // Si está embebido en modal
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo crear el usuario";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        width: "100%",
        maxWidth: 700,
        mx: "auto",
      }}
    >
      <Typography
        variant="h6"
        align="center"
        sx={{ fontWeight: 700, mb: 2, color: "primary.main" }}
      >
        Crear Nuevo Usuario
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Nombre de Usuario"
            {...register("nombreUsuario", {
              required: "Este campo es obligatorio",
            })}
            error={!!errors.nombreUsuario}
            helperText={errors.nombreUsuario?.message}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            type="password"
            label="Contraseña"
            {...register("contraseña", {
              required: "Este campo es obligatorio",
              minLength: {
                value: 6,
                message: "Debe tener al menos 6 caracteres",
              },
            })}
            error={!!errors.contraseña}
            helperText={errors.contraseña?.message}
          />
        </Grid>

        {/* Multi-select de roles */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="roles"
            control={control}
            rules={{ required: "Seleccione al menos un rol" }}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Roles"
                SelectProps={{ multiple: true }}
                value={field.value || []}
                onChange={(e) =>
                  field.onChange((e.target.value || []).map(Number))
                }
                error={!!errors.roles}
                helperText={errors.roles?.message}
              >
                {(roles ?? []).map((rol) => (
                  <MenuItem key={rol.idrol} value={rol.idrol}>
                    {rol.nombre}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Personal */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="idPersonal"
            control={control}
            rules={{ required: "Seleccione un personal" }}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Personal Operativo"
                error={!!errors.idPersonal}
                helperText={errors.idPersonal?.message}
                value={field.value || ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
              >
                {(personales ?? []).map((p) => (
                  <MenuItem key={p.idpersonal} value={p.idpersonal}>
                    {p.nombre} {p.apellido} {p.ci ? `- CI: ${p.ci}` : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Botones */}
        <Grid item xs={12}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            {onClose && (
              <Button variant="outlined" color="inherit" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button
              type="submit"
              variant="contained"
              disabled={loading || loadingData}
              startIcon={(loading || loadingData) && <CircularProgress size={20} />}
            >
              {loading || loadingData ? "Cargando..." : "Crear Usuario"}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar de feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
