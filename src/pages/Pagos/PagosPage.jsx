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
    Chip,
    IconButton,
    Tooltip,
    Typography,
    useMediaQuery,
    useTheme,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Dialog,
    DialogContent,
    DialogTitle,
    Button,
    Tabs,
    Tab,
} from '@mui/material';
import {
    CheckCircle,
    Cancel,
    Image as ImageIcon,
    Visibility,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import { useAuth } from '../../context/AuthContext';
import pagosService from '../../services/pagos.service';
import { getImageUrl } from '../../utils/imageUtils';
import Swal from 'sweetalert2';

const ESTADO_COLORS = {
    EN_REVISION: 'warning',
    APROBADO: 'success',
    RECHAZADO: 'error',
};

function PagosPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { hasPermission } = useAuth();

    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState('EN_REVISION');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [comprobanteDialog, setComprobanteDialog] = useState(null);

    const estados = ['EN_REVISION', 'APROBADO', 'RECHAZADO'];

    const puedeAprobar = hasPermission('pagos.aprobar');

    useEffect(() => {
        loadPagos();
    }, [filtroEstado]);

    const loadPagos = async () => {
        setLoading(true);
        try {
            const params = { estado: filtroEstado };
            const response = await pagosService.getPagos(params);
            if (response.success) {
                setPagos(response.data || []);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los pagos',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleAprobar = async (id) => {
        const result = await Swal.fire({
            title: '¿Aprobar pago?',
            text: 'Esto actualizará el saldo de la venta',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, aprobar',
            confirmButtonColor: theme.palette.success.main,
        });

        if (result.isConfirmed) {
            try {
                const response = await pagosService.aprobarPago(id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Pago aprobado',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadPagos();
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo aprobar el pago',
                });
            }
        }
    };

    const handleRechazar = async (id) => {
        const result = await Swal.fire({
            title: '¿Rechazar pago?',
            text: 'El comprador deberá registrar otro pago',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, rechazar',
            confirmButtonColor: theme.palette.error.main,
        });

        if (result.isConfirmed) {
            try {
                const response = await pagosService.rechazarPago(id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Pago rechazado',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadPagos();
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo rechazar el pago',
                });
            }
        }
    };

    const handleVerVenta = (ventaId) => {
        navigate(`/ventas/${ventaId}`);
    };

    const pagosPaginados = pagos.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

    if (!puedeAprobar) {
        return (
            <LayoutDashboard title="Pagos">
                <Box sx={{ p: 3 }}>
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No tienes permisos para acceder a esta página
                        </Typography>
                    </Paper>
                </Box>
            </LayoutDashboard>
        );
    }

    return (
        <LayoutDashboard title="Gestión de Pagos">
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        Gestión de Pagos
                    </Typography>
                </Box>

                {/* Filtros */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Tabs value={filtroEstado} onChange={(e, v) => setFiltroEstado(v)} variant="scrollable">
                        {estados.map((estado) => (
                            <Tab key={estado} label={estado.replace('_', ' ')} value={estado} />
                        ))}
                    </Tabs>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : pagos.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center' }}>
                        <Typography variant="h6" color="text.secondary">
                            No hay pagos {filtroEstado.toLowerCase().replace('_', ' ')}
                        </Typography>
                    </Paper>
                ) : isMobile ? (
                    <>
                        <Grid container spacing={2}>
                            {pagosPaginados.map((pago) => (
                                <Grid item xs={12} key={pago.id}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    Pago #{pago.id} - Venta #{pago.venta_id}
                                                </Typography>
                                                <Chip
                                                    label={pago.estado.replace('_', ' ')}
                                                    size="small"
                                                    color={ESTADO_COLORS[pago.estado] || 'default'}
                                                />
                                            </Box>
                                            <Typography variant="h6" gutterBottom>
                                                {pago.comprador}
                                            </Typography>
                                            <Typography variant="body2">
                                                Monto: Bs. {pago.monto}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Método: {pago.metodo_pago}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(pago.fecha_pago).toLocaleString('es-BO')}
                                            </Typography>
                                            <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                {/* Botón Ver Comprobante */}
                                                {pago.ruta_comprobante && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        startIcon={<Visibility />}
                                                        onClick={() => setComprobanteDialog(pago)}
                                                    >
                                                        Ver Comprobante
                                                    </Button>
                                                )}

                                                {/* Botones Aprobar/Rechazar */}
                                                {pago.estado === 'EN_REVISION' && puedeAprobar && (
                                                    <>
                                                        <Button
                                                            size="small"
                                                            color="success"
                                                            onClick={() => handleAprobar(pago.id)}
                                                        >
                                                            Aprobar
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleRechazar(pago.id)}
                                                        >
                                                            Rechazar
                                                        </Button>
                                                    </>
                                                )}
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <TablePagination
                            component="div"
                            count={pagos.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Pagos por página:"
                        />
                    </>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Venta</TableCell>
                                    <TableCell>Comprador</TableCell>
                                    <TableCell align="right">Monto</TableCell>
                                    <TableCell>Método</TableCell>
                                    <TableCell>Fecha</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                    <TableCell align="center">Comprobante</TableCell>
                                    {puedeAprobar && <TableCell align="center">Acciones</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pagosPaginados.map((pago) => (
                                    <TableRow key={pago.id} hover>
                                        <TableCell>#{pago.id}</TableCell>
                                        <TableCell>
                                            <Button
                                                size="small"
                                                onClick={() => handleVerVenta(pago.venta_id)}
                                            >
                                                Venta #{pago.venta_id}
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {pago.comprador}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold">
                                                Bs. {pago.monto}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>{pago.metodo_pago}</TableCell>
                                        <TableCell>
                                            {new Date(pago.fecha_pago).toLocaleString('es-BO')}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={pago.estado.replace('_', ' ')}
                                                size="small"
                                                color={ESTADO_COLORS[pago.estado] || 'default'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Tooltip title="Ver comprobante">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setComprobanteDialog(pago)}
                                                >
                                                    <ImageIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                        {puedeAprobar && (
                                            <TableCell align="center">
                                                {pago.estado === 'EN_REVISION' && (
                                                    <>
                                                        <Tooltip title="Aprobar">
                                                            <IconButton
                                                                size="small"
                                                                color="success"
                                                                onClick={() => handleAprobar(pago.id)}
                                                            >
                                                                <CheckCircle fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Rechazar">
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() => handleRechazar(pago.id)}
                                                            >
                                                                <Cancel fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={pagos.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Pagos por página:"
                        />
                    </TableContainer>
                )}

                {/* Dialog para ver comprobante */}
                <Dialog
                    open={Boolean(comprobanteDialog)}
                    onClose={() => setComprobanteDialog(null)}
                    maxWidth="md"
                >
                    <DialogTitle>Comprobante de Pago</DialogTitle>
                    <DialogContent>
                        {comprobanteDialog && (
                            <Box sx={{ textAlign: 'center' }}>
                                <img
                                    src={getImageUrl(comprobanteDialog.ruta_comprobante)}
                                    alt="Comprobante"
                                    style={{ maxWidth: '100%', maxHeight: '70vh' }}
                                />
                            </Box>
                        )}
                    </DialogContent>
                </Dialog>
            </Box>
        </LayoutDashboard>
    );
}

export default PagosPage;
