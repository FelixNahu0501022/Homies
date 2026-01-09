import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

// Auth guard
import PrivateRoute from "./components/PrivateRoute";
import ErrorBoundary from "./components/ErrorBoundary";

// Custom hooks
import useBackButton from "./hooks/useBackButton";

// Componente de Carga
const Loading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <CircularProgress />
  </Box>
);

// Páginas (Lazy Loading)
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

// Módulo: Miembros
const MiembrosPage = lazy(() => import("./pages/Miembros/MiembrosPage"));
const MiembroCrearPage = lazy(() => import("./pages/Miembros/MiembroCrearPage"));
const MiembroEditarPage = lazy(() => import("./pages/Miembros/MiembroEditarPage"));

// Módulo: Productos
const ProductosPage = lazy(() => import("./pages/Productos/ProductosPage"));
const ProductoFormPage = lazy(() => import("./pages/Productos/ProductoFormPage"));

// Módulo: Ventas
const VentasPage = lazy(() => import("./pages/Ventas/VentasPage"));
const VentaCrearPage = lazy(() => import("./pages/Ventas/VentaCrearPage"));
const VentaDetallePage = lazy(() => import("./pages/Ventas/VentaDetallePage"));

// Módulo: Pagos
const PagosPage = lazy(() => import("./pages/Pagos/PagosPage"));

// Módulo: Usuarios y Roles
const UsuariosPage = lazy(() => import("./pages/Usuarios/UsuariosPage"));
const UsuarioFormPage = lazy(() => import("./pages/Usuarios/UsuarioFormPage"));
const UsuarioEditarPage = lazy(() => import("./pages/Usuarios/UsuarioEditarPage"));
const RolesPage = lazy(() => import("./pages/Usuarios/RolesPage"));

// Módulo: Reportes
const ReportesPage = lazy(() => import("./pages/Reportes/ReportesPage"));

// Módulo: Inventario RPP
const MiStockPage = lazy(() => import("./pages/Inventario/MiStockPage"));
const GestionInventarioPage = lazy(() => import("./pages/Inventario/GestionInventarioPage"));

// Página Pública: Verificar Credencial
const VerificarCredencialPage = lazy(() => import("./pages/VerificarCredencialPage"));

function App() {
  // Manejar botón/gesto "Atrás" en dispositivos móviles
  useBackButton();

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Público */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/verificar/:uuid" element={<VerificarCredencialPage />} />

          {/* Protegido: Dashboard */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />

          {/* Protegido: Miembros */}
          <Route path="/miembros" element={<PrivateRoute><MiembrosPage /></PrivateRoute>} />
          <Route path="/miembros/crear" element={<PrivateRoute><MiembroCrearPage /></PrivateRoute>} />
          <Route path="/miembros/editar/:id" element={<PrivateRoute><MiembroEditarPage /></PrivateRoute>} />

          {/* Protegido: Productos */}
          <Route path="/productos" element={<PrivateRoute><ProductosPage /></PrivateRoute>} />
          <Route path="/productos/crear" element={<PrivateRoute><ProductoFormPage /></PrivateRoute>} />
          <Route path="/productos/editar/:id" element={<PrivateRoute><ProductoFormPage /></PrivateRoute>} />

          {/* Protegido: Ventas */}
          <Route path="/ventas" element={<PrivateRoute><VentasPage /></PrivateRoute>} />
          <Route path="/ventas/crear" element={<PrivateRoute><VentaCrearPage /></PrivateRoute>} />
          <Route path="/ventas/:id" element={<PrivateRoute><VentaDetallePage /></PrivateRoute>} />

          {/* Protegido: Pagos */}
          <Route path="/pagos" element={<PrivateRoute><PagosPage /></PrivateRoute>} />

          {/* Protegido: Usuarios y Roles */}
          <Route path="/usuarios" element={<PrivateRoute><UsuariosPage /></PrivateRoute>} />
          <Route path="/usuarios/crear" element={<PrivateRoute><UsuarioFormPage /></PrivateRoute>} />
          <Route path="/usuarios/:id/editar" element={<PrivateRoute><UsuarioEditarPage /></PrivateRoute>} />
          <Route path="/roles" element={<PrivateRoute><RolesPage /></PrivateRoute>} />

          {/* Protegido: Reportes */}
          <Route path="/reportes" element={<PrivateRoute><ReportesPage /></PrivateRoute>} />

          {/* Protegido: Inventario RPP */}
          <Route path="/mi-stock" element={<PrivateRoute><MiStockPage /></PrivateRoute>} />
          <Route path="/inventario/gestion" element={<PrivateRoute><GestionInventarioPage /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
