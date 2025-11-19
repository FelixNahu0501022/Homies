// p.ej. en src/main.jsx o aquí mismo (mantener 1 sola vez en la app)
import api from "./services/axios";
const t = localStorage.getItem("token");
if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;

// src/App.jsx
import { Routes, Route } from "react-router-dom";

// Páginas
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard/Dashboard";

// Auth guard
import PrivateRoute from "./components/PrivateRoute";

// Usuarios
import UsuariosPage from "./pages/Usuarios/UsuariosPage";
import UsuarioCrearPage from "./pages/Usuarios/UsuarioCrearPage";
import UsuarioEditar from "./pages/Usuarios/UsuarioEditar";
import UsuariosReportes from "./pages/Usuarios/UsuariosReportes";

// Roles
import RolesPage from "./pages/Roles/RolesPage";
import RolCrearPage from "./pages/Roles/RolCrearPage";
import RolEditarPage from "./pages/Roles/RolEditarPage";
import RolPermisosPage from "./pages/Roles/RolPermisosPage";

// Personal
import PersonalPage from "./pages/Personal/PersonalPage";
import PersonalCrearPage from "./pages/Personal/PersonalCrearPage";
import PersonalEditarPage from "./pages/Personal/PersonalEditarPage";
import ReportesPersonal from "./pages/personal/ReportesPersonal";

// Vehículos
import VehiculosPage from "./pages/Vehiculos/VehiculosPage";
import VehiculoCrearPage from "./pages/Vehiculos/VehiculoCrearPage";
import VehiculoEditarPage from "./pages/Vehiculos/VehiculoEditarPage";
import VehiculoMantenimientosPage from "./pages/Vehiculos/VehiculoMantenimientosPage";
import VehiculoInventarioPage from "./pages/Vehiculos/VehiculoInventarioPage";
import VehiculosReportesPage from "./pages/Vehiculos/VehiculosReportesPage";

// Capacitaciones
import CapacitacionesPage from "./pages/Capacitaciones/CapacitacionesPage";
import CapacitacionCrearPage from "./pages/Capacitaciones/CapacitacionCrearPage";
import CapacitacionEditarPage from "./pages/Capacitaciones/CapacitacionEditarPage";
import CapacitacionContenidosPage from "./pages/Capacitaciones/CapacitacionContenidosPage";
import CapacitacionPersonalPage from "./pages/Capacitaciones/CapacitacionPersonalPage";
import CapacitacionPersonasPage from "./pages/Capacitaciones/CapacitacionPersonasPage";
import CapacitacionInstitucionesPage from "./pages/Capacitaciones/CapacitacionInstitucionesPage";
import CapacitacionCertificadosPage from "./pages/Capacitaciones/CapacitacionCertificadosPage";
import PlantillasAdminPage from "./pages/Capacitaciones/PlantillasAdminPage";
import ReportesCapacitacionesPage from "./pages/Capacitaciones/ReportesCapacitacionesPage";

// Inventario
import InventarioPage from "./pages/Inventario/InventarioPage";
import InventarioCrearPage from "./pages/Inventario/InventarioCrearPage";
import InventarioEditarPage from "./pages/Inventario/InventarioEditarPage";
import InventarioAsignacionesPage from "./pages/Inventario/InventarioAsignacionesPage";
import MovimientosPage from "./pages/Inventario/MovimientosPage";
import InventarioReportesPage from "./pages/Inventario/InventarioReportesPage";

// Donativos
import DonativosPage from "./pages/Donativos/DonativosPage";
import DonativoCrearPage from "./pages/Donativos/DonativoCrearPage";
import DonativoEditarPage from "./pages/Donativos/DonativoEditarPage";
import DonativosReportesPage from "./pages/Donativos/DonativosReportesPage";
// Emergencias
import EmergenciasPage from "./pages/Emergencias/EmergenciasPage";
import EmergenciaCrearPage from "./pages/Emergencias/EmergenciaCrearPage";
import EmergenciaEditarPage from "./pages/Emergencias/EmergenciaEditarPage";
import EmergenciaVehiculosPage from "./pages/Emergencias/EmergenciaVehiculosPage";
import EmergenciaPersonalPage from "./pages/Emergencias/EmergenciaPersonalPage";
import EmergenciaInventarioPage from "./pages/Emergencias/EmergenciaInventarioPage";
import EmergenciasReportesPage from "./pages/Emergencias/EmergenciasReportesPage";
import EmergenciaDetallePage from "./pages/Emergencias/EmergenciaDetallePage";
// Credenciales
import CredencialesPage from "./pages/Credenciales/CredencialesPage";
import CredencialCrearPage from "./pages/Credenciales/CredencialCrearPage";
import CredencialesReportesPage from "./pages/Credenciales/ReportesCredencialesDialog";
function App() {
  return (
    <Routes>
      {/* Público */}
      <Route path="/" element={<LoginPage />} />

      {/* Protegido: Dashboard */}
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />

      {/* Usuarios */}
      <Route path="/usuarios" element={<PrivateRoute><UsuariosPage /></PrivateRoute>} />
      <Route path="/usuarios/crear" element={<PrivateRoute><UsuarioCrearPage /></PrivateRoute>} />
      <Route path="/usuarios/editar/:id" element={<PrivateRoute><UsuarioEditar /></PrivateRoute>} />
      <Route path="/usuarios/reportes"element={<PrivateRoute><UsuariosReportes /></PrivateRoute>}/>

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
      <Route path="/vehiculos/crear" element={<PrivateRoute><VehiculoCrearPage /></PrivateRoute>} />
      <Route path="/vehiculos/editar/:id" element={<PrivateRoute><VehiculoEditarPage /></PrivateRoute>} />
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
      <Route path="/donativos" element={<DonativosPage />} />
      <Route path="/donativos/crear" element={<DonativoCrearPage />} />
      <Route path="/donativos/editar/:id" element={<DonativoEditarPage />} />
      <Route path="/donativos/reportes" element={<DonativosReportesPage />} /> {/* ← AQUI */}

      {/* Emergencias */}
      <Route path="/emergencias" element={<PrivateRoute><EmergenciasPage /></PrivateRoute>} />
      <Route path="/emergencias/crear" element={<PrivateRoute><EmergenciaCrearPage /></PrivateRoute>} />
      <Route path="/emergencias/editar/:id" element={<PrivateRoute><EmergenciaEditarPage /></PrivateRoute>} />
      <Route path="/emergencias/:id/vehiculos" element={<PrivateRoute><EmergenciaVehiculosPage /></PrivateRoute>} />
      <Route path="/emergencias/:id/personal" element={<PrivateRoute><EmergenciaPersonalPage /></PrivateRoute>} />
      <Route path="/emergencias/:id/inventario" element={<PrivateRoute><EmergenciaInventarioPage /></PrivateRoute>} />
      <Route path="/emergencias/reportes" element={<EmergenciasReportesPage />} />
      <Route path="/emergencias/detalle/:id" element={<EmergenciaDetallePage />} />

      {/* Credenciales */}
      <Route path="/credenciales" element={<PrivateRoute><CredencialesPage /></PrivateRoute>} />
      <Route path="/credenciales/crear" element={<PrivateRoute><CredencialCrearPage /></PrivateRoute>} />
      <Route path="/credenciales/reportes" element={<PrivateRoute><CredencialesReportesPage /></PrivateRoute>} />
    </Routes>
  );
}

export default App;
