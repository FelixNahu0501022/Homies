import { Box, Toolbar, useTheme, useMediaQuery } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import { useSidebar } from "../context/SidebarContext";

const drawerWidth = 240;

export default function LayoutDashboard({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { isSidebarOpen } = useSidebar();

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Topbar />
      <Sidebar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          width: {
            xs: "100%",
            sm: isSidebarOpen ? `calc(100% - ${drawerWidth}px)` : "100%"
          },
          ml: {
            xs: 0,
            sm: isSidebarOpen ? `${drawerWidth}px` : 0
          },
          transition: theme.transitions.create(["margin", "width"], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
        }}
      >
        <Toolbar /> {/* Spacing for AppBar */}
        {children}
      </Box>
    </Box>
  );
}
