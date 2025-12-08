import { Box, CssBaseline, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/Topbar";
import { useSidebar } from "../../context/SidebarContext";

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { isSidebarOpen } = useSidebar();

  const drawerWidth = 240;
  const sidebarOffset = isSidebarOpen && !isMobile ? `${drawerWidth}px` : "0px";

  return (
    <Box sx={{ display: "flex", width: "100%", minHeight: "100vh" }}>
      <CssBaseline />
      <Topbar />
      <Sidebar />

      {/* Main content area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${sidebarOffset})`,
          pt: 9,
          transition: "margin 0.3s ease, width 0.3s ease",
          ml: sidebarOffset,
          backgroundColor: "#f5f6fa",
          minHeight: "100vh",
          overflow: "auto",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
