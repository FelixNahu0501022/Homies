// src/pages/Capacitaciones/ReportesCapacitacionesPage.jsx - PROFESIONAL CON TABS
import {
  Typography, Paper, Box, Button, TextField, MenuItem, IconButton, CircularProgress, Grid, Tooltip, Tabs, Tab, Autocomplete
} from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import { ArrowBack, PictureAsPdf, FileDownload, TableChart } from "@mui/icons-material";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useNavigate } from "react-router-dom";

import {
  repParticipacionInternos, repCoberturaInternos, repInternosPorClase, repInternosPorGrado,
  repBrechasInternos, repExternosRanking, repInstitucionesRanking, repHistorialInstitucion,
  repDistribucionPorTitulo, repDistribucionPorTema, repTopCapacitaciones, repSinAsistentes,
  repSeriesMensuales, repCertificadosEmitidos, listadoCertificados, repCertificadosPorTipo, repCertificadosPorCapacitacion,
  repCertificadoBuscarPorSerie, repHistorialPersona, buscarPersonalCatalogo, buscarPersonasCatalogo,
  buscarInstitucionesCatalogo
} from "../../services/capacitaciones.service";
import { exportTablePdf } from "../../utils/pdfExport";
import { exportToExcel } from "../../utils/exportToExcel";
import { TablaReporte } from "../../components/reportes";
import CapacitacionesDashboard from "./CapacitacionesDashboard";

// Definición de reportes por categoría
const REPORTES = {
  dashboard: {
    id: 'dashboard',
    label: 'Panel de Control',
    descripcion: 'Dashboard ejecutivo con métricas e indicadores clave',
    categoria: 'resumen'
  },
  // PERSONAL INTERNO
  participacion_internos: {
    id: 'participacion_internos',
    label: 'Participación de Personal',
    descripcion: 'Historial de participación del personal interno',
    categoria: 'internos',
    requiereFiltro: 'fechas'
  },
  cobertura_internos: {
    id: 'cobertura_internos',
    label: 'Cobertura de Capacitaciones',
    descripcion: 'Porcentaje de personal capacitado',
    categoria: 'internos',
    requiereFiltro: 'fechas'
  },
  internos_clase: {
    id: 'internos_clase',
    label: 'Participación por Clase',
    descripcion: 'Distribución de capacitaciones por clase de personal',
    categoria: 'internos',
    requiereFiltro: 'fechas'
  },
  internos_grado: {
    id: 'internos_grado',
    label: 'Participación por Grado',
    descripcion: 'Distribución de capacitaciones por grado',
    categoria: 'internos',
    requiereFiltro: 'fechas'
  },
  brechas_internos: {
    id: 'brechas_internos',
    label: 'Brechas de Capacitación',
    descripcion: 'Personal sin capacitaciones recientes',
    categoria: 'internos',
    requiereFiltro: 'fechas'
  },
  historial_persona_interno: {
    id: 'historial_persona_interno',
    label: 'Historial por Persona (Interno)',
    descripcion: 'Historial completo de capacitaciones de un miembro del personal',
    categoria: 'internos',
    requiereFiltro: 'persona_interno'
  },
  // EXTERNOS E INSTITUCIONES
  externos_ranking: {
    id: 'externos_ranking',
    label: 'Ranking Participación Externa',
    descripcion: 'Personas externas con mayor participación',
    categoria: 'externos',
    requiereFiltro: 'fechas'
  },
  instituciones_ranking: {
    id: 'instituciones_ranking',
    label: 'Ranking de Instituciones',
    descripcion: 'Instituciones con mayor participación',
    categoria: 'externos',
    requiereFiltro: 'fechas'
  },
  historial_institucion: {
    id: 'historial_institucion',
    label: 'Historial por Institución',
    descripcion: 'Capacitaciones relacionadas con una institución',
    categoria: 'externos',
    requiereFiltro: 'institucion'
  },
  historial_persona_externo: {
    id: 'historial_persona_externo',
    label: 'Historial por Persona (Externa)',
    descripcion: 'Historial completo de capacitaciones de una persona externa',
    categoria: 'externos',
    requiereFiltro: 'persona_externo'
  },
  // CAPACITACIONES
  distribucion_titulo: {
    id: 'distribucion_titulo',
    label: 'Distribución por Título',
    descripcion: 'Cantidad de capacitaciones por curso/título',
    categoria: 'capacitaciones',
    requiereFiltro: 'ninguno'
  },
  distribucion_tema: {
    id: 'distribucion_tema',
    label: 'Distribución por Tema',
    descripcion: 'Cantidad de capacitaciones por tema',
    categoria: 'capacitaciones',
    requiereFiltro: 'ninguno'
  },
  top_capacitaciones: {
    id: 'top_capacitaciones',
    label: 'Top Capacitaciones',
    descripcion: 'Capacitaciones con mayor cantidad de participantes',
    categoria: 'capacitaciones',
    requiereFiltro: 'fechas'
  },
  sin_asistentes: {
    id: 'sin_asistentes',
    label: 'Capacitaciones Sin Asistentes',
    descripcion: 'Capacitaciones sin participantes registrados',
    categoria: 'capacitaciones',
    requiereFiltro: 'fechas'
  },
  series_mensuales: {
    id: 'series_mensuales',
    label: 'Serie Mensual',
    descripcion: 'Evolución temporal de capacitaciones por mes',
    categoria: 'capacitaciones',
    requiereFiltro: 'fechas'
  },
  // CERTIFICADOS
  certificados_emitidos: {
    id: 'certificados_emitidos',
    label: 'Certificados Emitidos',
    descripcion: 'Listado de todos los certificados emitidos',
    categoria: 'certificados',
    requiereFiltro: 'fechas'
  },
  certificados_tipo: {
    id: 'certificados_tipo',
    label: 'Certificados por Tipo',
    descripcion: 'Distribución de certificados por tipo/plantilla',
    categoria: 'certificados',
    requiereFiltro: 'fechas'
  },
  certificados_capacitacion: {
    id: 'certificados_capacitacion',
    label: 'Certificados por Capacitación',
    descripcion: 'Cantidad de certificados emitidos por capacitación',
    categoria: 'certificados',
    requiereFiltro: 'fechas'
  },
  buscar_serie: {
    id: 'buscar_serie',
    label: 'Buscar por Número de Serie',
    descripcion: 'Buscar un certificado específico por su número de serie',
    categoria: 'certificados',
    requiereFiltro: 'serie'
  }
};

export default function ReportesCapacitacionesPage() {
  const navigate = useNavigate();
  const [tabSeleccionada, setTabSeleccionada] = useState(0);
  const [reporteSeleccionado, setReporteSeleccionado] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  // Filtros
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [numeroSerie, setNumeroSerie] = useState("");

  // Persona interno
  const [personalOpt, setPersonalOpt] = useState([]);
  const [personaInternoSel, setPersonaInternoSel] = useState(null);
  const [loadingPersonal, setLoadingPersonal] = useState(false);

  // Persona externo
  const [personasOpt, setPersonasOpt] = useState([]);
  const [personaExternoSel, setPersonaExternoSel] = useState(null);
  const [loadingPersonas, setLoadingPersonas] = useState(false);

  // Institución
  const [institucionesOpt, setInstitucionesOpt] = useState([]);
  const [institucionSel, setInstitucionSel] = useState(null);
  const [loadingInstituciones, setLoadingInstituciones] = useState(false);

  // Cargar catálogos cuando se necesiten
  const cargarPersonal = async (search = "") => {
    setLoadingPersonal(true);
    try {
      const data = await buscarPersonalCatalogo({ search, limit: 50 });
      setPersonalOpt(data || []);
    } catch (e) {
      console.error("Error cargando personal:", e);
    } finally {
      setLoadingPersonal(false);
    }
  };

  const cargarPersonasExternas = async (search = "") => {
    setLoadingPersonas(true);
    try {
      const data = await buscarPersonasCatalogo({ search, limit: 50 });
      setPersonasOpt(data || []);
    } catch (e) {
      console.error("Error cargando personas externas:", e);
    } finally {
      setLoadingPersonas(false);
    }
  };

  const cargarInstituciones = async (search = "") => {
    setLoadingInstituciones(true);
    try {
      const data = await buscarInstitucionesCatalogo({ search, limit: 50 });
      setInstitucionesOpt(data || []);
    } catch (e) {
      console.error("Error cargando instituciones:", e);
    } finally {
      setLoadingInstituciones(false);
    }
  };

  // Cargar catálogos al inicio
  useEffect(() => {
    if (reporteSeleccionado === 'historial_persona_interno') {
      cargarPersonal();
    } else if (reporteSeleccionado === 'historial_persona_externo') {
      cargarPersonasExternas();
    } else if (reporteSeleccionado === 'historial_institucion') {
      cargarInstituciones();
    }
  }, [reporteSeleccionado]);

  // Categorías de reportes para tabs
  const categorias = useMemo(() => [
    {
      id: 'resumen',
      label: 'Resumen Ejecutivo',
      icon: <TableChart />,
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'resumen')
    },
    {
      id: 'internos',
      label: 'Personal Interno',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'internos')
    },
    {
      id: 'externos',
      label: 'Externos e Instituciones',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'externos')
    },
    {
      id: 'capacitaciones',
      label: 'Capacitaciones',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'capacitaciones')
    },
    {
      id: 'certificados',
      label: 'Certificados',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'certificados')
    }
  ], []);

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
    if (!reporteSeleccionado || reporteSeleccionado === 'dashboard') {
      return; // El dashboard se muestra automáticamente
    }

    const reporte = REPORTES[reporteSeleccionado];
    if (!reporte) return;

    // Validar filtros requeridos
    if (reporte.requiereFiltro === 'persona_interno' && !personaInternoSel) {
      Swal.fire("Aviso", "Selecciona un miembro del personal", "info");
      return;
    }
    if (reporte.requiereFiltro === 'persona_externo' && !personaExternoSel) {
      Swal.fire("Aviso", "Selecciona una persona externa", "info");
      return;
    }
    if (reporte.requiereFiltro === 'institucion' && !institucionSel) {
      Swal.fire("Aviso", "Selecciona una institución", "info");
      return;
    }
    if (reporte.requiereFiltro === 'serie' && !numeroSerie.trim()) {
      Swal.fire("Aviso", "Ingresa un número de serie", "info");
      return;
    }

    setLoading(true);
    setBusqueda(''); // Limpiar búsqueda

    try {
      let resultado = [];
      const params = {
        inicio: fechaInicio || undefined,
        fin: fechaFin || undefined
      };

      switch (reporteSeleccionado) {
        // PERSONAL INTERNO
        case 'participacion_internos': {
          const data = await repParticipacionInternos(params);
          resultado = (data || []).map(p => ({
            Nombre: p.nombre || "—",
            Apellido: p.apellido || "—",
            'Total Capacitaciones': p.total_capacitaciones || p.total || 0
          }));
          break;
        }

        case 'cobertura_internos': {
          const data = await repCoberturaInternos(params);
          console.log('DEBUG - Cobertura data:', data);
          // Normalizar: si es objeto, convertir a array
          const dataArray = Array.isArray(data) ? data : (data ? [data] : []);
          resultado = dataArray.map(c => ({
            Descripción: c.descripcion || c.categoria || "Total",
            'Total Personal': c.total_personal || 0,
            Capacitados: c.con_capacitacion || c.capacitados || 0,
            '% Cobertura': `${parseFloat(c.cobertura || c.porcentaje || 0).toFixed(1)}%`
          }));
          break;
        }

        case 'internos_clase': {
          const data = await repInternosPorClase(params);
          console.log('DEBUG - Clase data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro clase:', data[0]);
          resultado = (data || []).map(c => ({
            Clase: c.clase_gestion || c.clase || c.clase_nombre || "—",
            'Total Participantes': c.participantes || c.total_personal || c.total || 0
          }));
          break;
        }

        case 'internos_grado': {
          const data = await repInternosPorGrado(params);
          console.log('DEBUG - Grado data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro grado:', data[0]);
          resultado = (data || []).map(g => ({
            Grado: g.grado_nombre || g.grado || "—",
            'Total Participantes': g.participantes || g.total_personal || g.total || 0
          }));
          break;
        }

        case 'brechas_internos': {
          const data = await repBrechasInternos(params);
          console.log('DEBUG - Brechas data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro brechas:', data[0]);
          resultado = (data || []).map(b => ({
            Nombre: b.nombre || "—",
            Apellido: b.apellido || "—",
            'Última Capacitación': b.ultima_capacitacion || "Nunca"
          }));
          break;
        }

        case 'historial_persona_interno': {
          const data = await repHistorialPersona('interno', personaInternoSel.idpersonal, params);
          console.log('DEBUG - Historial interno data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro historial:', data[0]);
          resultado = (data || []).map(h => ({
            Capacitación: h.titulo || h.nombre_capacitacion || h.nombre || "—",
            Tema: h.tema || h.curso || "—",
            Fecha: h.fecha || "—"
          }));
          break;
        }

        // EXTERNOS E INSTITUCIONES
        case 'externos_ranking': {
          const data = await repExternosRanking(params);
          resultado = (data || []).map(e => ({
            Nombre: e.nombre || "—",
            CI: e.ci || "—",
            'Total Capacitaciones': e.total_capacitaciones || e.total || 0
          }));
          break;
        }

        case 'instituciones_ranking': {
          const data = await repInstitucionesRanking(params);
          resultado = (data || []).map(i => ({
            Institución: i.nombre || i.institucion || "—",
            'Persona Responsable': i.persona_responsable || "—",
            'Total Capacitaciones': i.total_capacitaciones || i.total || 0
          }));
          break;
        }

        case 'historial_institucion': {
          const data = await repHistorialInstitucion(institucionSel.idinstitucion, params);
          resultado = (data || []).map(h => ({
            Capacitación: h.titulo || h.nombre_capacitacion || h.nombre || "—",
            Tema: h.tema || h.curso || "—",
            Fecha: h.fecha || "—",
            Participantes: h.participantes || 0
          }));
          break;
        }

        case 'historial_persona_externo': {
          const data = await repHistorialPersona('externo', personaExternoSel.idpersona, params);
          resultado = (data || []).map(h => ({
            Capacitación: h.titulo || h.nombre_capacitacion || h.nombre || "—",
            Tema: h.tema || h.curso || "—",
            Fecha: h.fecha || "—"
          }));
          break;
        }

        // CAPACITACIONES
        case 'distribucion_titulo': {
          const data = await repDistribucionPorTitulo(params);
          console.log('DEBUG - Distribucion titulo data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro titulo:', data[0]);
          resultado = (data || []).map(d => ({
            Título: d.titulo || d.nombre || "—",
            Total: d.total_eventos || d.total || d.cantidad || 0
          }));
          break;
        }

        case 'distribucion_tema': {
          const data = await repDistribucionPorTema(params);
          resultado = (data || []).map(d => ({
            Tema: d.tema || d.nombre || "—",
            Total: d.total_eventos || d.total || d.cantidad || 0
          }));
          break;
        }

        case 'top_capacitaciones': {
          const data = await repTopCapacitaciones(params);
          console.log('DEBUG - Top capacitaciones data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro top:', data[0]);
          resultado = (data || []).map(c => ({
            Capacitación: c.titulo || c.nombre || "—",
            Fecha: c.fecha || "—",
            'Total Participantes': c.total || c.total_participantes || c.participantes || 0
          }));
          break;
        }

        case 'sin_asistentes': {
          const data = await repSinAsistentes(params);
          resultado = (data || []).map(c => ({
            ID: c.idcapacitacion,
            Capacitación: c.nombre || c.titulo || "—",
            Fecha: c.fecha || "—",
            Instructor: c.instructor || "—"
          }));
          break;
        }

        case 'series_mensuales': {
          const data = await repSeriesMensuales(params);
          console.log('DEBUG - Series mensuales data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro series:', data[0]);
          // Función para formatear fecha a "Mes Año"
          const formatearMes = (fechaStr) => {
            if (!fechaStr) return "—";
            try {
              const fecha = new Date(fechaStr);
              const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
              return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
            } catch {
              return fechaStr;
            }
          };
          resultado = (data || []).map(s => ({
            Mes: formatearMes(s.periodo || s.mes),
            'Total Capacitaciones': s.eventos || s.total_eventos || s.total_capacitaciones || s.total || 0,
            'Total Participantes': s.participantes || s.total_asistentes || s.total_participantes || 0
          }));
          break;
        }

        // CERTIFICADOS
        case 'certificados_emitidos': {
          const data = await listadoCertificados(params);
          console.log('DEBUG - Certificados data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer certificado:', data[0]);
          resultado = (data || []).map(c => ({
            'Nro Serie': c.nro_serie || c.serie || "—",
            Participante: c.participante || c.nombre || "—",
            Capacitación: c.capacitacion || c.nombre_capacitacion || "—",
            'Fecha Emisión': c.fecha_emision || c.fecha || "—",
            Estado: c.estado || "—"
          }));
          break;
        }

        case 'certificados_tipo': {
          const data = await repCertificadosPorTipo(params);
          console.log('DEBUG - Certificados por tipo data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro tipo:', data[0]);
          resultado = (data || []).map(t => ({
            Tipo: t.tipoparticipante || t.tipo || t.plantilla || "—",
            Total: t.total || t.cantidad || 0
          }));
          break;
        }

        case 'certificados_capacitacion': {
          const data = await repCertificadosPorCapacitacion(params);
          console.log('DEBUG - Certificados por capacitacion data:', data);
          if (data?.length > 0) console.log('DEBUG - Primer registro capacitacion:', data[0]);
          resultado = (data || []).map(c => ({
            Capacitación: c.titulo || c.nombre || c.capacitacion || "—",
            'Total Certificados': c.certificados || c.total_certificados || c.total || 0
          }));
          break;
        }

        case 'buscar_serie': {
          const data = await repCertificadoBuscarPorSerie(numeroSerie);
          console.log('DEBUG - Buscar serie data:', data);
          if (!data || Object.keys(data).length === 0) {
            Swal.fire("No encontrado", "No se encontró ningún certificado con ese número de serie", "warning");
            resultado = [];
          } else {
            resultado = [{
              'Nro Serie': data.nroserie || data.nro_serie || data.serie || "—",
              Participante: data.nombremostrado || data.participante || data.nombre || "—",
              Capacitación: data.capacitacion || data.nombre_capacitacion || data.titulo || `ID: ${data.idcapacitacion || '?'}`,
              'Fecha Emisión': data.fecha || data.fecha_emision || "—",
              Estado: data.anulado === false ? "Vigente" : data.anulado === true ? "Anulado" : (data.estado || "—")
            }];
          }
          break;
        }

        default:
          Swal.fire("Aviso", "Reporte no implementado", "warning");
          break;
      }

      setDatos(resultado);

      if (resultado.length === 0) {
        Swal.fire("Información", "No se encontraron registros para este reporte", "info");
      }

    } catch (e) {
      console.error("Error generando reporte:", e);
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "Error al generar reporte", "error");
      setDatos([]);
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }
    const reporte = REPORTES[reporteSeleccionado];
    const columns = Object.keys(datosFiltrados[0]).map(k => ({ header: k, dataKey: k }));
    exportTablePdf({
      title: `Reporte: ${reporte?.label || reporteSeleccionado}`,
      subtitle: reporte?.descripcion || '',
      columns,
      rows: datosFiltrados,
      filename: `capacitaciones_${reporteSeleccionado}.pdf`
    });
  };

  const exportarExcel = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }
    const reporte = REPORTES[reporteSeleccionado];
    exportToExcel({
      data: datosFiltrados,
      filename: `capacitaciones_${reporteSeleccionado}`,
      sheetName: 'Reporte',
      title: reporte?.label || reporteSeleccionado
    });
  };

  const reporteActual = REPORTES[reporteSeleccionado];
  const mostrarFiltroFechas = reporteActual?.requiereFiltro === 'fechas';
  const mostrarFiltroPersonaInterno = reporteActual?.requiereFiltro === 'persona_interno';
  const mostrarFiltroPersonaExterno = reporteActual?.requiereFiltro === 'persona_externo';
  const mostrarFiltroInstitucion = reporteActual?.requiereFiltro === 'institucion';
  const mostrarFiltroSerie = reporteActual?.requiereFiltro === 'serie';

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes de Capacitaciones</Typography>
          <Typography variant="body2" color="text.secondary">
            Reportes profesionales con visualizaciones y exportación múltiple
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/capacitaciones")}>
          Volver
        </Button>
      </Box>

      {/* Tabs de categorías */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tabSeleccionada}
          onChange={(e, newValue) => {
            setTabSeleccionada(newValue);
            const primeraCategoria = categorias[newValue];
            if (primeraCategoria?.reportes.length > 0) {
              setReporteSeleccionado(primeraCategoria.reportes[0].id);
              setDatos([]);
              setBusqueda('');
            }
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {categorias.map((cat) => (
            <Tab
              key={cat.id}
              label={cat.label}
              icon={cat.icon}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {/* Selector de reporte */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={reporteSeleccionado === 'dashboard' ? 12 : 6}>
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
            >
              {categorias[tabSeleccionada]?.reportes.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.label}
                </MenuItem>
              ))}
            </TextField>
            {reporteActual && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                {reporteActual.descripcion}
              </Typography>
            )}
          </Grid>

          {reporteSeleccionado !== 'dashboard' && (
            <Grid item xs={12} md={6} display="flex" alignItems="center">
              <Button
                variant="contained"
                onClick={generarReporte}
                disabled={loading}
                fullWidth
                sx={{ height: 56 }}
              >
                {loading ? <CircularProgress size={24} /> : "Generar Reporte"}
              </Button>
            </Grid>
          )}
        </Grid>

        {/* Filtros dinámicos según el reporte */}
        {reporteSeleccionado !== 'dashboard' && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>Filtros del Reporte</Typography>
            <Grid container spacing={2}>
              {mostrarFiltroFechas && (
                <>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Desde"
                      InputLabelProps={{ shrink: true }}
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Hasta"
                      InputLabelProps={{ shrink: true }}
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                      size="small"
                    />
                  </Grid>
                </>
              )}

              {mostrarFiltroPersonaInterno && (
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={personalOpt}
                    getOptionLabel={(option) => `${option.nombre || ''} ${option.apellido || ''} (${option.ci || ''})`}
                    value={personaInternoSel}
                    onChange={(e, newValue) => setPersonaInternoSel(newValue)}
                    onInputChange={(e, value) => {
                      if (value?.length > 2) cargarPersonal(value);
                    }}
                    loading={loadingPersonal}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Persona (Personal Interno)"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingPersonal ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {mostrarFiltroPersonaExterno && (
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={personasOpt}
                    getOptionLabel={(option) => `${option.nombre || ''} (${option.ci || ''})`}
                    value={personaExternoSel}
                    onChange={(e, newValue) => setPersonaExternoSel(newValue)}
                    onInputChange={(e, value) => {
                      if (value?.length > 2) cargarPersonasExternas(value);
                    }}
                    loading={loadingPersonas}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Persona (Externa)"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingPersonas ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {mostrarFiltroInstitucion && (
                <Grid item xs={12} sm={6}>
                  <Autocomplete
                    options={institucionesOpt}
                    getOptionLabel={(option) => option.nombre || ''}
                    value={institucionSel}
                    onChange={(e, newValue) => setInstitucionSel(newValue)}
                    onInputChange={(e, value) => {
                      if (value?.length > 2) cargarInstituciones(value);
                    }}
                    loading={loadingInstituciones}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Institución"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingInstituciones ? <CircularProgress size={20} /> : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                  />
                </Grid>
              )}

              {mostrarFiltroSerie && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Serie"
                    value={numeroSerie}
                    onChange={(e) => setNumeroSerie(e.target.value)}
                    size="small"
                    placeholder="Ej: CERT-2024-001"
                  />
                </Grid>
              )}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Mostrar Dashboard o Resultados */}
      {reporteSeleccionado === 'dashboard' ? (
        <CapacitacionesDashboard />
      ) : loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : datos.length > 0 ? (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
              <Typography variant="h6">{reporteActual?.label || "Resultados"}</Typography>
              <Box display="flex" gap={1}>
                <TextField
                  size="small"
                  placeholder="Buscar en resultados..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  sx={{ width: 250 }}
                />
                <Tooltip title="Exportar a Excel">
                  <IconButton onClick={exportarExcel} color="success">
                    <FileDownload />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Exportar a PDF">
                  <IconButton onClick={exportarPDF} color="primary">
                    <PictureAsPdf />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <TablaReporte datos={datosFiltrados} />
          </Paper>
          <Typography variant="body2" color="text.secondary" align="center">
            Mostrando {datosFiltrados.length} de {datos.length} registros
          </Typography>
        </>
      ) : (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">
            Haz clic en "Generar Reporte" para ver los resultados
          </Typography>
        </Paper>
      )}
    </LayoutDashboard>
  );
}
