// src/pages/vehiculos/VehiculosReportesPage.jsx
import {
  Typography, Paper, Box, Tabs, Tab, Button, TextField,
  Table, TableHead, TableRow, TableCell, TableBody, Chip, MenuItem
} from "@mui/material";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import api from "../../services/axios"; // <- misma instancia que usan tus services

import {
  rptDistribucionEstado,
  rptDisponibles,
  rptEnEmergencia,
  rptTotalesItemFlota,
  rptVehiculosPorItem,
  rptParticipacionEmergencias,
  rptRankingMantenimientos,
  rptInventarioVehiculo,
  rptDetalleVehiculo,
  rptVehiculosListado,
  listarVehiculos,
  listarInventarioItems,
} from "../../services/vehiculos.service";
import { exportTablePdf } from "../../utils/pdfExport";

const estadoColor = (estado) => {
  if (estado === "Operativo") return "success";
  if (estado === "Fuera de servicio") return "warning";
  if (estado === "En emergencia") return "error";
  return "default";
};

export default function VehiculosReportesPage() {
  const [tab, setTab] = useState(0);

  // datasets base
  const [distEstado, setDistEstado] = useState([]);
  const [disponibles, setDisponibles] = useState([]);
  const [enEmergencia, setEnEmergencia] = useState([]);
  const [totalesItem, setTotalesItem] = useState([]);

  // combos
  const [vehiculosOpt, setVehiculosOpt] = useState([]);
  const [itemsOpt, setItemsOpt] = useState([]);

  // selecciones
  const [selItem, setSelItem] = useState("");          // idItem
  const [selVehiculo, setSelVehiculo] = useState("");  // idVehiculo

  // resultados
  const [vehPorItem, setVehPorItem] = useState([]);
  const [invVeh, setInvVeh] = useState([]);
  const [detalleVeh, setDetalleVeh] = useState(null);

  // rango fechas
  const [inicio, setInicio] = useState("");
  const [fin, setFin] = useState("");
  const [partEmerg, setPartEmerg] = useState([]);
  const [rankMant, setRankMant] = useState([]);

  // listado filtrable
  const [listado, setListado] = useState([]);
  const [loadingListado, setLoadingListado] = useState(false);
  const [filtro, setFiltro] = useState({ estado: "", tipo: "", marca: "", modelo: "", nominacion: "" });

  // opciones para los filtros desplegables
  const [filtrosOpt, setFiltrosOpt] = useState({
    tipos: [],
    marcas: [],
    modelos: [],
    nominaciones: [],
  });

  // =====================
  // Carga inicial (básicos, combos, filtros y listado)
  // =====================
  const cargarBasicos = async () => {
    try {
      const [d1, d2, d3, d4] = await Promise.all([
        rptDistribucionEstado(),
        rptDisponibles(),
        rptEnEmergencia(),
        rptTotalesItemFlota(),
      ]);
      setDistEstado(d1 || []);
      setDisponibles(d2 || []);
      setEnEmergencia(d3 || []);
      setTotalesItem(d4 || []);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudieron cargar los reportes";
      Swal.fire("Error", msg, "error");
    }
  };

  const cargarOpciones = async () => {
    try {
      const [vs, its] = await Promise.all([listarVehiculos(), listarInventarioItems()]);
      setVehiculosOpt(vs || []);
      setItemsOpt((its || []).map(i => ({
        iditem: i.iditem ?? i.idItem,
        nombre: i.nombre,
        descripcion: i.descripcion,
      })));
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudieron cargar opciones";
      Swal.fire("Error", msg, "error");
    }
  };

  const cargarFiltros = async () => {
    try {
      const { data } = await api.get("/vehiculos/reportes/filtros");
      setFiltrosOpt({
        tipos: data?.tipos || [],
        marcas: data?.marcas || [],
        modelos: data?.modelos || [],
        nominaciones: data?.nominaciones || [],
      });
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudieron cargar filtros de vehículos";
      Swal.fire("Error", msg, "error");
    }
  };

  const onBuscarListado = async () => {
    try {
      setLoadingListado(true);
      const params = {
        estado: filtro.estado || undefined,
        tipo: filtro.tipo || undefined,
        marca: filtro.marca || undefined,
        modelo: filtro.modelo || undefined,
        nominacion: filtro.nominacion || undefined,
      };
      const data = await rptVehiculosListado(params);
      setListado(data || []);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar listado";
      Swal.fire("Error", msg, "error");
    } finally {
      setLoadingListado(false);
    }
  };

  useEffect(() => {
    cargarBasicos();
    cargarOpciones();
    cargarFiltros();   // <-- trae opciones para los select
    onBuscarListado(); // <-- carga inicial del listado sin filtros
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // fuerza carga cuando entras a la pestaña de listado
  useEffect(() => {
    if (tab === 4 && listado.length === 0 && !loadingListado) {
      onBuscarListado();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // =====================
  // Acciones con combos y rangos
  // =====================
  const onBuscarVehiculosPorItem = async () => {
    try {
      if (!selItem) return Swal.fire("Valida", "Selecciona un ítem", "info");
      const data = await rptVehiculosPorItem(Number(selItem));
      setVehPorItem(data || []);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar";
      Swal.fire("Error", msg, "error");
    }
  };

  const onBuscarPartEmerg = async () => {
    try {
      const p = { inicio: inicio || undefined, fin: fin || undefined };
      const [p1, p2] = await Promise.all([
        rptParticipacionEmergencias(p),
        rptRankingMantenimientos({ inicio, fin }),
      ]);
      setPartEmerg(p1 || []);
      setRankMant(p2 || []);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar";
      Swal.fire("Error", msg, "error");
    }
  };

  const onBuscarInvVeh = async () => {
    try {
      if (!selVehiculo) return Swal.fire("Valida", "Selecciona un vehículo", "info");
      const [inv, det] = await Promise.all([
        rptInventarioVehiculo(Number(selVehiculo)),
        rptDetalleVehiculo(Number(selVehiculo)),
      ]);
      setInvVeh(inv || []);
      setDetalleVeh(det || null);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar";
      Swal.fire("Error", msg, "error");
    }
  };

  // =====================
  // Export helper
  // =====================
  const exportar = (titulo, cols, rows, file = "reporte.pdf", subtitle = "") =>
    exportTablePdf({ title: titulo, subtitle, columns: cols, rows, filename: file });

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h5">Reportes de Vehículos</Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Distribución/Disponibilidad" />
          <Tab label="Totales por ítem / Vehículos por ítem" />
          <Tab label="Participación y Mantenimientos (rango)" />
          <Tab label="Inventario y Detalle por Vehículo" />
          <Tab label="Listado filtrable" />
        </Tabs>

        {/* Tab 0: Distribución & Disponibilidad */}
        {tab === 0 && (
          <Box mt={2} display="grid" gap={3}>
            {/* Distribución por estado */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Distribución por estado</Typography>
                <Button onClick={() =>
                  exportar(
                    "Distribución por estado",
                    [{ header: "Estado", dataKey: "estado" }, { header: "Total", dataKey: "total" }],
                    distEstado,
                    "vehiculos_distribucion_estado.pdf"
                  )
                }>Exportar PDF</Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>Estado</TableCell><TableCell>Total</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {distEstado.map((r, i) => (
                    <TableRow key={i}>
                      <TableCell><Chip label={r.estado} color={estadoColor(r.estado)} /></TableCell>
                      <TableCell>{r.total}</TableCell>
                    </TableRow>
                  ))}
                  {distEstado.length === 0 && <TableRow><TableCell colSpan={2}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>

            {/* Disponibles */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Vehículos disponibles</Typography>
                <Button onClick={() =>
                  exportar(
                    "Vehículos disponibles",
                    [
                      { header: "ID", dataKey: "idvehiculo" },
                      { header: "Placa", dataKey: "placa" },
                      { header: "Marca", dataKey: "marca" },
                      { header: "Modelo", dataKey: "modelo" },
                      { header: "Tipo", dataKey: "tipo" },
                      { header: "Nominación", dataKey: "nominacion" },
                    ],
                    disponibles,
                    "vehiculos_disponibles.pdf"
                  )
                }>Exportar PDF</Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID</TableCell><TableCell>Placa</TableCell><TableCell>Marca</TableCell>
                  <TableCell>Modelo</TableCell><TableCell>Tipo</TableCell><TableCell>Nominación</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {disponibles.map(v => (
                    <TableRow key={v.idvehiculo}>
                      <TableCell>{v.idvehiculo}</TableCell><TableCell>{v.placa}</TableCell>
                      <TableCell>{v.marca}</TableCell><TableCell>{v.modelo}</TableCell>
                      <TableCell>{v.tipo || "—"}</TableCell><TableCell>{v.nominacion || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {disponibles.length === 0 && <TableRow><TableCell colSpan={6}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>

            {/* En emergencia */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Vehículos en emergencia</Typography>
                <Button onClick={() =>
                  exportar(
                    "Vehículos en emergencia",
                    [
                      { header: "ID", dataKey: "idvehiculo" },
                      { header: "Placa", dataKey: "placa" },
                      { header: "Marca", dataKey: "marca" },
                      { header: "Modelo", dataKey: "modelo" },
                      { header: "Tipo", dataKey: "tipo" },
                      { header: "Nominación", dataKey: "nominacion" },
                    ],
                    enEmergencia,
                    "vehiculos_en_emergencia.pdf"
                  )
                }>Exportar PDF</Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID</TableCell><TableCell>Placa</TableCell><TableCell>Marca</TableCell>
                  <TableCell>Modelo</TableCell><TableCell>Tipo</TableCell><TableCell>Nominación</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {enEmergencia.map(v => (
                    <TableRow key={v.idvehiculo}>
                      <TableCell>{v.idvehiculo}</TableCell><TableCell>{v.placa}</TableCell>
                      <TableCell>{v.marca}</TableCell><TableCell>{v.modelo}</TableCell>
                      <TableCell>{v.tipo || "—"}</TableCell><TableCell>{v.nominacion || "—"}</TableCell>
                    </TableRow>
                  ))}
                  {enEmergencia.length === 0 && <TableRow><TableCell colSpan={6}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Tab 1: Totales por ítem / Vehículos por ítem */}
        {tab === 1 && (
          <Box mt={2} display="grid" gap={3}>
            {/* Totales por ítem */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Totales por ítem en la flota</Typography>
                <Button onClick={() =>
                  exportar(
                    "Totales por ítem en flota",
                    [
                      { header: "ID Ítem", dataKey: "iditem" },
                      { header: "Ítem", dataKey: "nombre" },
                      { header: "Total en vehículos", dataKey: "total_en_vehiculos" },
                      { header: "Vehículos con ítem", dataKey: "vehiculos_con_item" },
                    ],
                    totalesItem,
                    "totales_item_flota.pdf"
                  )
                }>Exportar PDF</Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID Ítem</TableCell><TableCell>Ítem</TableCell>
                  <TableCell>Total en vehículos</TableCell><TableCell>Vehículos con ítem</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {totalesItem.map(r => (
                    <TableRow key={r.iditem}>
                      <TableCell>{r.iditem}</TableCell><TableCell>{r.nombre}</TableCell>
                      <TableCell>{r.total_en_vehiculos}</TableCell><TableCell>{r.vehiculos_con_item}</TableCell>
                    </TableRow>
                  ))}
                  {totalesItem.length === 0 && <TableRow><TableCell colSpan={4}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>

            {/* Vehículos por ítem */}
            <Box>
              <Box display="flex" gap={2} alignItems="center" mb={1}>
                <Typography variant="h6" sx={{ flex: 1 }}>Vehículos por ítem</Typography>

                <TextField
                  size="small"
                  select
                  label="Ítem"
                  value={selItem}
                  onChange={(e) => setSelItem(e.target.value)}
                  sx={{ minWidth: 280 }}
                >
                  <MenuItem value="">(Selecciona un ítem)</MenuItem>
                  {itemsOpt.map(it => (
                    <MenuItem key={it.iditem} value={it.iditem}>
                      {it.nombre} {it.descripcion ? `— ${it.descripcion}` : ""}
                    </MenuItem>
                  ))}
                </TextField>

                <Button variant="contained" onClick={onBuscarVehiculosPorItem}>Buscar</Button>
                <Button
                  onClick={() =>
                    exportTablePdf({
                      title: `Vehículos por ítem`,
                      subtitle: selItem
                        ? `Ítem seleccionado: ${(itemsOpt.find(x => String(x.iditem) === String(selItem))?.nombre) || selItem}`
                        : "",
                      columns: [
                        { header: "ID Vehículo", dataKey: "idvehiculo" },
                        { header: "Placa", dataKey: "placa" },
                        { header: "Marca", dataKey: "marca" },
                        { header: "Modelo", dataKey: "modelo" },
                        { header: "Estado", dataKey: "estado" },
                        { header: "Cantidad", dataKey: "cantidad" },
                      ],
                      rows: vehPorItem,
                      filename: `vehiculos_por_item_${selItem || "NA"}.pdf`,
                    })
                  }
                >
                  Exportar PDF
                </Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID Vehículo</TableCell><TableCell>Placa</TableCell><TableCell>Marca</TableCell>
                  <TableCell>Modelo</TableCell><TableCell>Estado</TableCell><TableCell>Cantidad</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {vehPorItem.map(v => (
                    <TableRow key={`${v.idvehiculo}-${v.iditem}`}>
                      <TableCell>{v.idvehiculo}</TableCell><TableCell>{v.placa}</TableCell>
                      <TableCell>{v.marca}</TableCell><TableCell>{v.modelo}</TableCell>
                      <TableCell><Chip label={v.estado} color={estadoColor(v.estado)} size="small" /></TableCell>
                      <TableCell>{v.cantidad ?? 1}</TableCell>
                    </TableRow>
                  ))}
                  {vehPorItem.length === 0 && <TableRow><TableCell colSpan={6}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Tab 2: Participación emergencias + Ranking mantenimientos */}
        {tab === 2 && (
          <Box mt={2} display="grid" gap={2}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField label="Inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Fin" type="date" value={fin} onChange={(e) => setFin(e.target.value)} InputLabelProps={{ shrink: true }} />
              <Button variant="contained" onClick={onBuscarPartEmerg}>Buscar</Button>
            </Box>

            {/* Participación en emergencias */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Participación en emergencias</Typography>
                <Button onClick={() =>
                  exportTablePdf({
                    title: `Participación en emergencias`,
                    columns: [
                      { header: "ID Vehículo", dataKey: "idvehiculo" },
                      { header: "Placa", dataKey: "placa" },
                      { header: "Total emergencias", dataKey: "total_emergencias" },
                    ],
                    rows: partEmerg,
                    filename: "participacion_emergencias.pdf",
                  })
                }>Exportar PDF</Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID Vehículo</TableCell><TableCell>Placa</TableCell><TableCell>Total emergencias</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {partEmerg.map(r => (
                    <TableRow key={r.idvehiculo}>
                      <TableCell>{r.idvehiculo}</TableCell><TableCell>{r.placa}</TableCell>
                      <TableCell>{r.total_emergencias}</TableCell>
                    </TableRow>
                  ))}
                  {partEmerg.length === 0 && <TableRow><TableCell colSpan={3}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>

            {/* Ranking de mantenimientos */}
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Ranking de mantenimientos</Typography>
                <Button onClick={() =>
                  exportTablePdf({
                    title: `Ranking de mantenimientos`,
                    columns: [
                      { header: "ID Vehículo", dataKey: "idvehiculo" },
                      { header: "Placa", dataKey: "placa" },
                      { header: "Total mantenimientos", dataKey: "total_mantenimientos" },
                    ],
                    rows: rankMant,
                    filename: "ranking_mantenimientos.pdf",
                  })
                }>Exportar PDF</Button>
              </Box>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID Vehículo</TableCell><TableCell>Placa</TableCell><TableCell>Total mantenimientos</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {rankMant.map(r => (
                    <TableRow key={r.idvehiculo}>
                      <TableCell>{r.idvehiculo}</TableCell><TableCell>{r.placa}</TableCell>
                      <TableCell>{r.total_mantenimientos}</TableCell>
                    </TableRow>
                  ))}
                  {rankMant.length === 0 && <TableRow><TableCell colSpan={3}>Sin datos</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>
          </Box>
        )}

        {/* Tab 3: Inventario y Detalle por vehículo */}
        {tab === 3 && (
          <Box mt={2} display="grid" gap={2}>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                size="small"
                select
                label="Vehículo"
                value={selVehiculo}
                onChange={(e) => setSelVehiculo(e.target.value)}
                sx={{ minWidth: 320 }}
              >
                <MenuItem value="">(Selecciona un vehículo)</MenuItem>
                {vehiculosOpt.map(v => (
                  <MenuItem key={v.idvehiculo} value={v.idvehiculo}>
                    {v.placa} — {v.marca} {v.modelo} {v.nominacion ? `(${v.nominacion})` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <Button variant="contained" onClick={onBuscarInvVeh}>Buscar</Button>
              <Button
                onClick={() =>
                  exportTablePdf({
                    title: `Inventario del vehículo`,
                    subtitle: selVehiculo
                      ? `Vehículo: ${vehiculosOpt.find(x => String(x.idvehiculo) === String(selVehiculo))?.placa || selVehiculo}`
                      : "",
                    columns: [
                      { header: "ID Ítem", dataKey: "iditem" },
                      { header: "Nombre", dataKey: "nombre" },
                      { header: "Descripción", dataKey: "descripcion" },
                      { header: "Cantidad", dataKey: "cantidad" },
                    ],
                    rows: invVeh,
                    filename: `inventario_vehiculo_${selVehiculo || "NA"}.pdf`,
                  })
                }
              >
                Exportar PDF
              </Button>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>Inventario del vehículo</Typography>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell>ID Ítem</TableCell><TableCell>Nombre</TableCell>
                  <TableCell>Descripción</TableCell><TableCell>Cantidad</TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {invVeh.map((it, idx) => (
                    <TableRow key={it.iditem || idx}>
                      <TableCell>{it.iditem ?? it.idItem ?? "—"}</TableCell>
                      <TableCell>{it.nombre || "—"}</TableCell>
                      <TableCell>{it.descripcion || "—"}</TableCell>
                      <TableCell>{it.cantidad ?? 1}</TableCell>
                    </TableRow>
                  ))}
                  {invVeh.length === 0 && <TableRow><TableCell colSpan={4}>Sin ítems</TableCell></TableRow>}
                </TableBody>
              </Table>
            </Box>

            <Box>
              <Typography variant="h6" gutterBottom>Detalle de vehículo</Typography>
              {detalleVeh?.vehiculo ? (
                <Box sx={{ fontSize: 14 }}>
                  <div><strong>Placa:</strong> {detalleVeh.vehiculo.placa}</div>
                  <div><strong>Marca/Modelo:</strong> {detalleVeh.vehiculo.marca} {detalleVeh.vehiculo.modelo}</div>
                  <div><strong>Tipo:</strong> {detalleVeh.vehiculo.tipo || "—"}</div>
                  <div><strong>Nominación:</strong> {detalleVeh.vehiculo.nominacion || "—"}</div>
                  <div><strong>Estado:</strong> <Chip label={detalleVeh.vehiculo.estado} color={estadoColor(detalleVeh.vehiculo.estado)} size="small" /></div>
                </Box>
              ) : <Box>Sin detalle</Box>}
            </Box>
          </Box>
        )}

        {/* Tab 4: Listado filtrable */}
        {tab === 4 && (
          <Box mt={2} display="grid" gap={2}>
            <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
              <TextField
                label="Estado"
                select
                value={filtro.estado}
                onChange={(e) => setFiltro(s => ({ ...s, estado: e.target.value }))}
              >
                <MenuItem value="">(Todos)</MenuItem>
                <MenuItem value="Operativo">Operativo</MenuItem>
                <MenuItem value="Fuera de servicio">Fuera de servicio</MenuItem>
                <MenuItem value="En emergencia">En emergencia</MenuItem>
              </TextField>

              <TextField
                label="Tipo"
                select
                value={filtro.tipo}
                onChange={(e) => setFiltro(s => ({ ...s, tipo: e.target.value }))}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {filtrosOpt.tipos.map((t, i) => <MenuItem key={i} value={t}>{t}</MenuItem>)}
              </TextField>

              <TextField
                label="Marca"
                select
                value={filtro.marca}
                onChange={(e) => setFiltro(s => ({ ...s, marca: e.target.value }))}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {filtrosOpt.marcas.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>)}
              </TextField>

              <TextField
                label="Modelo"
                select
                value={filtro.modelo}
                onChange={(e) => setFiltro(s => ({ ...s, modelo: e.target.value }))}
              >
                <MenuItem value="">(Todos)</MenuItem>
                {filtrosOpt.modelos.map((m, i) => <MenuItem key={i} value={m}>{m}</MenuItem>)}
              </TextField>

              <TextField
                label="Nominación"
                select
                value={filtro.nominacion}
                onChange={(e) => setFiltro(s => ({ ...s, nominacion: e.target.value }))}
              >
                <MenuItem value="">(Todas)</MenuItem>
                {filtrosOpt.nominaciones.map((n, i) => <MenuItem key={i} value={n}>{n}</MenuItem>)}
              </TextField>
            </Box>

            <Box display="flex" gap={2}>
              <Button variant="contained" onClick={onBuscarListado} disabled={loadingListado}>
                {loadingListado ? "Buscando..." : "Buscar"}
              </Button>
              <Button
                disabled={!listado.length}
                onClick={() => exportTablePdf({
                  title: "Listado de vehículos",
                  columns: [
                    { header: "ID", dataKey: "idvehiculo" },
                    { header: "Placa", dataKey: "placa" },
                    { header: "Marca", dataKey: "marca" },
                    { header: "Modelo", dataKey: "modelo" },
                    { header: "Tipo", dataKey: "tipo" },
                    { header: "Nominación", dataKey: "nominacion" },
                    { header: "Estado", dataKey: "estado" },
                  ],
                  rows: listado,
                  filename: "vehiculos_listado.pdf"
                })}
              >
                Exportar PDF
              </Button>
            </Box>

            <Table size="small">
              <TableHead><TableRow>
                <TableCell>ID</TableCell><TableCell>Placa</TableCell><TableCell>Marca</TableCell>
                <TableCell>Modelo</TableCell><TableCell>Tipo</TableCell><TableCell>Nominación</TableCell><TableCell>Estado</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {listado.map(v => (
                  <TableRow key={v.idvehiculo}>
                    <TableCell>{v.idvehiculo}</TableCell><TableCell>{v.placa}</TableCell>
                    <TableCell>{v.marca}</TableCell><TableCell>{v.modelo}</TableCell>
                    <TableCell>{v.tipo || "—"}</TableCell><TableCell>{v.nominacion || "—"}</TableCell>
                    <TableCell><Chip label={v.estado} color={estadoColor(v.estado)} size="small" /></TableCell>
                  </TableRow>
                ))}
                {listado.length === 0 && <TableRow><TableCell colSpan={7}>Sin resultados</TableCell></TableRow>}
              </TableBody>
            </Table>
          </Box>
        )}
      </Paper>
    </LayoutDashboard>
  );
}
