// src/pages/Donativos/DonativosReportesPage.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, Button, Grid, TextField, MenuItem,
  Tabs, Tab, Autocomplete, IconButton
} from '@mui/material';
import {
  ArrowBack, Search, TableChart, PictureAsPdf
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import { TablaReporte } from '../../components/reportes';
import { exportTablePdf } from '../../utils/pdfExport';
import { exportToExcel } from '../../utils/exportToExcel';
import DonativosDashboard from './DonativosDashboard';
import {
  listarDonativosV2,
  reporteDonativosPorTipoV2,
  reporteDonativosPorEstadoV2,
  reporteDonativosPorMesV2,
  resumenDonativosV2,
  reporteDonativosPorDonante,
  reporteInventarioPorDonativos,
  listarDonantes
} from '../../services/donativos.service';

// Definición de reportes organizados por tab
const REPORTES = {
  donativos: {
    donaciones_periodo: { label: 'Donaciones por Período', descripcion: 'Listado completo de donaciones en un período' },
    listado_completo: { label: 'Listado Completo', descripcion: 'Todos los donativos registrados' },
    por_tipo: { label: 'Por Tipo de Donativo', descripcion: 'Agrupado por tipo' },
    por_estado: { label: 'Por Estado', descripcion: 'Agrupado por estado' },
    por_mes: { label: 'Por Mes', descripcion: 'Tendencia mensual' },
    resumen: { label: 'Resumen General', descripcion: 'Estadísticas generales' }
  },
  donantes: {
    historial_donante: { label: 'Historial por Donante', descripcion: 'Historial completo de un donante' },
    ranking_donantes: { label: 'Ranking de Donantes', descripcion: 'Donantes con mayor participación' },
    donantes_activos: { label: 'Donantes Activos', descripcion: 'Lista de donantes activos' }
  }
};

export default function DonativosReportesPage() {
  const navigate = useNavigate();
  const [tabActual, setTabActual] = useState(0);
  const [reporteSeleccionado, setReporteSeleccionado] = useState('');
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState('');

  // Filtros
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [donanteSel, setDonanteSel] = useState(null);

  // Catálogos
  const [donantes, setDonantes] = useState([]);

  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const donantesRes = await listarDonantes({ activo: true, limit: 1000 });
      setDonantes(donantesRes.data || donantesRes || []);
    } catch (error) {
      console.error('Error cargando catálogos:', error);
    }
  };

  const generarReporte = async () => {
    if (!reporteSeleccionado) {
      Swal.fire('Aviso', 'Selecciona un tipo de reporte', 'info');
      return;
    }

    // Validaciones específicas
    if (reporteSeleccionado === 'historial_donante' && !donanteSel) {
      Swal.fire('Aviso', 'Debes seleccionar un donante', 'warning');
      return;
    }

    setLoading(true);
    console.log(`DEBUG - Generando reporte: ${reporteSeleccionado}`, { desde, hasta, donanteSel });

    try {
      const params = {
        desde: desde || null,
        hasta: hasta || null,
        idDonante: donanteSel?.iddonante || null
      };

      let resultado = [];

      switch (reporteSeleccionado) {
        // DONATIVOS
        case 'donaciones_periodo': {
          const data = await listarDonativosV2({ desde, hasta, detalle: '2' });
          console.log('DEBUG - Donaciones período:', data);
          resultado = (data.data || data || []).map(d => {
            // Formatear monto según el tipo
            let montoDisplay = '—';
            if (d.cantidad != null) {
              if (d.tipo === 'Efectivo' || d.tipo_codigo === 'efectivo') {
                montoDisplay = `Bs ${parseFloat(d.cantidad).toFixed(2)}`;
              } else {
                montoDisplay = String(d.cantidad);
              }
            }
            return {
              Fecha: d.fecha || '—',
              Tipo: d.tipo || d.tipo_nombre || '—',
              Donante: d.donante_nombre || d.donante || '—',
              Monto: montoDisplay,
              Descripción: d.descripcion || '—',
              Estado: d.estado || '—'
            };
          });
          break;
        }

        case 'listado_completo': {
          const data = await listarDonativosV2({ detalle: '2' });
          console.log('DEBUG - Listado completo:', data);
          resultado = (data.data || data || []).map(d => {
            let montoDisplay = '—';
            if (d.cantidad != null) {
              if (d.tipo === 'Efectivo' || d.tipo_codigo === 'efectivo') {
                montoDisplay = `Bs ${parseFloat(d.cantidad).toFixed(2)}`;
              } else {
                montoDisplay = String(d.cantidad);
              }
            }
            return {
              ID: d.iddonativo,
              Fecha: d.fecha || '—',
              Tipo: d.tipo || d.tipo_nombre || '—',
              Donante: d.donante_nombre || d.donante || '—',
              Monto: montoDisplay,
              Estado: d.estado || '—'
            };
          });
          break;
        }

        case 'por_tipo': {
          const data = await reporteDonativosPorTipoV2(params);
          console.log('DEBUG - Por tipo:', data);
          resultado = (data || []).map(r => ({
            Tipo: r.tipo || r.nombre || '—',
            'Total Donativos': parseInt(r.total_donativos || r.total || r.cantidad || 0)
          }));
          break;
        }

        case 'por_estado': {
          const data = await reporteDonativosPorEstadoV2(params);
          console.log('DEBUG - Por estado:', data);
          resultado = (data || []).map(r => ({
            Estado: r.estado || '—',
            Total: r.total_donativos || r.total || r.cantidad || 0
          }));
          break;
        }

        case 'por_mes': {
          const data = await reporteDonativosPorMesV2(params);
          console.log('DEBUG - Por mes:', data);
          resultado = (data || []).map(r => {
            // Formatear mes desde anio/mes
            const anio = r.anio || new Date().getFullYear();
            const mes = String(r.mes || 1).padStart(2, '0');
            return {
              Mes: `${anio}-${mes}`,
              'Total Donativos': parseInt(r.total_donativos || r.total || r.cantidad || 0)
            };
          });
          break;
        }

        case 'resumen': {
          const data = await resumenDonativosV2(params);
          console.log('DEBUG - Resumen:', data);
          resultado = [{
            'Total Donativos': parseInt(data.total_donativos || data.total || 0),
            'Material': parseInt(data.total_material || 0),
            'Efectivo': parseInt(data.total_efectivo || 0),
            'Servicio': parseInt(data.total_servicio || 0)
          }];
          break;
        }

        // DONANTES
        case 'historial_donante': {
          const data = await reporteDonativosPorDonante(donanteSel.iddonante, { desde, hasta });
          console.log('DEBUG - Historial donante:', data);
          resultado = (data || []).map(d => {
            let montoDisplay = '—';
            if (d.cantidad != null) {
              if (d.tipo === 'Efectivo' || d.tipo_codigo === 'efectivo') {
                montoDisplay = `Bs ${parseFloat(d.cantidad).toFixed(2)}`;
              } else {
                montoDisplay = String(d.cantidad);
              }
            }
            return {
              Fecha: d.fecha || '—',
              'Tipo Donativo': d.tipo || d.tipo_nombre || '—',
              Monto: montoDisplay,
              Descripción: d.descripcion || '—',
              Estado: d.estado || '—'
            };
          });
          break;
        }

        case 'ranking_donantes': {
          // Necesitamos procesar datos de múltiples donantes
          const donantesRes = await listarDonantes({ activo: true, limit: 100 });
          const donantesData = donantesRes.data || donantesRes || [];

          // Para cada donante, obtener su total de donaciones
          const rankings = await Promise.all(
            donantesData.map(async (donante) => {
              try {
                const historial = await reporteDonativosPorDonante(donante.iddonante, params);
                const nombreDisplay = donante.razon_social || donante.nombres || donante.nombre || '—';
                return {
                  Donante: nombreDisplay,
                  'Total Donaciones': historial?.length || 0
                };
              } catch {
                return null;
              }
            })
          );

          resultado = rankings
            .filter(r => r && r['Total Donaciones'] > 0)
            .sort((a, b) => b['Total Donaciones'] - a['Total Donaciones'])
            .slice(0, 20)
            .map(r => ({
              Donante: r.Donante,
              'Total Donaciones': r['Total Donaciones']
            }));
          break;
        }

        case 'donantes_activos': {
          const data = await listarDonantes({ activo: true, limit: 1000 });
          console.log('DEBUG - Donantes activos:', data);
          resultado = (data.data || data || []).map(d => ({
            ID: d.iddonante,
            Nombre: d.razon_social || d.nombres || d.nombre || '—',
            Tipo: d.tipo || '—',
            Email: d.email || '—',
            Teléfono: d.telefono || '—'
          }));
          break;
        }

        default:
          Swal.fire('Aviso', 'Tipo de reporte no implementado', 'warning');
          return;
      }

      setDatos(resultado);

      if (resultado.length === 0) {
        Swal.fire('Información', 'No se encontraron datos para este reporte', 'info');
      }

    } catch (error) {
      console.error('Error generando reporte:', error);
      const mensaje = error?.response?.data?.mensaje || error?.message || 'Error al generar el reporte';
      Swal.fire('Error', mensaje, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtered data based on search
  const datosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return datos;

    const searchLower = busqueda.toLowerCase();
    return datos.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchLower)
      )
    );
  }, [datos, busqueda]);

  const exportarPDF = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire('Aviso', 'No hay datos para exportar', 'info');
      return;
    }

    const reporteInfo = Object.values(REPORTES).flatMap(tab => Object.entries(tab))
      .find(([key]) => key === reporteSeleccionado);

    const title = reporteInfo ? reporteInfo[1].label : 'Reporte de Donativos';

    const columns = Object.keys(datosFiltrados[0]).map(key => ({
      header: key,
      dataKey: key
    }));

    exportTablePdf({
      title,
      columns,
      rows: datosFiltrados,
      filename: `donativos_${reporteSeleccionado}.pdf`
    });
  };

  const exportarExcel = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire('Aviso', 'No hay datos para exportar', 'info');
      return;
    }

    const reporteInfo = Object.values(REPORTES).flatMap(tab => Object.entries(tab))
      .find(([key]) => key === reporteSeleccionado);

    const sheetName = reporteInfo ? reporteInfo[1].label : 'Reporte';

    exportToExcel(datosFiltrados, `donativos_${reporteSeleccionado}.xlsx`, sheetName);
  };

  // Dynamic filters
  const mostrarFiltroFechas = ['donaciones_periodo', 'por_tipo', 'por_estado', 'por_mes',
    'resumen', 'historial_donante', 'ranking_donantes'].includes(reporteSeleccionado);

  const mostrarFiltroDonante = ['historial_donante'].includes(reporteSeleccionado);

  // Get reports for current tab
  const reportesActuales = useMemo(() => {
    const tabs = ['donativos', 'donantes'];
    if (tabActual === 0) return {}; // Dashboard tab
    const tabKey = tabs[tabActual - 1];
    return REPORTES[tabKey] || {};
  }, [tabActual]);

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Reportes de Donativos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard ejecutivo y reportes detallados
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/donativos")}
        >
          Volver
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabActual}
          onChange={(_, newValue) => {
            setTabActual(newValue);
            setReporteSeleccionado('');
            setDatos([]);
            setBusqueda('');
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<TableChart />} label="Resumen Ejecutivo" iconPosition="start" />
          <Tab label="Donativos" />
          <Tab label="Donantes" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabActual === 0 ? (
        <DonativosDashboard />
      ) : (
        <>
          {/* Report Selection */}
          <Paper sx={{ p: 2, mb: 2 }}>
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
                    setBusqueda('');
                  }}
                  helperText={reporteSeleccionado && reportesActuales[reporteSeleccionado]?.descripcion}
                >
                  <MenuItem value="">Selecciona un reporte</MenuItem>
                  {Object.entries(reportesActuales).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Dynamic Filters */}
              {reporteSeleccionado && (
                <>
                  {mostrarFiltroDonante && (
                    <Grid item xs={12} md={3}>
                      <Autocomplete
                        options={donantes}
                        getOptionLabel={(opt) => {
                          const nombre = opt.razon_social || opt.nombre || opt.nombres || "";
                          return nombre || `Donante #${opt.iddonante}`;
                        }}
                        value={donanteSel}
                        onChange={(_, v) => setDonanteSel(v)}
                        renderInput={(params) => (
                          <TextField {...params} label="Donante *" required />
                        )}
                      />
                    </Grid>
                  )}

                  {mostrarFiltroFechas && (
                    <>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Desde"
                          InputLabelProps={{ shrink: true }}
                          value={desde}
                          onChange={(e) => setDesde(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={6} md={2}>
                        <TextField
                          fullWidth
                          type="date"
                          label="Hasta"
                          InputLabelProps={{ shrink: true }}
                          value={hasta}
                          onChange={(e) => setHasta(e.target.value)}
                        />
                      </Grid>
                    </>
                  )}
                </>
              )}
            </Grid>

            <Box mt={2} display="flex" gap={1}>
              <Button
                variant="contained"
                onClick={generarReporte}
                disabled={loading || !reporteSeleccionado}
              >
                {loading ? 'Generando...' : 'Generar Reporte'}
              </Button>
              {reporteSeleccionado && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setReporteSeleccionado('');
                    setDatos([]);
                    setBusqueda('');
                    setDonanteSel(null);
                    setDesde('');
                    setHasta('');
                  }}
                >
                  Limpiar
                </Button>
              )}
            </Box>
          </Paper>

          {/* Results */}
          {datos.length > 0 && (
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
                <Typography variant="h6">
                  {reportesActuales[reporteSeleccionado]?.label || 'Resultados'}
                </Typography>

                <Box display="flex" gap={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Buscar en resultados..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ minWidth: 250 }}
                  />
                  <IconButton onClick={exportarExcel} color="success" title="Exportar a Excel">
                    <TableChart />
                  </IconButton>
                  <IconButton onClick={exportarPDF} color="primary" title="Exportar a PDF">
                    <PictureAsPdf />
                  </IconButton>
                </Box>
              </Box>

              <TablaReporte datos={datosFiltrados} />

              <Typography variant="body2" color="text.secondary" mt={2}>
                Mostrando {datosFiltrados.length} de {datos.length} registros
              </Typography>
            </Paper>
          )}

          {!loading && datos.length === 0 && reporteSeleccionado && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Haz clic en "Generar Reporte" para ver los resultados
              </Typography>
            </Paper>
          )}
        </>
      )}
    </LayoutDashboard>
  );
}
