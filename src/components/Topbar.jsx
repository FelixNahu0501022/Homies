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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircle from "@mui/icons-material/AccountCircle";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { useState, forwardRef } from "react";
import escudo from "../assets/img/EscudoSantaBarbara.jpg";

// Animación del diálogo
const Transition = forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const Topbar = () => {
  const { toggleSidebar } = useSidebar();
  const { logout } = useAuth();
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

  const handleConfirmLogout = () => {
    setConfirmOpen(false);
    logout();
  };

  return (
    <>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background:
            "linear-gradient(90deg, #003366 0%, #0055aa 100%)",
        }}
      >
        <Toolbar
          sx={{
            display: "flex",
            justifyContent: "space-between",
            px: { xs: 1, sm: 2, md: 3 },
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
              src={escudo}
              alt="Logo Santa Bárbara"
              style={{
                height: isSmallScreen ? 32 : 42,
                marginRight: isSmallScreen ? 6 : 10,
                borderRadius: "50%",
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
                2a Compañía de Bomberos Santa Bárbara
              </Typography>
            )}
          </Box>

          {/* Menú de usuario */}
          <Box>
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
                  minWidth: 160,
                },
              }}
            >
              <MenuItem onClick={handleLogoutClick}>Cerrar sesión</MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* 🧩 Diálogo de confirmación */}
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
