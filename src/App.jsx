import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

// Auth guard
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Componente de Carga
const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Páginas (Lazy Loading)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));

// Usuarios
const UsuariosPage = lazy(() => import("./pages/Usuarios/UsuariosPage"));
const UsuarioCrearPage = lazy(() => import("./pages/Usuarios/UsuarioCrearPage"));
const UsuarioEditar = lazy(() => import("./pages/Usuarios/UsuarioEditar"));
const UsuariosReportes = lazy(() => import("./pages/Usuarios/UsuariosReportes"));

// Roles
const RolesPage = lazy(() => import("./pages/Roles/RolesPage"));
const RolCrearPage = lazy(() => import("./pages/Roles/RolCrearPage"));
const RolEditarPage = lazy(() => import("./pages/Roles/RolEditarPage"));
const RolPermisosPage = lazy(() => import("./pages/Roles/RolPermisosPage"));

// Personal
const PersonalPage = lazy(() => import("./pages/Personal/PersonalPage"));
const PersonalCrearPage = lazy(() => import("./pages/Personal/PersonalCrearPage"));
const PersonalEditarPage = lazy(() => import("./pages/Personal/PersonalEditarPage"));
const ReportesPersonal = lazy(() => import("./pages/Personal/ReportesPersonal"));

// Vehículos
const VehiculosPage = lazy(() => import("./pages/Vehiculos/VehiculosPage"));
const VehiculoMantenimientosPage = lazy(() => import("./pages/Vehiculos/VehiculoMantenimientosPage"));
const VehiculoInventarioPage = lazy(() => import("./pages/Vehiculos/VehiculoInventarioPage"));
const VehiculosReportesPage = lazy(() => import("./pages/Vehiculos/VehiculosReportesPage"));

// Capacitaciones
const CapacitacionesPage = lazy(() => import("./pages/Capacitaciones/CapacitacionesPage"));
const CapacitacionCrearPage = lazy(() => import("./pages/Capacitaciones/CapacitacionCrearPage"));
const CapacitacionEditarPage = lazy(() => import("./pages/Capacitaciones/CapacitacionEditarPage"));
const CapacitacionContenidosPage = lazy(() => import("./pages/Capacitaciones/CapacitacionContenidosPage"));
const CapacitacionPersonalPage = lazy(() => import("./pages/Capacitaciones/CapacitacionPersonalPage"));
const CapacitacionPersonasPage = lazy(() => import("./pages/Capacitaciones/CapacitacionPersonasPage"));
const CapacitacionInstitucionesPage = lazy(() => import("./pages/Capacitaciones/CapacitacionInstitucionesPage"));
const CapacitacionCertificadosPage = lazy(() => import("./pages/Capacitaciones/CapacitacionCertificadosPage"));
const PlantillasAdminPage = lazy(() => import("./pages/Capacitaciones/PlantillasAdminPage"));
const ReportesCapacitacionesPage = lazy(() => import("./pages/Capacitaciones/ReportesCapacitacionesPage"));

// Inventario
const InventarioPage = lazy(() => import("./pages/Inventario/InventarioPage"));
const InventarioCrearPage = lazy(() => import("./pages/Inventario/InventarioCrearPage"));
const InventarioEditarPage = lazy(() => import("./pages/Inventario/InventarioEditarPage"));
const InventarioAsignacionesPage = lazy(() => import("./pages/Inventario/InventarioAsignacionesPage"));
const MovimientosPage = lazy(() => import("./pages/Inventario/MovimientosPage"));
const InventarioReportesPage = lazy(() => import("./pages/Inventario/InventarioReportesPage"));

// Donativos
const DonativosPage = lazy(() => import("./pages/Donativos/DonativosPage"));
const DonativoCrearPage = lazy(() => import("./pages/Donativos/DonativoCrearPage"));
const DonativoEditarPage = lazy(() => import("./pages/Donativos/DonativoEditarPage"));
const DonativosReportesPage = lazy(() => import("./pages/Donativos/DonativosReportesPage"));

// Emergencias
const EmergenciasPage = lazy(() => import("./pages/Emergencias/EmergenciasPage"));
const EmergenciaCrearPage = lazy(() => import("./pages/Emergencias/EmergenciaCrearPage"));
const EmergenciaEditarPage = lazy(() => import("./pages/Emergencias/EmergenciaEditarPage"));
const EmergenciaVehiculosPage = lazy(() => import("./pages/Emergencias/EmergenciaVehiculosPage"));
const EmergenciaPersonalPage = lazy(() => import("./pages/Emergencias/EmergenciaPersonalPage"));
const EmergenciaInventarioPage = lazy(() => import("./pages/Emergencias/EmergenciaInventarioPage"));
const EmergenciasReportesPage = lazy(() => import("./pages/Emergencias/EmergenciasReportesPage"));
const EmergenciaDetallePage = lazy(() => import("./pages/Emergencias/EmergenciaDetallePage"));

// Credenciales
const CredencialesPage = lazy(() => import("./pages/Credenciales/CredencialesPage"));
const CredencialCrearPage = lazy(() => import("./pages/Credenciales/CredencialCrearPage"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LoginPage />} />

          {/* Protegido: Dashboard */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

          {/* Usuarios */}
          <Route path="/usuarios" element={<PrivateRoute><UsuariosPage /></PrivateRoute>} />
          <Route path="/usuarios/crear" element={<PrivateRoute><UsuarioCrearPage /></PrivateRoute>} />
          <Route path="/usuarios/editar/:id" element={<PrivateRoute><UsuarioEditar /></PrivateRoute>} />
          <Route path="/usuarios/reportes" element={<PrivateRoute><UsuariosReportes /></PrivateRoute>} />

          {/* Roles */}
          <Route path="/roles" element={<PrivateRoute><RolesPage /></PrivateRoute>} />
          <Route path="/roles/crear" element={<PrivateRoute><RolCrearPage /></PrivateRoute>} />
          <Route path="/roles/editar/:id" element={<PrivateRoute><RolEditarPage /></PrivateRoute>} />
          <Route path="/roles/:id/permisos" element={<PrivateRoute><RolPermisosPage /></PrivateRoute>} />

          {/* Personal */}
          <Route path="/personal" element={<PrivateRoute><PersonalPage /></PrivateRoute>} />
          <Route path="/personal/crear" element={<PrivateRoute><PersonalCrearPage /></PrivateRoute>} />
          <Route path="/personal/editar/:id" element={<PrivateRoute><PersonalEditarPage /></PrivateRoute>} />
          <Route path="/reportes/personal" element={<PrivateRoute><ReportesPersonal /></PrivateRoute>} />

          {/* Vehículos */}
          <Route path="/vehiculos" element={<PrivateRoute><VehiculosPage /></PrivateRoute>} />
          <Route path="/vehiculos/:id/mantenimientos" element={<PrivateRoute><VehiculoMantenimientosPage /></PrivateRoute>} />
          <Route path="/vehiculos/:id/inventario" element={<PrivateRoute><VehiculoInventarioPage /></PrivateRoute>} />
          <Route path="/vehiculos/reportes" element={<PrivateRoute><VehiculosReportesPage /></PrivateRoute>} />

          {/* Capacitaciones */}
          <Route path="/capacitaciones" element={<PrivateRoute><CapacitacionesPage /></PrivateRoute>} />
          <Route path="/capacitaciones/crear" element={<PrivateRoute><CapacitacionCrearPage /></PrivateRoute>} />
          <Route path="/capacitaciones/editar/:id" element={<PrivateRoute><CapacitacionEditarPage /></PrivateRoute>} />
          <Route path="/capacitaciones/:id/contenidos" element={<PrivateRoute><CapacitacionContenidosPage /></PrivateRoute>} />
          <Route path="/capacitaciones/:id/personal" element={<PrivateRoute><CapacitacionPersonalPage /></PrivateRoute>} />
          <Route path="/capacitaciones/:id/personas" element={<PrivateRoute><CapacitacionPersonasPage /></PrivateRoute>} />
          <Route path="/capacitaciones/:id/instituciones" element={<PrivateRoute><CapacitacionInstitucionesPage /></PrivateRoute>} />
          <Route path="/capacitaciones/:id/certificados" element={<PrivateRoute><CapacitacionCertificadosPage /></PrivateRoute>} />
          <Route path="/capacitaciones/reportes" element={<PrivateRoute><ReportesCapacitacionesPage /></PrivateRoute>} />
          <Route path="/capacitaciones/plantillas" element={<PrivateRoute><PlantillasAdminPage /></PrivateRoute>} />

          {/* Inventario */}
          <Route path="/inventario" element={<PrivateRoute><InventarioPage /></PrivateRoute>} />
          <Route path="/inventario/crear" element={<PrivateRoute><InventarioCrearPage /></PrivateRoute>} />
          <Route path="/inventario/editar/:id" element={<PrivateRoute><InventarioEditarPage /></PrivateRoute>} />
          <Route path="/inventario/:id/asignaciones" element={<PrivateRoute><InventarioAsignacionesPage /></PrivateRoute>} />
          <Route path="/inventario/movimientos" element={<PrivateRoute><MovimientosPage /></PrivateRoute>} />
          <Route path="/inventario/reportes" element={<PrivateRoute><InventarioReportesPage /></PrivateRoute>} />

          {/* Donativos */}
          <Route path="/donativos" element={<PrivateRoute><DonativosPage /></PrivateRoute>} />
          <Route path="/donativos/crear" element={<PrivateRoute><DonativoCrearPage /></PrivateRoute>} />
          <Route path="/donativos/editar/:id" element={<PrivateRoute><DonativoEditarPage /></PrivateRoute>} />
          <Route path="/donativos/reportes" element={<PrivateRoute><DonativosReportesPage /></PrivateRoute>} />

          {/* Emergencias */}
          <Route path="/emergencias" element={<PrivateRoute><EmergenciasPage /></PrivateRoute>} />
          <Route path="/emergencias/crear" element={<PrivateRoute><EmergenciaCrearPage /></PrivateRoute>} />
          <Route path="/emergencias/editar/:id" element={<PrivateRoute><EmergenciaEditarPage /></PrivateRoute>} />
          <Route path="/emergencias/:id/vehiculos" element={<PrivateRoute><EmergenciaVehiculosPage /></PrivateRoute>} />
          <Route path="/emergencias/:id/personal" element={<PrivateRoute><EmergenciaPersonalPage /></PrivateRoute>} />
          <Route path="/emergencias/:id/inventario" element={<PrivateRoute><EmergenciaInventarioPage /></PrivateRoute>} />
          <Route path="/emergencias/reportes" element={<PrivateRoute><EmergenciasReportesPage /></PrivateRoute>} />
          <Route path="/emergencias/detalle/:id" element={<PrivateRoute><EmergenciaDetallePage /></PrivateRoute>} />

          {/* Credenciales */}
          <Route path="/credenciales" element={<PrivateRoute><CredencialesPage /></PrivateRoute>} />
          <Route path="/credenciales/crear" element={<PrivateRoute><CredencialCrearPage /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
