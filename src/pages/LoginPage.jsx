import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Container,
  Alert,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import { AccountCircle, Lock, Visibility, VisibilityOff } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@mui/material/styles";
import { useState } from "react";
import API from "../services/axios";
import { useAuth } from "../context/AuthContext";
import escudo from "../assets/img/EscudoSantaBarbara.jpg";

function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClickShowPassword = () => setShowPassword((prev) => !prev);

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await API.post("/auth/login", data);
      login(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      const mensaje =
        err.response?.data?.error || "Error desconocido. Intente más tarde.";
      setErrorMsg(mensaje);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        backgroundImage: `url(${escudo})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      {/* Overlay para contraste */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.45)",
        }}
      />

      <Container
        maxWidth={isSmallScreen ? "xs" : "sm"}
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        <Card
          elevation={8}
          sx={{
            p: isSmallScreen ? 3 : 5,
            borderRadius: 4,
            backdropFilter: "blur(10px)",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <CardContent>
            {/* Encabezado */}
            <Box sx={{ textAlign: "center", mb: 3 }}>
              <img
                src={escudo}
                alt="Escudo institucional"
                style={{
                  width: isSmallScreen ? 60 : 80,
                  height: isSmallScreen ? 60 : 80,
                  borderRadius: "50%",
                  marginBottom: 8,
                }}
              />
              <Typography
                variant={isSmallScreen ? "h6" : "h5"}
                sx={{
                  fontWeight: 700,
                  color: "primary.main",
                  lineHeight: 1.2,
                }}
              >
                Sistema de Gestión
              </Typography>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ fontSize: isSmallScreen ? "0.8rem" : "0.9rem" }}
              >
                Municipalidad de Santa Bárbara
              </Typography>
            </Box>

            {/* Alerta de error */}
            {errorMsg && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMsg}
              </Alert>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                label="Nombre de Usuario"
                fullWidth
                margin="normal"
                {...register("nombreUsuario", {
                  required: "Campo obligatorio",
                })}
                error={!!errors.nombreUsuario}
                helperText={errors.nombreUsuario?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircle />
                    </InputAdornment>
                  ),
                }}
                inputProps={{ "aria-label": "nombre de usuario" }}
                autoFocus
              />

              <TextField
                label="Contraseña"
                type={showPassword ? "text" : "password"}
                fullWidth
                margin="normal"
                {...register("contraseña", {
                  required: "Campo obligatorio",
                })}
                error={!!errors.contraseña}
                helperText={errors.contraseña?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleClickShowPassword}
                        edge="end"
                        aria-label="mostrar u ocultar contraseña"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{
                  mt: 3,
                  py: 1.3,
                  fontWeight: 700,
                  fontSize: isSmallScreen ? "0.9rem" : "1rem",
                  borderRadius: 2,
                  boxShadow: 3,
                  textTransform: "none",
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </form>

            {/* Pie de página */}
            <Typography
              variant="caption"
              display="block"
              align="center"
              sx={{
                mt: 3,
                color: "text.secondary",
                fontSize: isSmallScreen ? "0.7rem" : "0.8rem",
              }}
            >
              © 2025 Santa Bárbara
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default LoginPage;
