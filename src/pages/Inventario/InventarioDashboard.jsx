// src/pages/Inventario/InventarioDashboard.jsx
import { Box, Paper, Typography, Grid, Chip } from "@mui/material";
import { useEffect, useState } from "react";
import {
    Inventory, AttachMoney, Warning, ErrorOutline,
    TrendingUp, PieChart as PieChartIcon
} from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import Swal from "sweetalert2";
import {
    rptStock,
    rptStockPorCategoria,
    rptBajoStock,
    rptAgotados,
    rptValorizado
} from "../../services/inventario.service";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

export default function InventarioDashboard() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalItems: 0,
        bajoStock: 0,
        agotados: 0
    });
    const [distribucionCategorias, setDistribucionCategorias] = useState([]);

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        setLoading(true);
        try {
            const [stock, categorias, bajoStock, agotados] = await Promise.all([
                rptStock().catch(() => []),
                rptStockPorCategoria().catch(() => []),
                rptBajoStock().catch(() => []),
                rptAgotados().catch(() => [])
            ]);

            console.log('DEBUG - Dashboard Inventario:');
            console.log('Stock:', stock);
            console.log('Categorias:', categorias);
            console.log('Bajo Stock:', bajoStock);
            console.log('Agotados:', agotados);

            // Load catalog to resolve category names
            const catalogoCategorias = await import("../../services/inventario.service")
                .then(m => m.listarCategorias())
                .catch(() => []) || [];

            // Build category map
            const catMap = new Map();
            catalogoCategorias.forEach(cat => {
                const id = cat.idcategoria;
                const nombre = cat.nombre || cat.descripcion;
                if (id && nombre) catMap.set(Number(id), String(nombre));
            });

            // KPIs
            const totalItems = stock?.length || 0;
            const countBajo = bajoStock?.length || 0;
            const countAgotados = agotados?.length || 0;

            setStats({
                totalItems,
                bajoStock: countBajo,
                agotados: countAgotados
            });

            // Distribución por categorías - usar items (cantidad de items)
            const catData = (categorias || []).slice(0, 8).map(c => ({
                name: catMap.get(Number(c.idcategoria)) || `Categoría ${c.idcategoria || '?'}`,
                value: parseInt(c.items || c.total_items || 0)
            }));
            setDistribucionCategorias(catData);

        } catch (error) {
            console.error("Error cargando dashboard:", error);
            Swal.fire("Error", "Error al cargar datos del dashboard", "error");
        } finally {
            setLoading(false);
        }
    };

    const KPICard = ({ title, value, icon, color, subtitle, format = 'number' }) => (
        <Paper sx={{ p: 2, height: '100%', background: `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)` }}>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                <Box flex={1}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} color={color} mb={0.5}>
                        {loading ? "—" : format === 'currency' ? `$${value.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : value.toLocaleString()}
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
                <Grid item xs={12} sm={6} md={4}>
                    <KPICard
                        title="Total Items"
                        value={stats.totalItems}
                        icon={<Inventory sx={{ fontSize: 40 }} />}
                        color="#1976d2"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <KPICard
                        title="Items Bajo Stock"
                        value={stats.bajoStock}
                        icon={<Warning sx={{ fontSize: 40 }} />}
                        color="#ed6c02"
                        subtitle="Requieren reposición"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                    <KPICard
                        title="Items Agotados"
                        value={stats.agotados}
                        icon={<ErrorOutline sx={{ fontSize: 40 }} />}
                        color="#d32f2f"
                        subtitle="Stock en 0"
                    />
                </Grid>
            </Grid>

            {/* Gráficos */}
            <Grid container spacing={2}>
                {/* Distribución por Categorías */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <PieChartIcon color="primary" />
                            <Typography variant="h6" fontWeight={600}>
                                Distribución por Categoría
                            </Typography>
                        </Box>
                        {loading ? (
                            <Box display="flex" justifyContent="center" alignItems="center" height={350}>
                                <Typography color="text.secondary">Cargando...</Typography>
                            </Box>
                        ) : distribucionCategorias.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={350}>
                                    <PieChart>
                                        <Pie
                                            data={distribucionCategorias}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {distribucionCategorias.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value} items`} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                                <Box display="flex" flexWrap="wrap" gap={1} mt={2} justifyContent="center">
                                    {distribucionCategorias.map((cat, idx) => (
                                        <Chip
                                            key={idx}
                                            label={`${cat.name}: ${cat.value}`}
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
            </Grid>
        </Box>
    );
}
