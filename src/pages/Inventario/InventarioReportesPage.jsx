// src/pages/Inventario/InventarioReportesPage.jsx
import { Box, Button, Grid, Paper, TextField, Typography, Tabs, Tab, IconButton, MenuItem, Autocomplete } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { ArrowBack, PictureAsPdf, TableChart, Search } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import InventarioDashboard from "./InventarioDashboard";
import { TablaReporte } from "../../components/reportes";
import { exportTablePdf } from "../../utils/pdfExport";
import { exportToExcel } from "../../utils/exportToExcel";

// Services
import {
  listarItems, listarCategorias, listarUnidades, listarUbicaciones, listarProveedores,
  listarVehiculosCatalogo,
  rptStock, rptStockPorCategoria, rptStockPorUbicacion, rptStockPorProveedor,
  rptBajoStock, rptAgotados,
  rptKardex, rptTopConsumidos, rptMotivos, rptMovPorUbicacion,
  rptAsignacionesItemVehiculo, rptInventarioPorVehiculo,
  rptConsumosDirectos, rptConsumosConsolidado,
  rptBajas, rptBajasResumen, rptTopBajas
} from "../../services/inventario.service";

// Tipos de reportes organizados por tab (sin resumen_diario que no funciona)
const REPORTES = {
  stock: {
    stock_general: { label: "Stock General", descripcion: "Inventario completo actual" },
    stock_categoria: { label: "Stock por Categoría", descripcion: "Agrupado por categoría" },
    stock_ubicacion: { label: "Stock por Ubicación", descripcion: "Agrupado por ubicación" },
    stock_proveedor: { label: "Stock por Proveedor", descripcion: "Agrupado por proveedor" },
    bajo_stock: { label: "Items Bajo Stock", descripcion: "Items que requieren reposición" },
    agotados: { label: "Items Agotados", descripcion: "Items con stock en 0" },
  },
  movimientos: {
    kardex: { label: "Kardex", descripcion: "Historial de movimientos de un item", requiresItem: true },
    top_consumidos: { label: "Top Consumidos", descripcion: "Items más consumidos" },
    por_motivo: { label: "Por Motivo", descripcion: "Movimientos agrupados por motivo" },
    por_ubicacion: { label: "Por Ubicación", descripcion: "Movimientos agrupados por ubicación" },
  },
  asignaciones: {
    asignaciones_item: { label: "Asignaciones Item-Vehículo", descripcion: "Items asignados a vehículos" },
    inventario_vehiculo: { label: "Inventario por Vehículo", descripcion: "Todo el inventario de un vehículo", requiresVehiculo: true },
    consumos_directos: { label: "Consumos Directos", descripcion: "Consumos sin asignación" },
    consumos_consolidado: { label: "Consolidado de Consumos", descripcion: "Total de consumos agrupado" },
  },
  bajas: {
    bajas: { label: "Bajas", descripcion: "Detalle de bajas realizadas" },
    bajas_resumen: { label: "Resumen de Bajas", descripcion: "Bajas agrupadas" },
    top_bajas: { label: "Top Bajas", descripcion: "Items con más bajas" },
  }
};

export default function InventarioReportesPage() {
  const navigate = useNavigate();

  // Tab state
  const [tabActual, setTabActual] = useState(0);

  // Report state
  const [reporteSeleccionado, setReporteSeleccionado] = useState("");
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search
  const [busqueda, setBusqueda] = useState("");

  // Filters
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [itemSel, setItemSel] = useState(null);
  const [vehiculoSel, setVehiculoSel] = useState(null);

  // Catalogs
  const [items, setItems] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [unidades, setUnidades] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // Load catalogs
  useEffect(() => {
    cargarCatalogos();
  }, []);

  const cargarCatalogos = async () => {
    try {
      const [its, cats, unis, ubis, provs, vehs] = await Promise.all([
        listarItems().catch(() => []),
        listarCategorias().catch(() => []),
        listarUnidades().catch(() => []),
        listarUbicaciones().catch(() => []),
        listarProveedores().catch(() => []),
        listarVehiculosCatalogo().catch(() => [])
      ]);
      setItems(its);
      setCategorias(cats);
      setUnidades(unis);
      setUbicaciones(ubis);
      setProveedores(provs);
      setVehiculos(vehs);
    } catch (error) {
      console.error("Error cargando catálogos:", error);
    }
  };

  // Catalog maps
  const maps = useMemo(() => {
    const buildMap = (arr, idKey, nameKey) => {
      const map = new Map();
      (arr || []).forEach(item => {
        const id = item[idKey];
        const nombre = item[nameKey] || item.nombre || item.etiqueta;
        if (id && nombre) map.set(Number(id), String(nombre));
      });
      return map;
    };

    const itemMap = buildMap(items, 'iditem', 'nombre');
    const catMap = buildMap(categorias, 'idcategoria', 'nombre');
    const uniMap = buildMap(unidades, 'idunidad', 'nombre');
    const ubiMap = buildMap(ubicaciones, 'idubicacion', 'nombre');
    const provMap = buildMap(proveedores, 'idproveedor', 'nombre');
    const vehMap = buildMap(vehiculos, 'idvehiculo', 'nominacion');

    return {
      item: (id, fallback = "—") => itemMap.get(Number(id)) || fallback,
      categoria: (id, fallback = "—") => catMap.get(Number(id)) || fallback,
      unidad: (id, fallback = "—") => uniMap.get(Number(id)) || fallback,
      ubicacion: (id, fallback = "—") => ubiMap.get(Number(id)) || fallback,
      proveedor: (id, fallback = "—") => provMap.get(Number(id)) || fallback,
      vehiculo: (id, fallback = "—") => vehMap.get(Number(id)) || fallback,
    };
  }, [items, categorias, unidades, ubicaciones, proveedores, vehiculos]);

  const generarReporte = async () => {
    if (!reporteSeleccionado) {
      Swal.fire("Aviso", "Selecciona un tipo de reporte", "info");
      return;
    }

    setLoading(true);
    setBusqueda(""); // Clear search when generating new report

    try {
      let resultado = [];
      const params = {
        ...(desde && { desde }),
        ...(hasta && { hasta }),
        ...(itemSel && { idItem: itemSel.iditem }),
        ...(vehiculoSel && { idVehiculo: vehiculoSel.idvehiculo })
      };

      console.log(`DEBUG - Generando reporte: ${reporteSeleccionado}`, params);

      switch (reporteSeleccionado) {
        // STOCK Y EXISTENCIAS
        case 'stock_general': {
          const data = await rptStock();
          console.log('DEBUG - Stock general:', data);
          resultado = (data || []).map(r => ({
            Ítem: r.nombre || r.item || "—",
            Descripción: r.descripcion || "—",
            Categoría: maps.categoria(r.idcategoria, r.categoria),
            Ubicación: maps.ubicacion(r.idubicacion, r.ubicacion),
            Cantidad: r.cantidad || r.stock || 0,
            Unidad: maps.unidad(r.idunidad, r.unidad),
            Estado: r.estado || "—"
          }));
          break;
        }

        case 'stock_categoria': {
          const data = await rptStockPorCategoria();
          console.log('DEBUG - Stock categoría:', data);
          resultado = (data || []).map(r => ({
            Categoría: maps.categoria(r.idcategoria, r.categoria || r.nombre),
            'Total Items': parseInt(r.items || r.total_items || 0),
            'Total Cantidad': r.total_cantidad || r.cantidad || 0
          }));
          break;
        }

        case 'stock_ubicacion': {
          const data = await rptStockPorUbicacion();
          console.log('DEBUG - Stock ubicación:', data);
          resultado = (data || []).map(r => ({
            Ubicación: maps.ubicacion(r.idubicacion, r.ubicacion || r.nombre),
            'Total Items': parseInt(r.items || r.total_items || 0),
            'Total Cantidad': r.total_cantidad || r.cantidad || 0
          }));
          break;
        }

        case 'stock_proveedor': {
          const data = await rptStockPorProveedor();
          console.log('DEBUG - Stock proveedor:', data);
          resultado = (data || []).map(r => ({
            Proveedor: maps.proveedor(r.idproveedor, r.proveedor || r.nombre),
            'Total Items': parseInt(r.items || r.total_items || 0),
            'Total Cantidad': r.total_cantidad || r.cantidad || 0
          }));
          break;
        }

        case 'bajo_stock': {
          const data = await rptBajoStock();
          console.log('DEBUG - Bajo stock:', data);
          resultado = (data || []).map(r => ({
            Ítem: r.nombre || r.item || "—",
            Descripción: r.descripcion || "—",
            Cantidad: r.cantidad || r.stock || 0,
            'Stock Mínimo': r.stock_minimo || r.minimo || 0,
            Estado: r.estado || "Bajo Stock"
          }));
          break;
        }

        case 'agotados': {
          const data = await rptAgotados();
          console.log('DEBUG - Agotados:', data);
          resultado = (data || []).map(r => ({
            Ítem: r.nombre || r.item || "—",
            Descripción: r.descripcion || "—",
            Categoría: maps.categoria(r.idcategoria, r.categoria),
            Estado: "Agotado"
          }));
          break;
        }

        // MOVIMIENTOS
        case 'kardex': {
          if (!itemSel) {
            Swal.fire("Aviso", "Debes seleccionar un item para el Kardex", "warning");
            return;
          }
          const data = await rptKardex(params);
          console.log('DEBUG - Kardex:', data);

          // Get current stock from selected item
          const stockActual = itemSel?.cantidad || itemSel?.stock || 0;

          // Calculate initial stock by reversing movements from current stock
          let saldoInicial = stockActual;
          const movimientosReversed = [...(data || [])].reverse();
          movimientosReversed.forEach(r => {
            const cantidad = r.cantidad || 0;
            // Going backwards: reverse the logic
            if (r.tipo === 'IN' || r.tipo === 'in' || r.tipo === 'Entrada') {
              saldoInicial -= cantidad;
            } else if (r.tipo === 'OUT' || r.tipo === 'out' || r.tipo === 'Salida') {
              saldoInicial += cantidad;
            }
          });

          // Start with calculated initial stock (never negative)
          let saldoAcumulado = Math.max(0, saldoInicial);

          resultado = (data || []).map(r => {
            const cantidad = r.cantidad || 0;
            // IN adds, OUT subtracts
            if (r.tipo === 'IN' || r.tipo === 'in' || r.tipo === 'Entrada') {
              saldoAcumulado += cantidad;
            } else if (r.tipo === 'OUT' || r.tipo === 'out' || r.tipo === 'Salida') {
              saldoAcumulado -= cantidad;
            }

            return {
              Fecha: r.fecha || "—",
              Tipo: r.tipo === 'IN' ? 'Entrada' : r.tipo === 'OUT' ? 'Salida' : r.tipo,
              Cantidad: cantidad,
              Saldo: Math.max(0, saldoAcumulado), // Never show negative
              Motivo: r.motivo || "—"
            };
          });
          break;
        }

        case 'top_consumidos': {
          const data = await rptTopConsumidos(params);
          console.log('DEBUG - Top consumidos:', data);
          resultado = (data || []).map(r => ({
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            'Total Consumido': r.total_out || r.total || r.cantidad || 0
          }));
          break;
        }

        case 'por_motivo': {
          const data = await rptMotivos(params);
          console.log('DEBUG - Por motivo:', data);
          resultado = (data || []).map(r => ({
            Motivo: r.motivo || "—",
            'Total Movimientos': parseInt(r.movimientos || r.total || r.cantidad || 0)
          }));
          break;
        }

        case 'por_ubicacion': {
          const data = await rptMovPorUbicacion();
          console.log('DEBUG - Por ubicación:', data);
          resultado = (data || []).map(r => {
            const entradas = r.in_en_ubi || r.entradas || 0;
            const salidas = r.out_desde_ubi || r.salidas || 0;
            return {
              Ubicación: r.idubicacion ? maps.ubicacion(r.idubicacion, r.ubicacion || r.nombre) : "Sin ubicación",
              Entradas: entradas,
              Salidas: salidas
            };
          });
          break;
        }

        // ASIGNACIONES
        case 'asignaciones_item': {
          const data = await rptAsignacionesItemVehiculo(params);
          console.log('DEBUG - Asignaciones:', data);
          resultado = (data || []).map(r => ({
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            Vehículo: maps.vehiculo(r.idvehiculo, r.vehiculo || r.nominacion),
            Cantidad: r.cantidad || 0
          }));
          break;
        }

        case 'inventario_vehiculo': {
          if (!vehiculoSel) {
            Swal.fire("Aviso", "Debes seleccionar un vehículo", "warning");
            return;
          }
          const data = await rptInventarioPorVehiculo(params);
          console.log('DEBUG - Inventario vehículo:', data);
          resultado = (data || []).map(r => ({
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            Descripción: r.descripcion || "—",
            Cantidad: r.cantidad || 0,
            Unidad: maps.unidad(r.idunidad, r.unidad)
          }));
          break;
        }

        case 'consumos_directos': {
          const data = await rptConsumosDirectos(params);
          console.log('DEBUG - Consumos directos:', data);
          resultado = (data || []).map(r => ({
            Fecha: r.fecha || "—",
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            Cantidad: r.cantidad || 0,
            Motivo: r.motivo || "—"
          }));
          break;
        }

        case 'consumos_consolidado': {
          const data = await rptConsumosConsolidado(params);
          console.log('DEBUG - Consumos consolidado:', data);
          resultado = (data || []).map(r => ({
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            'Total Consumido': r.total || r.cantidad || 0,
            Unidad: maps.unidad(r.idunidad, r.unidad)
          }));
          break;
        }

        case 'bajas': {
          const data = await rptBajas(params);
          console.log('DEBUG - Bajas:', data);
          resultado = (data || []).map(r => ({
            Fecha: r.fecha || "—",
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            Cantidad: r.cantidad || 0,
            Motivo: r.motivo || "—"
          }));
          break;
        }

        case 'bajas_resumen': {
          const data = await rptBajasResumen(params);
          console.log('DEBUG - Bajas resumen:', data);
          resultado = (data || []).map(r => {
            // Format date
            let fechaFormateada = r.dia || r.fecha || "—";
            if (fechaFormateada && fechaFormateada !== "—") {
              try {
                const date = new Date(fechaFormateada);
                if (!isNaN(date.getTime())) {
                  fechaFormateada = date.toLocaleDateString('es-BO', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  });
                }
              } catch (e) {
                // Keep original if parsing fails
              }
            }

            return {
              Día: fechaFormateada,
              'Total Bajas': parseInt(r.total_bajas || r.total || r.cantidad || 0)
            };
          });
          break;
        }

        case 'top_bajas': {
          const data = await rptTopBajas(params);
          console.log('DEBUG - Top bajas:', data);
          resultado = (data || []).map(r => ({
            Ítem: maps.item(r.iditem, r.item || r.nombre),
            'Total Bajas': parseInt(r.total_bajas || r.total || r.cantidad || 0)
          }));
          break;
        }

        default:
          Swal.fire("Aviso", "Tipo de reporte no implementado", "warning");
          return;
      }

      setDatos(resultado);

      if (resultado.length === 0) {
        Swal.fire("Información", "No se encontraron datos para este reporte", "info");
      }

    } catch (error) {
      console.error("Error generando reporte:", error);
      const mensaje = error?.response?.data?.mensaje || error?.message || "Error al generar el reporte";
      Swal.fire("Error", mensaje, "error");
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
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }

    const reporteInfo = Object.values(REPORTES).flatMap(tab => Object.entries(tab))
      .find(([key]) => key === reporteSeleccionado);

    const title = reporteInfo ? reporteInfo[1].label : "Reporte de Inventario";

    const columns = Object.keys(datosFiltrados[0]).map(key => ({
      header: key,
      dataKey: key
    }));

    exportTablePdf({
      title,
      columns,
      rows: datosFiltrados,
      filename: `${reporteSeleccionado}.pdf`
    });
  };

  const exportarExcel = () => {
    if (!datosFiltrados || datosFiltrados.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }

    const reporteInfo = Object.values(REPORTES).flatMap(tab => Object.entries(tab))
      .find(([key]) => key === reporteSeleccionado);

    const sheetName = reporteInfo ? reporteInfo[1].label : "Reporte";

    exportToExcel(datosFiltrados, `${reporteSeleccionado}.xlsx`, sheetName);
  };

  // Dynamic filters
  const mostrarFiltroFechas = ['kardex', 'top_consumidos', 'por_motivo',
    'consumos_directos', 'consumos_consolidado', 'bajas', 'bajas_resumen', 'top_bajas'].includes(reporteSeleccionado);

  const mostrarFiltroItem = ['kardex'].includes(reporteSeleccionado);
  const mostrarFiltroVehiculo = ['inventario_vehiculo'].includes(reporteSeleccionado);

  // Get reports for current tab
  const reportesActuales = useMemo(() => {
    const tabs = ['stock', 'movimientos', 'asignaciones', 'bajas'];
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
            Reportes de Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dashboard ejecutivo y reportes detallados
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={() => navigate("/inventario")}
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
            setReporteSeleccionado("");
            setDatos([]);
            setBusqueda("");
          }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<TableChart />} label="Resumen Ejecutivo" iconPosition="start" />
          <Tab label="Stock y Existencias" />
          <Tab label="Movimientos" />
          <Tab label="Asignaciones" />
          <Tab label="Bajas" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabActual === 0 ? (
        <InventarioDashboard />
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
                    setBusqueda("");
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
                  {mostrarFiltroItem && (
                    <Grid item xs={12} md={3}>
                      <Autocomplete
                        options={items}
                        getOptionLabel={(opt) => opt.nombre || ""}
                        value={itemSel}
                        onChange={(_, v) => setItemSel(v)}
                        renderInput={(params) => (
                          <TextField {...params} label="Item *" required />
                        )}
                      />
                    </Grid>
                  )}

                  {mostrarFiltroVehiculo && (
                    <Grid item xs={12} md={3}>
                      <Autocomplete
                        options={vehiculos}
                        getOptionLabel={(opt) => opt.nominacion || opt.placa || ""}
                        value={vehiculoSel}
                        onChange={(_, v) => setVehiculoSel(v)}
                        renderInput={(params) => (
                          <TextField {...params} label="Vehículo *" required />
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
                {loading ? "Generando..." : "Generar Reporte"}
              </Button>
              {reporteSeleccionado && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setReporteSeleccionado("");
                    setDatos([]);
                    setBusqueda("");
                    setItemSel(null);
                    setVehiculoSel(null);
                    setDesde("");
                    setHasta("");
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
                  {reportesActuales[reporteSeleccionado]?.label || "Resultados"}
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

