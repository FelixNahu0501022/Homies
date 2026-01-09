import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
} from '@mui/material';
import {
    AttachMoney,
    ShoppingCart,
    Inventory2,
    TrendingUp,
    MoneyOff,
    CheckCircle,
    Warning,
    Cancel,
    LocalShipping,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import reportesService from '../../services/reportes.service';
import { useAuth } from '../../context/AuthContext';

// Utilidad para formato de moneda
// Utilidad para formato de moneda (Defensive programming)
const formatMoney = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return 'Bs. 0.00';
    return `Bs. ${num.toFixed(2)}`;
};

function StatCard({ title, value, subtext, icon, color = 'primary' }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                        <Typography color="text.secondary" gutterBottom>
                            {title}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                            {value}
                        </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.main` }}>
                        {icon}
                    </Avatar>
                </Box>
                {subtext && (
                    <Typography variant="caption" color="text.secondary">
                        {subtext}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
}

function ReportesPage() {
    const { hasPermission } = useAuth();
    const isAdmin = hasPermission('pagos.aprobar'); // Asumo que admin tiene este permiso clave

    const [loading, setLoading] = useState(true);
    const [statsVentas, setStatsVentas] = useState(null);
    const [statsInventario, setStatsInventario] = useState(null);
    const [topProductos, setTopProductos] = useState([]);
    const [flujoCaja, setFlujoCaja] = useState(null);

    useEffect(() => {
        loadReportes();
    }, []);

    const loadReportes = async () => {
        setLoading(true);
        try {
            // Carga paralela de reportes
            const promises = [
                reportesService.getVentasEstadisticas(),
                reportesService.getInventarioEstado(),
                reportesService.getProductosMasVendidos(5)
            ];

            if (isAdmin) {
                promises.push(reportesService.getFlujoCaja());
            }

            const results = await Promise.all(promises);

            console.log('Reportes - Ventas:', results[0]);
            console.log('Reportes - Inventario:', results[1]);
            console.log('Reportes - Top Productos:', results[2]);

            if (results[0].success) setStatsVentas(results[0].data);
            if (results[1].success) setStatsInventario(results[1].data);
            if (results[2].success) setTopProductos(results[2].data || []);

            if (isAdmin && results[3]) {
                console.log('Reportes - Flujo Caja:', results[3]);
                if (results[3].success) setFlujoCaja(results[3].data);
            }

        } catch (err) {
            console.error('Error cargando reportes:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <LayoutDashboard title="Panel de Reportes">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                    <CircularProgress />
                </Box>
            </LayoutDashboard>
        );
    }

    // Procesamiento de datos (Adapter Pattern inline)
    const resumenVentas = statsVentas || {};
    // Construir array de estados manualmente ya que el backend devuelve propiedades planas
    const estadosVentas = [
        { estado: 'PAGADO', cantidad: parseInt(resumenVentas.ventas_pagadas || 0), monto_total: parseFloat(resumenVentas.total_pagado || 0) },
        { estado: 'PENDIENTE_PAGO', cantidad: parseInt(resumenVentas.ventas_pendientes || 0), monto_total: parseFloat(resumenVentas.total_pendiente || 0) }, // Asumiendo pendiente ~ saldo pendiente
        { estado: 'INCOMPLETO', cantidad: parseInt(resumenVentas.ventas_incompletas || 0), monto_total: 0 }, // Backend no da monto específico incompleto separado en este log, ajustaremos visualización
        { estado: 'ENTREGADO', cantidad: parseInt(resumenVentas.ventas_entregadas || 0), monto_total: 0 } // Info extra
    ].filter(e => e.cantidad > 0);

    const resumenInventario = statsInventario?.resumen || {};
    // Calcular valor inventario frontend
    const valorInventarioCalculado = statsInventario?.productos?.reduce((acc, prod) => {
        return acc + (parseFloat(prod.precio_unitario) * parseInt(prod.stock_actual));
    }, 0) || 0;

    return (
        <LayoutDashboard title="Panel de Reportes">
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom mb={3}>
                    Resumen General
                </Typography>

                {/* KPIs Principales */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Total Ventas"
                            value={resumenVentas.total_ventas || 0}
                            icon={<ShoppingCart />}
                            color="info"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Monto Generado"
                            value={formatMoney(resumenVentas.ingresos_totales || 0)}
                            icon={<TrendingUp />}
                            color="success"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Saldo Pendiente"
                            value={formatMoney(resumenVentas.total_pendiente || 0)}
                            icon={<MoneyOff />}
                            color="warning"
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StatCard
                            title="Valor Inventario"
                            value={formatMoney(valorInventarioCalculado)}
                            subtext={`${resumenInventario.stock_total || 0} unidades`}
                            icon={<AttachMoney />}
                            color="primary"
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    {/* Ventas por Estado */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Estado de Ventas
                            </Typography>
                            <Box sx={{ mt: 2 }}>
                                {estadosVentas.map((estadoInfo) => {
                                    const percentage = (estadoInfo.cantidad / (parseInt(resumenVentas.total_ventas) || 1)) * 100;
                                    let color = 'primary';
                                    let icon = <CheckCircle fontSize="small" />;

                                    if (estadoInfo.estado === 'PENDIENTE_PAGO') { color = 'warning'; icon = <Warning fontSize="small" />; }
                                    if (estadoInfo.estado === 'ANULADO') { color = 'error'; icon = <Cancel fontSize="small" />; }
                                    if (estadoInfo.estado === 'INCOMPLETO') { color = 'info'; }
                                    if (estadoInfo.estado === 'ENTREGADO') { color = 'success'; icon = <LocalShipping fontSize="small" />; }

                                    return (
                                        <Box key={estadoInfo.estado} sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {icon} {estadoInfo.estado.replace('_', ' ')}
                                                </Typography>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {estadoInfo.cantidad} ({percentage.toFixed(0)}%)
                                                </Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={percentage} color={color} />
                                            {estadoInfo.monto_total > 0 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    Monto ref: {formatMoney(estadoInfo.monto_total)}
                                                </Typography>
                                            )}
                                        </Box>
                                    );
                                })}
                                {parseInt(resumenVentas.total_ventas) === 0 && (
                                    <Typography color="text.secondary">No hay datos de ventas.</Typography>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Top Productos */}
                    <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 3, height: '100%' }}>
                            <Typography variant="h6" gutterBottom>
                                Top 5 Productos Más Vendidos
                            </Typography>
                            <List>
                                {topProductos.map((prod, index) => (
                                    <div key={prod.id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                                                    <Inventory2 />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={
                                                    <Typography fontWeight="bold">
                                                        {prod.nombre}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <>
                                                        <Typography component="span" variant="body2" color="text.primary">
                                                            Vendidos: {prod.total_vendido || prod.numero_ventas}
                                                        </Typography>
                                                        <br />
                                                        {`Generado: ${formatMoney(prod.ingresos_generados)}`}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                        {index < topProductos.length - 1 && <Divider variant="inset" component="li" />}
                                    </div>
                                ))}
                                {topProductos.length === 0 && (
                                    <Typography color="text.secondary" sx={{ p: 2 }}>No hay productos vendidos aún.</Typography>
                                )}
                            </List>
                        </Paper>
                    </Grid>

                    {/* Flujo de Caja (Admin Only) */}
                    {isAdmin && flujoCaja && (
                        <Grid item xs={12}>
                            <Paper sx={{ p: 3 }}>
                                <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
                                    <AttachMoney color="success" /> Flujo de Caja (Pagos)
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 2, color: 'success.dark' }}>
                                            <Typography variant="subtitle2">Pagos Aprobados</Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {formatMoney(flujoCaja.total_aprobado || 0)}
                                            </Typography>
                                            <Typography variant="caption">
                                                {flujoCaja.pagos_aprobados} transacciones
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ p: 2, bgcolor: 'warning.light', borderRadius: 2, color: 'warning.dark' }}>
                                            <Typography variant="subtitle2">En Revisión</Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {formatMoney(flujoCaja.total_en_revision || 0)}
                                            </Typography>
                                            <Typography variant="caption">
                                                {flujoCaja.pagos_pendientes} transacciones
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={4}>
                                        <Box sx={{ p: 2, bgcolor: 'error.light', borderRadius: 2, color: 'error.dark' }}>
                                            <Typography variant="subtitle2">Pagos Rechazados</Typography>
                                            <Typography variant="h5" fontWeight="bold">
                                                {formatMoney(flujoCaja.total_rechazado || 0)}
                                            </Typography>
                                            <Typography variant="caption">
                                                {flujoCaja.pagos_rechazados} transacciones
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </LayoutDashboard>
    );
}

export default ReportesPage;
