// src/pages/Donativos/DonativosDashboard.jsx
import { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Grid, CircularProgress
} from '@mui/material';
import {
    TrendingUp, People, HourglassEmpty
} from '@mui/icons-material';
import {
    PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import Swal from 'sweetalert2';
import {
    reporteDonativosPorTipoV2,
    reporteDonativosPorMesV2,
    resumenDonativosV2,
    listarDonantes
} from '../../services/donativos.service';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export default function DonativosDashboard() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        totalDonativos: 0,
        donantesActivos: 0
    });
    const [distribucionTipo, setDistribucionTipo] = useState([]);
    const [tendenciaMensual, setTendenciaMensual] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [resumen, porTipo, porMes, donantes] = await Promise.all([
                resumenDonativosV2().catch(() => ({})),
                reporteDonativosPorTipoV2().catch(() => []),
                reporteDonativosPorMesV2().catch(() => []),
                listarDonantes({ activo: true, limit: 100 }).catch(() => ({ data: [] }))
            ]);

            console.log('DEBUG - Dashboard Donativos:');
            console.log('Resumen:', resumen);
            console.log('Por Tipo:', porTipo);
            console.log('Por Mes:', porMes);
            console.log('Donantes:', donantes);

            // KPIs desde resumen - parsear strings a números
            setKpis({
                totalDonativos: parseInt(resumen.total_donativos || resumen.total || 0),
                donantesActivos: (donantes.data || donantes || []).length
            });

            // Distribución por tipo
            if (porTipo && porTipo.length > 0) {
                const tipoData = (porTipo || []).map(t => ({
                    name: t.tipo || t.nombre || "Otro",
                    value: parseInt(t.total_donativos || t.total || t.cantidad || 0)
                })).filter(t => t.value > 0);
                setDistribucionTipo(tipoData);
            }

            // Tendencia mensual - últimos 6 meses
            // Backend devuelve { anio: 2025, mes: 12 } como números
            if (porMes && porMes.length > 0) {
                const mensualData = (porMes || [])
                    .slice(-6)
                    .map(m => {
                        const anio = m.anio || new Date().getFullYear();
                        const mes = String(m.mes || 1).padStart(2, '0');
                        return {
                            mes: `${anio}-${mes}`,
                            total: parseInt(m.total_donativos || m.total || m.cantidad || 0)
                        };
                    });
                setTendenciaMensual(mensualData);
            }

        } catch (error) {
            console.error("Error cargando dashboard:", error);
            Swal.fire("Error", "Error al cargar datos del dashboard", "error");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {/* KPIs */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TrendingUp sx={{ fontSize: 48, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Total Donativos</Typography>
                            <Typography variant="h5" fontWeight={700}>{kpis.totalDonativos}</Typography>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                    <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <People sx={{ fontSize: 48, color: 'info.main' }} />
                        <Box>
                            <Typography variant="body2" color="text.secondary">Donantes Activos</Typography>
                            <Typography variant="h5" fontWeight={700}>{kpis.donantesActivos}</Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/*  Gráficos */}
            <Grid container spacing={2}>
                {/* Distribución por Tipo */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                            Distribución por Tipo
                        </Typography>
                        {distribucionTipo.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={distribucionTipo}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {distribucionTipo.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                                <Typography color="text.secondary">Sin datos disponibles</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Tendencia Mensual */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6" fontWeight={600} mb={2}>
                            Tendencia Mensual (Últimos 6 meses)
                        </Typography>
                        {tendenciaMensual.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={tendenciaMensual}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="total" stroke="#8884d8" name="Total Donativos" />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={300}>
                                <Typography color="text.secondary">Sin datos disponibles</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
