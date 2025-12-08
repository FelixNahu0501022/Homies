// src/pages/Usuarios/ReporteUsuariosDashboard.jsx
import { useState, useEffect } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, CircularProgress, Paper, Chip
} from '@mui/material';
import {
    People, CheckCircle, Cancel, Security, TrendingUp
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { repResumenUsuarios, repUsuariosPorRol } from '../../services/usuarios.service';
import Swal from 'sweetalert2';

const COLORS = ['#0D47A1', '#D32F2F', '#2E7D32', '#ED6C02', '#9C27B0'];

// Componente de tarjeta KPI
function KPICard({ title, value, icon: Icon, color, subtitle }) {
    return (
        <Card elevation={2} sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h3" fontWeight={700} color={color}>
                            {value}
                        </Typography>
                        {subtitle && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}15`,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Icon sx={{ fontSize: 32, color }} />
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

export default function ReporteUsuariosDashboard() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState(null);
    const [ranking, setRanking] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [resumenData, rankingData] = await Promise.all([
                repResumenUsuarios(),
                repUsuariosPorRol()
            ]);
            setKpis(resumenData);
            setRanking(rankingData || []);
        } catch (error) {
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

    if (!kpis) {
        return (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="text.secondary">No se pudo cargar la información</Typography>
            </Paper>
        );
    }

    // Datos para gráfico de pastel (Distribución por estado)
    const pieData = [
        { name: 'Activos', value: parseInt(kpis.activos || 0), color: '#2E7D32' },
        { name: 'Inactivos', value: parseInt(kpis.inactivos || 0), color: '#D32F2F' },
    ];

    // Top 5 roles para gráfico de barras
    const top5Roles = ranking.slice(0, 5).map(r => ({
        rol: r.rol_nombre || r.nombre,
        usuarios: parseInt(r.total_usuarios || 0)
    }));

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                Panel de Control de Usuarios
            </Typography>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Total de Usuarios"
                        value={kpis.total_usuarios || 0}
                        icon={People}
                        color="#0D47A1"
                        subtitle="Registrados en el sistema"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Usuarios Activos"
                        value={kpis.activos || 0}
                        icon={CheckCircle}
                        color="#2E7D32"
                        subtitle={`${Math.round((kpis.activos / kpis.total_usuarios) * 100) || 0}% del total`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Usuarios Inactivos"
                        value={kpis.inactivos || 0}
                        icon={Cancel}
                        color="#D32F2F"
                        subtitle={`${Math.round((kpis.inactivos / kpis.total_usuarios) * 100) || 0}% del total`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Con Roles Asignados"
                        value={kpis.usuarios_con_roles || 0}
                        icon={Security}
                        color="#ED6C02"
                        subtitle={`${kpis.usuarios_sin_roles || 0} sin rol`}
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
                {/* Gráfico de Pastel - Distribución por Estado */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Distribución por Estado
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Gráfico de Barras - Top 5 Roles */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Top 5 Roles Más Asignados
                        </Typography>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={top5Roles}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="rol" angle={-15} textAnchor="end" height={80} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="usuarios" fill="#0D47A1" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* Resumen de Roles */}
            <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Resumen de Roles
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    {ranking.map((rol, idx) => (
                        <Chip
                            key={idx}
                            label={`${rol.rol_nombre || rol.nombre}: ${rol.total_usuarios}`}
                            color={idx < 3 ? 'primary' : 'default'}
                            variant={idx < 3 ? 'filled' : 'outlined'}
                        />
                    ))}
                    {ranking.length === 0 && (
                        <Typography variant="body2" color="text.secondary">
                            No hay roles registrados
                        </Typography>
                    )}
                </Box>
                <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        <strong>{kpis.roles_distintos || 0}</strong> roles distintos en el sistema
                    </Typography>
                </Box>
            </Paper>
        </Box>
    );
}
