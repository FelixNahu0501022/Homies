import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Button,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Divider,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Alert,
} from '@mui/material';
import {
    ArrowBack,
    LocalShipping,
    Cancel as CancelIcon,
    Payment,
    AttachFile,
    Receipt, // Icono para recibir/voucher
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import { useAuth } from '../../context/AuthContext';
import ventasService from '../../services/ventas.service';
import pagosService from '../../services/pagos.service';
import { getImageUrl } from '../../utils/imageUtils';
import { generarVoucherPDF } from '../../utils/voucherPDF';
import Swal from 'sweetalert2';

const ESTADO_COLORS = {
    PENDIENTE_PAGO: 'warning',
    INCOMPLETO: 'info',
    PAGADO: 'success',
    ENTREGADO: 'default',
    ANULADO: 'error',
};

const PAGO_ESTADO_COLORS = {
    EN_REVISION: 'warning',
    APROBADO: 'success',
    RECHAZADO: 'error',
};

function VentaDetallePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { hasPermission } = useAuth();

    const [venta, setVenta] = useState(null);
    const [pagos, setPagos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dialogPagoOpen, setDialogPagoOpen] = useState(false);
    const [pagoForm, setPagoForm] = useState({
        monto: '',
        metodo_pago: 'TRANSFERENCIA',
        comprobante: null,
    });
    const [comprobantePreview, setComprobantePreview] = useState(null);

    const puedeGestionar = hasPermission('ventas.gestion');

    useEffect(() => {
        loadVenta();
        loadPagos();
    }, [id]);

    const loadVenta = async () => {
        setLoading(true);
        try {
            const response = await ventasService.getVenta(id);
            if (response.success) {
                setVenta(response.data);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar la venta',
            });
        } finally {
            setLoading(false);
        }
    };

    const loadPagos = async () => {
        try {
            const response = await pagosService.getPagosByVenta(id);
            if (response.success) {
                setPagos(response.data || []);
            }
        } catch (err) {
            console.error('Error al cargar pagos:', err);
        }
    };

    const handleEntregar = async () => {
        const result = await Swal.fire({
            title: '¿Confirmar entrega?',
            text: 'Esto marcará la venta como ENTREGADO',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, entregar',
        });

        if (result.isConfirmed) {
            try {
                const response = await ventasService.entregarVenta(id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Entregado',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadVenta();
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo entregar',
                });
            }
        }
    };

    const handleCancelar = async () => {
        const result = await Swal.fire({
            title: '¿Anular venta?',
            text: 'No se puede cancelar si tiene pagos aprobados',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, anular',
            confirmButtonColor: '#d32f2f',
        });

        if (result.isConfirmed) {
            try {
                const response = await ventasService.cancelarVenta(id);
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Venta anulada',
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    loadVenta();
                }
            } catch (err) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo anular',
                });
            }
        }
    }


    const handleGenerarVoucher = async () => {
        try {
            await generarVoucherPDF(venta);
            Swal.fire({
                icon: 'success',
                title: 'PDF Generado',
                text: 'El voucher se ha descargado correctamente.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo generar el PDF.',
            });
        }
    };

    const handleComprobanteChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo muy grande',
                    text: 'El comprobante no debe superar los 10MB',
                });
                return;
            }

            setPagoForm({ ...pagoForm, comprobante: file });

            const reader = new FileReader();
            reader.onloadend = () => {
                setComprobantePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRegistrarPago = async () => {
        // Calcular pagos en revisión
        const pagosEnRevision = pagos
            .filter(p => p.estado === 'EN_REVISION')
            .reduce((sum, p) => sum + parseFloat(p.monto), 0);

        // Saldo real considerando lo que ya está pagado + lo que está en revisión
        const montoYaCubierto = venta.monto_pagado + pagosEnRevision;
        const saldoRealesPendiente = venta.monto_total - montoYaCubierto;

        // Validar si ya está todo cubierto
        if (saldoRealesPendiente <= 0) {
            Swal.fire({
                icon: 'info',
                title: 'Pagos en revisión',
                text: `Ya existen pagos registrados (Aprobados: ${venta.monto_pagado}, En Revisión: ${pagosEnRevision}) que cubren el total de la venta. Espera a que sean aprobados.`,
            });
            setDialogPagoOpen(false);
            return;
        }

        if (!pagoForm.monto || !pagoForm.comprobante) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos incompletos',
                text: 'Completa todos los campos',
            });
            return;
        }

        if (parseFloat(pagoForm.monto) > saldoRealesPendiente) {
            Swal.fire({
                icon: 'error',
                title: 'Monto inválido',
                text: `El monto excede el saldo pendiente real (Bs. ${saldoRealesPendiente.toFixed(2)}). Tienes Bs. ${pagosEnRevision} en revisión.`,
            });
            return;
        }

        if (parseFloat(pagoForm.monto) <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Monto inválido',
                text: 'El monto debe ser mayor a 0',
            });
            return;
        }

        try {
            const formData = new FormData();
            formData.append('venta_id', id);
            formData.append('monto', pagoForm.monto);
            formData.append('metodo_pago', pagoForm.metodo_pago);
            formData.append('comprobante', pagoForm.comprobante);

            const response = await pagosService.createPago(formData);
            if (response.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Pago registrado',
                    text: 'El pago está EN REVISIÓN',
                    timer: 2000,
                    showConfirmButton: false,
                });
                setDialogPagoOpen(false);
                setPagoForm({ monto: '', metodo_pago: 'TRANSFERENCIA', comprobante: null });
                setComprobantePreview(null);
                loadPagos();
                loadVenta();
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: err.response?.data?.message || 'No se pudo registrar el pago',
            });
        }
    };

    if (loading) {
        return (
            <LayoutDashboard title="Detalle de Venta">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}>
                    <CircularProgress />
                </Box>
            </LayoutDashboard>
        );
    }

    if (!venta) {
        return (
            <LayoutDashboard title="Detalle de Venta">
                <Box sx={{ p: 3 }}>
                    <Alert severity="error">Venta no encontrada</Alert>
                </Box>
            </LayoutDashboard>
        );
    }

    const saldoPendiente = venta.monto_total - venta.monto_pagado;

    return (
        <LayoutDashboard title={`Venta #${venta.id}`}>
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/ventas')} sx={{ mb: 2 }}>
                    Volver
                </Button>

                <Grid container spacing={3}>
                    {/* Información General */}
                    <Grid item xs={12} md={8}>
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h5" fontWeight="bold">
                                    Venta #{venta.id}
                                </Typography>
                                <Chip
                                    label={venta.estado.replace('_', ' ')}
                                    color={ESTADO_COLORS[venta.estado] || 'default'}
                                />
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Comprador
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {venta.comprador}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        CI: {venta.ci} | Tel: {venta.telefono}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Vendedor
                                    </Typography>
                                    <Typography variant="body1">{venta.vendedor}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        {new Date(venta.fecha_venta).toLocaleString('es-BO')}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="h6" gutterBottom>
                                Items de la Venta
                            </Typography>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Producto</TableCell>
                                            <TableCell align="center">Cantidad</TableCell>
                                            <TableCell align="right">Precio</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {venta.detalles.map((detalle) => (
                                            <TableRow key={detalle.id}>
                                                <TableCell>{detalle.producto_nombre}</TableCell>
                                                <TableCell align="center">{detalle.cantidad}</TableCell>
                                                <TableCell align="right">Bs. {detalle.precio_historico}</TableCell>
                                                <TableCell align="right">
                                                    <Typography fontWeight="bold">
                                                        Bs. {detalle.subtotal}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>

                        {/* Pagos */}
                        <Paper sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                <Typography variant="h6">Pagos Registrados</Typography>
                                {puedeGestionar &&
                                    saldoPendiente > 0 &&
                                    (parseFloat(venta.monto_pagado) + pagos.filter(p => p.estado === 'EN_REVISION').reduce((sum, p) => sum + parseFloat(p.monto), 0)) < parseFloat(venta.monto_total) &&
                                    venta.estado !== 'ENTREGADO' &&
                                    venta.estado !== 'ANULADO' && (
                                        <Button
                                            variant="outlined"
                                            startIcon={<Payment />}
                                            onClick={() => setDialogPagoOpen(true)}
                                        >
                                            Registrar Pago
                                        </Button>
                                    )}
                            </Box>

                            {pagos.length === 0 ? (
                                <Alert severity="info">No hay pagos registrados</Alert>
                            ) : (
                                <TableContainer>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Fecha</TableCell>
                                                <TableCell align="right">Monto</TableCell>
                                                <TableCell>Método</TableCell>
                                                <TableCell align="center">Estado</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pagos.map((pago) => (
                                                <TableRow key={pago.id}>
                                                    <TableCell>
                                                        {new Date(pago.fecha_pago).toLocaleString('es-BO')}
                                                    </TableCell>
                                                    <TableCell align="right">Bs. {pago.monto}</TableCell>
                                                    <TableCell>{pago.metodo_pago}</TableCell>
                                                    <TableCell align="center">
                                                        <Chip
                                                            label={pago.estado.replace('_', ' ')}
                                                            size="small"
                                                            color={
                                                                PAGO_ESTADO_COLORS[pago.estado] || 'default'
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Paper>
                    </Grid>

                    {/* Resumen Financiero */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.main', color: 'white' }}>
                            <Typography variant="h6" gutterBottom>
                                Resumen Financiero
                            </Typography>
                            <Box sx={{ my: 2 }}>
                                <Typography variant="body2">Monto Total</Typography>
                                <Typography variant="h4" fontWeight="bold">
                                    Bs. {venta.monto_total}
                                </Typography>
                            </Box>
                            <Box sx={{ my: 2, opacity: 0.9 }}>
                                <Typography variant="body2">Monto Pagado</Typography>
                                <Typography variant="h5">Bs. {venta.monto_pagado}</Typography>
                            </Box>
                            <Divider sx={{ borderColor: 'rgba(255,255,255,0.3)', my: 2 }} />
                            <Box>
                                <Typography variant="body2">Saldo Pendiente</Typography>
                                <Typography variant="h5" fontWeight="bold">
                                    Bs. {saldoPendiente.toFixed(2)}
                                </Typography>
                            </Box>
                        </Paper>

                        {/* Acciones */}
                        {puedeGestionar && (
                            <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    Acciones
                                </Typography>
                                <Grid container spacing={1}>
                                    {venta.estado === 'PAGADO' && (
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="contained"
                                                startIcon={<LocalShipping />}
                                                onClick={handleEntregar}
                                            >
                                                Marcar como Entregado
                                            </Button>
                                        </Grid>
                                    )}
                                    {venta.estado !== 'ENTREGADO' && venta.estado !== 'ANULADO' && (
                                        <Grid item xs={12}>
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                color="error"
                                                startIcon={<CancelIcon />}
                                                onClick={handleCancelar}
                                            >
                                                Anular Venta
                                            </Button>
                                        </Grid>
                                    )}
                                    <Grid item xs={12}>
                                        <Button
                                            fullWidth
                                            variant="outlined"
                                            startIcon={<Receipt />}
                                            onClick={handleGenerarVoucher}
                                            sx={{ mt: 1 }}
                                        >
                                            {saldoPendiente > 0 ? 'Recibo de Reserva' : 'Voucher de Entrega'}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}
                    </Grid>
                </Grid>

                {/* Dialog Registrar Pago */}
                <Dialog open={dialogPagoOpen} onClose={() => setDialogPagoOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Registrar Pago</DialogTitle>
                    <DialogContent>
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                fullWidth
                                required
                                label="Monto"
                                type="number"
                                value={pagoForm.monto}
                                onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                                sx={{ mb: 2 }}
                                helperText={`Saldo pendiente: Bs. ${saldoPendiente.toFixed(2)}`}
                            />
                            <TextField
                                fullWidth
                                required
                                select
                                label="Método de Pago"
                                value={pagoForm.metodo_pago}
                                onChange={(e) => setPagoForm({ ...pagoForm, metodo_pago: e.target.value })}
                                sx={{ mb: 2 }}
                            >
                                <MenuItem value="EFECTIVO">Efectivo</MenuItem>
                                <MenuItem value="TRANSFERENCIA">Transferencia</MenuItem>
                                <MenuItem value="QR">QR</MenuItem>
                                <MenuItem value="TARJETA">Tarjeta</MenuItem>
                            </TextField>
                            <Button
                                component="label"
                                variant="outlined"
                                startIcon={<AttachFile />}
                                fullWidth
                            >
                                {pagoForm.comprobante ? pagoForm.comprobante.name : 'Subir Comprobante *'}
                                <input type="file" hidden accept="image/*" onChange={handleComprobanteChange} />
                            </Button>
                            {comprobantePreview && (
                                <Box sx={{ mt: 2, textAlign: 'center' }}>
                                    <img
                                        src={comprobantePreview}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: 200 }}
                                    />
                                </Box>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDialogPagoOpen(false)}>Cancelar</Button>
                        <Button variant="contained" onClick={handleRegistrarPago}>
                            Registrar
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box >
        </LayoutDashboard >
    );
}

export default VentaDetallePage;
