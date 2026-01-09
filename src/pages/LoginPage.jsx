import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import authService from "../services/auth.service";
import Swal from "sweetalert2";
import AnimatedBackground from "../components/AnimatedBackground";
import AnimatedMascot from "../components/AnimatedMascot";
import { slideInFromTop, slideInFromBottom, scaleIn, float } from "../utils/animations";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [formData, setFormData] = useState({
    nombre_usuario: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.nombre_usuario.trim()) {
      setError("Por favor ingresa tu nombre de usuario");
      return;
    }
    if (!formData.password) {
      setError("Por favor ingresa tu contraseña");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.login(
        formData.nombre_usuario,
        formData.password
      );

      if (response.success && response.token && response.usuario) {
        login(response.token, response.usuario);

        Swal.fire({
          icon: "success",
          title: "¡Bienvenido!",
          text: `Hola ${response.usuario.nombres} ${response.usuario.apellidos}`,
          timer: 2000,
          showConfirmButton: false,
        });

        navigate("/dashboard");
      } else {
        setError("Error en la respuesta del servidor.");
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError(err.response?.data?.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Fondo animado */}
      <AnimatedBackground />

      {/* Contenedor principal */}
      <Container
        maxWidth="sm"
        sx={{
          position: "relative",
          zIndex: 1,
          py: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* Mascota animada (solo desktop) */}
          {!isMobile && (
            <motion.div {...scaleIn} style={{ marginBottom: theme.spacing(2) }}>
              <AnimatedMascot size={isMobile ? 100 : 140} />
            </motion.div>
          )}

          {/* Logo animado */}
          <motion.div
            {...slideInFromTop}
            style={{
              width: "100%",
              textAlign: "center",
              marginBottom: theme.spacing(3),
            }}
          >
            <motion.img
              src="/logo-homies.png"
              alt="HOMIES"
              style={{
                width: "100%",
                maxWidth: isMobile ? "250px" : "350px",
                height: "auto",
                filter: "drop-shadow(0 10px 30px rgba(255, 229, 0, 0.6))",
              }}
              {...float}
            />
          </motion.div>

          {/* Formulario con Glassmorphism */}
          <motion.div {...slideInFromBottom} style={{ width: "100%" }}>
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                padding: { xs: 3, sm: 4, md: 5 },
                borderRadius: 4,
                background: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(20px)",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px rgba(123, 41, 152, 0.4)",
              }}
            >
              {/* Título */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  component="h1"
                  gutterBottom
                  textAlign="center"
                  fontWeight={800}
                  sx={{
                    background: "linear-gradient(135deg, #FFE500 0%, #FF6B35 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    textShadow: "0 0 30px rgba(255, 229, 0, 0.5)",
                  }}
                >
                  Iniciar Sesión
                </Typography>

                <Typography
                  variant="body1"
                  textAlign="center"
                  sx={{
                    color: "white",
                    mb: 3,
                    textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                  }}
                >
                  Bienvenido a Estación HOMIES ✨
                </Typography>
              </motion.div>

              {/* Alerta de error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      background: "rgba(244, 67, 54, 0.2)",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(244, 67, 54, 0.5)",
                      color: "white",
                    }}
                    onClose={() => setError("")}
                  >
                    {error}
                  </Alert>
                </motion.div>
              )}

              {/* Formulario */}
              <Box component="form" onSubmit={handleSubmit} noValidate>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <TextField
                    fullWidth
                    id="nombre_usuario"
                    name="nombre_usuario"
                    label="Nombre de Usuario"
                    placeholder="Ingresa tu usuario"
                    variant="outlined"
                    margin="normal"
                    required
                    autoComplete="username"
                    autoFocus
                    value={formData.nombre_usuario}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircle sx={{ color: "rgba(255,255,255,0.7)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(10px)",
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "#FFE500",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#FFE500",
                          borderWidth: 2,
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(255,255,255,0.7)",
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#FFE500",
                      },
                    }}
                  />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    label="Contraseña"
                    placeholder="Ingresa tu contraseña"
                    variant="outlined"
                    margin="normal"
                    required
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: "rgba(255,255,255,0.7)" }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            sx={{ color: "rgba(255,255,255,0.7)" }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 3,
                      "& .MuiOutlinedInput-root": {
                        background: "rgba(255, 255, 255, 0.1)",
                        backdropFilter: "blur(10px)",
                        color: "white",
                        "& fieldset": {
                          borderColor: "rgba(255, 255, 255, 0.3)",
                        },
                        "&:hover fieldset": {
                          borderColor: "#FFE500",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "#FFE500",
                          borderWidth: 2,
                        },
                      },
                      "& .MuiInputLabel-root": {
                        color: "rgba(255,255,255,0.7)",
                      },
                      "& .MuiInputLabel-root.Mui-focused": {
                        color: "#FFE500",
                      },
                    }}
                  />
                </motion.div>

                {/* Botón de iniciar sesión */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={loading}
                    sx={{
                      mt: 2,
                      py: 1.5,
                      fontSize: { xs: "1rem", sm: "1.1rem" },
                      fontWeight: 700,
                      background: "linear-gradient(135deg, #FFE500 0%, #FF6B35 100%)",
                      color: "#1A1A1A",
                      border: "none",
                      boxShadow: "0 4px 20px rgba(255, 229, 0, 0.4)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #FF6B35 0%, #FFE500 100%)",
                        boxShadow: "0 6px 30px rgba(255, 229, 0, 0.6)",
                      },
                      "&:disabled": {
                        background: "rgba(255, 255, 255, 0.2)",
                        color: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} sx={{ color: "#1A1A1A" }} />
                    ) : (
                      "Iniciar Sesión 🚀"
                    )}
                  </Button>
                </motion.div>

                {/* Info adicional */}
                <Box sx={{ mt: 3, textAlign: "center" }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "rgba(255,255,255,0.6)",
                      textShadow: "0 2px 10px rgba(0,0,0,0.5)",
                    }}
                  >
                    Límite: 5 intentos cada 15 minutos
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <Typography
              variant="body2"
              sx={{
                mt: 3,
                textAlign: "center",
                color: "white",
                textShadow: "0 2px 10px rgba(0,0,0,0.5)",
              }}
            >
              © {new Date().getFullYear()} Estación HOMIES ✨
            </Typography>
          </motion.div>
        </Box>
      </Container>
    </Box>
  );
}

export default LoginPage;
