// src/pages/Emergencias/EmergenciasReportesPage.jsx
import {
  Typography, Paper, Box, TextField, Button, Stack, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Divider, MenuItem, CircularProgress,
  Autocomplete
} from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { exportTablePdf } from "../../utils/pdfExport";
import {
  reporteResumen, reporteMateriales, reporteSerieDiaria, listarTiposEmergencia, reporteBajasDetalle,
  reporteParticipantesPorEmergencia, reporteEmergenciasDePersonal, reporteEmergenciasPorTipo,
  opcionesEmergencias, opcionesPersonal
} from "../../services/emergencias.service";

const colsEstado = [
  { header: "Estado", dataKey: "estado" },
  { header: "Total", dataKey: "total" },
];
const colsTipo = [
  { header: "Tipo", dataKey: "tipo" },
  { header: "Total", dataKey: "total" },
];
const colsUsados = [
  { header: "Material", dataKey: "nombre" },
  { header: "Total usado", dataKey: "total_usado" },
];
const colsBajas = [
  { header: "Material", dataKey: "nombre" },
  { header: "Total bajas", dataKey: "total_bajas" },
];
const colsSerie = [
  { header: "Día", dataKey: "dia" },
  { header: "Usos", dataKey: "usos" },
  { header: "Bajas", dataKey: "bajas" },
];

// Amigables (sin IDs)
const colsBajasDetalle = [
  { header: "Fecha baja", dataKey: "fecha_baja" },
  { header: "Emergencia", dataKey: "emergencia" },
  { header: "Tipo", dataKey: "tipo_emergencia" },
  { header: "Vehículo", dataKey: "vehiculo" },
  { header: "Material", dataKey: "material" },
  { header: "Cantidad", dataKey: "cantidad" },
  { header: "Descripción", dataKey: "descripcion" },
];
const colsParticipantes = [
  { header: "Nombre", dataKey: "nombre" },
  { header: "Apellido", dataKey: "apellido" },
  { header: "CI", dataKey: "ci" },
  { header: "Fecha/Hora", dataKey: "fechahora" },
  { header: "Ubicación", dataKey: "ubicacion" },
  { header: "Tipo", dataKey: "tipo" },
  { header: "Descripción", dataKey: "descripcion" },
];
const colsDePersonal = [
  { header: "Fecha/Hora", dataKey: "fechahora" },
  { header: "Ubicación", dataKey: "ubicacion" },
  { header: "Tipo", dataKey: "tipo" },
  { header: "Descripción", dataKey: "descripcion" },
];
const colsPorTipoDet = [
  { header: "Fecha/Hora", dataKey: "fechahora" },
  { header: "Ubicación", dataKey: "ubicacion" },
  { header: "Tipo", dataKey: "tipo" },
  { header: "Descripción", dataKey: "descripcion" },
];

const toLocalDay = (s) => {
  try { return new Date(s).toISOString().slice(0, 10); } catch { return s; }
};
const toLocalDT = (s) => {
  if (!s) return "—";
  try { return new Date(s).toISOString().replace("T", " ").slice(0, 16); } catch { return s; }
};

export default function EmergenciasReportesPage() {
  // Pestañas: 0 Resumen | 1 Materiales | 2 Serie diaria | 3 Participantes | 4 De personal | 5 Por tipo (detalle)
  const [tab, setTab] = useState(0);
  const [tipos, setTipos] = useState([]);
  const [filtros, setFiltros] = useState({
    inicio: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    fin: new Date().toISOString().slice(0, 10),
    tipoId: "",
  });

  const [loading, setLoading] = useState(false);
  const [resumen, setResumen] = useState({ porEstado: [], porTipo: [] });
  const [materiales, setMateriales] = useState({ usados: [], bajas: [] });
  const [serie, setSerie] = useState([]);
  const [bajasDetalle, setBajasDetalle] = useState([]);

  // NUEVO: selects amigables
  const [optEmergencias, setOptEmergencias] = useState([]);
  const [optPersonal, setOptPersonal] = useState([]);
  const [selEmergencia, setSelEmergencia] = useState(null);
  const [selPersonal, setSelPersonal] = useState(null);

  // NUEVO: data de los nuevos reportes
  const [participantes, setParticipantes] = useState([]);
  const [dePersonal, setDePersonal] = useState([]);
  const [idTipoDePersonal, setIdTipoDePersonal] = useState("");
  const [porTipoDet, setPorTipoDet] = useState([]);

  // cargar tipos + opciones selects
  useEffect(() => {
    (async () => {
      try {
        const [ts, emOpts, perOpts] = await Promise.all([
          listarTiposEmergencia(),
          opcionesEmergencias(),
          opcionesPersonal(),
        ]);
        const norm = (ts || []).map(t => ({
          id: t.idtipoemergencia ?? t.idTipoEmergencia ?? t.id ?? null,
          nombre: t.nombre ?? ""
        })).filter(x => x.id != null);
        setTipos(norm);
        setOptEmergencias(emOpts || []);
        setOptPersonal(perOpts || []);
      } catch { /* noop */ }
    })();
  }, []);

  // EXISTENTE: fetch general
  const fetchAll = async () => {
    try {
      setLoading(true);
      const params = {
        inicio: filtros.inicio ? `${filtros.inicio}T00:00:00` : null,
        fin: filtros.fin ? `${filtros.fin}T23:59:59` : null,
        tipoId: filtros.tipoId ? Number(filtros.tipoId) : null,
      };
      const [r1, r2, r3, r4] = await Promise.all([
        reporteResumen(params),
        reporteMateriales(params),
        reporteSerieDiaria(params),
        reporteBajasDetalle(params),
      ]);

      setResumen({
        porEstado: (r1?.porEstado || []).map(x => ({ estado: x.estado ?? "—", total: x.total ?? 0 })),
        porTipo: (r1?.porTipo || []).map(x => ({ tipo: x.tipo ?? "—", total: x.total ?? 0 })),
      });
      setMateriales({
        usados: (r2?.usados || []).map(x => ({ nombre: x.nombre, total_usado: x.total_usado })),
        bajas: (r2?.bajas || []).map(x => ({ nombre: x.nombre, total_bajas: x.total_bajas })),
      });
      setSerie((r3 || []).map(x => ({ ...x, dia: toLocalDay(x.dia) })));

      // normalizar detalle bajas (etiquetas)
      setBajasDetalle((r4 || []).map(r => ({
        ...r,
        fecha_baja: toLocalDT(r.fecha_baja ?? r.fechaMovimiento),
        vehiculo: r.placa ? `${r.placa}${r.marca ? " — " + r.marca : ""}${r.modelo ? " " + r.modelo : ""}` : "—",
        emergencia: `${toLocalDT(r.fecha_emergencia)} — ${r.tipo_emergencia || ""} — ${r.ubicacion || ""}`,
      })));
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudieron obtener los reportes";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []); // primera carga

  const onFilter = async () => { await fetchAll(); };

  // ======== NUEVOS FETCHERS ========
  const fetchParticipantes = async () => {
    if (!selEmergencia?.id) return Swal.fire("Valida", "Selecciona una emergencia", "info");
    try {
      setLoading(true);
      const rs = await reporteParticipantesPorEmergencia(selEmergencia.id);
      const norm = (rs || []).map(r => ({ ...r, fechahora: toLocalDT(r.fechahora) }));
      setParticipantes(norm);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo obtener el reporte";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDePersonal = async () => {
    if (!selPersonal?.id) return Swal.fire("Valida", "Selecciona el personal", "info");
    const inicio = filtros.inicio ? `${filtros.inicio}T00:00:00` : null;
    const fin    = filtros.fin    ? `${filtros.fin}T23:59:59`   : null;
    const idTipo = idTipoDePersonal ? Number(idTipoDePersonal) : null;
    try {
      setLoading(true);
      const rs = await reporteEmergenciasDePersonal({ idPersonal: selPersonal.id, inicio, fin, idTipo });
      const norm = (rs || []).map(r => ({ ...r, fechahora: toLocalDT(r.fechahora) }));
      setDePersonal(norm);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo obtener el reporte";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchPorTipoDet = async () => {
    const idTipo = Number(filtros.tipoId || 0);
    if (!idTipo) return Swal.fire("Valida", "Selecciona un tipo de emergencia", "info");
    const inicio = filtros.inicio ? `${filtros.inicio}T00:00:00` : null;
    const fin    = filtros.fin    ? `${filtros.fin}T23:59:59`   : null;
    try {
      setLoading(true);
      const rs = await reporteEmergenciasPorTipo({ idTipo, inicio, fin });
      const norm = (rs || []).map(r => ({ ...r, fechahora: toLocalDT(r.fechahora) }));
      setPorTipoDet(norm);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo obtener el reporte";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ======== EXPORTS ========
  const exportParticipantesPdf = () => {
    exportTablePdf({
      title: "Participantes por emergencia",
      subtitle: selEmergencia?.label || "",
      columns: colsParticipantes,
      rows: participantes,
      filename: `reporte_participantes_emergencia.pdf`,
    });
  };
  const exportDePersonalPdf = () => {
    exportTablePdf({
      title: "Emergencias del personal",
      subtitle: subTitleText(filtros, `Personal: ${selPersonal?.label || "—"}`),
      columns: colsDePersonal,
      rows: dePersonal,
      filename: `reporte_emergencias_de_personal.pdf`,
    });
  };
  const exportPorTipoDetPdf = () => {
    exportTablePdf({
      title: "Emergencias por tipo (detalle)",
      subtitle: subTitleText(filtros, getTipoNombre(tipos, filtros.tipoId)),
      columns: colsPorTipoDet,
      rows: porTipoDet,
      filename: `reporte_emergencias_por_tipo_detalle.pdf`,
    });
  };

  const exportResumenPdf = (tipo = "estado") => {
    const columns = tipo === "estado" ? colsEstado : colsTipo;
    const rows = tipo === "estado" ? resumen.porEstado : resumen.porTipo;
    exportTablePdf({
      title: tipo === "estado" ? "Resumen por estado" : "Resumen por tipo",
      subtitle: subTitleText(filtros, tipo === "estado" ? "" : ""),
      columns,
      rows,
      filename: `reporte_resumen_${tipo}.pdf`,
    });
  };
  const exportMaterialesPdf = (which = "usados") => {
    const columns = which === "usados" ? colsUsados : colsBajas;
    const rows = which === "usados" ? materiales.usados : materiales.bajas;
    exportTablePdf({
      title: which === "usados" ? "Materiales usados" : "Materiales dados de baja",
      subtitle: subTitleText(filtros, getTipoNombre(tipos, filtros.tipoId)),
      columns,
      rows,
      filename: `reporte_materiales_${which}.pdf`,
    });
  };
  const exportSeriePdf = () => {
    exportTablePdf({
      title: "Serie diaria",
      subtitle: subTitleText(filtros, getTipoNombre(tipos, filtros.tipoId)),
      columns: colsSerie,
      rows: serie,
      filename: `reporte_serie_diaria.pdf`,
    });
  };
  const exportBajasDetallePdf = () => {
    exportTablePdf({
      title: "Bajas (detalle)",
      subtitle: subTitleText(filtros, getTipoNombre(tipos, filtros.tipoId)),
      columns: colsBajasDetalle,
      rows: bajasDetalle,
      filename: `reporte_bajas_detalle.pdf`,
    });
  };

  return (
    <LayoutDashboard>
      <Typography variant="h5">Reportes de emergencias</Typography>

      {/* Filtros generales */}
      <Paper sx={{ p: 2, mt: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            label="Desde"
            type="date"
            value={filtros.inicio}
            onChange={(e) => setFiltros({ ...filtros, inicio: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hasta"
            type="date"
            value={filtros.fin}
            onChange={(e) => setFiltros({ ...filtros, fin: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Tipo de emergencia"
            select
            value={filtros.tipoId}
            onChange={(e) => setFiltros({ ...filtros, tipoId: e.target.value })}
            sx={{ minWidth: 260 }}
          >
            <MenuItem value="">(Todos)</MenuItem>
            {tipos.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
          </TextField>
          <Button variant="contained" onClick={onFilter} disabled={loading}>
            {loading ? "Cargando..." : "Aplicar filtros"}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto">
          <Tab label="Resumen" />
          <Tab label="Materiales" />
          <Tab label="Serie diaria" />
          <Tab label="Participantes por emergencia" />
          <Tab label="Emergencias de personal" />
          <Tab label="Por tipo (detalle)" />
        </Tabs>
        <Divider sx={{ mb: 2 }} />

        {loading && (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 180 }}>
            <CircularProgress />
          </Box>
        )}

        {/* === Resumen === */}
        {!loading && tab === 0 && (
          <Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end" sx={{ mb: 1 }}>
              <Button variant="outlined" onClick={() => exportResumenPdf("estado")}>Exportar por Estado</Button>
              <Button variant="outlined" onClick={() => exportResumenPdf("tipo")}>Exportar por Tipo</Button>
            </Stack>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Por estado</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead><TableRow>{colsEstado.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {resumen.porEstado.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.estado}</TableCell><TableCell>{r.total}</TableCell></TableRow>
                  ))}
                  {resumen.porEstado.length === 0 && <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Por tipo</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow>{colsTipo.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {resumen.porTipo.map((r, i) => (
                    <TableRow key={i}><TableCell>{r.tipo}</TableCell><TableCell>{r.total}</TableCell></TableRow>
                  ))}
                  {resumen.porTipo.length === 0 && <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* === Materiales === */}
        {!loading && tab === 1 && (
          <Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end" sx={{ mb: 1 }}>
              <Button variant="outlined" onClick={() => exportMaterialesPdf("usados")}>Exportar Usados</Button>
              <Button variant="outlined" onClick={() => exportMaterialesPdf("bajas")}>Exportar Bajas</Button>
              <Button variant="outlined" onClick={exportBajasDetallePdf}>Exportar Bajas (detalle)</Button>
            </Stack>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Materiales usados</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead><TableRow>{colsUsados.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {materiales.usados.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.total_usado}</TableCell>
                    </TableRow>
                  ))}
                  {materiales.usados.length === 0 && <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="subtitle1" sx={{ mb: 1 }}>Materiales dados de baja</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
              <Table size="small">
                <TableHead><TableRow>{colsBajas.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {materiales.bajas.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.total_bajas}</TableCell>
                    </TableRow>
                  ))}
                  {materiales.bajas.length === 0 && <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Detalle de bajas */}
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Bajas (detalle)</Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {colsBajasDetalle.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bajasDetalle.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.fecha_baja}</TableCell>
                      <TableCell>{r.emergencia}</TableCell>
                      <TableCell>{r.tipo_emergencia}</TableCell>
                      <TableCell>{r.vehiculo}</TableCell>
                      <TableCell>{r.material}</TableCell>
                      <TableCell>{r.cantidad}</TableCell>
                      <TableCell>{r.descripcion ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {bajasDetalle.length === 0 && <TableRow><TableCell colSpan={colsBajasDetalle.length}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* === Serie diaria === */}
        {!loading && tab === 2 && (
          <Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end" sx={{ mb: 1 }}>
              <Button variant="outlined" onClick={exportSeriePdf}>Exportar Serie diaria</Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow>{colsSerie.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {serie.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.dia}</TableCell>
                      <TableCell>{r.usos}</TableCell>
                      <TableCell>{r.bajas}</TableCell>
                    </TableRow>
                  ))}
                  {serie.length === 0 && <TableRow><TableCell colSpan={3}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* === Participantes por emergencia === */}
        {!loading && tab === 3 && (
          <Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Autocomplete
                sx={{ minWidth: 420 }}
                options={optEmergencias}
                value={selEmergencia}
                onChange={(_, v) => setSelEmergencia(v)}
                getOptionLabel={(o) => o?.label || ""}
                renderInput={(params) => <TextField {...params} label="Emergencia" placeholder="Busca por fecha/tipo/ubicación" />}
              />
              <Button variant="contained" onClick={fetchParticipantes}>Buscar</Button>
              <Button variant="outlined" onClick={exportParticipantesPdf} disabled={participantes.length === 0}>
                Exportar
              </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow>{colsParticipantes.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {participantes.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.apellido}</TableCell>
                      <TableCell>{r.ci ?? "—"}</TableCell>
                      <TableCell>{r.fechahora}</TableCell>
                      <TableCell>{r.ubicacion ?? "—"}</TableCell>
                      <TableCell>{r.tipo ?? "—"}</TableCell>
                      <TableCell>{r.descripcion ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {participantes.length === 0 && <TableRow><TableCell colSpan={colsParticipantes.length}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* === Emergencias de personal === */}
        {!loading && tab === 4 && (
          <Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Autocomplete
                sx={{ minWidth: 320 }}
                options={optPersonal}
                value={selPersonal}
                onChange={(_, v) => setSelPersonal(v)}
                getOptionLabel={(o) => o?.label || ""}
                renderInput={(params) => <TextField {...params} label="Personal" placeholder="Busca por nombre/apellido" />}
              />
              <TextField
                label="Tipo (opcional)"
                select
                value={idTipoDePersonal}
                onChange={(e) => setIdTipoDePersonal(e.target.value)}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {tipos.map(t => <MenuItem key={t.id} value={t.id}>{t.nombre}</MenuItem>)}
              </TextField>
              <Button variant="contained" onClick={fetchDePersonal}>Buscar</Button>
              <Button variant="outlined" onClick={exportDePersonalPdf} disabled={dePersonal.length === 0}>
                Exportar
              </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow>{colsDePersonal.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {dePersonal.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.fechahora}</TableCell>
                      <TableCell>{r.ubicacion ?? "—"}</TableCell>
                      <TableCell>{r.tipo ?? "—"}</TableCell>
                      <TableCell>{r.descripcion ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {dePersonal.length === 0 && <TableRow><TableCell colSpan={colsDePersonal.length}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* === Por tipo (detalle) === */}
        {!loading && tab === 5 && (
          <Box>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Button variant="contained" onClick={fetchPorTipoDet} disabled={!filtros.tipoId}>
                Buscar
              </Button>
              <Button variant="outlined" onClick={exportPorTipoDetPdf} disabled={porTipoDet.length === 0}>
                Exportar
              </Button>
            </Stack>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead><TableRow>{colsPorTipoDet.map(c => <TableCell key={c.dataKey}>{c.header}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {porTipoDet.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell>{r.fechahora}</TableCell>
                      <TableCell>{r.ubicacion ?? "—"}</TableCell>
                      <TableCell>{r.tipo ?? "—"}</TableCell>
                      <TableCell>{r.descripcion ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                  {porTipoDet.length === 0 && <TableRow><TableCell colSpan={colsPorTipoDet.length}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </Paper>
    </LayoutDashboard>
  );
}

function getTipoNombre(tipos, id) {
  if (!id) return null;
  const t = (tipos || []).find(x => String(x.id) === String(id));
  return t?.nombre ?? null;
}
function subTitleText(filtros, extra = "") {
  const rango = `${filtros.inicio || "—"} a ${filtros.fin || "—"}`;
  const ext = extra ? ` — ${extra}` : "";
  return `Rango: ${rango}${ext}`;
}
