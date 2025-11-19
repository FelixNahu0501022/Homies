import {
  Grid,
  Typography,
  Box,
  Fade,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardLayout from "./DashboardLayout";
import StatCard from "../../components/StatCard";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isMedium = useMediaQuery(theme.breakpoints.down("md"));
  const [dateTime, setDateTime] = useState("");

  useEffect(() => {
    const now = new Date();
    setDateTime(
      now.toLocaleString("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
      })
    );
  }, []);

  return (
    <DashboardLayout>
      <Box
        sx={{
          position: "relative",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #f7f9fc 0%, #e9eef5 100%)",
          borderRadius: 2,
          p: { xs: 2, sm: 3 },
        }}
      >
        <Fade in timeout={700}>
          <Box sx={{ mb: 4 }}>
            <Typography
              variant={isSmall ? "h5" : "h4"}
              sx={{ fontWeight: 700, color: "primary.main" }}
            >
              Bienvenido al Panel de Control
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              {dateTime}
            </Typography>
          </Box>
        </Fade>

        <Grid
          container
          spacing={3}
          sx={{
            transition: "all 0.3s ease",
          }}
        >
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Usuarios activos"
              value="12"
              color="primary"
              icon="person"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Emergencias recientes"
              value="8"
              color="error"
              icon="local_fire_department"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Capacitaciones"
              value="5"
              color="success"
              icon="school"
            />
          </Grid>
        </Grid>

        <Typography
          variant="caption"
          display="block"
          align="center"
          sx={{ mt: 6, color: "text.secondary" }}
        >
          2a COMPAÑIA DE BOMBEROS SANTA BARBARA SAR BOLIVIA-LA PAZ © 2025
        </Typography>
      </Box>
    </DashboardLayout>
  );
}
