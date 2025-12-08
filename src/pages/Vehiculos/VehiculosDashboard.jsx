// src/pages/Vehiculos/VehiculosDashboard.jsx
import { useState, useEffect } from 'react';
import {
    Box, Grid, Card, CardContent, Typography, CircularProgress, Paper, Chip
} from '@mui/material';
import {
    DirectionsCar, CheckCircle, Warning, Build
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Swal from 'sweetalert2';
import { listarVehiculos, rptDistribucionEstado } from '../../services/vehiculos.service';
import api from '../../services/axios';

const COLORS = ['#0D47A1', '#1565C0', '#1976D2', '#1E88E5', '#2196F3', '#42A5F5', '#64B5F6', '#90CAF9'];

export default function VehiculosDashboard() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({
        total: 0,
        operativos: 0,
        enEmergencia: 0,
        fueraServicio: 0
    });
    const [distEstado, setDistEstado] = useState([]);
    const [distTipo, setDistTipo] = useState([]);

    useEffect(() => {
        cargarDashboard();
    }, []);

    const cargarDashboard = async () => {
        try {
            setLoading(true);

            // Obtener listado completo de vehículos para KPIs
            const vehiculos = await listarVehiculos();
            const total = vehiculos?.length || 0;

            // Calcular KPIs basados en estado
            const operativos = vehiculos?.filter(v =>
                v.estado === 'Operativo' || v.estado === 'operativo'
            ).length || 0;

            const enEmergencia = vehiculos?.filter(v =>
                v.estado === 'En emergencia' || v.estado === 'en emergencia'
            ).length || 0;

            const fueraServicio = vehiculos?.filter(v =>
                v.estado === 'Fuera de servicio' || v.estado === 'fuera de servicio'
            ).length || 0;

            setKpis({ total, operativos, enEmergencia, fueraServicio });

            // Obtener distribución por estado
            const estadoData = await rptDistribucionEstado();
            setDistEstado(estadoData || []);

            // Obtener distribución por tipo (agregando manualmente del listado)
            const tipoConteo = {};
            vehiculos?.forEach(v => {
                const tipo = v.tipo || 'Sin tipo';
                tipoConteo[tipo] = (tipoConteo[tipo] || 0) + 1;
            });

            const tipoData = Object.entries(tipoConteo).map(([tipo, total]) => ({
                tipo,
                total
            }));
            setDistTipo(tipoData);

        } catch (error) {
            console.error('Error al cargar dashboard:', error);
            Swal.fire('Error', error?.message || 'No se pudo cargar el dashboard', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    // Preparar datos para PieChart de estados
    const pieDataEstados = distEstado.map((item, index) => ({
        name: item.estado || 'Sin estado',
        value: parseInt(item.total || 0),
        color: COLORS[index % COLORS.length]
    })).filter(item => item.value > 0);

    // Preparar datos para BarChart de tipos
    const barDataTipos = distTipo.slice(0, 8).map(item => ({
        tipo: item.tipo || 'Sin tipo',
        cantidad: parseInt(item.total || 0)
    })).filter(item => item.cantidad > 0);

    return (
        <Box>
            {/* KPI Cards */}
            <Grid container spacing={3} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Total de Vehículos
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700}>
                                        {kpis.total}
                                    </Typography>
                                </Box>
                                <DirectionsCar sx={{ fontSize: 48, color: '#0D47A1', opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Operativos
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="success.main">
                                        {kpis.operativos}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {kpis.total > 0 ? `${((kpis.operativos / kpis.total) * 100).toFixed(0)}%` : '0%'} del total
                                    </Typography>
                                </Box>
                                <CheckCircle sx={{ fontSize: 48, color: 'success.main', opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        En Emergencia
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="warning.main">
                                        {kpis.enEmergencia}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {kpis.total > 0 ? `${((kpis.enEmergencia / kpis.total) * 100).toFixed(0)}%` : '0%'} del total
                                    </Typography>
                                </Box>
                                <Warning sx={{ fontSize: 48, color: 'warning.main', opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={2}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" color="text.secondary">
                                        Fuera de Servicio
                                    </Typography>
                                    <Typography variant="h4" fontWeight={700} color="error.main">
                                        {kpis.fueraServicio}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {kpis.total > 0 ? `${((kpis.fueraServicio / kpis.total) * 100).toFixed(0)}%` : '0%'} del total
                                    </Typography>
                                </Box>
                                <Build sx={{ fontSize: 48, color: 'error.main', opacity: 0.8 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
                {/* Gráfico de Pastel - Distribución por Estado */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Distribución por Estado
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Vehículos agrupados por estado operativo
                        </Typography>
                        {pieDataEstados.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <PieChart>
                                    <Pie
                                        data={pieDataEstados}
                                        cx="50%"
                                        cy="45%"
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieDataEstados.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value} vehículos`, name]}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={60}
                                        wrapperStyle={{ fontSize: '13px', paddingTop: '10px' }}
                                        formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">No hay datos de estados</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Gráfico de Barras - Distribución por Tipo */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Distribución por Tipo
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Vehículos agrupados por tipo
                        </Typography>
                        {barDataTipos.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={barDataTipos}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="tipo"
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                        interval={0}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value} vehículos`, 'Total']}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                                    />
                                    <Bar dataKey="cantidad" fill="#0D47A1" radius={[8, 8, 0, 0]}>
                                        {barDataTipos.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">No hay datos de tipos</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Resumen de Estados */}
            {pieDataEstados.length > 0 && (
                <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Resumen por Estado
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                        {pieDataEstados.map((item, index) => (
                            <Chip
                                key={index}
                                label={`${item.name}: ${item.value}`}
                                sx={{
                                    backgroundColor: item.color,
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '0.875rem'
                                }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
}
