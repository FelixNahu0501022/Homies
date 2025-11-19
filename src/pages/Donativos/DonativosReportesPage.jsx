import {
  Typography, Paper, Box, Grid, TextField, Button, Divider, Table, TableHead, TableRow, TableCell,
  TableBody, Chip, CircularProgress, Stack, Tabs, Tab, Alert
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import Autocomplete from "@mui/material/Autocomplete";
import {
  reporteDonativosPorTipoV2,
  reporteDonativosPorEstadoV2,
  reporteDonativosPorMesV2,
  reporteInventarioPorDonativos,
  resumenDonativosV2,
  listarDonantes,
  reportePorDonante
} from "../../services/donativos.service";
import {
  ResponsiveContainer, PieChart, Pie, Tooltip as RTooltip, Legend, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, LineChart, Line, Cell
} from "recharts";
import { exportTablePdf } from "../../utils/pdfExport";

const COLORS = [
  "#1976d2", "#2e7d32", "#ed6c02", "#9c27b0", "#d32f2f",
  "#455a64", "#00838f", "#6d4c41", "#7b1fa2", "#43a047",
  "#c2185b", "#f9a825", "#5d4037"
];

export default function DonativosReportesPage() {
  // === Tabs: 0 => Generales, 1 => Por Donante
  const [tab, setTab] = useState(0);

  // === Filtros Generales
  const [desdeG, setDesdeG] = useState(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [hastaG, setHastaG] = useState(() => new Date().toISOString().slice(0, 10));

  // === Filtro Por Donante
  const [desdeD, setDesdeD] = useState(() => new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10));
  const [hastaD, setHastaD] = useState(() => new Date().toISOString().slice(0, 10));
  const [donantes, setDonantes] = useState([]);
  const [donanteSel, setDonanteSel] = useState(null);
  const [donQ, setDonQ] = useState("");

  const [loading, setLoading] = useState(false);

  // === Data Generales
  const [porTipo, setPorTipo] = useState([]);
  const [porEstado, setPorEstado] = useState([]);
  const [porMes, setPorMes] = useState([]);
  const [invPorDonativos, setInvPorDonativos] = useState([]);
  const [resumen, setResumen] = useState(null);

  // === Data Por Donante
  const [rowsDonante, setRowsDonante] = useState([]);
  const [resumenDonante, setResumenDonante] = useState(null);

  // ===== Helpers render vacíos
  const Empty = ({ height = 220, text = "Sin datos en el rango seleccionado" }) => (
    <Box sx={{ display: "grid", placeItems: "center", height, color: "text.secondary" }}>{text}</Box>
  );

  // ====== Cargar Generales con V2 (usa desde/hasta)
  const cargarGenerales = async () => {
    try {
      setLoading(true);
      const [t, e, m, inv, res] = await Promise.all([
        reporteDonativosPorTipoV2({ desde: desdeG, hasta: hastaG }),
        reporteDonativosPorEstadoV2({ desde: desdeG, hasta: hastaG }),
        reporteDonativosPorMesV2({ desde: desdeG, hasta: hastaG }),
        reporteInventarioPorDonativos(), // este es legacy, no filtra por fecha (si necesitas, házmelo saber para versionarlo)
        resumenDonativosV2({ desde: desdeG, hasta: hastaG }),
      ]);
      setPorTipo(Array.isArray(t) ? t : []);
      setPorEstado(Array.isArray(e) ? e : []);
      setPorMes(Array.isArray(m) ? m : []);
      setInvPorDonativos(Array.isArray(inv) ? inv : []);
      setResumen(res || null);
      if ((t?.length || 0) === 0 && (e?.length || 0) === 0 && (m?.length || 0) === 0) {
        Swal.fire("Sin resultados", "No se encontraron donativos para el rango seleccionado.", "info");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "No se pudieron cargar los reportes";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ====== Cargar Por Donante
  const cargarPorDonante = async () => {
    try {
      setLoading(true);
      const iddonante = donanteSel?.iddonante || null;
      if (!iddonante) {
        setRowsDonante([]);
        setResumenDonante(null);
        Swal.fire("Atención", "Selecciona un donante para consultar.", "info");
        return;
      }
      const [rows, resDon] = await Promise.all([
        reportePorDonante({ iddonante, desde: desdeD, hasta: hastaD }),
        resumenDonativosV2({ desde: desdeD, hasta: hastaD, idDonante: iddonante }),
      ]);
      setRowsDonante(Array.isArray(rows) ? rows : []);
      setResumenDonante(resDon || null);
      if ((rows?.length || 0) === 0) {
        Swal.fire("Sin resultados", "El donante no tiene donativos en el rango seleccionado.", "info");
      }
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || "No se pudo cargar el reporte por donante";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ====== Autocomplete Donantes
  const cargarDonantes = async (q = "") => {
    try {
      const data = await listarDonantes({ q, activo: true, limit: 20, offset: 0 });
      setDonantes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    // Primera carga: pestaña generales
    cargarGenerales();
    cargarDonantes("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // === Transformaciones para gráficos
  const pieTipoData = useMemo(
    () => porTipo.map(r => ({ name: r.tipo, value: Number(r.total_donativos || 0) })),
    [porTipo]
  );

  const barEstadoData = useMemo(
    () => porEstado.map(r => ({ estado: r.estado, total: Number(r.total_donativos || 0) })),
    [porEstado]
  );

  const lineMesData = useMemo(
    () =>
      [...porMes]
        .sort((a, b) => (a.periodo > b.periodo ? 1 : -1))
        .map(r => ({ periodo: r.periodo, total: Number(r.total_donativos || 0) })),
    [porMes]
  );

  // ===== Exportaciones a PDF (Generales)
  const exportResumenPdf = () => {
    const porTipoRows = (resumen?.por_tipo || []).map(x => ({
      tipo: x.tipo,
      total: x.total,
      cantidad: x.cantidad ?? 0
    }));
    const porEstadoRows = (resumen?.por_estado || []).map(x => ({
      estado: x.estado,
      total: x.total,
      cantidad: x.cantidad ?? 0
    }));

    exportTablePdf({
      title: "Resumen Donativos - Por Tipo",
      subtitle: `Rango: ${resumen?.desde || desdeG} a ${resumen?.hasta || hastaG}`,
      columns: [
        { header: "Tipo", dataKey: "tipo" },
        { header: "Total", dataKey: "total" },
        { header: "Cantidad", dataKey: "cantidad" },
      ],
      rows: porTipoRows,
      filename: "donativos_resumen_por_tipo.pdf",
    });

    exportTablePdf({
      title: "Resumen Donativos - Por Estado",
      subtitle: `Rango: ${resumen?.desde || desdeG} a ${resumen?.hasta || hastaG}`,
      columns: [
        { header: "Estado", dataKey: "estado" },
        { header: "Total", dataKey: "total" },
        { header: "Cantidad", dataKey: "cantidad" },
      ],
      rows: porEstadoRows,
      filename: "donativos_resumen_por_estado.pdf",
    });
  };

  const exportPorTipoPdf = () => {
    exportTablePdf({
      title: "Donativos por Tipo",
      subtitle: `Rango: ${desdeG} a ${hastaG}`,
      columns: [
        { header: "Tipo", dataKey: "tipo" },
        { header: "Total donativos", dataKey: "total_donativos" },
        { header: "Total cantidad", dataKey: "total_cantidad" },
      ],
      rows: porTipo.map(r => ({
        tipo: r.tipo,
        total_donativos: Number(r.total_donativos || 0),
        total_cantidad: Number(r.total_cantidad || 0),
      })),
      filename: "donativos_por_tipo.pdf",
    });
  };

  const exportPorEstadoPdf = () => {
    exportTablePdf({
      title: "Donativos por Estado",
      subtitle: `Rango: ${desdeG} a ${hastaG}`,
      columns: [
        { header: "Estado", dataKey: "estado" },
        { header: "Total donativos", dataKey: "total_donativos" },
        { header: "Total cantidad", dataKey: "total_cantidad" },
      ],
      rows: porEstado.map(r => ({
        estado: r.estado,
        total_donativos: Number(r.total_donativos || 0),
        total_cantidad: Number(r.total_cantidad || 0),
      })),
      filename: "donativos_por_estado.pdf",
    });
  };

  const exportPorMesPdf = () => {
    exportTablePdf({
      title: "Donativos por Mes",
      subtitle: `Rango: ${desdeG} a ${hastaG}`,
      columns: [
        { header: "Periodo", dataKey: "periodo" },
        { header: "Total donativos", dataKey: "total_donativos" },
        { header: "Total cantidad", dataKey: "total_cantidad" },
      ],
      rows: porMes.map(r => ({
        periodo: r.periodo,
        total_donativos: Number(r.total_donativos || 0),
        total_cantidad: Number(r.total_cantidad || 0),
      })),
      filename: "donativos_por_mes.pdf",
    });
  };

  const exportInventarioPdf = () => {
    exportTablePdf({
      title: "Inventario Ingresado por Donativos",
      subtitle: "",
      columns: [
        { header: "Ítem", dataKey: "item_nombre" },
        { header: "Cantidad donada", dataKey: "cantidad_donada" },
        { header: "# Donativos distintos", dataKey: "donativos_distintos" },
      ],
      rows: invPorDonativos.map(r => ({
        item_nombre: r.item_nombre || r.iditem,
        cantidad_donada: Number(r.cantidad_donada || 0),
        donativos_distintos: Number(r.donativos_distintos || 0),
      })),
      filename: "inventario_por_donativos.pdf",
      orientation: "landscape",
    });
  };

  return (
    <LayoutDashboard>
      <Box mb={2}>
        <Typography variant="h5">Reportes de Donativos</Typography>
      </Box>

      <Paper sx={{ p: 1, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Generales" />
          <Tab label="Por donante" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Desde"
                  type="date"
                  value={desdeG}
                  onChange={(e) => setDesdeG(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Hasta"
                  type="date"
                  value={hastaG}
                  onChange={(e) => setHastaG(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md="auto">
                <Button variant="contained" onClick={cargarGenerales} disabled={loading}>
                  {loading ? "Actualizando..." : "Actualizar"}
                </Button>
              </Grid>
              <Grid item xs />
              <Grid item>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="outlined" onClick={exportResumenPdf} disabled={loading || !resumen}>Exportar Resumen</Button>
                  <Button variant="outlined" onClick={exportPorTipoPdf} disabled={loading || porTipo.length === 0}>Exportar por Tipo</Button>
                  <Button variant="outlined" onClick={exportPorEstadoPdf} disabled={loading || porEstado.length === 0}>Exportar por Estado</Button>
                  <Button variant="outlined" onClick={exportPorMesPdf} disabled={loading || porMes.length === 0}>Exportar por Mes</Button>
                  <Button variant="outlined" onClick={exportInventarioPdf} disabled={loading || invPorDonativos.length === 0}>Exportar Inventario</Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>

          {loading && (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Resumen</Typography>
                {!resumen ? (
                  <Empty />
                ) : (
                  <>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} divider={<Divider flexItem orientation="vertical" />}>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Rango</Typography>
                        <Typography variant="subtitle1">
                          {resumen?.desde || desdeG} — {resumen?.hasta || hastaG}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total donativos</Typography>
                        <Typography variant="h6">{Number(resumen?.total_donativos || 0)}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Total cantidad (materiales)</Typography>
                        <Typography variant="h6">{Number(resumen?.total_cantidad || 0)}</Typography>
                      </Box>
                    </Stack>

                    <Grid container spacing={2} mt={1}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Por tipo</Typography>
                        <Box component="ul" sx={{ pl: 3, mt: 0 }}>
                          {(resumen?.por_tipo || []).map((x, i) => (
                            <li key={i}>
                              {x.tipo}: <b>{x.total}</b> (cant: {x.cantidad ?? 0})
                            </li>
                          ))}
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2">Por estado</Typography>
                        <Box component="ul" sx={{ pl: 3, mt: 0 }}>
                          {(resumen?.por_estado || []).map((x, i) => (
                            <li key={i}>
                              {x.estado}: <b>{x.total}</b> (cant: {x.cantidad ?? 0})
                            </li>
                          ))}
                        </Box>
                      </Grid>
                    </Grid>
                  </>
                )}
              </Paper>

              <Grid container spacing={3}>
                {/* Pie: Por Tipo */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 360 }}>
                    <Typography variant="subtitle1" gutterBottom>Donativos por tipo</Typography>
                    {pieTipoData.length === 0 ? (
                      <Empty height={280} />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie dataKey="value" data={pieTipoData} outerRadius={100} label>
                            {pieTipoData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <RTooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>
                </Grid>

                {/* Barras: Por Estado */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 360 }}>
                    <Typography variant="subtitle1" gutterBottom>Donativos por estado</Typography>
                    {barEstadoData.length === 0 ? (
                      <Empty height={280} />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={barEstadoData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="estado" />
                          <YAxis allowDecimals={false} />
                          <RTooltip />
                          <Legend />
                          <Bar dataKey="total" name="Total">
                            {barEstadoData.map((_, i) => (
                              <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>
                </Grid>

                {/* Línea: Por Mes */}
                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 2, height: 360 }}>
                    <Typography variant="subtitle1" gutterBottom>Donativos por mes</Typography>
                    {lineMesData.length === 0 ? (
                      <Empty height={280} />
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={lineMesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="periodo" />
                          <YAxis allowDecimals={false} />
                          <RTooltip />
                          <Legend />
                          <Line type="monotone" dataKey="total" name="Total" stroke="#1976d2" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}
                  </Paper>
                </Grid>
              </Grid>

              {/* Tabla: Inventario por Donativos (legacy, sin filtro de fechas) */}
              <Paper sx={{ p: 2, mt: 3 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" gutterBottom>Inventario ingresado por donativos</Typography>
                  <Button variant="outlined" onClick={exportInventarioPdf} disabled={invPorDonativos.length === 0}>
                    Exportar PDF
                  </Button>
                </Box>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ítem</TableCell>
                      <TableCell align="right">Cantidad donada</TableCell>
                      <TableCell align="right"># Donativos distintos</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invPorDonativos.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3}>Sin datos</TableCell>
                      </TableRow>
                    )}
                    {invPorDonativos.map((r) => (
                      <TableRow key={r.iditem}>
                        <TableCell>
                          <Chip size="small" label={r.item_nombre || r.iditem} />
                        </TableCell>
                        <TableCell align="right">{Number(r.cantidad_donada || 0)}</TableCell>
                        <TableCell align="right">{Number(r.donativos_distintos || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Alert sx={{ mt: 2 }} severity="info">
                  Este bloque aún no filtra por fechas. Si quieres, lo migramos a un endpoint V2 con rango.
                </Alert>
              </Paper>
            </>
          )}
        </>
      )}

      {tab === 1 && (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Autocomplete
                  options={donantes}
                  value={donanteSel}
                  onChange={(_, v) => setDonanteSel(v || null)}
                  inputValue={donQ}
                  onInputChange={(_, q) => {
                    setDonQ(q || "");
                    cargarDonantes(q);
                  }}
                  getOptionLabel={(opt) => {
                    if (!opt) return "";
                    return opt.tipo === "INSTITUCION"
                      ? (opt.razon_social || "")
                      : `${opt.nombres || ""} ${opt.apellidos || ""}`.trim();
                  }}
                  renderInput={(params) => (
                    <TextField {...params} label="Donante (persona o institución)" fullWidth />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.iddonante}>
                      {option.tipo === "INSTITUCION"
                        ? `${option.razon_social || ""}`
                        : `${option.nombres || ""} ${option.apellidos || ""}`.trim()
                      }
                      {option.documento_numero ? ` — ${option.documento_numero}` : ""}
                    </li>
                  )}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Desde"
                  type="date"
                  value={desdeD}
                  onChange={(e) => setDesdeD(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Hasta"
                  type="date"
                  value={hastaD}
                  onChange={(e) => setHastaD(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md="auto">
                <Button variant="contained" onClick={cargarPorDonante} disabled={loading}>
                  {loading ? "Consultando..." : "Consultar"}
                </Button>
              </Grid>
            </Grid>
          </Paper>

          {loading && (
            <Box sx={{ display: "grid", placeItems: "center", minHeight: 220 }}>
              <CircularProgress />
            </Box>
          )}

          {!loading && (
            <>
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Resumen del donante</Typography>
                {!resumenDonante ? (
                  <Empty />
                ) : (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} divider={<Divider flexItem orientation="vertical" />}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Rango</Typography>
                      <Typography variant="subtitle1">
                        {resumenDonante?.desde || desdeD} — {resumenDonante?.hasta || hastaD}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total donativos</Typography>
                      <Typography variant="h6">{Number(resumenDonante?.total_donativos || 0)}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Total cantidad (materiales)</Typography>
                      <Typography variant="h6">{Number(resumenDonante?.total_cantidad || 0)}</Typography>
                    </Box>
                  </Stack>
                )}
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                  <Typography variant="subtitle1">Donativos del donante</Typography>
                  {/* Si deseas exportar esta tabla, podemos armar un exportTablePdf similar */}
                </Box>

                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Descripción</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell>Ítem (si material)</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rowsDonante.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6}>Sin datos en el rango seleccionado</TableCell>
                      </TableRow>
                    )}
                    {rowsDonante.map((r) => (
                      <TableRow key={r.iddonativo}>
                        <TableCell>{String(r.fecha).slice(0, 10)}</TableCell>
                        <TableCell>
                          <Chip size="small" label={r.tipo || r.tipo_codigo || "—"} />
                        </TableCell>
                        <TableCell>{r.descripcion || "—"}</TableCell>
                        <TableCell align="right">{r.cantidad ?? "—"}</TableCell>
                        <TableCell>{r.item_nombre || "—"}</TableCell>
                        <TableCell>{r.estado || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            </>
          )}
        </>
      )}
    </LayoutDashboard>
  );
}
