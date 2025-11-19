// src/pages/Inventario/InventarioAsignacionesPage.jsx
import {
  Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Tooltip, Button, Box, TextField, Chip, TablePagination, CircularProgress
} from "@mui/material";
import { ArrowBack, LocalShipping, Delete, Add } from "@mui/icons-material";
import Autocomplete from "@mui/material/Autocomplete";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarVehiculosAsignados,
  asignarItemAVehiculo,
  quitarItemDeVehiculo,
  obtenerItem,
} from "../../services/inventario.service";
import { listarVehiculos } from "../../services/vehiculos.service";

export default function InventarioAsignacionesPage() {
  const { id } = useParams();
  const idItem = Number(id);
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [rows, setRows] = useState([]);
  const [allVehiculos, setAllVehiculos] = useState([]);

  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [vehSel, setVehSel] = useState(null);
  const [cantidad, setCantidad] = useState("");
  const [saving, setSaving] = useState(false);

  const cargar = async () => {
    try {
      const [it, asignaciones, vehiculos] = await Promise.all([
        obtenerItem(idItem),
        listarVehiculosAsignados(idItem),
        listarVehiculos(),
      ]);
      setItem(it || null);
      setRows(asignaciones || []);
      setFiltered(asignaciones || []);
      setAllVehiculos(vehiculos || []);
      setPage(0);
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
      navigate("/inventario");
    }
  };
  useEffect(() => { cargar(); }, [idItem]); // eslint-disable-line

  // === FILTRO ===
  const applyFilter = useMemo(() => debounce((value, source) => {
    const v = (value || "").toLowerCase().trim();
    if (!v) { setFiltered(source); setPage(0); return; }
    setFiltered(
      source.filter(r =>
        `${r.placa ?? ""}`.toLowerCase().includes(v) ||
        `${r.marca ?? ""}`.toLowerCase().includes(v) ||
        `${r.modelo ?? ""}`.toLowerCase().includes(v)
      )
    );
    setPage(0);
  }, 300), []);
  useEffect(() => { applyFilter(search, rows); }, [search, rows, applyFilter]);

  const labelVehiculo = (veh) =>
    veh ? `${veh.placa || "SIN-PLACA"} — ${veh.marca || ""} ${veh.modelo || ""}`.trim() : "";

  // === ASIGNAR ===
  const onAsignar = async () => {
    const idVehiculo = vehSel?.idvehiculo;
    const cant = Number(cantidad);
    const stockDisponible = Number(item?.cantidad ?? 0);

    if (!idVehiculo) return Swal.fire("Valida", "Selecciona un vehículo", "info");
    if (!cant || cant <= 0) return Swal.fire("Valida", "Ingresa una cantidad válida", "info");

    if (cant > stockDisponible) {
      return Swal.fire("Stock insuficiente", `Solo hay ${stockDisponible} unidades disponibles`, "warning");
    }

    try {
      setSaving(true);
      await asignarItemAVehiculo(idItem, { idVehiculo, cantidad: cant });
      setVehSel(null);
      setCantidad("");
      await cargar();
      Swal.fire("Éxito", "Ítem asignado correctamente", "success");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // === QUITAR ===
  const onQuitar = async (row) => {
    const confirm = await Swal.fire({
      title: `¿Quitar del vehículo ${row.placa}?`,
      text: `Cantidad asignada: ${row.cantidad}`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Quitar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;
    try {
      setSaving(true);
      await quitarItemDeVehiculo(idItem, row.idvehiculo);
      await cargar();
      Swal.fire("Listo", "Ítem quitado del vehículo", "success");
    } catch (err) {
      Swal.fire("Error", err?.response?.data?.mensaje || err?.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const pageItems = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // === UI ===
  if (!item) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 240 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate(-1)}>Volver</Button>
          <Typography variant="h5">
            Asignaciones — <b>{item.nombre}</b> (Stock: {item.cantidad ?? 0})
          </Typography>
        </Box>
      </Box>

      {/* === Formulario de asignación === */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>Asignar este ítem a un vehículo</Typography>
        <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "2fr 1fr auto" }} gap={2}>
          <Autocomplete
            options={allVehiculos}
            getOptionLabel={labelVehiculo}
            value={vehSel}
            onChange={(_, val) => setVehSel(val)}
            renderInput={(params) => <TextField {...params} label="Vehículo" placeholder="Buscar por placa o marca" />}
          />
          <TextField
            label="Cantidad"
            type="number"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            inputProps={{ min: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onAsignar}
            disabled={saving}
          >
            {saving ? "Asignando..." : "Asignar"}
          </Button>
        </Box>
      </Paper>

      {/* === Buscador y tabla === */}
      <TextField
        label="Buscar por placa, marca o modelo"
        fullWidth
        margin="normal"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Paper sx={{ mt: 1 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vehículo</TableCell>
              <TableCell>Marca / Modelo</TableCell>
              <TableCell align="center">Cantidad</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pageItems.map((r) => (
              <TableRow key={r.idvehiculo} hover>
                <TableCell>
                  <Chip
                    icon={<LocalShipping fontSize="small" />}
                    label={r.placa || "SIN-PLACA"}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </TableCell>
                <TableCell>{`${r.marca || ""} ${r.modelo || ""}`.trim() || "—"}</TableCell>
                <TableCell align="center">
                  <Chip color="success" label={r.cantidad ?? 0} />
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Quitar asignación">
                    <IconButton color="error" onClick={() => onQuitar(r)} disabled={saving}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Sin resultados</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 20, 50]}
        />
      </Paper>
    </LayoutDashboard>
  );
}
