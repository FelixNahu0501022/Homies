// src/pages/vehiculos/VehiculosReportesPage.jsx - MEJORADO CON TABS
import {
  Typography, Paper, Box, Button, TextField, MenuItem, IconButton, CircularProgress, Grid, Tooltip, Tabs, Tab
} from "@mui/material";
import { useState, useMemo } from "react";
import { ArrowBack, PictureAsPdf, TableChart, FileDownload } from "@mui/icons-material";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useNavigate } from "react-router-dom";

import {
  rptDistribucionEstado, rptDisponibles, rptEnEmergencia, rptTotalesItemFlota,
  rptVehiculosPorItem, rptParticipacionEmergencias, rptRankingMantenimientos,
  rptInventarioVehiculo, rptVehiculosListado, rptDisponiblesPorTipoEmergencia,
  listarVehiculos, listarInventarioItems,
} from "../../services/vehiculos.service";
import api from "../../services/axios";
import { exportTablePdf } from "../../utils/pdfExport";
import { exportToExcel } from "../../utils/exportToExcel";
import { TablaReporte } from "../../components/reportes";
import VehiculosDashboard from "./VehiculosDashboard";

// Definición de reportes por categoría
const REPORTES = {
  dashboard: {
    id: 'dashboard',
    label: 'Panel de Control',
    descripcion: 'Dashboard ejecutivo con metrics e indicadores clave',
    categoria: 'resumen'
  },
  distribucion_estado: {
    id: 'distribucion_estado',
    label: 'Distribución por Estado',
    descripcion: 'Cantidad de vehículos agrupados por estado operativo',
    categoria: 'estado'
  },
  disponibles: {
    id: 'disponibles',
    label: 'Vehículos Disponibles',
    descripcion: 'Listado de todos los vehículos operativos disponibles',
    categoria: 'estado'
  },
  en_emergencia: {
    id: 'en_emergencia',
    label: 'Vehículos en Emergencia',
    descripcion: 'Vehículos actualmente en atención de emergencias',
    categoria: 'estado'
  },
  totales_item: {
    id: 'totales_item',
    label: 'Totales por Ítem en la Flota',
    descripcion: 'Resumen de inventario distribuido en todos los vehículos',
    categoria: 'inventario'
  },
  vehiculos_por_item: {
    id: 'vehiculos_por_item',
    label: 'Vehículos por Ítem',
    descripcion: 'Listado de vehículos que poseen un ítem específico',
    categoria: 'inventario',
    requiereFiltro: 'item'
  },
  inventario_vehiculo: {
    id: 'inventario_vehiculo',
    label: 'Inventario de Vehículo',
    descripcion: 'Detalle del inventario asignado a un vehículo',
    categoria: 'inventario',
    requiereFiltro: 'vehiculo'
  },
  participacion_emergencias: {
    id: 'participacion_emergencias',
    label: 'Participación en Emergencias',
    descripcion: 'Historial de participación de vehículos en emergencias',
    categoria: 'actividad',
    requiereFiltro: 'fechas'
  },
  ranking_mantenimientos: {
    id: 'ranking_mantenimientos',
    label: 'Ranking de Mantenimientos',
    descripcion: 'Vehículos ordenados por cantidad de mantenimientos',
    categoria: 'actividad',
    requiereFiltro: 'fechas'
  },
  listado_filtrable: {
    id: 'listado_filtrable',
    label: 'Listado Completo Filtrable',
    descripcion: 'Listado general con múltiples filtros personalizables',
    categoria: 'actividad',
    requiereFiltro: 'avanzado'
  },
  disponibles_tipo_emergencia: {
    id: 'disponibles_tipo_emergencia',
    label: 'Vehículos por Tipo de Emergencia',
    descripcion: 'Vehículos disponibles categorizados por tipo de emergencia',
    categoria: 'actividad',
    requiereFiltro: 'tipo_emergencia'
  }
};

export default function VehiculosReportesPage() {
  const navigate = useNavigate();
  const [tabSeleccionada, setTabSeleccionada] = useState(0);
  const [reporteSeleccionado, setReporteSeleccionado] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState([]);
  const [busqueda, setBusqueda] = useState("");

  // Opciones para filtros
  const [vehiculosOpt, setVehiculosOpt] = useState([]);
  const [itemsOpt, setItemsOpt] = useState([]);
  const [filtrosOpt, setFiltrosOpt] = useState({ tipos: [], marcas: [], modelos: [], nominaciones: [] });

  // Filtros
  const [selItem, setSelItem] = useState("");
  const [selVehiculo, setSelVehiculo] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tipoEmergencia, setTipoEmergencia] = useState("");
  const [filtroAvanzado, setFiltroAvanzado] = useState({ estado: "", tipo: "", marca: "", modelo: "", nominacion: "" });

  // Cargar opciones al montar
  useState(() => {
    const cargarOpciones = async () => {
      try {
        const [vs, its, { data }] = await Promise.all([
          listarVehiculos(),
          listarInventarioItems(),
          api.get("/vehiculos/reportes/filtros")
        ]);
        setVehiculosOpt(vs || []);
        setItemsOpt((its || []).map(i => ({ iditem: i.iditem ?? i.idItem, nombre: i.nombre, descripcion: i.descripcion })));
        setFiltrosOpt({ tipos: data?.tipos || [], marcas: data?.marcas || [], modelos: data?.modelos || [], nominaciones: data?.nominaciones || [] });
      } catch (err) {
        console.error("Error cargando opciones:", err);
      }
    };
    cargarOpciones();
  }, []);

  // Categorías de reportes para tabs
  const categorias = useMemo(() => [
    {
      id: 'resumen',
      label: 'Resumen Ejecutivo',
      icon: <TableChart />,
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'resumen')
    },
    {
      id: 'estado',
      label: 'Estado y Disponibilidad',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'estado')
    },
    {
      id: 'inventario',
      label: 'Inventario',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'inventario')
    },
    {
      id: 'actividad',
      label: 'Actividad',
      reportes: Object.values(REPORTES).filter(r => r.categoria === 'actividad')
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
    if (reporte.requiereFiltro === 'item' && !selItem) {
      Swal.fire("Aviso", "Selecciona un ítem", "info");
      return;
    }
    if (reporte.requiereFiltro === 'vehiculo' && !selVehiculo) {
      Swal.fire("Aviso", "Selecciona un vehículo", "info");
      return;
    }

    setLoading(true);
    setBusqueda(''); // Limpiar búsqueda

    try {
      let resultado = [];

      switch (reporteSeleccionado) {
        case 'distribucion_estado': {
          const dist = await rptDistribucionEstado();
          resultado = (dist || []).map(r => ({
            Estado: r.estado,
            Total: parseInt(r.total || 0),
            Porcentaje: `${((parseInt(r.total || 0) / dist.reduce((sum, item) => sum + parseInt(item.total || 0), 0)) * 100).toFixed(1)}%`
          }));
          break;
        }

        case 'disponibles': {
          // Workaround: El endpoint /reportes/disponibles tiene un bug
          // Usamos el listado general y filtramos por estado Operativo
          const todosVehiculos = await listarVehiculos();
          const operativos = (todosVehiculos || []).filter(v =>
            v.estado === 'Operativo' || v.estado === 'operativo'
          );

          resultado = operativos.map(v => ({
            ID: v.idvehiculo,
            Placa: v.placa,
            Marca: v.marca,
            Modelo: v.modelo,
            Tipo: v.tipo || "—",
            Nominación: v.nominacion || "—"
          }));
          break;
        }

        case 'en_emergencia': {
          const emerg = await rptEnEmergencia();
          resultado = (emerg || []).map(v => ({
            ID: v.idvehiculo,
            Placa: v.placa,
            Marca: v.marca,
            Modelo: v.modelo,
            Tipo: v.tipo || "—",
            Nominación: v.nominacion || "—"
          }));
          break;
        }

        case 'totales_item': {
          const totales = await rptTotalesItemFlota();
          resultado = (totales || []).map(r => ({
            "ID Ítem": r.iditem,
            Ítem: r.nombre,
            "Total en Vehículos": r.total_en_vehiculos || 0,
            "Vehículos con Ítem": r.vehiculos_con_item || 0
          }));
          break;
        }

        case 'vehiculos_por_item': {
          const vehItem = await rptVehiculosPorItem(Number(selItem));
          resultado = (vehItem || []).map(v => ({
            "ID Vehículo": v.idvehiculo,
            Placa: v.placa,
            Marca: v.marca,
            Modelo: v.modelo,
            Estado: v.estado,
            Cantidad: v.cantidad ?? 1
          }));
          break;
        }

        case 'participacion_emergencias': {
          const partEmerg = await rptParticipacionEmergencias({
            inicio: fechaInicio || undefined,
            fin: fechaFin || undefined
          });
          resultado = (partEmerg || []).map(r => ({
            Vehículo: r.nominacion ? `${r.nominacion} (${r.placa})` : r.placa,
            "Total Emergencias": r.total_emergencias || 0
          }));
          break;
        }

        case 'ranking_mantenimientos': {
          const rankMant = await rptRankingMantenimientos({
            inicio: fechaInicio || undefined,
            fin: fechaFin || undefined
          });
          resultado = (rankMant || []).map(r => ({
            Vehículo: r.nominacion ? `${r.nominacion} (${r.placa})` : r.placa,
            "Total Mantenimientos": r.total_mantenimientos || 0
          }));
          break;
        }

        case 'inventario_vehiculo': {
          const invVeh = await rptInventarioVehiculo(Number(selVehiculo));
          resultado = (invVeh || []).map(it => ({
            "ID Ítem": it.iditem ?? it.idItem ?? "—",
            Nombre: it.item_nombre || it.nombre || "—",
            Descripción: it.descripcion || "—",
            Cantidad: it.cantidad ?? 1
          }));
          break;
        }

        case 'listado_filtrable': {
          const params = {
            estado: filtroAvanzado.estado || undefined,
            tipo: filtroAvanzado.tipo || undefined,
            marca: filtroAvanzado.marca || undefined,
            modelo: filtroAvanzado.modelo || undefined,
            nominacion: filtroAvanzado.nominacion || undefined,
          };
          const listado = await rptVehiculosListado(params);
          resultado = (listado || []).map(v => ({
            ID: v.idvehiculo,
            Placa: v.placa,
            Marca: v.marca,
            Modelo: v.modelo,
            Tipo: v.tipo || "—",
            Nominación: v.nominacion || "—",
            Estado: v.estado
          }));
          break;
        }

        case 'disponibles_tipo_emergencia': {
          // Workaround: El endpoint tiene un bug y solo devuelve 1 vehículo
          // Usamos el listado general y clasificamos por tipo en el frontend

          const todosVehiculos = await listarVehiculos();

          // Clasificar vehículos por tipo de emergencia (misma lógica del backend)
          const clasificarTipoEmergencia = (tipoVehiculo) => {
            if (!tipoVehiculo) return 'Apoyo';
            const tipo = tipoVehiculo.toLowerCase();

            if (tipo.includes('ambulancia')) return 'Médica';
            if (tipo.includes('cisterna') || tipo.includes('bombero')) return 'Incendio';
            if (tipo.includes('motocicleta') || tipo.includes('rescate')) return 'Rescate';
            return 'Apoyo'; // Furgón y otros
          };

          // Agregar tipo_emergencia a cada vehículo
          let vehiculosConTipo = (todosVehiculos || []).map(v => ({
            ...v,
            tipo_emergencia: clasificarTipoEmergencia(v.tipo)
          }));

          // Aplicar filtro si se seleccionó un tipo
          if (tipoEmergencia) {
            vehiculosConTipo = vehiculosConTipo.filter(v =>
              v.tipo_emergencia === tipoEmergencia
            );
          }

          resultado = (vehiculosConTipo || []).map(v => ({
            Vehículo: v.nominacion ? `${v.nominacion} (${v.placa})` : v.placa,
            Marca: v.marca,
            Modelo: v.modelo,
            Tipo: v.tipo || "—",
            Estado: v.estado,
            "Tipo de Emergencia": v.tipo_emergencia || "—"
          }));
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
      filename: `vehiculos_${reporteSeleccionado}.pdf`
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
      filename: `vehiculos_${reporteSeleccionado}`,
      sheetName: 'Reporte',
      title: reporte?.label || reporteSeleccionado
    });
  };

  const reporteActual = REPORTES[reporteSeleccionado];
  const mostrarFiltroItem = reporteActual?.requiereFiltro === 'item';
  const mostrarFiltroVehiculo = reporteActual?.requiereFiltro === 'vehiculo';
  const mostrarFiltroFechas = reporteActual?.requiereFiltro === 'fechas';
  const mostrarFiltroAvanzado = reporteActual?.requiereFiltro === 'avanzado';
  const mostrarFiltroTipoEmergencia = reporteActual?.requiereFiltro === 'tipo_emergencia';

  const tiposEmergencia = ['Médica', 'Incendio', 'Rescate', 'Apoyo'];

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes de Vehículos</Typography>
          <Typography variant="body2" color="text.secondary">
            Reportes profesionales con visualizaciones y exportación múltiple
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/vehiculos")}>
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
          {categorias.map((cat, index) => (
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
              {mostrarFiltroItem && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Ítem"
                    value={selItem}
                    onChange={(e) => setSelItem(e.target.value)}
                    size="small"
                  >
                    <MenuItem value=""><em>(Selecciona un ítem)</em></MenuItem>
                    {itemsOpt.map(it => (
                      <MenuItem key={it.iditem} value={it.iditem}>
                        {it.nombre} {it.descripcion ? `— ${it.descripcion}` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {mostrarFiltroVehiculo && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Vehículo"
                    value={selVehiculo}
                    onChange={(e) => setSelVehiculo(e.target.value)}
                    size="small"
                  >
                    <MenuItem value=""><em>(Selecciona un vehículo)</em></MenuItem>
                    {vehiculosOpt.map(v => (
                      <MenuItem key={v.idvehiculo} value={v.idvehiculo}>
                        {v.placa} — {v.marca} {v.modelo} {v.nominacion ? `(${v.nominacion})` : ""}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

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

              {mostrarFiltroTipoEmergencia && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Tipo de Emergencia"
                    value={tipoEmergencia}
                    onChange={(e) => setTipoEmergencia(e.target.value)}
                    size="small"
                  >
                    <MenuItem value="">(Todos los tipos)</MenuItem>
                    {tiposEmergencia.map((tipo) => (
                      <MenuItem key={tipo} value={tipo}>
                        {tipo}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              )}

              {mostrarFiltroAvanzado && (
                <>
                  <Grid item xs={6} sm={2.4}>
                    <TextField
                      select
                      fullWidth
                      label="Estado"
                      value={filtroAvanzado.estado}
                      onChange={(e) => setFiltroAvanzado({ ...filtroAvanzado, estado: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="">(Todos)</MenuItem>
                      <MenuItem value="Operativo">Operativo</MenuItem>
                      <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
                      <MenuItem value="En emergencia">En emergencia</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <TextField
                      select
                      fullWidth
                      label="Tipo"
                      value={filtroAvanzado.tipo}
                      onChange={(e) => setFiltroAvanzado({ ...filtroAvanzado, tipo: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="">(Todos)</MenuItem>
                      {filtrosOpt.tipos.map((t, i) => <MenuItem key={i} value={t}>{t}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <TextField
                      select
                      fullWidth
                      label="Marca"
                      value={filtroAvanzado.marca}
                      onChange={(e) => setFiltroAvanzado({ ...filtroAvanzado, marca: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="">(Todas)</MenuItem>
                      {filtrosOpt.marcas.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <TextField
                      select
                      fullWidth
                      label="Modelo"
                      value={filtroAvanzado.modelo}
                      onChange={(e) => setFiltroAvanzado({ ...filtroAvanzado, modelo: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="">(Todos)</MenuItem>
                      {filtrosOpt.modelos.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>)}
                    </TextField>
                  </Grid>
                  <Grid item xs={6} sm={2.4}>
                    <TextField
                      select
                      fullWidth
                      label="Nominación"
                      value={filtroAvanzado.nominacion}
                      onChange={(e) => setFiltroAvanzado({ ...filtroAvanzado, nominacion: e.target.value })}
                      size="small"
                    >
                      <MenuItem value="">(Todas)</MenuItem>
                      {filtrosOpt.nominaciones.map((n, i) => <MenuItem key={i} value={n}>{n}</MenuItem>)}
                    </TextField>
                  </Grid>
                </>
              )}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Mostrar Dashboard o Resultados */}
      {reporteSeleccionado === 'dashboard' ? (
        <VehiculosDashboard />
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
