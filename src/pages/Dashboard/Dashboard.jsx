import {
  Grid,
  Typography,
  Box,
  Fade,
  useMediaQuery,
  useTheme,
  Alert,
  IconButton,
  Snackbar,
  Container,
  Paper,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import DashboardLayout from "./DashboardLayout";
import StatCard from "../../components/StatCard";
import AlertCard from "../../components/AlertCard";
import { useEffect, useState } from "react";
import dashboardService from "../../services/dashboard.service";

export default function Dashboard() {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  const isMedium = useMediaQuery(theme.breakpoints.down("md"));
  const [dateTime, setDateTime] = useState("");

  // Estados para las métricas
  const [usuariosActivos, setUsuariosActivos] = useState(null);
  const [emergenciasHoy, setEmergenciasHoy] = useState(null);
  const [alertasStock, setAlertasStock] = useState(null);
  const [inventarioVehiculos, setInventarioVehiculos] = useState(null);

  // Estados de carga
  const [loadingUsuarios, setLoadingUsuarios] = useState(true);
  const [loadingEmergencias, setLoadingEmergencias] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);
  const [loadingVehiculos, setLoadingVehiculos] = useState(true);

  // Estados de error
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    const now = new Date();
    setDateTime(
      now.toLocaleString("es-ES", {
        dateStyle: "long",
        timeStyle: "short",
      })
    );

    // Cargar datos iniciales
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchUsuariosActivos(),
      fetchEmergenciasHoy(),
      fetchAlertasStock(),
      fetchInventarioVehiculos(),
    ]);
  };

  const fetchUsuariosActivos = async () => {
    setLoadingUsuarios(true);
    try {
      const data = await dashboardService.getUsuariosActivos();
      setUsuariosActivos(data);
    } catch (err) {
      console.error("Error al cargar usuarios activos:", err);
      if (err.response?.status !== 403) {
        handleError("No se pudieron cargar los usuarios activos");
      }
    } finally {
      setLoadingUsuarios(false);
    }
  };

  const fetchEmergenciasHoy = async () => {
    setLoadingEmergencias(true);
    try {
      const data = await dashboardService.getEmergenciasHoy();
      setEmergenciasHoy(data);
    } catch (err) {
      console.error("Error al cargar emergencias:", err);
      if (err.response?.status !== 403) {
        handleError("No se pudieron cargar las emergencias del día");
      }
    } finally {
      setLoadingEmergencias(false);
    }
  };

  const fetchAlertasStock = async () => {
    setLoadingStock(true);
    try {
      const data = await dashboardService.getAlertasStock(10);
      setAlertasStock(data);
    } catch (err) {
      console.error("Error al cargar alertas de stock:", err);
      if (err.response?.status !== 403) {
        handleError("No se pudieron cargar las alertas de stock");
      }
    } finally {
      setLoadingStock(false);
    }
  };

  const fetchInventarioVehiculos = async () => {
    setLoadingVehiculos(true);
    try {
      const data = await dashboardService.getInventarioVehiculos(5);
      setInventarioVehiculos(data);
    } catch (err) {
      console.error("Error al cargar inventario de vehículos:", err);
      if (err.response?.status !== 403) {
        handleError("No se pudo cargar el inventario de vehículos");
      }
    } finally {
      setLoadingVehiculos(false);
    }
  };

  const handleError = (message) => {
    setError(message);
    setShowError(true);
  };

  const handleRefresh = () => {
    fetchAllData();
  };

  // Formatear datos para AlertCard
  const formatStockAlerts = () => {
    if (!alertasStock?.alertas) return [];
    return alertasStock.alertas.map(item => ({
      primary: item.nombre,
      secondary: `Cantidad: ${item.cantidad} ${item.unidad || ''} - ${item.categoria || ''}`,
    }));
  };

  const formatVehiculoAlerts = () => {
    if (!inventarioVehiculos?.alertas) return [];
    return inventarioVehiculos.alertas.map(alert => ({
      primary: `${alert.vehiculo.nominacion} (${alert.vehiculo.placa})`,
      secondary: `${alert.item.nombre}: ${alert.item.cantidad} unidades`,
    }));
  };

  return (
    <DashboardLayout>
      <Box
        sx={{
          width: "100%",
          minHeight: "calc(100vh - 64px)",
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Container
          maxWidth="xl"
          sx={{
            px: { xs: 0, sm: 1, md: 2 },
          }}
        >
          {/* Header */}
          <Fade in timeout={500}>
            <Paper
              elevation={0}
              sx={{
                mb: { xs: 2, sm: 3, md: 4 },
                p: { xs: 2, sm: 2.5, md: 3 },
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                borderRadius: { xs: 2, sm: 2.5, md: 3 },
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Box sx={{ width: { xs: "100%", sm: "auto" } }}>
                <Typography
                  variant={isSmall ? "h6" : isMedium ? "h5" : "h4"}
                  sx={{
                    fontWeight: 700,
                    color: "primary.main",
                    mb: 0.5,
                    fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" },
                  }}
                >
                  Panel de Control
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  }}
                >
                  📅 {dateTime}
                </Typography>
              </Box>
              <IconButton
                onClick={handleRefresh}
                color="primary"
                size={isSmall ? "medium" : "large"}
                sx={{
                  background: theme.palette.primary.main,
                  color: "white",
                  alignSelf: { xs: "flex-end", sm: "center" },
                  "&:hover": {
                    background: theme.palette.primary.dark,
                    transform: "rotate(180deg)",
                  },
                  transition: "all 0.3s ease",
                }}
              >
                <Refresh />
              </IconButton>
            </Paper>
          </Fade>

          {/* Métricas Principales */}
          <Grid
            container
            spacing={{ xs: 2, sm: 2.5, md: 3 }}
            sx={{ mb: { xs: 3, sm: 3.5, md: 4 } }}
          >
            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Usuarios Activos"
                value={usuariosActivos?.resumen?.activos || "0"}
                subtitle={`Total: ${usuariosActivos?.resumen?.total || "0"}`}
                color="primary"
                icon="person"
                loading={loadingUsuarios}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Emergencias Hoy"
                value={emergenciasHoy?.resumen?.total || "0"}
                subtitle={`En curso: ${emergenciasHoy?.resumen?.en_curso || "0"}`}
                color="error"
                icon="local_fire_department"
                loading={loadingEmergencias}
                showWarning={emergenciasHoy?.resumen?.en_curso > 0}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Alertas de Stock"
                value={alertasStock?.total || "0"}
                subtitle={`Umbral: ${alertasStock?.umbral || "10"} unidades`}
                color="warning"
                icon="warning"
                loading={loadingStock}
                showWarning={alertasStock?.total > 0}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <StatCard
                title="Alertas Vehículos"
                value={inventarioVehiculos?.alertas?.length || "0"}
                subtitle={`${inventarioVehiculos?.resumenPorVehiculo?.length || "0"} vehículos afectados`}
                color="info"
                icon="directions_car"
                loading={loadingVehiculos}
                showWarning={inventarioVehiculos?.alertas?.length > 0}
              />
            </Grid>
          </Grid>

          {/* Sección de Alertas Detalladas */}
          <Fade in timeout={700}>
            <Box>
              <Typography
                variant={isSmall ? "subtitle1" : "h6"}
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  mb: { xs: 1.5, sm: 2 },
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" },
                }}
              >
                🔔 Alertas Detalladas
              </Typography>

              <Grid
                container
                spacing={{ xs: 2, sm: 2.5, md: 3 }}
              >
                <Grid item xs={12} lg={6}>
                  <AlertCard
                    title="Alertas de Stock Bajo"
                    alerts={formatStockAlerts()}
                    loading={loadingStock}
                    severity="warning"
                    emptyMessage="✅ No hay items con stock bajo"
                  />
                </Grid>

                <Grid item xs={12} lg={6}>
                  <AlertCard
                    title="Inventario Bajo en Vehículos"
                    alerts={formatVehiculoAlerts()}
                    loading={loadingVehiculos}
                    severity="error"
                    emptyMessage="✅ No hay alertas de inventario en vehículos"
                  />
                </Grid>
              </Grid>
            </Box>
          </Fade>

          {/* Footer */}
          <Box sx={{ mt: { xs: 4, sm: 5, md: 6 }, mb: 2, textAlign: "center" }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                py: { xs: 1.5, sm: 2 },
                borderTop: "1px solid",
                borderColor: "divider",
                fontSize: { xs: "0.65rem", sm: "0.75rem" },
              }}
            >
              2a COMPAÑIA DE BOMBEROS SANTA BARBARA SAR BOLIVIA-LA PAZ © 2025
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Snackbar para errores */}
      <Snackbar
        open={showError}
        autoHideDuration={6000}
        onClose={() => setShowError(false)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: isSmall ? "center" : "right"
        }}
      >
        <Alert
          onClose={() => setShowError(false)}
          severity="error"
          sx={{
            width: "100%",
            maxWidth: { xs: "90vw", sm: "400px" },
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
