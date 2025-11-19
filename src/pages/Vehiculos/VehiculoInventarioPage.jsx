// src/pages/vehiculos/VehiculoInventarioPage.jsx
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
} from "@mui/material";
import { Refresh } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
  obtenerVehiculo,
  verInventarioAsignado,
} from "../../services/vehiculos.service";

// 🔧 Colores por estado
const estadoColor = (estado) => {
  if (estado === "Operativo") return "success";
  if (estado === "Fuera de servicio") return "warning";
  if (estado === "En emergencia") return "error";
  return "default";
};

export default function VehiculoInventarioPage() {
  const { id } = useParams();
  const idVehiculo = useMemo(() => Number(id), [id]);
  const navigate = useNavigate();

  const [vehiculo, setVehiculo] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const cargar = async () => {
    try {
      setLoading(true);
      if (!id || Number.isNaN(idVehiculo)) {
        Swal.fire("Aviso", "ID inválido", "warning");
        return navigate("/vehiculos");
      }

      const [v, inv] = await Promise.all([
        obtenerVehiculo(idVehiculo),
        verInventarioAsignado(idVehiculo),
      ]);

      if (!v) {
        Swal.fire("Aviso", "Vehículo no encontrado", "warning");
        return navigate("/vehiculos");
      }

      setVehiculo(v);
      setRows(inv || []);
    } catch (err) {
      const msg =
        err?.response?.data?.mensaje ||
        err?.response?.data?.error ||
        err?.message ||
        "No se pudo cargar el inventario";
      setSnack({ open: true, message: msg, severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargar(); }, []); // eslint-disable-line

  if (loading) {
    return (
      <LayoutDashboard>
        <Box sx={{ display: "grid", placeItems: "center", minHeight: 280 }}>
          <CircularProgress />
        </Box>
      </LayoutDashboard>
    );
  }

  return (
    <LayoutDashboard>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={1}
      >
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Inventario — {vehiculo?.placa}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Ítems asignados actualmente a este vehículo
          </Typography>
        </Box>

        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={cargar}
            disabled={loading}
          >
            Actualizar
          </Button>
          <Button variant="contained" onClick={() => navigate("/vehiculos")}>
            Volver
          </Button>
        </Box>
      </Box>

      {/* Estado del vehículo */}
      <Box mt={1} mb={2}>
        <Chip
          label={vehiculo?.estado || "—"}
          color={estadoColor(vehiculo?.estado)}
          sx={{ fontWeight: 500 }}
        />
      </Box>

      {/* Inventario */}
      {loading ? (
        <Box sx={{ display: "grid", placeItems: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
          No hay ítems asignados al vehículo
        </Box>
      ) : (
        <Paper sx={{ mt: 2, borderRadius: 3, overflow: "hidden" }} elevation={3}>
          <Table>
            <TableHead sx={{ backgroundColor: "action.hover" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>ID Ítem</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Descripción</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Cantidad</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((it, idx) => (
                <TableRow
                  key={`${it.iditem || it.idItem || idx}`}
                  hover
                  sx={{
                    "&:last-child td, &:last-child th": { border: 0 },
                  }}
                >
                  <TableCell>{it.iditem ?? it.idItem ?? "—"}</TableCell>
                  <TableCell>{it.nombre || "—"}</TableCell>
                  <TableCell>{it.descripcion || "—"}</TableCell>
                  <TableCell>{it.cantidad ?? it.cant ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snack.severity} variant="filled" sx={{ width: "100%" }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </LayoutDashboard>
  );
}
