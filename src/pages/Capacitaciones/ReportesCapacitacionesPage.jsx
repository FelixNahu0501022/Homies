// src/pages/Capacitaciones/ReportesCapacitacionesPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box, Paper, Tabs, Tab, Stack, TextField, Button, Typography,
  Table, TableHead, TableRow, TableCell, TableBody, Divider, Chip, Autocomplete
} from "@mui/material";
import { Search, PictureAsPdf } from "@mui/icons-material";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  // Participantes (internos/externos)
  repParticipacionInternos, repCoberturaInternos, repInternosPorClase, repInternosPorGrado, repBrechasInternos,
  repExternosRanking,

  // Instituciones
  repInstitucionesRanking, repHistorialInstitucion, buscarInstitucionesCatalogo,

  // Capacitaciones (agregados)
  repDistribucionPorTitulo, repDistribucionPorTema, repTopCapacitaciones,
  repSinAsistentes, repContenidosPorCapacitacion, repSeriesMensuales,

  // Certificados
  repCertificadosEmitidos, repCertificadosPorTipo, repCertificadosPorCapacitacion, repCertificadoBuscarPorSerie,

  // Personas (historial)
  repHistorialPersona,

  // Catálogos/ayudas
  buscarPersonalCatalogo, buscarPersonasCatalogo, obtenerCapacitacion,
} from "../../services/capacitaciones.service";
import { exportTablePdf } from "../../utils/pdfExport";

/** Hook simple para rango de fechas (YYYY-MM-DD) */
function useDateRange() {
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const isInvalid = useMemo(() => Boolean(inicio && fin && inicio > fin), [inicio, fin]);
  const params = useMemo(
    () => (inicio || fin ? { inicio: inicio || undefined, fin: fin || undefined } : {}),
    [inicio, fin]
  );
  return { inicio, fin, setInicio, setFin, isInvalid, params };
}

function DateFilters({ inicio, fin, setInicio, setFin, onApply }) {
  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      <TextField label="Inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} InputLabelProps={{ shrink: true }} size="small" inputProps={{ max: fin || undefined }} />
      <TextField label="Fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} InputLabelProps={{ shrink: true }} size="small" inputProps={{ min: inicio || undefined }} />
      <Button variant="contained" startIcon={<Search />} onClick={onApply}>Aplicar</Button>
      {(inicio || fin) && (
        <Button variant="text" onClick={() => { setInicio(""); setFin(""); onApply?.(); }}>
          Limpiar
        </Button>
      )}
    </Stack>
  );
}

function SimpleTable({ columns, rows, getKey }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>{columns.map((c) => <TableCell key={c.key} width={c.w}>{c.label}</TableCell>)}</TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={getKey ? getKey(r, i) : i}>
            {columns.map((c) => (
              <TableCell key={c.key}>{c.render ? c.render(r[c.key], r) : String(r[c.key] ?? "")}</TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function ReportesCapacitacionesPage() {
  // Pestañas
  const [tab, setTab] = useState("participantes"); // unificado
  const dr = useDateRange();

  // ====== Filtro de tipo de capacitación (afecta agregados) ======
  const [tipoCap, setTipoCap] = useState("titulo"); // "titulo" | "tema"

  // ====== Participantes (selector: internos/externos) ======
  const [tipoPart, setTipoPart] = useState("internos"); // "internos" | "externos"

  // INTERNOS
  const [internosRank, setInternosRank] = useState([]);
  const [cobertura, setCobertura]       = useState(null);
  const [clase, setClase]               = useState([]);
  const [grado, setGrado]               = useState([]);
  const [brechas, setBrechas]           = useState([]);

  // EXTERNOS
  const [extRank, setExtRank]           = useState([]);

  // INSTITUCIONES
  const [instRank, setInstRank]         = useState([]);
  const [instSearch, setInstSearch]     = useState("");
  const [instOptions, setInstOptions]   = useState([]);
  const [instSel, setInstSel]           = useState(null);
  const [instHist, setInstHist]         = useState([]);
  const [instTried, setInstTried]       = useState(false);
  // CAPACITACIONES
  const [distTitulo, setDistTitulo]     = useState([]);
  const [distTema, setDistTema]         = useState([]);
  const [topCaps, setTopCaps]           = useState([]);
  const [sinAsist, setSinAsist]         = useState([]);
  const [conts, setConts]               = useState([]);
  const [series, setSeries]             = useState([]);

  // CERTIFICADOS
  const [certSerie, setCertSerie]       = useState("");
  const [certFound, setCertFound]       = useState(null);
  const [certEmit, setCertEmit]         = useState([]);
  const [certTipo, setCertTipo]         = useState([]);
  const [certCap,  setCertCap]          = useState([]);

  // PERSONAS
  const [perTipo, setPerTipo] = useState("interno"); // "interno" | "externo"
  const [perSearch, setPerSearch] = useState("");
  const [perOptions, setPerOptions] = useState([]);
  const [perSel, setPerSel] = useState(null);
  const [perHist, setPerHist] = useState([]);

  // 🔎 Cache local de títulos por idcapacitacion para evitar mostrar IDs
  const [capTitles, setCapTitles] = useState({}); // { [id:number]: string }
  const loadingTitlesRef = useRef(new Set());

  const ensureCapTitles = async (ids = []) => {
    const missing = ids.filter((id) => id && !capTitles[id] && !loadingTitlesRef.current.has(id));
    if (missing.length === 0) return;
    missing.forEach((id) => loadingTitlesRef.current.add(id));
    try {
      const results = await Promise.all(missing.map((id) => obtenerCapacitacion(id).catch(() => null)));
      const toAdd = {};
      results.forEach((cap) => {
        if (!cap) return;
        const id = Number(cap.idcapacitacion ?? cap.idCapacitacion ?? cap.id);
        const title = cap.titulo_resuelto || cap.titulo || "(Capacitación)";
        if (id) toAdd[id] = title;
      });
      if (Object.keys(toAdd).length) setCapTitles((prev) => ({ ...prev, ...toAdd }));
    } finally {
      missing.forEach((id) => loadingTitlesRef.current.delete(id));
    }
  };

  // Helpers para limpiar
  const clearInternos = () => { setInternosRank([]); setCobertura(null); setClase([]); setGrado([]); setBrechas([]); };
  const clearExternos = () => setExtRank([]);
  const clearInst     = () => { setInstRank([]); setInstHist([]); };
  const clearCaps     = () => { setDistTitulo([]); setDistTema([]); setTopCaps([]); setSinAsist([]); setConts([]); setSeries([]); };
  const clearCerts    = () => { setCertEmit([]); setCertTipo([]); setCertCap([]); };
  const clearPer      = () => setPerHist([]);

  // ====== Cargas ======
  // Participantes → Internos
  const applyInternos = async () => {
    if (dr.isInvalid) return clearInternos();
    const p = dr.params;
    try {
      const [rank, cov, cl, gr, br] = await Promise.all([
        repParticipacionInternos(p),
        repCoberturaInternos(p),
        repInternosPorClase(p),
        repInternosPorGrado(p),
        repBrechasInternos(p),
      ]);
      setInternosRank(rank ?? []); setCobertura(cov ?? null); setClase(cl ?? []); setGrado(gr ?? []); setBrechas(br ?? []);
    } catch { clearInternos(); }
  };

  // Participantes → Externos
  const applyExternos = async () => {
    if (dr.isInvalid) return clearExternos();
    try { setExtRank((await repExternosRanking(dr.params)) ?? []); } catch { clearExternos(); }
  };

  // Instituciones
  const applyInstRanking = async () => {
    if (dr.isInvalid) return setInstRank([]);
    try { setInstRank((await repInstitucionesRanking(dr.params)) ?? []); } catch { setInstRank([]); }
  };

    const applyInstHist = async () => {
+   setInstTried(true);
    setInstHist([]);
    if (dr.isInvalid) return;
    if (!instSel?.idinstitucion) return;
    try {
      const rows = await repHistorialInstitucion(instSel.idinstitucion, dr.params);
      setInstHist(Array.isArray(rows) ? rows : []);
    } catch {
      setInstHist([]); // tabla vacía en caso de error
    }
  };



  // Capacitaciones
  const applyCaps = async () => {
    if (dr.isInvalid) return clearCaps();
    const p = dr.params;
    try {
      const [dt, tm, tp, sa, co, se] = await Promise.all([
        repDistribucionPorTitulo(p),
        repDistribucionPorTema(p),
        repTopCapacitaciones(p),
        repSinAsistentes(p),
        repContenidosPorCapacitacion(p),
        repSeriesMensuales(p),
      ]);
      setDistTitulo(dt ?? []); setDistTema(tm ?? []); setTopCaps(tp ?? []); setSinAsist(sa ?? []); setConts(co ?? []); setSeries(se ?? []);

      // Resolver títulos para tablas que vienen sólo con ID
      const contIds = (co || []).map((r) => Number(r.idcapacitacion || r.idCapacitacion)).filter(Boolean);
      await ensureCapTitles(contIds);
    } catch { clearCaps(); }
  };

  // Certificados
  const applyCerts = async () => {
    if (dr.isInvalid) return clearCerts();
    const p = dr.params;
    try {
      const [em, tp, pc] = await Promise.all([
        repCertificadosEmitidos(p),
        repCertificadosPorTipo(p),
        repCertificadosPorCapacitacion(p),
      ]);
      setCertEmit(em ?? []); setCertTipo(tp ?? []); setCertCap(pc ?? []);
      // Resolver títulos si llega idcapacitacion sin nombre
      const ids = (pc || []).map((r) => Number(r.idcapacitacion || r.idCapacitacion)).filter(Boolean);
      await ensureCapTitles(ids);
    } catch { clearCerts(); }
  };

  // Certificado por serie
  const buscarSerie = async () => {
    setCertFound(null);
    const query = certSerie.trim();
    if (!query) return;
    try {
      const res = await repCertificadoBuscarPorSerie(query);
      setCertFound(res || { error: true });
    } catch {
      setCertFound({ error: true });
    }
  };

  // Personas (historial)
  const applyPersonas = async () => {
    setPerHist([]);
    if (dr.isInvalid) return clearPer();
    const sel = perSel;
    if (!sel) return;
    try {
      if (perTipo === "interno" && !sel.idpersonal) return;
      if (perTipo === "externo" && !sel.idpersona) return;
      const id = perTipo === "interno" ? sel.idpersonal : sel.idpersona;
      const rows = await repHistorialPersona(perTipo, id, dr.params);
      setPerHist(rows || []);
    } catch {
      clearPer();
    }
  };

  // Autocomplete personas
  const doSearchPersonRef = useRef(null);
  useEffect(() => {
    doSearchPersonRef.current = debounce(async (tipo, q) => {
      try {
        if (tipo === "interno") {
          const data = await buscarPersonalCatalogo({ search: q, limit: 20, offset: 0 });
          setPerOptions(Array.isArray(data) ? data : []);
        } else {
          const data = await buscarPersonasCatalogo({ search: q, limit: 20, offset: 0 });
          setPerOptions(Array.isArray(data) ? data : []);
        }
      } catch {
        setPerOptions([]);
      }
    }, 350);
  }, []);
  useEffect(() => {
    setPerSel(null);
    setPerSearch("");
    setPerOptions([]);
    doSearchPersonRef.current?.(perTipo, "");
  }, [perTipo]);
  const onPersonSearchChange = (v) => {
    setPerSearch(v);
    doSearchPersonRef.current?.(perTipo, v);
  };

  // Autocomplete instituciones
  const doSearchInstRef = useRef(null);
  useEffect(() => {
    doSearchInstRef.current = debounce(async (q) => {
      try {
        const data = await buscarInstitucionesCatalogo({ search: q, limit: 20, offset: 0 });
        setInstOptions(Array.isArray(data) ? data : []);
      } catch {
        setInstOptions([]);
      }
    }, 350);
  }, []);
  useEffect(() => { doSearchInstRef.current?.(instSearch); }, []); // precarga

  // Export util
  const exportTable = (title, columns, rows, filename) => {
    const cols = columns.map((c) => ({ header: c.label, dataKey: c.key }));
    const mapped = rows.map((r) => {
      const obj = {};
      for (const c of columns) obj[c.key] = c.render ? c.render(r[c.key], r) : r[c.key];
      return obj;
    });
    exportTablePdf({ title, columns: cols, rows: mapped, filename, orientation: "landscape" });
  };

  // Efecto por pestaña
  useEffect(() => {
    if (tab === "participantes") {
      if (tipoPart === "internos") applyInternos();
      else applyExternos();
    }
    if (tab === "instituciones") { applyInstRanking(); if (instSel) applyInstHist(); }
    if (tab === "capacitaciones") applyCaps();
    if (tab === "certificados")   applyCerts();
    if (tab === "personas")       applyPersonas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, tipoPart]);

  // Reaplicar cuando cambia rango
  const onApplyDates = () => {
    if (tab === "participantes") {
      if (tipoPart === "internos") applyInternos(); else applyExternos();
    }
    if (tab === "instituciones") { applyInstRanking(); applyInstHist(); }
    if (tab === "capacitaciones") applyCaps();
    if (tab === "certificados")   applyCerts();
    if (tab === "personas")       applyPersonas();
  };

  // Formatter de fechas cortas (defensivo)
  const fmtDate = (v) => (v ? String(v).slice(0, 10) : "—");

  return (
    <LayoutDashboard>
      <Box p={2}>
        <Typography variant="h5" gutterBottom>Reportes — Capacitaciones</Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
            <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="primary" indicatorColor="primary" sx={{ minHeight: 0 }}>
              <Tab value="participantes"  label="Participantes" />
              <Tab value="instituciones"  label="Instituciones" />
              <Tab value="capacitaciones" label="Capacitaciones" />
              <Tab value="certificados"   label="Certificados" />
              <Tab value="personas"       label="Personas" />
            </Tabs>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              {/* Filtro global de fechas */}
              <DateFilters
                inicio={dr.inicio}
                fin={dr.fin}
                setInicio={dr.setInicio}
                setFin={dr.setFin}
                onApply={onApplyDates}
              />
              {(dr.inicio || dr.fin) && (
                <Stack direction="row" spacing={1}>
                  {dr.inicio && <Chip size="small" label={`Desde: ${fmtDate(dr.inicio)}`} />}
                  {dr.fin && <Chip size="small" label={`Hasta: ${fmtDate(dr.fin)}`} />}
                </Stack>
              )}
            </Stack>
          </Stack>

          {dr.isInvalid && (
            <Typography variant="caption" color="error">
              El rango es inválido: "Inicio" debe ser menor o igual que "Fin".
            </Typography>
          )}
        </Paper>

        {/* PARTICIPANTES (unificado) */}
        {tab === "participantes" && (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <TextField
                select
                label="Tipo de participantes"
                size="small"
                sx={{ minWidth: 220 }}
                value={tipoPart}
                onChange={(e) => setTipoPart(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="internos">Internos</option>
                <option value="externos">Externos</option>
              </TextField>
            </Stack>

            {tipoPart === "internos" && (
              <>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1">KPI Cobertura</Typography>
                    <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                      exportTable("Cobertura (internos)",
                        [{ key: "k", label: "KPI" }, { key: "v", label: "Valor" }],
                        [
                          { k: "Personal", v: cobertura?.total_personal ?? 0 },
                          { k: "Con capacitación", v: cobertura?.con_capacitacion ?? 0 },
                          { k: "Cobertura %", v: cobertura?.cobertura ?? 0 },
                        ],
                        "kpi-cobertura.pdf"
                      )
                    }>Exportar</Button>
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    <Chip label={`Personal: ${cobertura?.total_personal ?? 0}`} />
                    <Chip color="primary" label={`Con capacitación: ${cobertura?.con_capacitacion ?? 0}`} />
                    <Chip color="success" label={`Cobertura: ${cobertura?.cobertura ?? 0}%`} />
                  </Stack>
                </Paper>

                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1">Ranking de participación (internos)</Typography>
                    <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                      exportTable("Ranking (internos)",
                        [
                          { key: "apellido", label: "Apellido" },
                          { key: "nombre", label: "Nombre" },
                          { key: "total_capacitaciones", label: "Total" },
                        ],
                        internosRank,
                        "ranking-internos.pdf"
                      )
                    }>Exportar</Button>
                  </Stack>
                  <SimpleTable
                    columns={[
                      { key: "apellido", label: "Apellido" },
                      { key: "nombre", label: "Nombre" },
                      { key: "total_capacitaciones", label: "Total" },
                    ]}
                    rows={internosRank}
                    getKey={(r, i) => `${r.apellido ?? ""}-${r.nombre ?? ""}-${i}`}
                  />
                </Paper>

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1">Participación por Clase</Typography>
                      <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                        exportTable("Participación por Clase",
                          [
                            { key: "clase_gestion", label: "Clase" },
                            { key: "participantes", label: "Participantes" },
                          ],
                          clase,
                          "participacion-clase.pdf"
                        )
                      }>Exportar</Button>
                    </Stack>
                    <SimpleTable
                      columns={[
                        { key: "clase_gestion", label: "Clase" },
                        { key: "participantes", label: "Participantes" },
                      ]}
                      rows={clase}
                      getKey={(r, i) => `${r.clase_gestion ?? i}-${i}`}
                    />
                  </Paper>
                  <Paper sx={{ p: 2, flex: 1 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1">Participación por Grado</Typography>
                      <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                        exportTable("Participación por Grado",
                          [
                            { key: "grado_nombre", label: "Grado" },
                            { key: "participantes", label: "Participantes" },
                          ],
                          grado,
                          "participacion-grado.pdf"
                        )
                      }>Exportar</Button>
                    </Stack>
                    <SimpleTable
                      columns={[
                        { key: "grado_nombre", label: "Grado" },
                        { key: "participantes", label: "Participantes" },
                      ]}
                      rows={grado}
                      getKey={(r, i) => `${r.grado_nombre ?? i}-${i}`}
                    />
                  </Paper>
                </Stack>

                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                    <Typography variant="subtitle1">Brechas (sin capacitación en el rango)</Typography>
                    <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                      exportTable("Brechas (internos)",
                        [
                          { key: "apellido", label: "Apellido" },
                          { key: "nombre", label: "Nombre" },
                        ],
                        brechas,
                        "brechas-internos.pdf"
                      )
                    }>Exportar</Button>
                  </Stack>
                  <SimpleTable
                    columns={[
                      { key: "apellido", label: "Apellido" },
                      { key: "nombre", label: "Nombre" },
                    ]}
                    rows={brechas}
                    getKey={(r, i) => `${r.apellido ?? ""}-${r.nombre ?? ""}-${i}`}
                  />
                </Paper>
              </>
            )}

            {tipoPart === "externos" && (
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Ranking de participación (externos)</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable("Ranking (externos)",
                      [
                        { key: "nombre", label: "Nombre" },
                        { key: "ci", label: "CI" },
                        { key: "total_capacitaciones", label: "Total" },
                      ],
                      extRank,
                      "ranking-externos.pdf"
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: "nombre", label: "Nombre" },
                    { key: "ci", label: "CI" },
                    { key: "total_capacitaciones", label: "Total" },
                  ]}
                  rows={extRank}
                  getKey={(r, i) => `${r.nombre ?? ""}-${r.ci ?? ""}-${i}`}
                />
              </Paper>
            )}
          </Stack>
        )}

        {/* INSTITUCIONES */}
        {tab === "instituciones" && (
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1">Instituciones participantes</Typography>
                <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                  exportTable("Instituciones participantes",
                    [
                      { key: "nombre", label: "Institución" },
                      { key: "total_capacitaciones", label: "Capacitaciones" },
                    ],
                    instRank,
                    "instituciones.pdf"
                  )
                }>Exportar</Button>
              </Stack>
              <SimpleTable
                columns={[
                  { key: "nombre", label: "Institución" },
                  { key: "total_capacitaciones", label: "Capacitaciones" },
                ]}
                rows={instRank}
                getKey={(r, i) => `${r.nombre ?? i}-${i}`}
              />
            </Paper>

            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Historial por institución</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" mb={2} flexWrap="wrap">
                <Autocomplete
                  sx={{ minWidth: 340, flex: 1 }}
                  options={instOptions}
                  value={instSel}
                  onChange={(_, v) => setInstSel(v)}
                  onInputChange={(_, v) => { setInstSearch(v); doSearchInstRef.current?.(v); }}
                  getOptionLabel={(o) => (o?.nombre ? o.nombre : "")}
                  isOptionEqualToValue={(a, b) => a?.idinstitucion === b?.idinstitucion}
                  renderInput={(params) => <TextField {...params} label="Buscar institución" size="small" />}
                  noOptionsText={instSearch ? "No hay coincidencias" : "Escribe para buscar"}
                />
                <Button variant="contained" startIcon={<Search />} onClick={applyInstHist} disabled={!instSel}>
                  Ver historial
                </Button>
              </Stack>

              {instTried && instSel && instHist.length === 0 && (
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
      No se encontraron capacitaciones para esta institución en el rango seleccionado.
    </Typography>
  )}

  <SimpleTable
    columns={[
      { key: "fecha",  label: "Fecha", render: (v) => fmtDate(v) },
      { key: "titulo", label: "Capacitación" },
      { key: "tema",   label: "Tema" },
    ]}
    rows={instHist}
    getKey={(r, i) => `${r.titulo ?? i}-${r.fecha ?? i}-${i}`}
  />
</Paper>
          </Stack>
        )}

        {/* CAPACITACIONES */}
        {tab === "capacitaciones" && (
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
              <TextField
                select
                label="Tipo de capacitación"
                size="small"
                sx={{ minWidth: 220 }}
                value={tipoCap}
                onChange={(e) => setTipoCap(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="titulo">Título</option>
                <option value="tema">Tema</option>
              </TextField>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Distribución por {tipoCap === "titulo" ? "Título" : "Tema"}</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable(`Distribución por ${tipoCap === "titulo" ? "Título" : "Tema"}`,
                      [
                        { key: tipoCap === "titulo" ? "titulo" : "tema", label: tipoCap === "titulo" ? "Título" : "Tema" },
                        { key: "total_eventos", label: "Capacitaciones" },
                        { key: "total_asistentes", label: "Asistentes" },
                      ],
                      tipoCap === "titulo" ? distTitulo : distTema,
                      `dist-${tipoCap}.pdf`
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: tipoCap === "titulo" ? "titulo" : "tema", label: tipoCap === "titulo" ? "Título" : "Tema" },
                    { key: "total_eventos", label: "Capacitaciones" },
                    { key: "total_asistentes", label: "Asistentes" },
                  ]}
                  rows={tipoCap === "titulo" ? distTitulo : distTema}
                  getKey={(r, i) => `${(tipoCap === "titulo" ? r.titulo : r.tema) ?? i}-${i}`}
                />
              </Paper>

              <Paper sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Serie mensual (capacitaciones y participantes)</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable("Serie mensual (capacitaciones y participantes)",
                      [
                        { key: "periodo", label: "Periodo" },
                        { key: "eventos", label: "Capacitaciones" },
                        { key: "participantes", label: "Participantes" },
                      ],
                      series,
                      "serie-mensual.pdf"
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: "periodo", label: "Periodo" },
                    { key: "eventos", label: "Capacitaciones" },
                    { key: "participantes", label: "Participantes" },
                  ]}
                  rows={series}
                  getKey={(r, i) => `${r.periodo ?? i}-${i}`}
                />
              </Paper>
            </Stack>

            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1">Top Capacitaciones (por asistentes)</Typography>
                <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                  exportTable("Top Capacitaciones",
                    [
                      { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                      { key: "titulo", label: "Capacitación" },
                      { key: "total", label: "Asistentes" },
                    ],
                    topCaps,
                    "top-capacitaciones.pdf"
                  )
                }>Exportar</Button>
              </Stack>
              <SimpleTable
                columns={[
                  { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                  { key: "titulo", label: "Capacitación" },
                  { key: "total", label: "Asistentes" },
                ]}
                rows={topCaps}
                getKey={(r, i) => `${r.titulo ?? i}-${r.fecha ?? i}-${i}`}
              />
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Capacitaciones sin asistentes</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable("Capacitaciones sin asistentes",
                      [
                        { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                        { key: "titulo", label: "Capacitación" },
                      ],
                      sinAsist,
                      "sin-asistentes.pdf"
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                    { key: "titulo", label: "Capacitación" },
                  ]}
                  rows={sinAsist}
                  getKey={(r, i) => `${r.titulo ?? i}-${r.fecha ?? i}-${i}`}
                />
              </Paper>

              {/* Recursos por capacitación (sin IDs visibles) */}
              <Paper sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Recursos por capacitación</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable("Recursos por capacitación",
                      [
                        { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                        { key: "cap", label: "Capacitación" },
                        { key: "total_contenidos", label: "Recursos" },
                      ],
                      (conts || []).map((r) => ({
                        ...r,
                        cap: capTitles[r.idcapacitacion] || capTitles[r.idCapacitacion] || `Cap. #${r.idcapacitacion || r.idCapacitacion}`,
                      })),
                      "recursos.pdf"
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                    { key: "cap", label: "Capacitación", render: (_v, r) => capTitles[r.idcapacitacion] || capTitles[r.idCapacitacion] || `Cap. #${r.idcapacitacion || r.idCapacitacion}` },
                    { key: "total_contenidos", label: "Recursos" },
                  ]}
                  rows={conts}
                  getKey={(r, i) => `${r.idcapacitacion ?? r.idCapacitacion ?? i}-${i}`}
                />
              </Paper>
            </Stack>
          </Stack>
        )}

        {/* CERTIFICADOS */}
        {tab === "certificados" && (
          <Stack spacing={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Buscar por Nro. de Serie</Typography>
              <Stack direction="row" spacing={2}>
                <TextField label="Nro. de Serie" size="small" value={certSerie} onChange={(e) => setCertSerie(e.target.value)} />
                <Button variant="contained" onClick={buscarSerie}>Buscar</Button>
              </Stack>
              <Divider sx={{ my: 2 }} />
              {certFound && !certFound.error && (
                <Stack spacing={1}>
                  <Typography variant="body2"><b>Serie:</b> {certFound.nroSerie || certFound.nroserie || "—"}</Typography>
                  <Typography variant="body2"><b>Nombre:</b> {certFound.nombremostrado || certFound.nombreMostrado || "—"}</Typography>
                  <Typography variant="body2"><b>Fecha:</b> {fmtDate(certFound.fecha)}</Typography>
                  <Typography variant="body2"><b>Capacitación:</b> {certFound.titulo_resuelto || certFound.titulo || "—"}</Typography>
                  <Typography variant="body2"><b>Estado:</b> {certFound.anulado ? "ANULADO" : "Vigente"}</Typography>
                  {(certFound.archivoPDF || certFound.archivopdf) && (
                    <Typography variant="body2">
                      <a href={certFound.archivoPDF || certFound.archivopdf} target="_blank" rel="noreferrer">Ver PDF</a>
                    </Typography>
                  )}
                </Stack>
              )}
              {certFound?.error && <Typography color="error">No se pudo buscar el certificado.</Typography>}
            </Paper>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Paper sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Certificados emitidos (mensual)</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable("Certificados emitidos (mensual)",
                      [
                        { key: "periodo", label: "Periodo" },
                        { key: "emitidos", label: "Emitidos" },
                        { key: "anulados", label: "Anulados" },
                      ],
                      certEmit,
                      "certificados-emitidos.pdf"
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: "periodo", label: "Periodo" },
                    { key: "emitidos", label: "Emitidos" },
                    { key: "anulados", label: "Anulados" },
                  ]}
                  rows={certEmit}
                  getKey={(r, i) => `${r.periodo ?? i}-${i}`}
                />
              </Paper>

              <Paper sx={{ p: 2, flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                  <Typography variant="subtitle1">Certificados por tipo</Typography>
                  <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                    exportTable("Certificados por tipo",
                      [
                        { key: "tipoparticipante", label: "Tipo" },
                        { key: "total", label: "Total" },
                      ],
                      certTipo,
                      "certificados-tipo.pdf"
                    )
                  }>Exportar</Button>
                </Stack>
                <SimpleTable
                  columns={[
                    { key: "tipoparticipante", label: "Tipo" },
                    { key: "total", label: "Total" },
                  ]}
                  rows={certTipo}
                  getKey={(r, i) => `${r.tipoparticipante ?? i}-${i}`}
                />
              </Paper>
            </Stack>

            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle1">Certificados por capacitación</Typography>
                <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                  exportTable("Certificados por capacitación",
                    [
                      { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                      { key: "titulo", label: "Capacitación" },
                      { key: "certificados", label: "Certificados" },
                      { key: "anulados", label: "Anulados" },
                    ],
                    certCap,
                    "certificados-por-capacitacion.pdf"
                  )
                }>Exportar</Button>
              </Stack>
              <SimpleTable
                columns={[
                  { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                  { key: "titulo", label: "Capacitación" },
                  { key: "certificados", label: "Certificados" },
                  { key: "anulados", label: "Anulados" },
                ]}
                rows={certCap}
                getKey={(r, i) => `${r.titulo ?? i}-${r.fecha ?? i}-${i}`}
              />
            </Paper>
          </Stack>
        )}

        {/* PERSONAS (historial con Autocomplete) */}
        {tab === "personas" && (
          <Paper sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="subtitle1">Historial por persona</Typography>
              <Button size="small" startIcon={<PictureAsPdf />} onClick={() =>
                exportTable(
                  "Historial por persona",
                  [
                    { key: "fecha", label: "Fecha", render: (v) => fmtDate(v) },
                    { key: "titulo", label: "Capacitación" },
                    { key: "tema",   label: "Tema"   },
                  ],
                  perHist,
                  "historial-persona.pdf"
                )
              }>
                Exportar
              </Button>
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center" mb={2} flexWrap="wrap">
              <TextField
                select
                label="Tipo"
                size="small"
                sx={{ minWidth: 160 }}
                value={perTipo}
                onChange={(e) => setPerTipo(e.target.value)}
                SelectProps={{ native: true }}
              >
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </TextField>

              <Autocomplete
                sx={{ minWidth: 320, flex: 1 }}
                options={perOptions}
                value={perSel}
                onChange={(_, v) => setPerSel(v)}
                onInputChange={(_, v) => onPersonSearchChange(v)}
                getOptionLabel={(o) => {
                  if (!o) return "";
                  if (perTipo === "interno") {
                    const nombre = `${o.nombre ?? ""} ${o.apellido ?? ""}`.trim();
                    const extra = [o.ci, o.clase_nombre, o.grado_nombre].filter(Boolean).join(" — ");
                    return extra ? `${nombre} — ${extra}` : nombre;
                  }
                  const extra = [o.ci, o.correo].filter(Boolean).join(" — ");
                  return extra ? `${o.nombre} — ${extra}` : (o.nombre ?? "");
                }}
                isOptionEqualToValue={(a, b) => {
                  if (!a || !b) return a === b;
                  return perTipo === "interno"
                    ? a.idpersonal === b.idpersonal
                    : a.idpersona === b.idpersona;
                }}
                renderInput={(params) => (
                  <TextField {...params} label={`Buscar ${perTipo === "interno" ? "personal" : "persona"} por nombre / CI`} size="small" />
                )}
                noOptionsText={perSearch ? "No hay coincidencias" : "Escribe para buscar"}
              />

              <Button variant="contained" startIcon={<Search />} onClick={applyPersonas} disabled={!perSel}>
                Buscar
              </Button>
            </Stack>

            <SimpleTable
              columns={[
                { key: "fecha",  label: "Fecha", render: (v) => fmtDate(v) },
                { key: "titulo", label: "Capacitación" },
                { key: "tema",   label: "Tema"   },
              ]}
              rows={perHist}
              getKey={(r, i) => `${r.titulo ?? i}-${r.fecha ?? i}-${i}`}
            />
          </Paper>
        )}
      </Box>
    </LayoutDashboard>
  );
}
