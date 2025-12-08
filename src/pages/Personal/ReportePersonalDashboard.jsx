// src/pages/Personal/ReportePersonalDashboard.jsx
import { useState, useEffect } from 'react';
import {
    Grid, Card, CardContent, Typography, Box, CircularProgress, Paper, Chip
} from '@mui/material';
import {
    People, CheckCircle, Groups, WorkspacePremium
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { rptDistribucionClase, rptDistribucionGrado } from '../../services/personal.service';
import Swal from 'sweetalert2';
import api from '../../services/axios';

const COLORS = ['#0D47A1', '#D32F2F', '#2E7D32', '#ED6C02', '#9C27B0', '#00897B', '#6A1B9A', '#F57C00'];

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

export default function ReportePersonalDashboard() {
    const [loading, setLoading] = useState(true);
    const [kpis, setKpis] = useState({ total: 0, activos: 0, clases: 0, grados: 0 });
    const [distClase, setDistClase] = useState([]);
    const [distGrado, setDistGrado] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [personalData, claseData, gradoData] = await Promise.all([
                api.get('/personal?limit=10000'),
                rptDistribucionClase(),
                rptDistribucionGrado()
            ]);

            // Calcular KPIs
            const personal = personalData.data?.data || personalData.data || [];
            const activos = personal.filter(p => p.activo === true || p.activo === 1 || p.activo === 'true').length;
            const clasesUnicas = new Set(personal.map(p => p.idclase).filter(Boolean)).size;
            const gradosUnicos = new Set(personal.map(p => p.idgrado).filter(Boolean)).size;

            setKpis({
                total: personal.length,
                activos: activos,
                clases: clasesUnicas,
                grados: gradosUnicos
            });

            // Preparar datos para gráficos
            console.log('DEBUG - Datos de clases:', claseData);
            console.log('DEBUG - Datos de grados:', gradoData);
            setDistClase(claseData || []);
            setDistGrado(gradoData || []);

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

    // Preparar datos para PieChart de clases
    const pieDataClases = distClase.map((item, index) => {
        console.log('DEBUG - Item clase:', item);
        return {
            name: item.clase_etiqueta || item.clase_nombre || item.nombre || 'Sin clase',
            value: parseInt(item.total || item.cantidad || 0),
            color: COLORS[index % COLORS.length]
        };
    }).filter(item => item.value > 0);

    console.log('DEBUG - pieDataClases procesado:', pieDataClases);

    // Preparar datos para BarChart de grados
    const barDataGrados = distGrado.slice(0, 8).map(item => {
        console.log('DEBUG - Item grado:', item);
        return {
            grado: item.grado_nombre || item.nombre || item.grado || 'Sin grado',
            cantidad: parseInt(item.total || item.cantidad || 0)
        };
    }).filter(item => item.cantidad > 0);

    return (
        <Box>
            <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>
                Panel de Control de Personal
            </Typography>

            {/* KPI Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Total de Personal"
                        value={kpis.total}
                        icon={People}
                        color="#0D47A1"
                        subtitle="Registrados en el sistema"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Personal Activo"
                        value={kpis.activos}
                        icon={CheckCircle}
                        color="#2E7D32"
                        subtitle={`${Math.round((kpis.activos / kpis.total) * 100) || 0}% del total`}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Clases Representadas"
                        value={kpis.clases}
                        icon={Groups}
                        color="#ED6C02"
                        subtitle="Diferentes clases bomberiles"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Grados Representados"
                        value={kpis.grados}
                        icon={WorkspacePremium}
                        color="#9C27B0"
                        subtitle="Jerarquías distintas"
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={3}>
                {/* Gráfico de Pastel - Distribución por Clase */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Distribución por Clase
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Personal agrupado por clase de ingreso
                        </Typography>
                        {pieDataClases.length > 0 ? (
                            <ResponsiveContainer width="100%" height={420}>
                                <PieChart>
                                    <Pie
                                        data={pieDataClases}
                                        cx="50%"
                                        cy="43%"
                                        labelLine={false}
                                        label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                                        outerRadius={105}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieDataClases.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value} personas`, name]}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={70}
                                        wrapperStyle={{ fontSize: '13px', paddingTop: '15px' }}
                                        formatter={(value, entry) => `${value}: ${entry.payload.value}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={420}>
                                <Typography color="text.secondary">No hay datos de clases</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Gráfico de Barras - Distribución por Grado */}
                <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Distribución por Grado
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Personal agrupado por grado jerárquico
                        </Typography>
                        {barDataGrados.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart
                                    data={barDataGrados}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 90 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="grado"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        interval={0}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <YAxis
                                        label={{ value: 'Cantidad', angle: -90, position: 'insideLeft' }}
                                    />
                                    <Tooltip
                                        formatter={(value) => [`${value} personas`, 'Total']}
                                        contentStyle={{ borderRadius: 8, border: '1px solid #ddd' }}
                                    />
                                    <Bar dataKey="cantidad" fill="#0D47A1" radius={[8, 8, 0, 0]}>
                                        {barDataGrados.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">No hay datos de grados</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Resumen de Clases */}
            {pieDataClases.length > 0 && (
                <Paper elevation={2} sx={{ p: 3, mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Resumen de Clases
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                        {pieDataClases.map((clase, idx) => (
                            <Chip
                                key={idx}
                                label={`${clase.name}: ${clase.value}`}
                                sx={{ backgroundColor: clase.color, color: 'white' }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}
        </Box>
    );
}
