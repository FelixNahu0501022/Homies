// src/pages/emergencias/EmergenciaVehiculosPage.jsx
// ✅ Modo dual: página completa o modal embebido
// ✅ Misma línea visual que Inventario y Personal
// ✅ 100% funcional, sin tocar lógica, rutas ni servicios

import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Tooltip,
  Button,
  Box,
  TextField,
  Chip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import { ArrowBack, LocalShipping, Delete, Add, Close } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import debounce from "lodash.debounce";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  listarVehiculosDeEmergencia,
  listarVehiculosDisponibles,
  asignarVehiculos,
  quitarVehiculo,
  obtenerEmergencia,
} from "../../services/emergencias.service";

const estadoColor = (estado) => {
  if (estado === "Operativo") return "success";
  if (estado === "Fuera de servicio") return "warning";
  if (estado === "En emergencia") return "error";
  return "default";
};

export default function EmergenciaVehiculosPage(props) {
  const { embedded = false, open = false, onClose, idEmergencia: idEmergProp } = props || {};
  const params = useParams();
  const idEmergencia = idEmergProp != null ? Number(idEmergProp) : Number(params.id);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:900px)");

  const [emerg, setEmerg] = useState(null);
  const [asignados, setAsignados] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [vSel, setVSel] = useState(null);

  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // ====== Cargar datos ======
  const cargar = async () => {
    try {
      const [e, a, c] = await Promise.all([
        obtenerEmergencia(idEmergencia),
        listarVehiculosDeEmergencia(idEmergencia),
        listarVehiculosDisponibles(idEmergencia),
      ]);
      setEmerg(e || null);
      setAsignados(a || []);
      setFiltered(a || []);
      setCatalogo(c || []);
      setPage(0);
    } catch {
      Swal.fire("Error", "No se pudo cargar vehículos", "error");
      if (!embedded) navigate("/emergencias");
    }
  };
  useEffect(() => {
    if (idEmergencia) cargar();
    // eslint-disable-next-line
  }, [idEmergencia]);

  // ====== Filtro ======
  const applyFilter = useMemo(
    () =>
      debounce((value, src) => {
        const v = (value || "").toLowerCase().trim();
        if (!v) return setFiltered(src);
        setFiltered(
          src.filter(
            (x) =>
              `${x.placa ?? ""}`.toLowerCase().includes(v) ||
              `${x.marca ?? ""} ${x.modelo ?? ""}`.toLowerCase().includes(v)
          )
        );
        setPage(0);
      }, 250),
    []
  );
  useEffect(() => {
    applyFilter(search, asignados);
  }, [search, asignados, applyFilter]);

  // ====== Acciones ======
  const addVehiculo = async () => {
    if (!vSel) return Swal.fire("Valida", "Selecciona un vehículo", "info");
    try {
      await asignarVehiculos(idEmergencia, [vSel.idvehiculo]);
      setVSel(null);
      await cargar();
      Swal.fire("Listo", "Vehículo asignado", "success");
    } catch (err) {
      const msg = err?.response?.data?.mensaje || err?.message || "No se pudo asignar";
      Swal.fire("Error", msg, "error");
    }
  };

  const removeVehiculo = async (row) => {
    const ok = await Swal.fire({
      title: `¿Quitar ${row.placa}?`,
      icon: "warning",
      showCancelButton: true,
    });
    if (!ok.isConfirmed) return;
    try {
      await quitarVehiculo(idEmergencia, row.idvehiculo);
      await cargar();
      Swal.fire("Listo", "Vehículo quitado", "success");
    } catch {
      Swal.fire("Error", "No se pudo quitar", "error");
    }
  };

  // ====== Contenido principal ======
  const Content = (
    <>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          mb: 2,
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Vehículos — Emergencia #{idEmergencia}
          {emerg?.estado && (
            <Chip label={emerg.estado} size="small" sx={{ ml: 1 }} />
          )}
        </Typography>

        {!embedded ? (
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={() => navigate("/emergencias")}
          >
            Volver
          </Button>
        ) : (
          <Button variant="outlined" startIcon={<Close />} onClick={onClose}>
            Cerrar
          </Button>
        )}
      </Box>

      {/* Selector + Asignar */}
      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2, borderRadius: 3 }}>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Autocomplete
            options={catalogo || []}
            getOptionLabel={(v) =>
              `${v.placa ?? ""} — ${v.marca ?? ""} ${v.modelo ?? ""}`
            }
            value={vSel}
            onChange={(_, val) => setVSel(val)}
            renderInput={(params) => (
              <TextField {...params} label="Seleccionar vehículo disponible" />
            )}
            sx={{ minWidth: 300, flex: 1 }}
          />
          <Button variant="contained" startIcon={<Add />} onClick={addVehiculo}>
            Asignar
          </Button>
        </Box>
        <Typography
          variant="caption"
          sx={{ display: "block", color: "text.secondary", mt: 0.5 }}
        >
          Solo se listan <strong>vehículos Operativos</strong> que no estén en
          otra emergencia activa.
        </Typography>
      </Paper>

      {/* Tabla */}
      <Paper sx={{ borderRadius: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          p={2}
          pb={0}
        >
          <TextField
            label="Buscar por placa o modelo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="small"
            sx={{ maxWidth: 360 }}
          />
        </Box>

        <Table size={isMobile ? "small" : "medium"}>
          <TableHead>
            <TableRow>
              <TableCell>
                <LocalShipping fontSize="small" sx={{ mr: 0.5 }} /> Placa
              </TableCell>
              <TableCell>Marca / Modelo</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((v) => (
                <TableRow key={v.idvehiculo} hover>
                  <TableCell>{v.placa}</TableCell>
                  <TableCell>
                    {v.marca} {v.modelo}
                  </TableCell>
                  <TableCell>{v.tipo || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={v.estado}
                      color={estadoColor(v.estado)}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Quitar">
                      <IconButton color="error" onClick={() => removeVehiculo(v)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Sin vehículos asignados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

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
          rowsPerPageOptions={[5, 10, 20]}
        />
      </Paper>
    </>
  );

  // ====== Render condicional ======
  if (embedded) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3 } }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <LocalShipping fontSize="small" />
            <Typography variant="h6">
              Vehículos — Emergencia #{idEmergencia}
            </Typography>
          </Box>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 1, sm: 2 } }}>
          {Content}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" startIcon={<Close />}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  // Página completa
  return <LayoutDashboard>{Content}</LayoutDashboard>;
}
