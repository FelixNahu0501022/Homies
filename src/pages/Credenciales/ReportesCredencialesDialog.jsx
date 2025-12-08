// src/pages/Credenciales/ReportesCredencialesDialog.jsx - REFACTORIZADO
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Stack, Typography, MenuItem, Grid, CircularProgress, IconButton, Tooltip
} from "@mui/material";
import { PictureAsPdf, Refresh } from "@mui/icons-material";
import {
  repResumen,
  repEstado,
  repClase,
  repGrado,
  repEmisionesMes,
  repEmisionesAnio,
  repProximasVencer,
  repVencidas,
  repUltimaPorPersona,
  repListadoDetalle,
  repUltimaPorPersonaV2,
} from "../../services/credenciales.service";
import { exportTablePdf } from "../../utils/pdfExport";
import api from "../../services/axios";
import { SelectorTipoReporte, TablaReporte } from "../../components/reportes";

const TIPOS_REPORTE = [
  { value: "resumen", label: "Resumen General" },
  { value: "por_estado", label: "Por Estado" },
  { value: "por_clase", label: "Por Clase" },
  { value: "por_grado", label: "Por Grado" },
  { value: "emisiones", label: "Emisiones (Mes/Año)" },
  { value: "proximas_vencer", label: "Próximas a Vencer" },
  { value: "vencidas", label: "Vencidas" },
  { value: "ultima_persona", label: "Última por Persona" },
  { value: "listado_detallado", label: "Listado Detallado" },
  { value: "ultima_persona_v2", label: "Última por Persona (Filtrada)" },
];

function SimpleTable({ columns = [], rows = [], getKey }) {
  return (
    <Paper variant="outlined" sx={{ width: "100%", overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.field} sx={{ fontWeight: 700 }}>{c.headerName}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ color: "text.secondary" }}>
                Sin datos
              </TableCell>
            </TableRow>
          )}
          {rows.map((r, i) => (
            <TableRow key={getKey ? getKey(r, i) : i} hover>
              {columns.map((c) => (
                <TableCell key={c.field}>
                  {typeof c.valueGetter === "function" ? c.valueGetter(r) : r[c.field]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default function ReportesCredencialesDialog({ open, onClose }) {
  const [tipoReporte, setTipoReporte] = useState("");
  const [loading, setLoading] = useState(false);

  // Datos
  const [resumen, setResumen] = useState({ total: 0, por_estado: [] });
  const [porEstado, setPorEstado] = useState({ publico: [], crudo: [] });
  const [porClase, setPorClase] = useState([]);
  const [porGrado, setPorGrado] = useState([]);
  const [mes, setMes] = useState([]);
  const [anio, setAnio] = useState([]);
  const [proxDias, setProxDias] = useState(30);
  const [proximas, setProximas] = useState([]);
  const [vencDesde, setVencDesde] = useState("");
  const [vencHasta, setVencHasta] = useState("");
  const [vencidas, setVencidas] = useState([]);
  const [ultima, setUltima] = useState([]);

  // Catálogos
  const [gradosOpt, setGradosOpt] = useState([]);
  const [clasesOpt, setClasesOpt] = useState([]);

  // Listados Detallados
  const [ldEstado, setLdEstado] = useState("");
  const [ldGrado, setLdGrado] = useState("");
  const [ldClase, setLdClase] = useState("");
  const [ldIniDesde, setLdIniDesde] = useState("");
  const [ldIniHasta, setLdIniHasta] = useState("");
  const [ldFinDesde, setLdFinDesde] = useState("");
  const [ldFinHasta, setLdFinHasta] = useState("");
  const [ldRows, setLdRows] = useState([]);
  const [ldTotal, setLdTotal] = useState(0);
  const [ldLoading, setLdLoading] = useState(false);

  // Última v2
  const [u2Estado, setU2Estado] = useState("");
  const [u2Grado, setU2Grado] = useState("");
  const [u2Clase, setU2Clase] = useState("");
  const [u2Rows, setU2Rows] = useState([]);
  const [u2Total, setU2Total] = useState(0);
  const [u2Loading, setU2Loading] = useState(false);

  // Cargar catálogos
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        try {
          const { data } = await api.get("/grados");
          const arr = Array.isArray(data) ? data : (data?.rows || []);
          const opts = (arr || []).map((g) => ({
            value: g?.nombre ?? g?.grado_nombre ?? String(g?.idgrado ?? ""),
            label: g?.nombre ?? g?.grado_nombre ?? `Grado ${g?.idgrado ?? ""}`,
          }));
          setGradosOpt(opts);
        } catch (_) { setGradosOpt([]); }

        try {
          const { data } = await api.get("/clases");
          const arr = Array.isArray(data) ? data : (data?.rows || []);
          const opts = (arr || []).map((c) => ({
            value: c?.etiqueta ?? (c?.gestion ? `Clase ${c.gestion}` : String(c?.idclase ?? "")),
            label: c?.etiqueta ?? (c?.gestion ? `Clase ${c.gestion}` : `Clase ${c?.idclase ?? ""}`),
          }));
          setClasesOpt(opts);
        } catch (_) { setClasesOpt([]); }
      } catch (e) {
        console.error("Error cargando catálogos:", e);
      }
    })();
  }, [open]);

  const generarReporte = async () => {
    if (!tipoReporte) return;

    setLoading(true);
    try {
      switch (tipoReporte) {
        case "resumen":
          setResumen(await repResumen());
          break;
        case "por_estado":
          setPorEstado(await repEstado());
          break;
        case "por_clase":
          setPorClase(await repClase());
          break;
        case "por_grado":
          setPorGrado(await repGrado());
          break;
        case "emisiones":
          setMes(await repEmisionesMes());
          setAnio(await repEmisionesAnio());
          break;
        case "proximas_vencer":
          await recargarProximas();
          break;
        case "vencidas":
          await recargarVencidas();
          break;
        case "ultima_persona":
          setUltima(await repUltimaPorPersona());
          break;
        case "listado_detallado":
          await cargarListadosDetallados();
          break;
        case "ultima_persona_v2":
          await cargarUltimaPorPersonaV2();
          break;
      }
    } catch (e) {
      console.error("Error:", e);
    } finally {
      setLoading(false);
    }
  };

  async function recargarProximas() {
    const r = await repProximasVencer(proxDias);
    setProximas(r.resultados || r || []);
  }

  async function recargarVencidas() {
    const r = await repVencidas({ desde: vencDesde || undefined, hasta: vencHasta || undefined });
    setVencidas(r.resultados || r || []);
  }

  async function cargarListadosDetallados() {
    try {
      setLdLoading(true);
      const { results, total } = await repListadoDetalle({
        estado: ldEstado || undefined,
        grado: ldGrado || undefined,
        clase: ldClase || undefined,
        iniDesde: ldIniDesde || undefined,
        iniHasta: ldIniHasta || undefined,
        finDesde: ldFinDesde || undefined,
        finHasta: ldFinHasta || undefined,
        orderBy: "grado_nombre, clase_etiqueta, personal_apellido, personal_nombre",
        orderDir: "ASC",
        limit: 1000,
        offset: 0,
      });
      setLdRows(results || []);
      setLdTotal(total || 0);
    } catch (e) {
      console.error("Error:", e);
      setLdRows([]);
      setLdTotal(0);
    } finally {
      setLdLoading(false);
    }
  }

  async function cargarUltimaPorPersonaV2() {
    try {
      setU2Loading(true);
      const { results, total } = await repUltimaPorPersonaV2({
        estado: u2Estado || undefined,
        grado: u2Grado || undefined,
        clase: u2Clase || undefined,
        orderBy: "personal_apellido, personal_nombre",
        orderDir: "ASC",
        limit: 1000,
        offset: 0,
      });
      setU2Rows(results || []);
      setU2Total(total || 0);
    } catch (e) {
      console.error("Error:", e);
      setU2Rows([]);
      setU2Total(0);
    } finally {
      setU2Loading(false);
    }
  }

  function exportarPdfListados() {
    exportTablePdf({
      title: "Reporte de Credenciales - Listado Detallado",
      subtitle: [
        ldEstado ? `Estado: ${ldEstado}` : "Estado: Todos",
        ldGrado ? `Grado: ${ldGrado}` : null,
        ldClase ? `Clase: ${ldClase}` : null,
      ].filter(Boolean).join(" · "),
      columns: [
        { header: "Número", dataKey: "numero" },
        { header: "Nombre", dataKey: "personal_nombre" },
        { header: "Apellido", dataKey: "personal_apellido" },
        { header: "CI", dataKey: "personal_ci" },
        { header: "Grado", dataKey: "grado_nombre" },
        { header: "Clase", dataKey: "clase_etiqueta" },
        { header: "Inicio", dataKey: "fecha_inicio_vigencia" },
        { header: "Fin", dataKey: "fecha_fin_vigencia" },
        { header: "Estado", dataKey: "estado_publico" },
      ],
      rows: ldRows,
      filename: "credenciales_detallado.pdf",
      orientation: "landscape",
    });
  }

  function exportarPdfUltimaV2() {
    exportTablePdf({
      title: "Reporte - Última Credencial por Persona",
      columns: [
        { header: "Nombre", dataKey: "personal_nombre" },
        { header: "Apellido", dataKey: "personal_apellido" },
        { header: "CI", dataKey: "personal_ci" },
        { header: "Número", dataKey: "numero" },
        { header: "Inicio", dataKey: "fecha_inicio_vigencia" },
        { header: "Fin", dataKey: "fecha_fin_vigencia" },
        { header: "Estado", dataKey: "estado_publico" },
      ],
      rows: u2Rows,
      filename: "credenciales_ultima_persona.pdf",
      orientation: "landscape",
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Reportes de Credenciales</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <SelectorTipoReporte
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              opciones={TIPOS_REPORTE}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              fullWidth
              onClick={generarReporte}
              disabled={!tipoReporte || loading}
              startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}
            >
              {loading ? "Generando..." : "Generar Reporte"}
            </Button>
          </Grid>
        </Grid>

        {/* Filtros según tipo */}
        {tipoReporte === "proximas_vencer" && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                type="number"
                label="Días"
                value={proxDias}
                onChange={(e) => setProxDias(Number(e.target.value || 0))}
                size="small"
                sx={{ width: 120 }}
              />
              <Button variant="outlined" onClick={recargarProximas}>Aplicar</Button>
            </Stack>
          </Box>
        )}

        {tipoReporte === "vencidas" && (
          <Box sx={{ mb: 2 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                type="date"
                label="Desde"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={vencDesde}
                onChange={(e) => setVencDesde(e.target.value)}
              />
              <TextField
                type="date"
                label="Hasta"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={vencHasta}
                onChange={(e) => setVencHasta(e.target.value)}
              />
              <Button variant="outlined" onClick={recargarVencidas}>Aplicar</Button>
            </Stack>
          </Box>
        )}

        {tipoReporte === "listado_detallado" && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Estado" select size="small" fullWidth value={ldEstado} onChange={(e) => setLdEstado(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="vigente">Vigente</MenuItem>
                  <MenuItem value="emitida">Emitida</MenuItem>
                  <MenuItem value="suspendida">Suspendida</MenuItem>
                  <MenuItem value="revocada">Revocada</MenuItem>
                  <MenuItem value="vencida">Vencida</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Grado" select size="small" fullWidth value={ldGrado} onChange={(e) => setLdGrado(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {gradosOpt.map((g) => <MenuItem key={g.value} value={g.label}>{g.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Clase" select size="small" fullWidth value={ldClase} onChange={(e) => setLdClase(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {clasesOpt.map((c) => <MenuItem key={c.value} value={c.label}>{c.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" onClick={cargarListadosDetallados} disabled={ldLoading} startIcon={<Refresh />}>
                  {ldLoading ? "Cargando..." : "Buscar"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdf />}
                  onClick={exportarPdfListados}
                  disabled={ldRows.length === 0}
                  sx={{ ml: 1 }}
                >
                  PDF
                </Button>
                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                  {ldTotal > 0 ? `${ldRows.length} / ${ldTotal}` : "0"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {tipoReporte === "ultima_persona_v2" && (
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Estado" select size="small" fullWidth value={u2Estado} onChange={(e) => setU2Estado(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="vigente">Vigente</MenuItem>
                  <MenuItem value="emitida">Emitida</MenuItem>
                  <MenuItem value="suspendida">Suspendida</MenuItem>
                  <MenuItem value="revocada">Revocada</MenuItem>
                  <MenuItem value="vencida">Vencida</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Grado" select size="small" fullWidth value={u2Grado} onChange={(e) => setU2Grado(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {gradosOpt.map((g) => <MenuItem key={g.value} value={g.label}>{g.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Clase" select size="small" fullWidth value={u2Clase} onChange={(e) => setU2Clase(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {clasesOpt.map((c) => <MenuItem key={c.value} value={c.label}>{c.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" onClick={cargarUltimaPorPersonaV2} disabled={u2Loading} startIcon={<Refresh />}>
                  {u2Loading ? "Cargando..." : "Buscar"}
                </Button>
                <Button
                  variant="contained"
                  startIcon={<PictureAsPdf />}
                  onClick={exportarPdfUltimaV2}
                  disabled={u2Rows.length === 0}
                  sx={{ ml: 1 }}
                >
                  PDF
                </Button>
                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                  {u2Total > 0 ? `${u2Rows.length} / ${u2Total}` : "0"}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Resultados */}
        <Box>
          {tipoReporte === "resumen" && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Total credenciales: <b>{resumen.total}</b>
              </Typography>
              <SimpleTable
                columns={[
                  { field: "estado_publico", headerName: "Estado público" },
                  { field: "total", headerName: "Total" }
                ]}
                rows={resumen.por_estado || []}
              />
            </Box>
          )}

          {tipoReporte === "por_estado" && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Por estado público</Typography>
              <SimpleTable
                columns={[
                  { field: "estado_publico", headerName: "Estado público" },
                  { field: "total", headerName: "Total" },
                ]}
                rows={porEstado.publico || []}
              />
              <Typography variant="subtitle2">Por estado (crudo)</Typography>
              <SimpleTable
                columns={[
                  { field: "estado", headerName: "Estado (crudo)" },
                  { field: "total", headerName: "Total" },
                ]}
                rows={porEstado.crudo || []}
              />
            </Stack>
          )}

          {tipoReporte === "por_clase" && (
            <SimpleTable
              columns={[
                { field: "clase_etiqueta", headerName: "Clase" },
                { field: "estado_publico", headerName: "Estado" },
                { field: "total", headerName: "Total" },
              ]}
              rows={porClase}
            />
          )}

          {tipoReporte === "por_grado" && (
            <SimpleTable
              columns={[
                { field: "grado_nombre", headerName: "Grado" },
                { field: "estado_publico", headerName: "Estado" },
                { field: "total", headerName: "Total" },
              ]}
              rows={porGrado}
            />
          )}

          {tipoReporte === "emisiones" && (
            <Stack spacing={2}>
              <Typography variant="subtitle2">Por mes</Typography>
              <SimpleTable
                columns={[
                  { field: "mes", headerName: "Mes" },
                  { field: "emitidas", headerName: "Emitidas" },
                ]}
                rows={mes}
              />
              <Typography variant="subtitle2">Por año</Typography>
              <SimpleTable
                columns={[
                  { field: "anio", headerName: "Año" },
                  { field: "emitidas", headerName: "Emitidas" },
                ]}
                rows={anio}
              />
            </Stack>
          )}

          {tipoReporte === "proximas_vencer" && (
            <SimpleTable
              columns={[
                { field: "numero", headerName: "Número" },
                { field: "personal_nombre", headerName: "Nombre" },
                { field: "personal_apellido", headerName: "Apellido" },
                { field: "personal_ci", headerName: "CI" },
                { field: "fecha_fin_vigencia", headerName: "Fin vigencia" },
                { field: "dias_restantes", headerName: "Días restantes" },
              ]}
              rows={proximas}
            />
          )}

          {tipoReporte === "vencidas" && (
            <SimpleTable
              columns={[
                { field: "numero", headerName: "Número" },
                { field: "nombre", headerName: "Nombre" },
                { field: "apellido", headerName: "Apellido" },
                { field: "ci", headerName: "CI" },
                { field: "fecha_fin_vigencia", headerName: "Fin vigencia" },
              ]}
              rows={vencidas}
            />
          )}

          {tipoReporte === "ultima_persona" && (
            <SimpleTable
              columns={[
                { field: "nombre", headerName: "Nombre" },
                { field: "apellido", headerName: "Apellido" },
                { field: "numero", headerName: "Número" },
                { field: "fecha_inicio_vigencia", headerName: "Inicio" },
                { field: "fecha_fin_vigencia", headerName: "Fin" },
                { field: "estado_publico", headerName: "Estado" },
              ]}
              rows={ultima}
              getKey={(r) => `${r.idpersonal}-${r.idcredencial}`}
            />
          )}

          {tipoReporte === "listado_detallado" && (
            <SimpleTable
              columns={[
                { field: "numero", headerName: "Número" },
                { field: "personal_nombre", headerName: "Nombre" },
                { field: "personal_apellido", headerName: "Apellido" },
                { field: "grado_nombre", headerName: "Grado" },
                { field: "clase_etiqueta", headerName: "Clase" },
                { field: "fecha_inicio_vigencia", headerName: "Inicio" },
                { field: "fecha_fin_vigencia", headerName: "Fin" },
                { field: "estado_publico", headerName: "Estado" },
              ]}
              rows={ldRows}
              getKey={(r) => r.idcredencial}
            />
          )}

          {tipoReporte === "ultima_persona_v2" && (
            <SimpleTable
              columns={[
                { field: "personal_nombre", headerName: "Nombre" },
                { field: "personal_apellido", headerName: "Apellido" },
                { field: "personal_ci", headerName: "CI" },
                { field: "numero", headerName: "Número" },
                { field: "fecha_inicio_vigencia", headerName: "Inicio" },
                { field: "fecha_fin_vigencia", headerName: "Fin" },
                { field: "estado_publico", headerName: "Estado" },
              ]}
              rows={u2Rows}
              getKey={(r, i) => `${r.idpersonal || i}-${r.idcredencial || "x"}`}
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
