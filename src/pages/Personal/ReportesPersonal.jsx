// src/pages/Personal/ReportesPersonal.jsx
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
import ReportePersonalDashboard from "./ReportePersonalDashboard";
import {
  rptLegajo,
  rptDistribucionClase,
  rptDistribucionGrado,
  rptCompletitud,
  rptCapParticipacion,
  rptCapCobertura,
  rptEmParticipacion,
  rptEmSinParticipacion
} from "../../services/personal.service";
import api from "../../services/axios";

// Definición de todos los reportes disponibles
const REPORTES = {
  // Panel de Control
  dashboard: {
    id: 'dashboard',
    label: 'Panel de Control de Personal',
    categoria: 'resumen',
    descripcion: 'Dashboard ejecutivo con KPIs y gráficos estadísticos',
    requiereFiltro: false
  },

  // Reportes de Personal
  legajo: {
    id: 'legajo',
    label: 'Legajo Completo del Personal',
    categoria: 'personal',
    descripcion: 'Lista detallada de todo el personal operativo',
    requiereFiltro: false,
    filtros: ['clase', 'grado', 'estado']
  },
  distribucion_clase: {
    id: 'distribucion_clase',
    label: 'Distribución del Personal por Clase',
    categoria: 'personal',
    descripcion: 'Cantidad de personal agrupado por clase bomberil',
    requiereFiltro: false
  },
  distribucion_grado: {
    id: 'distribucion_grado',
    label: 'Distribución del Personal por Grado',
    categoria: 'personal',
    descripcion: 'Cantidad de personal agrupado por grado jerárquico',
    requiereFiltro: false
  },
  completitud: {
    id: 'completitud',
    label: 'Análisis de Completitud de Datos',
    categoria: 'personal',
    descripcion: 'Personal con datos incompletos o faltantes',
    requiereFiltro: false,
    filtros: ['soloIncompletos']
  },

  // Capacitaciones
  cap_participacion: {
    id: 'cap_participacion',
    label: 'Participación del Personal en Capacitaciones',
    categoria: 'capacitaciones',
    descripcion: 'Personal y su historial de capacitaciones',
    requiereFiltro: false,
    filtros: ['fechas']
  },
  cap_cobertura: {
    id: 'cap_cobertura',
    label: 'Cobertura de Capacitaciones del Personal',
    categoria: 'capacitaciones',
    descripcion: 'Porcentaje de personal capacitado vs no capacitado',
    requiereFiltro: false,
    filtros: ['fechas']
  },

  // Emergencias
  em_participacion: {
    id: 'em_participacion',
    label: 'Participación del Personal en Emergencias',
    categoria: 'emergencias',
    descripcion: 'Personal activo en atención de emergencias',
    requiereFiltro: false,
    filtros: ['fechas', 'tipoEmergencia']
  },
  em_sin_participacion: {
    id: 'em_sin_participacion',
    label: 'Personal Sin Participación en Emergencias',
    categoria: 'emergencias',
    descripcion: 'Personal que no ha participado en emergencias',
    requiereFiltro: false,
    filtros: ['fechas']
  }
};

function TabPanel({ children, value, index, ...other }) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function ReportesPersonal() {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState(0);
  const [reporteSeleccionado, setReporteSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Filtros
  const [clases, setClases] = useState([]);
  const [grados, setGrados] = useState([]);
  const [claseFiltro, setClaseFiltro] = useState('');
  const [gradoFiltro, setGradoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [soloIncompletos, setSoloIncompletos] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [clasesRes, gradosRes] = await Promise.all([
        api.get("/clases"),
        api.get("/grados")
      ]);
      setClases(clasesRes.data || []);
      setGrados(gradosRes.data || []);
    } catch (e) {
      console.error("Error cargar catálogos:", e);
    }
  };

  // Filtrar reportes por categoría
  const reportesPorCategoria = useMemo(() => {
    const categorias = {
      resumen: [],
      personal: [],
      capacitaciones: [],
      emergencias: []
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

    setLoading(true);
    setBusqueda('');

    try {
      let resultado = [];

      switch (reporteSeleccionado) {
        case 'legajo': {
          const params = {
            limit: 10000,
            idClase: claseFiltro || undefined,
            idGrado: gradoFiltro || undefined,
            activo: estadoFiltro ? (estadoFiltro === 'activo' ? true : false) : undefined
          };
          const data = await rptLegajo(params);
          const personal = data?.data || data || [];

          // Obtener datos completos de cada personal
          const personalCompleto = await Promise.all(
            personal.map(async (p) => {
              if (!p.idpersonal) return p;
              try {
                const response = await api.get(`/personal/${p.idpersonal}`);
                const completo = response.data || {};
                // Combinar datos del reporte con datos completos
                return { ...p, ...completo };
              } catch (error) {
                console.warn(`No se pudo obtener personal ${p.idpersonal}:`, error);
                return p;
              }
            })
          );

          resultado = personalCompleto.map(p => ({
            Nombre: p.nombre || "—",
            Apellido: p.apellido || "—",
            CI: p.ci || "—",
            Clase: p.clase_etiqueta || p.clase_nombre || p.clase || "—",
            Grado: p.grado_nombre || p.grado || "—",
            Teléfono: p.telefono || p.tel || p.celular || "—",
            Estado: p.activo ? 'Activo' : 'Inactivo'
          }));
          break;
        }

        case 'distribucion_clase': {
          const data = await rptDistribucionClase();
          resultado = data.map(c => ({
            Clase: c.clase_etiqueta || c.clase_nombre || c.nombre || "—",
            'Total Personal': parseInt(c.total || c.cantidad || 0),
            Porcentaje: `${((parseInt(c.total || 0) / data.reduce((sum, item) => sum + parseInt(item.total || 0), 0)) * 100).toFixed(1)}%`
          }));
          break;
        }

        case 'distribucion_grado': {
          const data = await rptDistribucionGrado();
          resultado = data.map(g => ({
            Grado: g.grado_nombre || g.grado || g.nombre || "—",
            'Total Personal': parseInt(g.total || g.cantidad || 0),
            Porcentaje: `${((parseInt(g.total || 0) / data.reduce((sum, item) => sum + parseInt(item.total || 0), 0)) * 100).toFixed(1)}%`
          }));
          break;
        }

        case 'completitud': {
          const data = await rptCompletitud({ soloIncompletos });

          resultado = data.map(p => {
            // Calcular campos faltantes
            const faltantes = [];
            if (!p.tiene_telefono) faltantes.push('Teléfono');
            if (!p.tiene_foto) faltantes.push('Foto');
            if (!p.tiene_documento) faltantes.push('Documento');

            // Calcular porcentaje (3 campos verificables)
            const totalCampos = 3;
            const completos = (p.tiene_telefono ? 1 : 0) +
              (p.tiene_foto ? 1 : 0) +
              (p.tiene_documento ? 1 : 0);
            const porcentaje = ((completos / totalCampos) * 100).toFixed(0);

            return {
              Nombre: p.nombre || "—",
              Apellido: p.apellido || "—",
              CI: p.ci || "—",
              'Campos Faltantes': faltantes.length > 0 ? faltantes.join(', ') : 'Ninguno',
              '% Completitud': `${porcentaje}%`
            };
          });
          break;
        }

        case 'cap_participacion': {
          const params = {
            inicio: fechaInicio || undefined,
            fin: fechaFin || undefined
          };
          const data = await rptCapParticipacion(params);
          resultado = data.map(p => ({
            Nombre: p.nombre || "—",
            Apellido: p.apellido || "—",
            'Total Capacitaciones': p.total_capacitaciones || p.totalCapacitaciones || p.total || 0
          }));
          break;
        }

        case 'cap_cobertura': {
          const params = {
            inicio: fechaInicio || undefined,
            fin: fechaFin || undefined
          };
          const data = await rptCapCobertura(params);
          // Este reporte devuelve métricas agregadas
          resultado = [{
            'Total Personal': data.total_personal || 0,
            'Con Capacitación': data.con_capacitacion || 0,
            'Sin Capacitación': (data.total_personal || 0) - (data.con_capacitacion || 0),
            '% Cobertura': data.cobertura ? `${data.cobertura}%` : "0%"
          }];
          break;
        }

        case 'em_participacion': {
          const params = {
            inicio: fechaInicio || undefined,
            fin: fechaFin || undefined
          };
          const data = await rptEmParticipacion(params);
          resultado = data.map(p => ({
            Nombre: p.nombre || "—",
            Apellido: p.apellido || "—",
            'Total Emergencias': p.total_emergencias || p.totalEmergencias || p.total || 0
          }));
          break;
        }

        case 'em_sin_participacion': {
          const params = {
            inicio: fechaInicio || undefined,
            fin: fechaFin || undefined
          };
          const data = await rptEmSinParticipacion(params);
          resultado = data.map(p => ({
            Nombre: p.nombre || "—",
            Apellido: p.apellido || "—"
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
      console.error('Error al generar reporte:', e);
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "Error al generar reporte", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }

    try {
      const reporte = REPORTES[reporteSeleccionado];
      const primeraFila = datosFiltrados[0];
      if (!primeraFila || typeof primeraFila !== 'object') {
        Swal.fire("Error", "Formato de datos inválido para exportar", "error");
        return;
      }

      const columns = Object.keys(primeraFila).map(k => ({
        header: k,
        dataKey: k
      }));

      exportTablePdf({
        title: reporte?.label || "Reporte de Personal",
        subtitle: reporte?.descripcion || "",
        columns,
        rows: datosFiltrados,
        filename: `personal_${reporteSeleccionado}_${new Date().getTime()}.pdf`,
        showStats: true
      });
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      Swal.fire("Error", "Ocurrió un error al generar el PDF: " + error.message, "error");
    }
  };

  const exportarExcel = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }

    try {
      const reporte = REPORTES[reporteSeleccionado];

      exportToExcel({
        data: datosFiltrados,
        filename: `personal_${reporteSeleccionado}_${new Date().getTime()}`,
        sheetName: 'Reporte',
        title: reporte?.label || "Reporte de Personal"
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
  const mostrarFiltros = reporteActual?.filtros || [];

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Reportes de Personal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Reportes profesionales con visualizaciones y exportación múltiple
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/personal")}>
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
          <Tab label="Reportes de Personal" icon={<Search />} iconPosition="start" />
          <Tab label="Capacitaciones" icon={<TableView />} iconPosition="start" />
          <Tab label="Emergencias" icon={<Search />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Panel: Resumen Ejecutivo */}
      <TabPanel value={tabActual} index={0}>
        <ReportePersonalDashboard />
      </TabPanel>

      {/* Tab Panel: Reportes de Personal */}
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
                }}
                size="small"
              >
                <MenuItem value="">
                  <em>(Selecciona un reporte)</em>
                </MenuItem>
                {reportesPorCategoria.personal.map(r => (
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

            {/* Filtros dinámicos */}
            {mostrarFiltros.includes('clase') && (
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Clase"
                  value={claseFiltro}
                  onChange={(e) => setClaseFiltro(e.target.value)}
                  size="small"
                >
                  <MenuItem value=""><em>Todas</em></MenuItem>
                  {clases.map(c => (
                    <MenuItem key={c.idclase} value={c.idclase}>{c.nombre}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {mostrarFiltros.includes('grado') && (
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Grado"
                  value={gradoFiltro}
                  onChange={(e) => setGradoFiltro(e.target.value)}
                  size="small"
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  {grados.map(g => (
                    <MenuItem key={g.idgrado} value={g.idgrado}>{g.nombre}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {mostrarFiltros.includes('estado') && (
              <Grid item xs={12} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Estado"
                  value={estadoFiltro}
                  onChange={(e) => setEstadoFiltro(e.target.value)}
                  size="small"
                >
                  <MenuItem value=""><em>Todos</em></MenuItem>
                  <MenuItem value="activo">Activo</MenuItem>
                  <MenuItem value="inactivo">Inactivo</MenuItem>
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

      {/* Tab Panel: Capacitaciones */}
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
                }}
                size="small"
              >
                <MenuItem value="">
                  <em>(Selecciona un reporte)</em>
                </MenuItem>
                {reportesPorCategoria.capacitaciones.map(r => (
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

            {mostrarFiltros.includes('fechas') && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Inicio"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Fin"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
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

        {/* Resultados (mismo código que tab anterior) */}
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

      {/* Tab Panel: Emergencias */}
      <TabPanel value={tabActual} index={3}>
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
                }}
                size="small"
              >
                <MenuItem value="">
                  <em>(Selecciona un reporte)</em>
                </MenuItem>
                {reportesPorCategoria.emergencias.map(r => (
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

            {mostrarFiltros.includes('fechas') && (
              <>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Inicio"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha Fin"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </>
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

        {/* Resultados (mismo código) */}
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
    </LayoutDashboard>
  );
}
