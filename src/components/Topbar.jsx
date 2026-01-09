import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Slide,
  useMediaQuery,
  useTheme,
  Chip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useState, forwardRef } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/auth.service";

// Animación del diálogo
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Topbar = () => {
  const { toggleSidebar } = useSidebar();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleCloseMenu();
    setConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    setConfirmOpen(false);

    try {
      // Intentar cerrar sesión en el backend
      await authService.logout();
    } catch (error) {
      console.error("Error al cerrar sesión en backend:", error);
      // Continuar con logout local incluso si falla el backend
    } finally {
      // Limpiar sesión local y redirigir
      logout();
      navigate("/");
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: `linear-gradient(90deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: "white",
          // Safe area para notches/barras de estado en todos los dispositivos
          paddingTop: { xs: 'env(safe-area-inset-top, 0px)', sm: 0 },
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 1, sm: 2, md: 3 },
            minHeight: { xs: 56, sm: 64 },
          }}
        >
          {/* Botón del menú lateral */}
          <IconButton
            color="inherit"
            onClick={toggleSidebar}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon fontSize={isSmallScreen ? "medium" : "large"} />
          </IconButton>

          {/* Logo + título responsivo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <img
              src="/logo-homies.png"
              alt="HOMIES"
              style={{
                height: isSmallScreen ? 32 : 42,
                marginRight: isSmallScreen ? 6 : 10,
              }}
            />
            {!isSmallScreen && (
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Estación HOMIES
              </Typography>
            )}
          </Box>

          {/* Información de usuario + Menú */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && !isSmallScreen && (
              <Box sx={{ textAlign: 'right', mr: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user.miembro_nombre || user.nombre_usuario}
                </Typography>
                {user.roles && user.roles.length > 0 && (
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    {user.roles.join(", ")}
                  </Typography>
                )}
              </Box>
            )}
            <IconButton color="inherit" onClick={handleMenu}>
              <AccountCircle fontSize={isSmallScreen ? "medium" : "large"} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleCloseMenu}
              PaperProps={{
                sx: {
                  mt: 1.5,
                  borderRadius: 2,
                  minWidth: 200,
                },
              }}
            >
              {user && (
                <Box sx={{ px: 2, py: 1, borderBottom: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="body2" fontWeight={600}>
                    {user.miembro_nombre || user.nombre_usuario}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.nombre_usuario}
                  </Typography>
                </Box>
              )}
              <MenuItem onClick={handleLogoutClick} sx={{ mt: 1 }}>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Diálogo de confirmación de logout */}
      <Dialog
        open={confirmOpen}
        TransitionComponent={Transition}
        keepMounted
        onClose={() => setConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            textAlign: "center",
            pb: 1,
            color: "primary.main",
          }}
        >
          ¿Cerrar sesión?
        </DialogTitle>

        <DialogContent sx={{ textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Tu sesión se cerrará y deberás volver a iniciar sesión
            para acceder al sistema.
          </Typography>
        </DialogContent>

        <DialogActions
          sx={{
            display: "flex",
            justifyContent: "center",
            pb: 2,
          }}
        >
          <Button
            onClick={() => setConfirmOpen(false)}
            variant="outlined"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmLogout}
            variant="contained"
            color="error"
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cerrar sesión
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Topbar;
