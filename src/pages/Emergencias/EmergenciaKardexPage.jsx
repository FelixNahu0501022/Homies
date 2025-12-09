// src/pages/Emergencias/EmergenciaKardexPage.jsx
// Timeline cronológico de recursos en emergencia
// KPIs resumen, filtros, timeline vertical

import {
    Typography, Paper, Box, Grid, Chip, Button,
    FormGroup, FormControlLabel, Checkbox,
    Card, CardContent, useMediaQuery
} from "@mui/material";
import {
    ArrowBack, People, LocalShipping, DirectionsCar,
    Inventory, ChangeCircle
} from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import {
    obtenerKardexEmergencia,
    obtenerResumenRecursos,
    obtenerEmergencia,
} from "../../services/emergencias.service";

const tipoIcons = {
    vehiculo: "🚗",
    personal: "👤",
    chofer: "🚙",
    material: "📦",
    estado: "🔄",
};

const accionColors = {
    asignar: "success",
    desasignar: "error",
    usar: "info",
    dar_baja: "warning",
    cambiar: "secondary",
};

export default function EmergenciaKardexPage() {
    const { id } = useParams();
    const idEmergencia = Number(id);
    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:900px)");

    const [emerg, setEmerg] = useState(null);
    const [kardex, setKardex] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [filtros, setFiltros] = useState({
        vehiculo: true,
        personal: true,
        chofer: true,
        material: true,
        estado: true,
    });

    const cargar = async () => {
        try {
            const [e, k, r] = await Promise.all([
                obtenerEmergencia(idEmergencia),
                obtenerKardexEmergencia(idEmergencia),
                obtenerResumenRecursos(idEmergencia),
            ]);
            setEmerg(e || null);
            setKardex(k || []);
            setResumen(r || {});
        } catch (err) {
            const msg = err?.response?.data?.mensaje || err?.message || "No se pudo cargar kardex";
            Swal.fire("Error", msg, "error");
            navigate("/emergencias");
        }
    };

    useEffect(() => {
        if (idEmergencia) cargar();
        // eslint-disable-next-line
    }, [idEmergencia]);

    const kardexFiltrado = kardex.filter((k) => filtros[k.tiporecurso]);

    const formatFecha = (fecha) => {
        if (!fecha) return "—";
        const d = new Date(fecha);
        return d.toLocaleString("es-BO", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <LayoutDashboard>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                    Kardex de Recursos — Emergencia #{idEmergencia}
                    {emerg?.estado && <Chip label={emerg.estado} size="small" sx={{ ml: 1 }} />}
                </Typography>
                <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate("/emergencias")}>
                    Volver
                </Button>
            </Box>

            {/* KPIs Resumen */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <People sx={{ fontSize: 40, color: "primary.main", mb: 1 }} />
                            <Typography variant="h4" fontWeight={700}>{resumen?.total_personal || 0}</Typography>
                            <Typography variant="body2" color="text.secondary">Personal</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <LocalShipping sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                            <Typography variant="h4" fontWeight={700}>{resumen?.total_vehiculos || 0}</Typography>
                            <Typography variant="body2" color="text.secondary">Vehículos</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <DirectionsCar sx={{ fontSize: 40, color: "info.main", mb: 1 }} />
                            <Typography variant="h4" fontWeight={700}>{resumen?.total_choferes || 0}</Typography>
                            <Typography variant="body2" color="text.secondary">Choferes</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                    <Card>
                        <CardContent sx={{ textAlign: "center" }}>
                            <Inventory sx={{ fontSize: 40, color: "warning.main", mb: 1 }} />
                            <Typography variant="h4" fontWeight={700}>{resumen?.materiales_usados || 0}</Typography>
                            <Typography variant="body2" color="text.secondary">Materiales</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtros */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} mb={1}>Filtrar por Tipo</Typography>
                <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={filtros.vehiculo} onChange={(e) => setFiltros({ ...filtros, vehiculo: e.target.checked })} />}
                        label="Vehículos"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={filtros.personal} onChange={(e) => setFiltros({ ...filtros, personal: e.target.checked })} />}
                        label="Personal"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={filtros.chofer} onChange={(e) => setFiltros({ ...filtros, chofer: e.target.checked })} />}
                        label="Choferes"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={filtros.material} onChange={(e) => setFiltros({ ...filtros, material: e.target.checked })} />}
                        label="Materiales"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={filtros.estado} onChange={(e) => setFiltros({ ...filtros, estado: e.target.checked })} />}
                        label="Estados"
                    />
                </FormGroup>
            </Paper>

            {/* Timeline */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} mb={3}>
                    Historial ({kardexFiltrado.length})
                </Typography>

                {kardexFiltrado.length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                        <Typography color="text.secondary">Sin registros</Typography>
                    </Box>
                ) : (
                    <Box>
                        {kardexFiltrado.map((item, idx) => (
                            <Box key={item.idhistorial || idx} sx={{ mb: 2, pb: 2, borderBottom: idx < kardexFiltrado.length - 1 ? "1px solid #eee" : "none" }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                    <Box display="flex" gap={1} alignItems="center">
                                        <span>{tipoIcons[item.tiporecurso]}</span>
                                        <Chip label={item.tiporecurso} size="small" color="primary" variant="outlined" />
                                        <Chip label={item.accion} size="small" color={accionColors[item.accion] || "default"} />
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {formatFecha(item.fechaaccion)}
                                    </Typography>
                                </Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                    {item.recurso_nombre || "—"}
                                </Typography>
                                {item.observaciones && (
                                    <Typography variant="body2" color="text.secondary">
                                        {item.observaciones}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>
                )}
            </Paper>
        </LayoutDashboard>
    );
}
