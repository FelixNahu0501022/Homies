// src/pages/usuarios/UsuarioEditar.jsx
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
  Divider,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { obtenerUsuario, editarUsuario } from "../../services/usuarios.service";
import api from "../../services/axios";

// Normaliza respuestas (array directo o data/rows/results)
function toArray(x) {
  if (Array.isArray(x)) return x;
  if (x && Array.isArray(x.data)) return x.data;
  if (x && Array.isArray(x.rows)) return x.rows;
  if (x && Array.isArray(x.results)) return x.results;
  return [];
}

/**
 * Puede funcionar:
 * - Como página: usa :id de la URL y navega al guardar.
 * - Como modal embebido: recibe props { idUsuario, onClose, onSuccess } y NO usa LayoutDashboard.
 */
export default function UsuarioEditarPage({ idUsuario, onClose, onSuccess }) {
  const params = useParams();
  const navigate = useNavigate();

  const idUrl = params?.id;
  const idNum = useMemo(
    () => (idUsuario != null ? Number(idUsuario) : Number(idUrl)),
    [idUsuario, idUrl]
  );

  const isEmbedded = idUsuario != null || typeof onClose === "function" || typeof onSuccess === "function";

  const [roles, setRoles] = useState([]);
  const [personales, setPersonales] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      nombreUsuario: "",
      roles: [],          // multi-rol (ids numéricos)
      idPersonal: "",     // id numérico
      nuevaContrasena: "",// opcional; si se envía, actualiza la contraseña
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      setFetching(true);
      try {
        if (!idNum || Number.isNaN(idNum)) {
          setSnackbar({ open: true, message: "ID de usuario inválido", severity: "warning" });
          if (!isEmbedded) navigate("/usuarios");
          return;
        }

        const [usuario, resRoles, resPersonal] = await Promise.all([
          obtenerUsuario(idNum),
          api.get("/roles"),
          api.get("/personal"),
        ]);

        if (!usuario) {
          setSnackbar({ open: true, message: "Usuario no encontrado", severity: "warning" });
          if (!isEmbedded) navigate("/usuarios");
          return;
        }

        // Setear valores de formulario
        setValue("nombreUsuario", usuario.nombreusuario ?? "");

        const rolesArray = Array.isArray(usuario.roles)
          ? usuario.roles
          : (usuario.idrol ? [usuario.idrol] : []);
        setValue("roles", rolesArray.map(Number)); // asegurar números
        setValue("idPersonal", usuario.idpersonal ?? "");

        setRoles(toArray(resRoles.data));
        setPersonales(toArray(resPersonal.data));
      } catch (err) {
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "No se pudieron cargar los datos";
        setSnackbar({ open: true, message: msg, severity: "error" });
        if (!isEmbedded) navigate("/usuarios");
      } finally {
        setFetching(false);
      }
    };

    fetchData();
  }, [idNum, isEmbedded, navigate, setValue]);

  const onSubmit = async (form) => {
    setSaving(true);
    try {
      const payload = {
        nombreUsuario: form.nombreUsuario,
        roles: (form.roles || []).map(Number),
        idPersonal: Number(form.idPersonal),
      };
      // Solo enviar contraseña si el usuario ingresó una nueva
      if (form.nuevaContrasena && form.nuevaContrasena.trim().length >= 6) {
        payload.contraseña = form.nuevaContrasena.trim();
      }

      await editarUsuario(idNum, payload);

      setSnackbar({
        open: true,
        message: "Usuario actualizado correctamente",
        severity: "success",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/usuarios");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo actualizar el usuario";
      setSnackbar({ open: true, message: msg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = (_, reason) => {
    if (reason === "clickaway") return;
    setSnackbar((s) => ({ ...s, open: false }));
  };

  // Vista de carga
  if (fetching) {
    const content = (
      <Box sx={{ display: "grid", placeItems: "center", minHeight: 280, p: 2 }}>
        <CircularProgress />
      </Box>
    );
    return isEmbedded ? content : <LayoutDashboard>{content}</LayoutDashboard>;
  }

  // Contenido del formulario (usable en página o modal)
  const formContent = (
    <Box
      component="form"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        width: "100%",
        maxWidth: 800,
        mx: "auto",
      }}
    >
      {!isEmbedded && (
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: 700, color: "primary.main" }}
        >
          Editar Usuario
        </Typography>
      )}

      <Grid container spacing={2}>
        {/* Nombre de usuario */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="nombreUsuario"
            control={control}
            rules={{ required: "Este campo es obligatorio" }}
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Nombre de Usuario"
                error={!!errors.nombreUsuario}
                helperText={errors.nombreUsuario?.message}
              />
            )}
          />
        </Grid>

        {/* Roles (multi-select) */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="roles"
            control={control}
            rules={{
              required: "Seleccione al menos un rol",
              validate: (v) =>
                (Array.isArray(v) && v.length > 0) || "Seleccione al menos un rol",
            }}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Roles"
                SelectProps={{ multiple: true }}
                value={field.value || []}
                onChange={(e) => field.onChange((e.target.value || []).map(Number))}
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
        <Grid item xs={12}>
          <Controller
            name="idPersonal"
            control={control}
            rules={{
              required: "Seleccione un personal",
              validate: (v) => (v === "" ? "Seleccione un personal" : true),
            }}
            render={({ field }) => (
              <TextField
                select
                fullWidth
                label="Personal Operativo"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                error={!!errors.idPersonal}
                helperText={errors.idPersonal?.message}
              >
                {(Array.isArray(personales) ? personales : []).map((p) => (
                  <MenuItem key={p.idpersonal} value={p.idpersonal}>
                    {p.nombre} {p.apellido} {p.ci ? `- CI: ${p.ci}` : ""}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        </Grid>

        {/* Sección opcional: Nueva contraseña */}
        <Grid item xs={12}>
          <Divider sx={{ my: 1 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Seguridad (opcional)
          </Typography>

          <Controller
            name="nuevaContrasena"
            control={control}
            rules={{
              validate: (v) =>
                !v || v.length >= 6 || "Debe tener al menos 6 caracteres",
            }}
            render={({ field }) => (
              <TextField
                {...field}
                type={showNewPassword ? "text" : "password"}
                fullWidth
                label="Nueva contraseña (dejar en blanco para no cambiar)"
                error={!!errors.nuevaContrasena}
                helperText={errors.nuevaContrasena?.message}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((p) => !p)}
                        aria-label="mostrar u ocultar contraseña"
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
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
              mt: 1,
            }}
          >
            {isEmbedded && onClose && (
              <Button variant="outlined" color="inherit" onClick={onClose}>
                Cancelar
              </Button>
            )}
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </Box>
        </Grid>
      </Grid>

      {/* Snackbar */}
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

  // Si es modal embebido, no usamos LayoutDashboard
  if (isEmbedded) return formContent;

  // Como página independiente
  return <LayoutDashboard>{formContent}</LayoutDashboard>;
}
