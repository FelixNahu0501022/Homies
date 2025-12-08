// src/pages/Donativos/DonativosReportesPage.jsx - SIMPLIFIED
import {
  Typography, Paper, Box, Button, Grid, CircularProgress, IconButton, Tooltip
} from "@mui/material";
import { useState } from "react";
import { ArrowBack, PictureAsPdf, Refresh } from "@mui/icons-material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../../services/axios";
import { exportTablePdf } from "../../utils/pdfExport";
import { SelectorTipoReporte, TablaReporte } from "../../components/reportes";

const TIPOS_REPORTE = [
  { value: "listado_completo", label: "Donativos - Listado Completo" },
];

export default function DonativosReportesPage() {
  const navigate = useNavigate();
  const [tipoReporte, setTipoReporte] = useState("");
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState([]);

  const generarReporte = async () => {
    if (!tipoReporte) {
      Swal.fire("Aviso", "Selecciona un tipo de reporte", "info");
      return;
    }

    setLoading(true);
    try {
      const response = await api.get("/donativos");
      const donativos = response.data?.data || response.data || [];

      const resultado = donativos.map(d => ({
        ID: d.iddonativo,
        Fecha: d.fecha || "—",
        Tipo: d.tipo || "—",
        Monto: d.monto ? `Bs ${d.monto}` : "—",
        Descripción: d.descripcion || "—",
        Donante: d.donante_nombre || "—",
      }));

      setDatos(resultado);
    } catch (e) {
      Swal.fire("Error", e?.response?.data?.mensaje || e?.message || "Error al generar reporte", "error");
    } finally {
      setLoading(false);
    }
  };

  const exportarPDF = () => {
    if (!datos || datos.length === 0) {
      Swal.fire("Aviso", "No hay datos para exportar", "info");
      return;
    }
    const columns = Object.keys(datos[0]).map(k => ({ header: k, dataKey: k }));
    const reporteSeleccionado = TIPOS_REPORTE.find(r => r.value === tipoReporte);
    exportTablePdf({ title: `Reporte: ${reporteSeleccionado?.label || tipoReporte}`, columns, rows: datos, filename: `donativos_${tipoReporte}.pdf` });
  };

  return (
    <LayoutDashboard>
      <Box display="flex" justifyContent="center" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Reportes de Donativos</Typography>
          <Typography variant="body2" color="text.secondary">Genera reportes con filtros personalizados</Typography>
        </Box>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/donativos")}>Volver</Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <SelectorTipoReporte value={tipoReporte} onChange={(e) => setTipoReporte(e.target.value)} opciones={TIPOS_REPORTE} />
          </Grid>
        </Grid>

        <Box mt={2} display="flex" gap={1}>
          <Button variant="contained" onClick={generarReporte} disabled={!tipoReporte || loading} startIcon={loading ? <CircularProgress size={20} /> : <Refresh />}>
            {loading ? "Generando..." : "Generar Reporte"}
          </Button>
        </Box>
      </Paper>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
      ) : datos.length > 0 ? (
        <>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">{TIPOS_REPORTE.find(r => r.value === tipoReporte)?.label || "Resultados"}</Typography>
              <Tooltip title="Exportar a PDF">
                <IconButton onClick={exportarPDF} color="primary"><PictureAsPdf /></IconButton>
              </Tooltip>
            </Box>
            <TablaReporte datos={datos} />
          </Paper>
          <Typography variant="body2" color="text.secondary" align="center">Total de registros: {datos.length}</Typography>
        </>
      ) : tipoReporte ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="body1" color="text.secondary">Haz clic en "Generar Reporte" para ver los resultados</Typography>
        </Paper>
      ) : null}
    </LayoutDashboard>
  );
}
