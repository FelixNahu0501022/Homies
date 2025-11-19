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
} from "@mui/material";
import {
  Dashboard,
  People,
  Security,
  Engineering,
  DirectionsCar,
  School,
  Inventory2,
  VolunteerActivism,
  LocalFireDepartment,
  BadgeOutlined,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  const menuItems = [
    { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
    { text: "Usuarios", icon: <People />, path: "/usuarios" },
    { text: "Roles", icon: <Security />, path: "/roles" },
    { text: "Personal", icon: <Engineering />, path: "/personal" },
    { text: "Vehículos", icon: <DirectionsCar />, path: "/vehiculos" },
    { text: "Capacitaciones", icon: <School />, path: "/capacitaciones" },
    { text: "Inventario", icon: <Inventory2 />, path: "/inventario" },
    { text: "Donativos", icon: <VolunteerActivism />, path: "/donativos" },
    { text: "Emergencias", icon: <LocalFireDepartment />, path: "/emergencias" },
    { text: "Credenciales", icon: <BadgeOutlined />, path: "/credenciales" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    if (isMobile) toggleSidebar(); // 🔹 Cierra el menú al hacer clic en móvil
  };

  return (
    <>
      {/* 🔹 Drawer persistente (escritorio) */}
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
            <Typography variant="h6">Santa Bárbara</Typography>
          </Toolbar>
          <Divider />
          <List>
            {menuItems.map((item) => (
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

      {/* 🔹 Drawer temporal (mobile) */}
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
            },
          }}
        >
          <Toolbar>
            <Typography variant="h6">Santa Bárbara</Typography>
          </Toolbar>
          <Divider />
          <List>
            {menuItems.map((item) => (
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
