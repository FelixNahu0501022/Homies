// src/pages/emergencias/EmergenciasPage.jsx
// ✅ Integración completa de modales: Vehículos, Personal, Inventario
// ✅ Sin alterar la lógica original ni servicios
// ✅ Visual consistente con los demás módulos

import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip, Button, Box, TextField, Chip,
  TablePagination, Stack, MenuItem, TableContainer
} from "@mui/material";
import {
  Add, Edit, Delete, Visibility,
  LocalShipping, Person, Inventory2, Emergency, BarChart,
  DirectionsCar, Assignment, CheckCircle
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { listarEmergencias, eliminarEmergencia, listarTiposEmergencia, finalizarEmergencia } from "../../services/emergencias.service";

// === Importamos los modales ===
import EmergenciaVehiculosPage from "./EmergenciaVehiculosPage";
import EmergenciaPersonalPage from "./EmergenciaPersonalPage";
import EmergenciaInventarioPage from "./EmergenciaInventarioPage";

// === helpers ===
const normEstado = (estado) => String(estado ?? "").trim().toLowerCase().replace(/\s+/g, "_");
const estadoColor = (estado) => {
  const e = normEstado(estado);
  if (e === "pendiente") return "warning";
  if (e === "en_curso") return "info";
  if (e === "finalizada" || e === "completa") return "success";
  return "default";
};
const fechaFmt = (f) => (f ? String(f).replace("T", " ").slice(0, 16) : "—");
const getId = (e) => e.idemergencia ?? e.idEmergencia ?? e.id;

export default function EmergenciasPage() {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [tiposMap, setTiposMap] = useState({});
  const navigate = useNavigate();

  const cargar = async () => {
    try {
      const [data, tiposData] = await Promise.all([
        listarEmergencias(),
        listarTiposEmergencia()
      ]);

      // Crear mapa de tipos: id -> nombre
      const tMap = {};
      if (Array.isArray(tiposData)) {
        tiposData.forEach(t => {
          const id = t.idtipoemergencia ?? t.idTipoEmergencia ?? t.id;
          if (id) tMap[id] = t.nombre ?? t.descripcion;
        });
      }
      setTiposMap(tMap);

      setRows(data || []);
      setFiltered(data || []);
      setPage(0);
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar emergencias";
      Swal.fire("Error", msg, "error");
    }
  };
  useEffect(() => { cargar(); }, []); // eslint-disable-line

  // === Stats rápidos ===
  const stats = useMemo(() => {
    const total = rows.length;
    const pend = rows.filter(r => normEstado(r.estado) === "pendiente").length;
    const curso = rows.filter(r => normEstado(r.estado) === "en_curso").length;
    const fin = rows.filter(r => ["finalizada", "completa"].includes(normEstado(r.estado))).length;
    return { total, pend, curso, fin };
  }, [rows]);

  // === Filtro + búsqueda ===
  const runFilter = useMemo(
    () => debounce((value, estado, source) => {
      const q = (value || "").toLowerCase().trim();
      const out = (source || []).filter((e) => {
        if (estado && normEstado(e.estado) !== estado) return false;
        if (!q) return true;
        const tipo = `${e.tipos?.nombre ?? e.tipoNombre ?? tiposMap[e.idtipoemergencia ?? e.idTipoEmergencia] ?? ""}`.toLowerCase();
        const ubic = `${e.ubicacion ?? e.direccionTexto ?? ""}`.toLowerCase();
        const desc = `${e.descripcion ?? ""}`.toLowerCase();
        const est = `${e.estado ?? ""}`.toLowerCase();
        const id = `${getId(e) ?? ""}`;
        return tipo.includes(q) || ubic.includes(q) || desc.includes(q) || est.includes(q) || id.includes(q);
      });
      setFiltered(out);
      setPage(0);
    }, 250),
    [tiposMap]
  );
  useEffect(() => { runFilter(search, estadoFilter, rows); }, [search, estadoFilter, rows, runFilter]);

  // === Eliminar ===
  const onDelete = async (e) => {
    const ok = await Swal.fire({
      title: "¿Eliminar emergencia?",
      text: e.descripcion || "",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await eliminarEmergencia(getId(e));
      await cargar();
      Swal.fire("Listo", "Registro eliminado", "success");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo eliminar";
      Swal.fire("Error", msg, "error");
    }
  };

  // === Finalizar ===
  const onFinalizar = async (e) => {
    const ok = await Swal.fire({
      title: "¿Finalizar emergencia?",
      text: `Esto marcará la fecha de fin y cambiará el estado a 'finalizada'. ${e.descripcion || ""}`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, finalizar",
      cancelButtonText: "Cancelar",
    });
    if (!ok.isConfirmed) return;
    try {
      await finalizarEmergencia(getId(e));
      await cargar();
      Swal.fire("Listo", "Emergencia finalizada correctamente", "success");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo finalizar";
      Swal.fire("Error", msg, "error");
    }
  };

  const pageItems = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // === Estados de modales ===
  const [openVeh, setOpenVeh] = useState(false);
  const [openPer, setOpenPer] = useState(false);
  const [openInv, setOpenInv] = useState(false);
  const [idModal, setIdModal] = useState(null);

  const openVehiculos = (id) => { setIdModal(id); setOpenVeh(true); };
  const openPersonal = (id) => { setIdModal(id); setOpenPer(true); };
  const openInventario = (id) => { setIdModal(id); setOpenInv(true); };

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography variant="h5">Emergencias</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<BarChart />} onClick={() => navigate("/emergencias/reportes")}>
            Reportes
          </Button>
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/emergencias/crear")}>
            Nueva
          </Button>
        </Stack>
      </Box>

      {/* === Filtros === */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ xs: "stretch", md: "center" }}>
          <TextField
            label="Buscar por ID, tipo, ubicación, descripción o estado"
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ej: 12, Atención Prehospitalaria, incendio, en curso..."
          />
          <TextField
            select
            label="Estado"
            value={estadoFilter}
            onChange={(e) => setEstadoFilter(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            <MenuItem value="">(Todos)</MenuItem>
            <MenuItem value="pendiente">Pendiente</MenuItem>
            <MenuItem value="en_curso">En curso</MenuItem>
            <MenuItem value="finalizada">Finalizada</MenuItem>
            <MenuItem value="completa">Completa</MenuItem>
          </TextField>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
            <Chip size="small" label={`Total: ${stats.total}`} />
            <Chip size="small" color="warning" label={`Pendiente: ${stats.pend}`} />
            <Chip size="small" color="info" label={`En curso: ${stats.curso}`} />
            <Chip size="small" color="success" label={`Finalizadas/Completas: ${stats.fin}`} />
          </Stack>
        </Stack>
      </Paper>

      {/* === Tabla === */}
      <Paper>
        <TableContainer sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell><Emergency fontSize="small" sx={{ mr: .5 }} /> Tipo</TableCell>
                <TableCell>Descripción</TableCell>
                <TableCell>Fecha/Hora</TableCell>
                <TableCell>Ubicación</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageItems.map((e) => {
                const id = getId(e);
                return (
                  <TableRow key={id} hover>
                    <TableCell>{e.tipoNombre ?? e.tipos?.nombre ?? tiposMap[e.idtipoemergencia ?? e.idTipoEmergencia] ?? "—"}</TableCell>
                    <TableCell>{e.descripcion || e.descripcionCatalogo || "—"}</TableCell>
                    <TableCell>{fechaFmt(e.fechahora)}</TableCell>
                    <TableCell>{e.ubicacion || e.direccionTexto || "—"}</TableCell>
                    <TableCell>
                      <Chip size="small" label={e.estado || "—"} color={estadoColor(e.estado)} />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Editar">
                        <IconButton onClick={() => navigate(`/emergencias/editar/${id}`)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Vehículos">
                        <IconButton onClick={() => openVehiculos(id)}>
                          <LocalShipping />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Personal">
                        <IconButton onClick={() => openPersonal(id)}>
                          <Person />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Inventario usado">
                        <IconButton onClick={() => openInventario(id)}>
                          <Inventory2 />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Choferes">
                        <IconButton onClick={() => navigate(`/emergencias/${id}/choferes`)}>
                          <DirectionsCar />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Kardex">
                        <IconButton onClick={() => navigate(`/emergencias/${id}/kardex`)}>
                          <Assignment />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Detalle">
                        <IconButton onClick={() => navigate(`/emergencias/detalle/${id}`)}>
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {normEstado(e.estado) !== "finalizada" && (
                        <Tooltip title="Finalizar">
                          <IconButton color="success" onClick={() => onFinalizar(e)}>
                            <CheckCircle />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Eliminar">
                        <IconButton color="error" onClick={() => onDelete(e)}>
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={6}>Sin resultados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>

      {/* === MODALES EMBEBIDOS === */}
      <EmergenciaVehiculosPage
        embedded
        open={openVeh}
        onClose={() => setOpenVeh(false)}
        idEmergencia={idModal}
      />
      <EmergenciaPersonalPage
        embedded
        open={openPer}
        onClose={() => setOpenPer(false)}
        idEmergencia={idModal}
      />
      <EmergenciaInventarioPage
        embedded
        open={openInv}
        onClose={() => setOpenInv(false)}
        idEmergencia={idModal}
      />
    </LayoutDashboard>
  );
}
