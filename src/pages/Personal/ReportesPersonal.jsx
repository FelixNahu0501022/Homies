// src/pages/personal/ReportesPersonal.jsx
import { useEffect, useMemo, useState } from "react";
import {
  Typography, Paper, TextField, Button, Box, Grid, Table,
  TableHead, TableRow, TableCell, TableBody, TablePagination,
  Chip, CircularProgress, Divider, FormControlLabel, Switch
} from "@mui/material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  rptLegajo, rptDistribucionClase, rptDistribucionGrado, rptCompletitud,
  rptCapParticipacion, rptCapCobertura, rptEmParticipacion, rptEmSinParticipacion
} from "../../services/personal.service";
import { exportTablePdf } from "../../utils/pdfExport";

export default function ReportesPersonal() {
  const [loading, setLoading] = useState(false);

  // Legajo (paginado)
  const [page, setPage] = useState(0); // 0-based para TablePagination
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [legajo, setLegajo] = useState({ data: [], total: 0 });

  // KPIs y tablas
  const [distClase, setDistClase] = useState([]);
  const [distGrado, setDistGrado] = useState([]);
  const [completitud, setCompletitud] = useState([]);
  const [soloIncompletos, setSoloIncompletos] = useState(false);

  // Capacitaciones/Emergencias (12 meses por defecto)
  const hoy = new Date().toISOString().slice(0, 10);
  const hace12m = new Date(); hace12m.setFullYear(hace12m.getFullYear() - 1);
  const defaultInicio = hace12m.toISOString().slice(0, 10);

  const [capCob, setCapCob] = useState({ total_personal: 0, con_capacitacion: 0, cobertura: 0 });
  const [capRank, setCapRank] = useState([]);
  const [emRank, setEmRank] = useState([]);
  const [emNoPart, setEmNoPart] = useState([]);

  // Columnas para export y render
  const columnsLegajo = useMemo(() => ([
    { dataKey: "idpersonal", header: "ID" },
    { dataKey: "apellido", header: "Apellido" },
    { dataKey: "nombre", header: "Nombre" },
    { dataKey: "ci", header: "CI" },
    { dataKey: "clase_etiqueta", header: "Clase" },
    { dataKey: "grado_nombre", header: "Grado" },
    { dataKey: "telefono", header: "Teléfono" },
  ]), []);

  // Cargas
  async function loadLegajo() {
    setLoading(true);
    try {
      const res = await rptLegajo({ page: page + 1, limit, search });
      setLegajo({ data: res.data || [], total: res.total || 0 });
    } finally { setLoading(false); }
  }
  useEffect(() => { loadLegajo(); /* eslint-disable-next-line */ }, [page, limit]);

  async function loadKPIs() {
    const [c, g, comp] = await Promise.all([
      rptDistribucionClase(),
      rptDistribucionGrado(),
      rptCompletitud({ soloIncompletos }),
    ]);
    setDistClase(c || []); setDistGrado(g || []); setCompletitud(comp || []);
  }
  useEffect(() => { loadKPIs(); /* eslint-disable-next-line */ }, [soloIncompletos]);

  async function loadRanges() {
    const [cov, rank, emP, emN] = await Promise.all([
      rptCapCobertura({ inicio: defaultInicio, fin: hoy }),
      rptCapParticipacion({ inicio: defaultInicio, fin: hoy }),
      rptEmParticipacion({ inicio: `${defaultInicio}T00:00:00`, fin: `${hoy}T23:59:59` }),
      rptEmSinParticipacion({ inicio: `${defaultInicio}T00:00:00`, fin: `${hoy}T23:59:59` }),
    ]);
    setCapCob(cov || { total_personal: 0, con_capacitacion: 0, cobertura: 0 });
    setCapRank(rank || []); setEmRank(emP || []); setEmNoPart(emN || []);
  }
  useEffect(() => { loadRanges(); }, []); // eslint-disable-line

  const totalIncompletos = useMemo(
    () => completitud.filter(x => !x.tiene_telefono || !x.tiene_foto || !x.tiene_documento).length,
    [completitud]
  );

  return (
    <LayoutDashboard>
      <Box p={2}>
        <Typography variant="h5" gutterBottom>Reportes de Personal</Typography>

        {/* Filtros & export legajo */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth size="small"
                label="Buscar (nombre, apellido, CI, grado, clase)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button variant="contained" onClick={loadLegajo} disabled={loading}>Buscar</Button>
            </Grid>
            <Grid item xs={12} md={3} textAlign={{ xs: 'left', md: 'right' }}>
              <Button variant="outlined" onClick={() => exportLegajoPDF(legajo.data, columnsLegajo)}>PDF</Button>
            </Grid>
          </Grid>
        </Paper>

        {/* KPIs */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><KPI title="Total Personal" value={legajo.total} /></Grid>
          <Grid item xs={12} md={3}><KPI title="Clases (cohortes)" value={distClase.length} /></Grid>
          <Grid item xs={12} md={3}><KPI title="Grados" value={distGrado.length} /></Grid>
          <Grid item xs={12} md={3}><KPI title="Incompletos (legajo)" value={totalIncompletos} /></Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Tabla Legajo */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>Legajo</Typography>
          {loading ? (
            <Box display="grid" placeItems="center" p={4}><CircularProgress /></Box>
          ) : (
            <>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columnsLegajo.map(col => <TableCell key={col.dataKey}>{col.header}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {legajo.data.map((row) => (
                    <TableRow key={row.idpersonal}>
                      {columnsLegajo.map(col => (
                        <TableCell key={col.dataKey}>
                          {formatCell(row[col.dataKey], col.dataKey)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={legajo.total}
                page={page}
                onPageChange={(_, p) => setPage(p)}
                rowsPerPage={limit}
                onRowsPerPageChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(0); }}
                rowsPerPageOptions={[5, 10, 20, 50]}
              />
            </>
          )}
        </Paper>

        {/* Distribuciones */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Distribución por Clase</Typography>
                <Button size="small" onClick={() => exportDistribClasePDF(distClase)}>PDF</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Clase</TableCell>
                    <TableCell align="right">Activos</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distClase.map((r) => (
                    <TableRow key={r.idclase}>
                      <TableCell>{r.clase_etiqueta}</TableCell>
                      <TableCell align="right">{r.total_activos}</TableCell>
                      <TableCell align="right">{r.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Distribución por Grado</Typography>
                <Button size="small" onClick={() => exportDistribGradoPDF(distGrado)}>PDF</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Grado</TableCell>
                    <TableCell align="right">Activos</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {distGrado.map((r) => (
                    <TableRow key={r.idgrado}>
                      <TableCell>{r.grado_nombre}</TableCell>
                      <TableCell align="right">{r.total_activos}</TableCell>
                      <TableCell align="right">{r.total}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Completitud de legajo */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Completitud de Legajo</Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <FormControlLabel
                control={<Switch checked={soloIncompletos} onChange={(e) => setSoloIncompletos(e.target.checked)} />}
                label="Mostrar solo incompletos"
              />
              <Button size="small" onClick={() => exportCompletitudPDF(completitud, soloIncompletos ? "Solo incompletos" : "Todos")}>
                PDF
              </Button>
            </Box>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>CI</TableCell>
                <TableCell>Apellido</TableCell>
                <TableCell>Nombre</TableCell>
                <TableCell>Teléfono</TableCell>
                <TableCell>Foto</TableCell>
                <TableCell>Documento</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {completitud.map(r => (
                <TableRow key={r.idpersonal}>
                  <TableCell>{r.ci}</TableCell>
                  <TableCell>{r.apellido}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell>{r.tiene_telefono ? <Chip size="small" label="OK" color="success" /> : <Chip size="small" label="Falta" color="warning" />}</TableCell>
                  <TableCell>{r.tiene_foto ? <Chip size="small" label="OK" color="success" /> : <Chip size="small" label="Falta" color="warning" />}</TableCell>
                  <TableCell>{r.tiene_documento ? <Chip size="small" label="OK" color="success" /> : <Chip size="small" label="Falta" color="warning" />}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>

        {/* Capacitaciones & Emergencias */}
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle1" gutterBottom>Cobertura Capacitaciones (12 meses)</Typography>
              <Typography>Con capacitación: <b>{capCob.con_capacitacion}</b> / {capCob.total_personal}</Typography>
              <Typography>Porcentaje: <b>{capCob.cobertura}%</b></Typography>
              <Box mt={1}>
                <Button size="small" onClick={() => exportCoberturaPDF(capCob, defaultInicio, hoy)}>PDF</Button>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Ranking Capacitaciones</Typography>
                <Button size="small" onClick={() => exportCapRankPDF(capRank, defaultInicio, hoy)}>PDF</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Persona</TableCell>
                    <TableCell align="right">Capacitaciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {capRank.slice(0, 8).map(r => (
                    <TableRow key={r.idpersonal}>
                      <TableCell>{r.apellido}, {r.nombre}</TableCell>
                      <TableCell align="right">{r.total_capacitaciones}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="subtitle1">Ranking Emergencias</Typography>
                <Button size="small" onClick={() => exportEmRankPDF(emRank, defaultInicio, hoy)}>PDF</Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Persona</TableCell>
                    <TableCell align="right">Emergencias</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emRank.slice(0, 8).map(r => (
                    <TableRow key={r.idpersonal}>
                      <TableCell>{r.apellido}, {r.nombre}</TableCell>
                      <TableCell align="right">{r.total_emergencias}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>
        </Grid>

        <Paper sx={{ p: 2, mt: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="subtitle1">Sin participación en emergencias (12 meses)</Typography>
            <Button size="small" onClick={() => exportEmNoPartPDF(emNoPart, defaultInicio, hoy)}>PDF</Button>
          </Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Apellido</TableCell>
                <TableCell>Nombre</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {emNoPart.slice(0, 20).map(r => (
                <TableRow key={r.idpersonal}>
                  <TableCell>{r.apellido}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Box>
    </LayoutDashboard>
  );
}

function formatCell(val, field) {
  if (field === "telefono" && !val) return <Chip size="small" label="—" />;
  return val ?? "";
}

/* ====== KPI local (evita ReferenceError) ====== */
function KPI({ title, value }) {
  return (
    <Paper sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="body2" color="text.secondary">{title}</Typography>
      <Typography variant="h5">{value ?? 0}</Typography>
    </Paper>
  );
}

/* ===== Exportaciones con tu util pdfExport.js ===== */
function exportLegajoPDF(rows, cols) {
  exportTablePdf({
    title: "Legajo de Personal",
    columns: cols,
    rows,
    filename: `legajo_personal_${new Date().toISOString().slice(0, 10)}.pdf`,
    orientation: "portrait",
  });
}
function exportDistribClasePDF(rows) {
  exportTablePdf({
    title: "Distribución por Clase (Personal)",
    columns: [
      { header: "Clase", dataKey: "clase_etiqueta" },
      { header: "Activos", dataKey: "total_activos" },
      { header: "Total", dataKey: "total" },
    ],
    rows,
    filename: `distrib_clase_${hoyStr()}.pdf`,
  });
}
function exportDistribGradoPDF(rows) {
  exportTablePdf({
    title: "Distribución por Grado (Personal)",
    columns: [
      { header: "Grado", dataKey: "grado_nombre" },
      { header: "Activos", dataKey: "total_activos" },
      { header: "Total", dataKey: "total" },
    ],
    rows,
    filename: `distrib_grado_${hoyStr()}.pdf`,
  });
}
function exportCompletitudPDF(rows, filtroLabel) {
  exportTablePdf({
    title: "Completitud de Legajo",
    subtitle: filtroLabel ? `Filtro: ${filtroLabel}` : "",
    columns: [
      { header: "CI", dataKey: "ci" },
      { header: "Apellido", dataKey: "apellido" },
      { header: "Nombre", dataKey: "nombre" },
      { header: "Teléfono", dataKey: "tiene_telefono" },
      { header: "Foto", dataKey: "tiene_foto" },
      { header: "Documento", dataKey: "tiene_documento" },
    ],
    rows: rows.map(r => ({
      ...r,
      tiene_telefono: r.tiene_telefono ? "OK" : "Falta",
      tiene_foto: r.tiene_foto ? "OK" : "Falta",
      tiene_documento: r.tiene_documento ? "OK" : "Falta",
    })),
    filename: `completitud_legajo_${hoyStr()}.pdf`,
  });
}
function exportCoberturaPDF(kpi, inicio, fin) {
  exportTablePdf({
    title: "Cobertura de Capacitaciones",
    subtitle: `Periodo: ${inicio} a ${fin}`,
    columns: [
      { header: "Total Personal", dataKey: "total_personal" },
      { header: "Con Capacitaciones", dataKey: "con_capacitacion" },
      { header: "Cobertura (%)", dataKey: "cobertura" },
    ],
    rows: [kpi],
    filename: `capacitaciones_cobertura_${hoyStr()}.pdf`,
  });
}
function exportCapRankPDF(rows, inicio, fin) {
  exportTablePdf({
    title: "Ranking de Capacitaciones",
    subtitle: `Periodo: ${inicio} a ${fin}`,
    columns: [
      { header: "Apellido", dataKey: "apellido" },
      { header: "Nombre", dataKey: "nombre" },
      { header: "Capacitaciones", dataKey: "total_capacitaciones" },
    ],
    rows,
    filename: `capacitaciones_ranking_${hoyStr()}.pdf`,
  });
}
function exportEmRankPDF(rows, inicio, fin) {
  exportTablePdf({
    title: "Ranking de Emergencias",
    subtitle: `Periodo: ${inicio} a ${fin}`,
    columns: [
      { header: "Apellido", dataKey: "apellido" },
      { header: "Nombre", dataKey: "nombre" },
      { header: "Emergencias", dataKey: "total_emergencias" },
    ],
    rows,
    filename: `emergencias_ranking_${hoyStr()}.pdf`,
  });
}
function exportEmNoPartPDF(rows, inicio, fin) {
  exportTablePdf({
    title: "Sin participación en emergencias",
    subtitle: `Periodo: ${inicio} a ${fin}`,
    columns: [
      { header: "Apellido", dataKey: "apellido" },
      { header: "Nombre", dataKey: "nombre" },
    ],
    rows,
    filename: `emergencias_sin_part_${hoyStr()}.pdf`,
  });
}
function hoyStr() { return new Date().toISOString().slice(0, 10); }
