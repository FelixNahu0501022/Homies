import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    TextField,
    Chip,
    IconButton,
    Tooltip,
    Typography,
    InputAdornment,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    CardActions,
    Grid,
    CircularProgress,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add,
    Search,
    Visibility,
    LocalShipping,
    Cancel as CancelIcon,
    ShoppingCart,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import { useAuth } from '../../context/AuthContext';
import ventasService from '../../services/ventas.service';
import Swal from 'sweetalert2';

// Mapeo de estados a colores
const ESTADO_COLORS = {
    PENDIENTE_PAGO: 'warning',
    INCOMPLETO: 'info',
    PAGADO: 'success',
    ENTREGADO: 'default',
    ANULADO: 'error',
};

function VentasPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { hasPermission, hasRole, user } = useAuth();

    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const estados = ['TODOS', 'PENDIENTE_PAGO', 'INCOMPLETO', 'PAGADO', 'ENTREGADO', 'ANULADO'];

    const puedeGestionar = hasPermission('ventas.gestion');
    const esAdmin = hasRole('admin');

    useEffect(() => {
        if (user) loadVentas(); // Esperar a que user cargue
    }, [filtroEstado, user]);

    const loadVentas = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filtroEstado !== 'TODOS') params.estado = filtroEstado;
            if (busqueda) params.busqueda = busqueda;

            // Si no es admin, filtramos por su ID para que vea solo sus ventas
            if (!esAdmin && user?.id) {
                params.vendedor_id = user.id;
            }

            const response = await ventasService.getVentas(params);
            if (response.success) {
                let data = response.data || [];

                // Fallback: Filtrado en cliente si el backend devolvió todo
                if (!esAdmin && user?.id) {
                    // Intentamos filtrar si vemos que vinieron ventas de otros
                    // Asumimos que data tiene vendedor_id o vendedor (nombre)
                    // Si data no tiene vendedor_id, intentamos con el nombre de usuario
                    const isMixed = data.some(v => v.vendedor_id && v.vendedor_id !== user.id);
                    if (isMixed || data.length > 0) {
                        data = data.filter(v => {
                            // Coincidencia estricta por ID o Nombre
                            const matchId = v.vendedor_id && v.vendedor_id === user.id;
                            const matchName = v.vendedor && v.vendedor === user.nombre_usuario;
                            return matchId || matchName;
                        });
                    }
                }

                setVentas(data);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar las ventas',
            });
        } finally {
            setLoading(false);
        }
    };

    // Debounce para búsqueda
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (user) loadVentas();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [busqueda]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleVerDetalle = (id) => {
        navigate(`/ventas/${id}`);
    };

    const handleEntregar = async (id) => {
        const result = await Swal.fire({
            title: '¿Confirmar entrega?',
            text: 'Esto marcará la venta como ENTREGADO',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, entregar',
            cancelButtonText: 'Cancelar',
        });

        if (result.isConfirmed) {
            try {
                const response = await ventasService.entregarVenta(id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Entregado',
                        text: 'La venta se marcó como entregada',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadVentas();
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo entregar la venta',
                });
            }
        }
    };

    const handleCancelar = async (id) => {
        const result = await Swal.fire({
            title: '¿Anular venta?',
            text: 'Esto devolverá el stock. No se puede cancelar si tiene pagos aprobados.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, anular',
            cancelButtonText: 'No',
            confirmButtonColor: theme.palette.error.main,
        });

        if (result.isConfirmed) {
            try {
                const response = await ventasService.cancelarVenta(id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Venta anulada',
                        text: 'El stock ha sido devuelto',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadVentas();
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo anular la venta',
                });
            }
        }
    };

    const ventasPaginadas = ventas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    return (
        <LayoutDashboard title="Ventas">
            <Box sx={{ p: 3 }}>
                {/* Barra superior */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <Typography variant="h5" fontWeight="bold">
                        {esAdmin ? 'Gestión Global de Ventas' : 'Mis Ventas'}
                    </Typography>
                    {puedeGestionar && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/ventas/crear')}
                        >
                            Nueva Venta
                        </Button>
                    )}
                </Box>

                {/* Filtros */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Buscar por comprador..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Tabs
                                value={filtroEstado}
                                onChange={(e, v) => setFiltroEstado(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                {estados.map((estado) => (
                                    <Tab key={estado} label={estado.replace('_', ' ')} value={estado} />
                                ))}
                            </Tabs>
                        </Grid>
                    </Grid>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : ventas.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center' }}>
                        <ShoppingCart sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No se encontraron ventas
                        </Typography>
                    </Paper>
                ) : isMobile ? (
                    /* Vista móvil */
                    <>
                        <Grid container spacing={2}>
                            {ventasPaginadas.map((venta) => (
                                <Grid item xs={12} key={venta.id}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Venta #{venta.id}
                                                </Typography>
                                                <Chip
                                                    label={venta.estado.replace('_', ' ')}
                                                    size="small"
                                                    color={ESTADO_COLORS[venta.estado] || 'default'}
                                                />
                                            </Box>
                                            <Typography variant="h6" gutterBottom>
                                                {venta.comprador}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Vendedor: {venta.vendedor}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Fecha: {new Date(venta.fecha_venta).toLocaleDateString('es-BO')}
                                            </Typography>
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    Total: Bs. {venta.monto_total}
                                                </Typography>
                                                <Typography variant="body2" color="success.main">
                                                    Pagado: Bs. {venta.monto_pagado}
                                                </Typography>
                                                <Typography variant="body2" color="warning.main">
                                                    Pendiente: Bs. {(venta.monto_total - venta.monto_pagado).toFixed(2)}
                                                </Typography>
                                            </Box>
                                        </CardContent>
                                        <CardActions>
                                            <Button size="small" onClick={() => handleVerDetalle(venta.id)}>
                                                Ver Detalle
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <TablePagination
                            component="div"
                            count={ventas.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Ventas por página:"
                        />
                    </>
                ) : (
                    /* Vista escritorio */
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Comprador</TableCell>
                                    <TableCell>Vendedor</TableCell>
                                    <TableCell align="right">Monto Total</TableCell>
                                    <TableCell align="right">Pagado</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    {puedeGestionar && <TableCell align="center">Acciones</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {ventasPaginadas.map((venta) => (
                                    <TableRow key={venta.id} hover>
                                        <TableCell>#{venta.id}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {venta.comprador}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{venta.vendedor}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold">
                                                Bs. {venta.monto_total}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" color="success.main">
                                                Bs. {venta.monto_pagado}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={venta.estado.replace('_', ' ')}
                                                size="small"
                                                color={ESTADO_COLORS[venta.estado] || 'default'}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {new Date(venta.fecha_venta).toLocaleDateString('es-BO')}
                                        </TableCell>
                                        {puedeGestionar && (
                                            <TableCell align="center">
                                                <Tooltip title="Ver Detalle">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleVerDetalle(venta.id)}
                                                    >
                                                        <Visibility fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                {venta.estado === 'PAGADO' && (
                                                    <Tooltip title="Entregar">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEntregar(venta.id)}
                                                        >
                                                            <LocalShipping fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                {venta.estado !== 'ENTREGADO' && venta.estado !== 'ANULADO' && (
                                                    <Tooltip title="Cancelar">
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleCancelar(venta.id)}
                                                        >
                                                            <CancelIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={ventas.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Ventas por página:"
                        />
                    </TableContainer>
                )}
            </Box>
        </LayoutDashboard>
    );
}

export default VentasPage;
