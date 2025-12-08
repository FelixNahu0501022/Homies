// src/pages/Capacitaciones/CapacitacionesDashboard.jsx
import { Box, Paper, Typography, Grid, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import {
    School, Groups, Business, EmojiEvents,
    TrendingUp, PieChart as PieChartIcon
} from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import Swal from "sweetalert2";
import {
    listarCapacitaciones,
    repParticipacionInternos,
    repExternosRanking,
    repCertificadosEmitidos,
    repDistribucionPorTema,
    repTopCapacitaciones
} from "../../services/capacitaciones.service";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function CapacitacionesDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalCapacitaciones: 0,
        participantesInternos: 0,
        participantesExternos: 0,
        certificadosEmitidos: 0
    });
    const [distribucionTemas, setDistribucionTemas] = useState([]);
    const [topCapacitaciones, setTopCapacitaciones] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [capacitaciones, internos, externos, certificados, temas, top] = await Promise.all([
                listarCapacitaciones().catch(() => []),
                repParticipacionInternos().catch(() => []),
                repExternosRanking().catch(() => []),
                repCertificadosEmitidos().catch(() => []),
                repDistribucionPorTema().catch(() => []),
                repTopCapacitaciones().catch(() => [])
            ]);

            console.log('DEBUG - Dashboard responses:');
            console.log('Capacitaciones:', capacitaciones);
            console.log('Internos:', internos);
            console.log('Externos:', externos);
            console.log('Certificados:', certificados);
            console.log('Temas:', temas);
            console.log('Top:', top);

            // KPIs
            const totalCap = capacitaciones?.length || 0;
            const totalInternos = internos?.reduce((sum, p) => sum + parseInt(p.total_capacitaciones || p.total || 0), 0) || 0;
            const totalExternos = externos?.reduce((sum, p) => sum + parseInt(p.total_capacitaciones || p.total || 0), 0) || 0;
            // Certificados ahora viene como {emitidos: X, anulados: Y}
            const totalCert = certificados?.[0]?.emitidos || certificados?.length || 0;

            setStats({
                totalCapacitaciones: totalCap,
                participantesInternos: totalInternos,
                participantesExternos: totalExternos,
                certificadosEmitidos: totalCert
            });

            // Distribución por temas - campo es total_eventos
            const temasData = (temas || []).slice(0, 8).map(t => ({
                name: t.tema || t.nombre || "Sin tema",
                value: parseInt(t.total_eventos || t.total_asistentes || t.total || t.cantidad || 0)
            }));
            setDistribucionTemas(temasData);

            // Top capacitaciones - campo es total
            const topData = (top || []).slice(0, 8).map(c => ({
                name: (c.nombre || c.titulo || "Sin nombre").substring(0, 30),
                cantidad: parseInt(c.total || c.total_participantes || c.participantes || 0)
            }));
            setTopCapacitaciones(topData);

        } catch (error) {
            console.error("Error cargando dashboard:", error);
            Swal.fire("Error", "Error al cargar datos del dashboard", "error");
        } finally {
            setLoading(false);
        }
    };

    const KPICard = ({ title, value, icon, color, subtitle }) => (
        <Paper sx={{ p: 2, height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={color} mb={0.5}>
                        {loading ? "—" : value.toLocaleString()}
                    </Typography>
                    {subtitle && (
                        <Typography variant="caption" color="text.secondary">
                            {subtitle}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ color, opacity: 0.8 }}>
                    {icon}
                </Box>
            </Box>
        </Paper>
    );

    return (
        <Box>
            {/* KPIs */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Total Capacitaciones"
                        value={stats.totalCapacitaciones}
                        icon={<School sx={{ fontSize: 40 }} />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Participantes Internos"
                        value={stats.participantesInternos}
                        icon={<Groups sx={{ fontSize: 40 }} />}
                        color="#2e7d32"
                        subtitle="Personal capacitado"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Participantes Externos"
                        value={stats.participantesExternos}
                        icon={<Business sx={{ fontSize: 40 }} />}
                        color="#ed6c02"
                        subtitle="Instituciones/Personas"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Certificados Emitidos"
                        value={stats.certificadosEmitidos}
                        icon={<EmojiEvents sx={{ fontSize: 40 }} />}
                        color="#9c27b0"
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={2}>
                {/* Distribución por Temas */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <PieChartIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Distribución por Tema
                            </Typography>
                        </Box>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">Cargando...</Typography>
                            </Box>
                        ) : distribucionTemas.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={distribucionTemas}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {distribucionTemas.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} capacitaciones`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box display="flex" flexWrap="wrap" gap={1} mt={2} justifyContent="center">
                                    {distribucionTemas.map((tema, idx) => (
                                        <Chip
                                            key={idx}
                                            label={`${tema.name}: ${tema.value}`}
                                            size="small"
                                            sx={{
                                                bgcolor: `${COLORS[idx % COLORS.length]}20`,
                                                color: COLORS[idx % COLORS.length],
                                                fontWeight: 600
                                            }}
                                        />
                                    ))}
                                </Box>
                            </>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">Sin datos disponibles</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>

                {/* Top Capacitaciones */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <TrendingUp color="success" />
                            <Typography variant="h6" fontWeight={600}>
                                Top Capacitaciones
                            </Typography>
                        </Box>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">Cargando...</Typography>
                            </Box>
                        ) : topCapacitaciones.length > 0 ? (
                            <ResponsiveContainer width="100%" height={350}>
                                <BarChart data={topCapacitaciones} margin={{ top: 5, right: 10, left: 10, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={100}
                                        interval={0}
                                        style={{ fontSize: '11px' }}
                                    />
                                    <YAxis label={{ value: 'Participantes', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Bar dataKey="cantidad" fill="#2e7d32" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">Sin datos disponibles</Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}
