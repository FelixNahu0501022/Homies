// src/pages/Usuarios/UsuariosReportes.jsx
import {
  Typography, Paper, Box, Button, TextField, MenuItem, Grid, CircularProgress,
  IconButton, Tooltip, Tabs, Tab, InputAdornment, Divider
} from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import {
  ArrowBack, PictureAsPdf, Refresh, TableView, Search, FileDownload
} from "@mui/icons-material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { exportTablePdf } from "../../utils/pdfExport";
import { exportToExcel } from "../../utils/exportToExcel";
import { TablaReporte } from "../../components/reportes";
import ReporteUsuariosDashboard from "./ReporteUsuariosDashboard";
import MatrizPermisos from "./MatrizPermisos";
import {
  listarUsuarios,
  repUsuariosSinRol,
  repUsuariosMultiRol,
  repUsuariosDeRol,
  repRolesConDetalle,
  repRolesSinUsuarios,
  repPermisosDeRol,
  repPermisosSinRol
} from "../../services/usuarios.service";
import api from "../../services/axios";

// Definición de todos los reportes disponibles
const REPORTES = {
  // Panel de Control
  dashboard: {
    id: 'dashboard',
    label: 'Panel de Control de Usuarios',
    categoria: 'resumen',
    descripcion: 'Dashboard ejecutivo con KPIs y gráficos estadísticos',
    requiereFiltro: false
  },

  // Reportes de Usuarios
  listado_completo: {
    id: 'listado_completo',
    label: 'Listado Completo de Usuarios del Sistema',
    categoria: 'usuarios',
    descripcion: 'Todos los usuarios registrados con sus roles y estado',
    requiereFiltro: false
  },
  sin_rol: {
    id: 'sin_rol',
    label: 'Usuarios Sin Asignación de Rol',
    categoria: 'usuarios',
    descripcion: 'Usuarios que no tienen ningún rol asignado',
    requiereFiltro: false
  },
  multiples_roles: {
    id: 'multiples_roles',
    label: 'Usuarios con Múltiples Responsabilidades',
    categoria: 'usuarios',
    descripcion: 'Usuarios con 2 o más roles asignados',
    requiereFiltro: false
  },
  por_rol: {
    id: 'por_rol',
    label: 'Detalle de Usuarios por Rol Específico',
    categoria: 'usuarios',
    descripcion: 'Lista de usuarios asignados a un rol particular',
    requiereFiltro: true,
    filtroTipo: 'rol'
  },

  // Reportes de Roles
  analisis_roles: {
    id: 'analisis_roles',
    label: 'Análisis de Roles del Sistema',
    categoria: 'roles',
    descripcion: 'Resumen de todos los roles con cantidad de usuarios',
    requiereFiltro: false
  },
  roles_sin_usuarios: {
    id: 'roles_sin_usuarios',
    label: 'Roles Sin Usuarios Asignados',
    categoria: 'roles',
    descripcion: 'Roles que no tienen usuarios (huérfanos)',
    requiereFiltro: false
  },
  matriz_permisos: {
    id: 'matriz_permisos',
    label: 'Matriz de Permisos por Rol',
    categoria: 'roles',
    descripcion: 'Tabla cruzada de roles y permisos asignados',
    requiereFiltro: false,
    componente: 'MatrizPermisos'
  },
  permisos_rol: {
    id: 'permisos_rol',
    label: 'Detalle de Permisos de un Rol',
    categoria: 'roles',
    descripcion: 'Lista completa de permisos de un rol específico',
    requiereFiltro: true,
    filtroTipo: 'rol'
  },
  permisos_huerfanos: {
    id: 'permisos_huerfanos',
    label: 'Permisos No Asignados a Ningún Rol',
    categoria: 'roles',
    descripcion: 'Permisos que no están asignados (huérfanos)',
    requiereFiltro: false
  }
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UsuariosReportes() {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState(0);
  const [reporteSeleccionado, setReporteSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Filtros
  const [roles, setRoles] = useState([]);
  const [rolFiltro, setRolFiltro] = useState('');

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      const { data } = await api.get("/roles");
      setRoles(data || []);
    } catch (e) {
      console.error("Error cargar roles:", e);
    }
  };

  // Filtrar reportes por categoría
  const reportesPorCategoria = useMemo(() => {
    const categorias = {
      resumen: [],
      usuarios: [],
      roles: []
    };

    Object.values(REPORTES).forEach(reporte => {
      categorias[reporte.categoria]?.push(reporte);
    });

    return categorias;
  }, []);

  // Filtrar datos por búsqueda
  const datosFiltrados = useMemo(() => {
    if (!busqueda || !datos || datos.length === 0) return datos;

    const termino = busqueda.toLowerCase();
    return datos.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(termino)
      )
    );
  }, [datos, busqueda]);

  const generarReporte = async () => {
    if (!reporteSeleccionado) {
      Swal.fire("Aviso", "Selecciona un tipo de reporte", "info");
      return;
    }

    const reporte = REPORTES[reporteSeleccionado];

    // Validar filtros requeridos
    if (reporte.requiereFiltro && reporte.filtroTipo === 'rol' && !rolFiltro) {
      Swal.fire("Aviso", "Selecciona un rol para este reporte", "info");
      return;
    }

    setLoading(true);
    setBusqueda(''); // Limpiar búsqueda

    try {
      let resultado = [];

      switch (reporteSeleccionado) {
        case 'listado_completo': {
          const data = await listarUsuarios({ limit: 10000 });
          const usuarios = data?.data || data || [];
          resultado = usuarios.map(u => ({
            Usuario: u.nombreusuario || u.nombreUsuario || "—",
            'Nombre Personal': u.personal_nombre || u.nombre || "—",
            Roles: Array.isArray(u.roles)
              ? u.roles.map(r => r.nombre || r).join(", ")
              : (u.roles || "Sin rol"),
            Estado: u.estado || "Activo",
          }));
          break;
        }

        case 'sin_rol': {
          const data = await repUsuariosSinRol({ limit: 10000 });
          const usuarios = data?.data || data || [];
          resultado = usuarios.map(u => ({
            Usuario: u.nombreusuario || u.nombreUsuario || "—",
            'Nombre Personal': u.personal_nombre || u.nombre || "—",
            Estado: u.estado || "—"
          }));
          break;
        }

        case 'multiples_roles': {
          const data = await repUsuariosMultiRol({ limit: 10000 });
          const usuarios = data?.data || data || [];
          resultado = usuarios.map(u => ({
            Usuario: u.nombreusuario || u.nombreUsuario || "—",
            'Nombre Personal': u.personal_nombre || u.nombre || "—",
            Roles: Array.isArray(u.roles)
              ? u.roles.map(r => r.nombre || r).join(", ")
              : (u.roles || "—"),
            'Cantidad de Roles': u.cantidad_roles || u.cantidadRoles || 0,
          }));
          break;
        }

        case 'por_rol': {
          // En lugar de usar el endpoint específico, usar listado completo y filtrar
          const todosUsuarios = await listarUsuarios({ limit: 10000 });
          const usuariosData = todosUsuarios?.data || todosUsuarios || [];
          const rolSeleccionado = roles.find(r => r.idrol === parseInt(rolFiltro));

          console.log('DEBUG - Total usuarios:', usuariosData.length);
          console.log('DEBUG - Rol filtro ID:', rolFiltro, 'Rol seleccionado:', rolSeleccionado);
          console.log('DEBUG - Primer usuario ejemplo:', usuariosData[0]);

          // Filtrar usuarios que tengan el rol seleccionado
          const usuariosFiltrados = usuariosData.filter(u => {
            if (!u.roles) {
              console.log('DEBUG - Usuario sin roles:', u.nombreusuario);
              return false;
            }

            // Si roles es array de números [1, 2, 3]
            if (Array.isArray(u.roles)) {
              const tieneRol = u.roles.includes(parseInt(rolFiltro));
              if (tieneRol) console.log('DEBUG - Usuario con rol (ID array):', u.nombreusuario, u.roles);
              return tieneRol;
            }

            // Si roles_detalle existe como array de objetos
            if (u.roles_detalle && Array.isArray(u.roles_detalle)) {
              const tieneRol = u.roles_detalle.some(rol =>
                rol.idrol === parseInt(rolFiltro) ||
                rol.idRol === parseInt(rolFiltro)
              );
              if (tieneRol) console.log('DEBUG - Usuario con rol (detalle):', u.nombreusuario);
              return tieneRol;
            }

            return false;
          });

          console.log('DEBUG - Usuarios filtrados:', usuariosFiltrados.length);

          // Obtener datos de personal completos (incluyendo CI)
          const usuariosConCI = await Promise.all(
            usuariosFiltrados.map(async (u) => {
              if (!u.idpersonal) return u;
              try {
                const res = await api.get(`/personal/${u.idpersonal}`);
                console.log('DEBUG - CI del personal:', res.data?.ci);
                return { ...u, ci_personal: res.data?.ci || res.data?.cedula };
              } catch (e) {
                return u;
              }
            })
          );

          resultado = usuariosConCI.map(u => {
            // Extraer CI - el backend devuelve campos planos como personal_ci
            const ci = u.ci_personal || u.personal_ci ||       // Campo plano del backend
              u.personal?.ci ||       // Por si viene como objeto
              u.ci ||
              u.CI ||
              u.cedula ||
              "Sin registro";

            // Nombre completo del personal
            const nombreCompleto = u.personal
              ? `${u.personal.nombre || ''} ${u.personal.apellido || ''}`.trim()
              : (u.personal_nombre || u.personalnombre || u.nombre || "Sin nombre");

            // Estado - manejar booleano correctamente
            let estado = "Desconocido";
            if (typeof u.estado === 'boolean') {
              // Si estado es booleano (true/false)
              estado = u.estado ? 'Activo' : 'Inactivo';
            } else if (u.estado) {
              // Si estado es string ("Activo"/"Inactivo")
              estado = String(u.estado).toLowerCase() === 'activo' ? 'Activo' : 'Inactivo';
            } else if (u.Estado) {
              estado = String(u.Estado).toLowerCase() === 'activo' ? 'Activo' : 'Inactivo';
            } else if (u.activo !== undefined) {
              estado = u.activo === true || u.activo === 'true' || u.activo === 1 ? 'Activo' : 'Inactivo';
            }

            return {
              Usuario: u.nombreusuario || u.nombreUsuario || u.usuario || "—",
              'Nombre Personal': nombreCompleto || "—",
              CI: ci,
              Estado: estado
            };
          });

          // Agregar info del rol como encabezado
          const totalUsuarios = resultado.length;
          if (rolSeleccionado && totalUsuarios > 0) {
            resultado.unshift({
              Usuario: `━━━ ROL: ${rolSeleccionado.nombre} ━━━`,
              'Nombre Personal': `Total: ${totalUsuarios} usuario(s)`,
              CI: "━━━━━━━━━",
              Estado: "━━━━━━━━━"
            });
          }
          break;
        }

        case 'analisis_roles': {
          const data = await repRolesConDetalle();
          resultado = data.map(r => ({
            Rol: r.rol_nombre || r.nombre || "—",
            Descripción: r.descripcion || "—",
            'Total Usuarios': r.total_usuarios || 0,
            'Usuarios Muestra': r.usuarios_resumen
              ? r.usuarios_resumen.slice(0, 3).map(u => u.nombreusuario).join(", ") + "..."
              : "—"
          }));
          break;
        }

        case 'roles_sin_usuarios': {
          const data = await repRolesSinUsuarios();
          resultado = data.map(r => ({
            Rol: r.nombre || "—",
            Descripción: r.descripcion || "—",
            'ID Rol': r.idrol || "—"
          }));
          break;
        }

        case 'permisos_rol': {
          const data = await repPermisosDeRol(rolFiltro);
          const rolSeleccionado = roles.find(r => r.idrol === parseInt(rolFiltro));
          resultado = data.map(p => ({
            Permiso: p.nombre || "—",
            Descripción: p.descripcion || "—"
          }));
          if (rolSeleccionado) {
            resultado.unshift({
              Permiso: `ROL: ${rolSeleccionado.nombre}`,
              Descripción: `Total: ${resultado.length} permisos`
            });
          }
          break;
        }

        case 'permisos_huerfanos': {
          const data = await repPermisosSinRol();
          resultado = data.map(p => ({
            Permiso: p.nombre || "—",
            Descripción: p.descripcion || "—",
            'ID Permiso': p.idpermiso || "—"
          }));
          break;
        }

        default:
          Swal.fire("Aviso", "Tipo de reporte no implementado", "warning");
          break;
      }

      setDatos(resultado);

      if (resultado.length === 0) {
        Swal.fire("Información", "No se encontraron registros para este reporte", "info");
      }
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "Error al generar reporte", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    // Validar que hay datos
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }

    try {
      const reporte = REPORTES[reporteSeleccionado];

      // Validar estructura de datos
      const primeraFila = datosFiltrados[0];
      if (!primeraFila || typeof primeraFila !== 'object') {
        Swal.fire("Error", "Formato de datos inválido para exportar", "error");
        return;
      }

      const columns = Object.keys(primeraFila).map(k => ({
        header: k,
        dataKey: k
      }));

      if (columns.length === 0) {
        Swal.fire("Error", "No se encontraron columnas para exportar", "error");
        return;
      }

      exportTablePdf({
        title: reporte?.label || "Reporte de Usuarios",
        subtitle: reporte?.descripcion || "",
        columns,
        rows: datosFiltrados,
        filename: `usuarios_${reporteSeleccionado}_${new Date().getTime()}.pdf`,
        showStats: true
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Swal.fire("Error", "Ocurrió un error al generar el PDF: " + error.message, "error");
    }
  };

  const exportarExcel = () => {
    // Validar que hay datos
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }

    try {
      const reporte = REPORTES[reporteSeleccionado];

      // Validar estructura de datos
      if (!datosFiltrados[0] || typeof datosFiltrados[0] !== 'object') {
        Swal.fire("Error", "Formato de datos inválido para exportar", "error");
        return;
      }

      exportToExcel({
        data: datosFiltrados,
        filename: `usuarios_${reporteSeleccionado}_${new Date().getTime()}`,
        sheetName: 'Reporte',
        title: reporte?.label || "Reporte de Usuarios"
      });

      Swal.fire({
        icon: 'success',
        title: 'Excel generado',
        text: 'El archivo se descargó correctamente',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error al exportar Excel:', error);
      Swal.fire("Error", "Ocurrió un error al generar el Excel: " + error.message, "error");
    }
  };

  const reporteActual = REPORTES[reporteSeleccionado];
  const mostrarFiltroRol = reporteActual?.requiereFiltro && reporteActual?.filtroTipo === 'rol';

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Reportes de Usuarios
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reportes profesionales con visualizaciones y exportación múltiple
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/usuarios")}>
          Volver
        </Button>
      </Box>

      {/* Tabs de Categorías */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabActual}
          onChange={(e, newValue) => {
            setTabActual(newValue);
            setReporteSeleccionado('');
            setDatos([]);
          }}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Resumen Ejecutivo" icon={<TableView />} iconPosition="start" />
          <Tab label="Reportes de Usuarios" icon={<Search />} iconPosition="start" />
          <Tab label="Roles y Permisos" icon={<TableView />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panel: Resumen Ejecutivo */}
      <TabPanel value={tabActual} index={0}>
        <ReporteUsuariosDashboard />
      </TabPanel>

      {/* Tab Panel: Reportes de Usuarios */}
      <TabPanel value={tabActual} index={1}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selecciona un Reporte
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Tipo de Reporte"
                value={reporteSeleccionado}
                onChange={(e) => {
                  setReporteSeleccionado(e.target.value);
                  setDatos([]);
                  setRolFiltro('');
                }}
                size="small"
              >
                <MenuItem value="">
                  <em>(Selecciona un reporte)</em>
                </MenuItem>
                {reportesPorCategoria.usuarios.map(r => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
              {reporteActual && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {reporteActual.descripcion}
                </Typography>
              )}
            </Grid>

            {mostrarFiltroRol && (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Selecciona un Rol"
                  value={rolFiltro}
                  onChange={(e) => setRolFiltro(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">
                    <em>(Selecciona un rol)</em>
                  </MenuItem>
                  {roles.map(r => (
                    <MenuItem key={r.idrol} value={r.idrol}>
                      {r.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>

          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="contained"
              onClick={generarReporte}
              disabled={!reporteSeleccionado || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            >
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>
          </Box>
        </Paper>

        {/* Resultados */}
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : datos.length > 0 ? (
          <>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                <Typography variant="h6">{reporteActual?.label || "Resultados"}</Typography>
                <Box display="flex" gap={1}>
                  <TextField
                    size="small"
                    placeholder="Buscar en resultados..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ width: 250 }}
                  />
                  <Tooltip title="Exportar a PDF">
                    <IconButton onClick={exportarPDF} color="error">
                      <PictureAsPdf />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Exportar a Excel">
                    <IconButton onClick={exportarExcel} color="success">
                      <FileDownload />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TablaReporte datos={datosFiltrados} />
            </Paper>
            <Typography variant="body2" color="text.secondary" align="center">
              Mostrando {datosFiltrados.length} de {datos.length} registro(s)
            </Typography>
          </>
        ) : reporteSeleccionado ? (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="body1" color="text.secondary">
              Haz clic en "Generar Reporte" para ver los resultados
            </Typography>
          </Paper>
        ) : null}
      </TabPanel>

      {/* Tab Panel: Roles y Permisos */}
      <TabPanel value={tabActual} index={2}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Selecciona un Reporte
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Tipo de Reporte"
                value={reporteSeleccionado}
                onChange={(e) => {
                  setReporteSeleccionado(e.target.value);
                  setDatos([]);
                  setRolFiltro('');
                }}
                size="small"
              >
                <MenuItem value="">
                  <em>(Selecciona un reporte)</em>
                </MenuItem>
                {reportesPorCategoria.roles.map(r => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.label}
                  </MenuItem>
                ))}
              </TextField>
              {reporteActual && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {reporteActual.descripcion}
                </Typography>
              )}
            </Grid>

            {mostrarFiltroRol && (
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Selecciona un Rol"
                  value={rolFiltro}
                  onChange={(e) => setRolFiltro(e.target.value)}
                  size="small"
                >
                  <MenuItem value="">
                    <em>(Selecciona un rol)</em>
                  </MenuItem>
                  {roles.map(r => (
                    <MenuItem key={r.idrol} value={r.idrol}>
                      {r.nombre}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}
          </Grid>

          {reporteSeleccionado !== 'matriz_permisos' && (
            <Box mt={2} display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={generarReporte}
                disabled={!reporteSeleccionado || loading}
                startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
              >
                {loading ? "Generando..." : "Generar Reporte"}
              </Button>
            </Box>
          )}
        </Paper>

        {/* Matriz de Permisos (componente especial) */}
        {reporteSeleccionado === 'matriz_permisos' && <MatrizPermisos />}

        {/* Otros reportes de roles */}
        {reporteSeleccionado !== 'matriz_permisos' && (
          <>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : datos.length > 0 ? (
              <>
                <Paper sx={{ p: 2, mb: 2 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
                    <Typography variant="h6">{reporteActual?.label || "Resultados"}</Typography>
                    <Box display="flex" gap={1}>
                      <TextField
                        size="small"
                        placeholder="Buscar en resultados..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ width: 250 }}
                      />
                      <Tooltip title="Exportar a PDF">
                        <IconButton onClick={exportarPDF} color="error">
                          <PictureAsPdf />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Exportar a Excel">
                        <IconButton onClick={exportarExcel} color="success">
                          <FileDownload />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <TablaReporte datos={datosFiltrados} />
                </Paper>
                <Typography variant="body2" color="text.secondary" align="center">
                  Mostrando {datosFiltrados.length} de {datos.length} registro(s)
                </Typography>
              </>
            ) : reporteSeleccionado ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  Haz clic en "Generar Reporte" para ver los resultados
                </Typography>
              </Paper>
            ) : null}
          </>
        )}
      </TabPanel>
    </LayoutDashboard>
  );
}
