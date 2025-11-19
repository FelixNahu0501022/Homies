// src/pages/Credenciales/ReportesCredencialesDialog.jsx
import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Tabs, Tab, Box, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  TextField, Stack, Typography, MenuItem
} from "@mui/material";
import PictureAsPdf from "@mui/icons-material/PictureAsPdf";
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
  // NUEVOS
  repListadoDetalle,
  repUltimaPorPersonaV2,
} from "../../services/credenciales.service";
import { exportTablePdf } from "../../utils/pdfExport";
import api from "../../services/axios"; // 👉 para cargar catálogos (grados/clases)

function SimpleTable({ columns = [], rows = [], getKey }) {
  return (
    <Paper variant="outlined" sx={{ width: "100%", overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.field}>{c.headerName}</TableCell>
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
            <TableRow key={getKey ? getKey(r, i) : i}>
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
  const [tab, setTab] = useState(0);

  // Datos existentes
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

  // Catálogos (para selects)
  const [gradosOpt, setGradosOpt] = useState([]); // {value,label}
  const [clasesOpt, setClasesOpt] = useState([]); // {value,label}

  // Listados Detallados (con selects)
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

  // Última por persona (v2) (con selects)
  const [u2Estado, setU2Estado] = useState("");
  const [u2Grado, setU2Grado] = useState("");
  const [u2Clase, setU2Clase] = useState("");
  const [u2Rows, setU2Rows] = useState([]);
  const [u2Total, setU2Total] = useState(0);
  const [u2Loading, setU2Loading] = useState(false);

  // Carga catálogos una sola vez al abrir
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        // Grados
        try {
          const { data } = await api.get("/grados");
          const arr = Array.isArray(data) ? data : (data?.rows || []);
          const opts = (arr || []).map((g) => ({
            value: g?.nombre ?? g?.grado_nombre ?? String(g?.idgrado ?? ""),
            label: g?.nombre ?? g?.grado_nombre ?? `Grado ${g?.idgrado ?? ""}`,
          }));
          setGradosOpt(opts);
        } catch (_) {
          setGradosOpt([]); // si falla, se queda vacío (igual hay "Todos")
        }

        // Clases
        try {
          const { data } = await api.get("/clases");
          const arr = Array.isArray(data) ? data : (data?.rows || []);
          const opts = (arr || []).map((c) => ({
            value: c?.etiqueta ?? (c?.gestion ? `Clase ${c.gestion}` : String(c?.idclase ?? "")),
            label: c?.etiqueta ?? (c?.gestion ? `Clase ${c.gestion}` : `Clase ${c?.idclase ?? ""}`),
          }));
          setClasesOpt(opts);
        } catch (_) {
          setClasesOpt([]);
        }
      } catch (e) {
        // silencioso
      }
    })();
  }, [open]);

  // Cargar por pestaña
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        if (tab === 0) {
          const r = await repResumen();
          setResumen(r);
        } else if (tab === 1) {
          const r = await repEstado();
          setPorEstado(r);
        } else if (tab === 2) {
          setPorClase(await repClase());
        } else if (tab === 3) {
          setPorGrado(await repGrado());
        } else if (tab === 4) {
          setMes(await repEmisionesMes());
          setAnio(await repEmisionesAnio());
        } else if (tab === 5) {
          const r = await repProximasVencer(proxDias);
          setProximas(r.resultados || r || []);
        } else if (tab === 6) {
          const r = await repVencidas({ desde: vencDesde || undefined, hasta: vencHasta || undefined });
          setVencidas(r.resultados || r || []);
        } else if (tab === 7) {
          setUltima(await repUltimaPorPersona());
        } else if (tab === 8) {
          await cargarListadosDetallados();
        } else if (tab === 9) {
          await cargarUltimaPorPersonaV2();
        }
      } catch (e) {
        console.error("Reporte error:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  // Dependientes
  async function recargarProximas() {
    const r = await repProximasVencer(proxDias);
    setProximas(r.resultados || r || []);
  }
  async function recargarVencidas() {
    const r = await repVencidas({ desde: vencDesde || undefined, hasta: vencHasta || undefined });
    setVencidas(r.resultados || r || []);
  }

  // Listados detallados
  async function cargarListadosDetallados() {
    try {
      setLdLoading(true);
      const { results, total } = await repListadoDetalle({
        estado: ldEstado || undefined,
        grado: ldGrado || undefined,  // ← se envía el label seleccionado
        clase: ldClase || undefined,  // ← se envía el label seleccionado
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
      console.error("Listado detallado error:", e);
      setLdRows([]);
      setLdTotal(0);
    } finally {
      setLdLoading(false);
    }
  }

  function exportarPdfListados() {
    exportTablePdf({
      title: "Reporte de Credenciales - Listado Detallado",
      subtitle: [
        ldEstado ? `Estado: ${ldEstado}` : "Estado: Todos",
        ldGrado ? `Grado: ${ldGrado}` : null,
        ldClase ? `Clase: ${ldClase}` : null,
        (ldIniDesde || ldIniHasta) ? `Inicio: ${ldIniDesde || "—"} a ${ldIniHasta || "—"}` : null,
        (ldFinDesde || ldFinHasta) ? `Fin: ${ldFinDesde || "—"} a ${ldFinHasta || "—"}` : null,
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
        { header: "Días Rest.", dataKey: "dias_restantes" },
        { header: "Motivo", dataKey: "motivo_suspension_revocacion" },
      ],
      rows: ldRows,
      filename: "reporte_credenciales_detallado.pdf",
      orientation: "landscape",
    });
  }

  // Última por persona v2
  async function cargarUltimaPorPersonaV2() {
    try {
      setU2Loading(true);
      const { results, total } = await repUltimaPorPersonaV2({
        estado: u2Estado || undefined,
        grado: u2Grado || undefined,  // label
        clase: u2Clase || undefined,  // label
        orderBy: "personal_apellido, personal_nombre",
        orderDir: "ASC",
        limit: 1000,
        offset: 0,
      });
      setU2Rows(results || []);
      setU2Total(total || 0);
    } catch (e) {
      console.error("Ultima v2 error:", e);
      setU2Rows([]);
      setU2Total(0);
    } finally {
      setU2Loading(false);
    }
  }

  function exportarPdfUltimaV2() {
    exportTablePdf({
      title: "Reporte - Última Credencial por Persona (v2)",
      subtitle: [
        u2Estado ? `Estado: ${u2Estado}` : "Estado: Todos",
        u2Grado ? `Grado: ${u2Grado}` : null,
        u2Clase ? `Clase: ${u2Clase}` : null,
      ].filter(Boolean).join(" · "),
      columns: [
        { header: "Nombre", dataKey: "personal_nombre" },
        { header: "Apellido", dataKey: "personal_apellido" },
        { header: "CI", dataKey: "personal_ci" },
        { header: "Número", dataKey: "numero" },
        { header: "Inicio", dataKey: "fecha_inicio_vigencia" },
        { header: "Fin", dataKey: "fecha_fin_vigencia" },
        { header: "Estado", dataKey: "estado_publico" },
        { header: "Días Rest.", dataKey: "dias_restantes" },
        { header: "Motivo", dataKey: "motivo_suspension_revocacion" },
      ],
      rows: u2Rows,
      filename: "reporte_ultima_por_persona_v2.pdf",
      orientation: "landscape",
    });
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitle>Reportes de Credenciales</DialogTitle>
      <DialogContent dividers>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2 }}
        >
          <Tab label="Resumen" />
          <Tab label="Por estado" />
          <Tab label="Por clase" />
          <Tab label="Por grado" />
          <Tab label="Emisiones (mes/año)" />
          <Tab label="Próximas a vencer" />
          <Tab label="Vencidas" />
          <Tab label="Última por persona" />
          <Tab label="Listados detallados" />           {/* 8 */}
          <Tab label="Última por persona (v2)" />       {/* 9 */}
        </Tabs>

        {/* Resumen */}
        {tab === 0 && (
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

        {/* Por estado */}
        {tab === 1 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Por estado público</Typography>
            <SimpleTable
              columns={[
                { field: "estado_publico", headerName: "Estado público" },
                { field: "total", headerName: "Total" },
              ]}
              rows={porEstado.publico || []}
            />
            <Typography variant="subtitle2">Por estado (crudo en tabla)</Typography>
            <SimpleTable
              columns={[
                { field: "estado", headerName: "Estado (crudo)" },
                { field: "total", headerName: "Total" },
              ]}
              rows={porEstado.crudo || []}
            />
          </Stack>
        )}

        {/* Por clase */}
        {tab === 2 && (
          <SimpleTable
            columns={[
              { field: "clase_etiqueta", headerName: "Clase" },
              { field: "estado_publico", headerName: "Estado" },
              { field: "total", headerName: "Total" },
            ]}
            rows={porClase}
          />
        )}

        {/* Por grado */}
        {tab === 3 && (
          <SimpleTable
            columns={[
              { field: "grado_nombre", headerName: "Grado" },
              { field: "estado_publico", headerName: "Estado" },
              { field: "total", headerName: "Total" },
            ]}
            rows={porGrado}
          />
        )}

        {/* Emisiones */}
        {tab === 4 && (
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

        {/* Próximas a vencer */}
        {tab === 5 && (
          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
          </Box>
        )}

        {/* Vencidas */}
        {tab === 6 && (
          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
          </Box>
        )}

        {/* Última por persona (v1) */}
        {tab === 7 && (
          <SimpleTable
            columns={[
              { field: "nombre", headerName: "Nombre" },
              { field: "apellido", headerName: "Apellido" },
              { field: "numero", headerName: "Número" },
              { field: "fecha_inicio_vigencia", headerName: "Inicio" },
              { field: "fecha_fin_vigencia", headerName: "Fin" },
              { field: "estado", headerName: "Estado (crudo)" },
              { field: "estado_publico", headerName: "Estado público" },
              {
                field: "es_vigente_flag",
                headerName: "¿Vigente?",
                valueGetter: (r) => (r.es_vigente_flag ? "Sí" : "No"),
              },
            ]}
            rows={ultima}
            getKey={(r) => `${r.idpersonal}-${r.idcredencial}`}
          />
        )}

        {/* Listados detallados (con selects) */}
        {tab === 8 && (
          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
              <TextField
                label="Estado"
                select
                size="small"
                value={ldEstado}
                onChange={(e) => setLdEstado(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="vigente">Vigente</MenuItem>
                <MenuItem value="emitida">Emitida</MenuItem>
                <MenuItem value="suspendida">Suspendida</MenuItem>
                <MenuItem value="revocada">Revocada</MenuItem>
                <MenuItem value="vencida">Vencida</MenuItem>
              </TextField>

              <TextField
                label="Grado"
                select
                size="small"
                value={ldGrado}
                onChange={(e) => setLdGrado(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {gradosOpt.map((g) => (
                  <MenuItem key={g.value} value={g.label}>{g.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Clase"
                select
                size="small"
                value={ldClase}
                onChange={(e) => setLdClase(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {clasesOpt.map((c) => (
                  <MenuItem key={c.value} value={c.label}>{c.label}</MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
              <TextField
                type="date"
                label="Inicio: Desde"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={ldIniDesde}
                onChange={(e) => setLdIniDesde(e.target.value)}
              />
              <TextField
                type="date"
                label="Inicio: Hasta"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={ldIniHasta}
                onChange={(e) => setLdIniHasta(e.target.value)}
              />
              <TextField
                type="date"
                label="Fin: Desde"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={ldFinDesde}
                onChange={(e) => setLdFinDesde(e.target.value)}
              />
              <TextField
                type="date"
                label="Fin: Hasta"
                InputLabelProps={{ shrink: true }}
                size="small"
                value={ldFinHasta}
                onChange={(e) => setLdFinHasta(e.target.value)}
              />
              <Button variant="outlined" onClick={cargarListadosDetallados} disabled={ldLoading}>
                {ldLoading ? "Cargando..." : "Buscar"}
              </Button>
              <Button
                variant="contained"
                startIcon={<PictureAsPdf />}
                onClick={exportarPdfListados}
                disabled={ldRows.length === 0}
              >
                Exportar PDF
              </Button>
              <Typography variant="body2" sx={{ alignSelf: "center", ml: 1 }}>
                {ldTotal > 0 ? `Resultados: ${ldRows.length} / Total: ${ldTotal}` : "Resultados: 0"}
              </Typography>
            </Stack>

            <SimpleTable
              columns={[
                { field: "numero", headerName: "Número" },
                { field: "personal_nombre", headerName: "Nombre" },
                { field: "personal_apellido", headerName: "Apellido" },
                { field: "personal_ci", headerName: "CI" },
                { field: "grado_nombre", headerName: "Grado" },
                { field: "clase_etiqueta", headerName: "Clase" },
                { field: "fecha_inicio_vigencia", headerName: "Inicio" },
                { field: "fecha_fin_vigencia", headerName: "Fin" },
                { field: "estado_publico", headerName: "Estado" },
                { field: "dias_restantes", headerName: "Días Restantes" },
                { field: "motivo_suspension_revocacion", headerName: "Motivo" },
              ]}
              rows={ldRows}
              getKey={(r) => r.idcredencial}
            />
          </Box>
        )}

        {/* Última por persona (v2) (con selects) */}
        {tab === 9 && (
          <Box>
            <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: "wrap" }}>
              <TextField
                label="Estado"
                select
                size="small"
                value={u2Estado}
                onChange={(e) => setU2Estado(e.target.value)}
                sx={{ minWidth: 160 }}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="vigente">Vigente</MenuItem>
                <MenuItem value="emitida">Emitida</MenuItem>
                <MenuItem value="suspendida">Suspendida</MenuItem>
                <MenuItem value="revocada">Revocada</MenuItem>
                <MenuItem value="vencida">Vencida</MenuItem>
              </TextField>

              <TextField
                label="Grado"
                select
                size="small"
                value={u2Grado}
                onChange={(e) => setU2Grado(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {gradosOpt.map((g) => (
                  <MenuItem key={g.value} value={g.label}>{g.label}</MenuItem>
                ))}
              </TextField>

              <TextField
                label="Clase"
                select
                size="small"
                value={u2Clase}
                onChange={(e) => setU2Clase(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="">Todos</MenuItem>
                {clasesOpt.map((c) => (
                  <MenuItem key={c.value} value={c.label}>{c.label}</MenuItem>
                ))}
              </TextField>

              <Button variant="outlined" onClick={cargarUltimaPorPersonaV2} disabled={u2Loading}>
                {u2Loading ? "Cargando..." : "Buscar"}
              </Button>
              <Button
                variant="contained"
                startIcon={<PictureAsPdf />}
                onClick={exportarPdfUltimaV2}
                disabled={u2Rows.length === 0}
              >
                Exportar PDF
              </Button>
              <Typography variant="body2" sx={{ alignSelf: "center", ml: 1 }}>
                {u2Total > 0 ? `Resultados: ${u2Rows.length} / Total: ${u2Total}` : "Resultados: 0"}
              </Typography>
            </Stack>

            <SimpleTable
              columns={[
                { field: "personal_nombre", headerName: "Nombre" },
                { field: "personal_apellido", headerName: "Apellido" },
                { field: "personal_ci", headerName: "CI" },
                { field: "numero", headerName: "Número" },
                { field: "fecha_inicio_vigencia", headerName: "Inicio" },
                { field: "fecha_fin_vigencia", headerName: "Fin" },
                { field: "estado_publico", headerName: "Estado" },
                { field: "dias_restantes", headerName: "Días Restantes" },
                { field: "motivo_suspension_revocacion", headerName: "Motivo" },
              ]}
              rows={u2Rows}
              getKey={(r, i) => `${r.idpersonal || i}-${r.idcredencial || "x"}`}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
}
