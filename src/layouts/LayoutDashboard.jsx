import { Box, Toolbar } from "@mui/material";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

export default function LayoutDashboard({ children }) {
  return (
    <Box sx={{ display: "flex" }}>
      <Topbar />
      <Sidebar />

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* para dejar espacio debajo del AppBar */}
        {children}
      </Box>
    </Box>
  );
}
