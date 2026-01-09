import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Divider,
  Typography,
  useTheme,
  useMediaQuery,
  ListItemButton,
  Box,
} from "@mui/material";
import {
  Dashboard,
  People,
  Inventory2,
  ShoppingCart,
  Payment,
  ManageAccounts,
  Security,
  Assessment
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { isSidebarOpen, toggleSidebar } = useSidebar();
  const { hasPermission, hasRole } = useAuth();

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Miembros", icon: <People />, path: "/miembros", permission: "miembros.gestion", roles: ["rpp"] },
    { text: "Productos", icon: <Inventory2 />, path: "/productos", permission: "productos.gestion", hiddenRoles: ["rpp"] },
    { text: "Ventas", icon: <ShoppingCart />, path: "/ventas" },
    { text: "Pagos", icon: <Payment />, path: "/pagos", permission: "pagos.gestion" },
    { text: "Usuarios", icon: <ManageAccounts />, path: "/usuarios", permission: "usuarios.gestion", hiddenRoles: ["rpp"] },
    { text: "Roles y Permisos", icon: <Security />, path: "/roles", permission: "roles.gestion", hiddenRoles: ["rpp"] },
    { text: "Reportes", icon: <Assessment />, path: "/reportes", permission: "ventas.gestion", hiddenRoles: ["rpp"] },
    { text: "Mi Inventario", icon: <Inventory2 />, path: "/mi-stock" },
    { text: "Gestionar Stock RPP", icon: <Inventory2 />, path: "/inventario/gestion", permission: "productos.gestion", hiddenRoles: ["rpp"] },
  ];

  const filteredItems = menuItems.filter(item => {
    // 0. Si es ADMIN, ve todo (excepto si hubiera bloq explícito, que no debería aplicar al admin usualmente)
    // Pero respetaremos hiddenRoles por si acaso se quisiera ocultar algo al admin a futuro
    if (item.hiddenRoles && item.hiddenRoles.some(role => hasRole(role))) return false;

    // Admin Master Key
    if (hasRole('admin')) return true;

    // 1. Bloqueo explícito por Rol (hiddenRoles) - GANA SIEMPRE
    if (item.hiddenRoles && item.hiddenRoles.some(role => hasRole(role))) return false;

    // 2. Si no tiene restricciones de permiso ni roles positivos, es público
    if (!item.permission && !item.roles) return true;

    // 3. Verificar permisos (si tiene el permiso, pasa - a menos que haya sido bloqueado arriba)
    if (item.permission && hasPermission(item.permission)) return true;

    // 4. Verificar roles explícitos (si tiene el rol permitido)
    if (item.roles && item.roles.some(role => hasRole(role))) return true;

    return false;
  });

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) toggleSidebar(); // Cierra el menú al hacer clic en móvil
  };

  return (
    <>
      {/* Drawer persistente (escritorio) */}
      {!isMobile && (
        <Drawer
          variant="persistent"
          open={isSidebarOpen}
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              backgroundColor: "#fff",
            },
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img
                src="/logo-homies.png"
                alt="HOMIES"
                style={{ height: '40px', width: 'auto' }}
              />
            </Box>
          </Toolbar>
          <Divider />
          <List>
            {filteredItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ x: 5 }}
                >
                  <ListItemButton
                    selected={isActive}
                    onClick={() => handleNavigate(item.path)}
                    sx={{
                      position: 'relative',
                      '&.Mui-selected': {
                        background: 'linear-gradient(90deg, rgba(123, 41, 152, 0.1) 0%, transparent 100%)',
                        borderLeft: '4px solid #7B2998',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '4px',
                          height: '60%',
                          background: 'linear-gradient(180deg, #FFE500 0%, #FF6B35 100%)',
                          boxShadow: '0 0 10px rgba(255, 229, 0, 0.6)',
                        },
                      },
                      '&:hover': {
                        background: 'linear-gradient(90deg, rgba(255, 229, 0, 0.08) 0%, transparent 100%)',
                      },
                    }}
                  >
                    <ListItemIcon>
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        style={{
                          display: 'flex',
                          color: isActive ? '#7B2998' : 'inherit',
                          filter: isActive ? 'drop-shadow(0 0 8px rgba(123, 41, 152, 0.5))' : 'none',
                        }}
                      >
                        {item.icon}
                      </motion.div>
                    </ListItemIcon>
                    <ListItemText
                      primary={item.text}
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 400,
                        color: isActive ? 'primary.main' : 'text.primary',
                      }}
                    />
                  </ListItemButton>
                </motion.div>
              );
            })}
          </List>
        </Drawer>
      )}

      {/* Drawer temporal (mobile) */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={isSidebarOpen}
          onClose={toggleSidebar}
          ModalProps={{
            keepMounted: true, // mejor rendimiento en móviles
          }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              backgroundColor: "#fff",
              // Safe area para móviles con notch
              paddingTop: 'env(safe-area-inset-top, 0px)',
            },
          }}
        >
          <Toolbar>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <img
                src="/logo-homies.png"
                alt="HOMIES"
                style={{ height: '40px', width: 'auto' }}
              />
            </Box>
          </Toolbar>
          <Divider />
          <List>
            {filteredItems.map((item) => (
              <ListItemButton
                key={item.text}
                selected={location.pathname === item.path}
                onClick={() => handleNavigate(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            ))}
          </List>
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
