import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
} from '@mui/material';
import { Inventory2 } from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import inventarioService from '../../services/inventario.service';

function MiStockPage() {
    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMiStock();
    }, []);

    const loadMiStock = async () => {
        setLoading(true);
        try {
            const response = await inventarioService.getMiStock();
            if (response.success) {
                setStock(response.data || []);
            }
        } catch (err) {
            console.error('Error MiStock:', err);
            // Mostrar error en UI si no es un simple 404
            console.log('Detalles error backend:', err.response?.data);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutDashboard title="Mi Inventario">
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                    <Inventory2 color="primary" fontSize="large" />
                    <Box>
                        <Typography variant="h5" fontWeight="bold">
                            Mi Stock Disponible
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Productos asignados a tu cuenta para venta directa.
                        </Typography>
                    </Box>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : stock.length === 0 ? (
                    <Alert severity="info">No tienes stock asignado actualmente.</Alert>
                ) : (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Código</TableCell>
                                    <TableCell align="center">Cantidad Disponible</TableCell>
                                    <TableCell align="right">Precio Unitario</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stock.map((item) => (
                                    <TableRow key={item.producto_id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                {item.imagen_url ? (
                                                    <Avatar src={item.imagen_url} sx={{ mr: 2, borderRadius: 1 }} variant="square" />
                                                ) : (
                                                    <Avatar sx={{ mr: 2, bgcolor: 'secondary.main', borderRadius: 1 }} variant="square">
                                                        {item.producto_nombre[0]}
                                                    </Avatar>
                                                )}
                                                <Typography fontWeight="bold">{item.producto_nombre}</Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={item.codigo || 'S/C'} size="small" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={item.cantidad}
                                                color={item.cantidad < 5 ? 'error' : 'success'}
                                                sx={{ minWidth: 60, fontWeight: 'bold' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            Bs. {parseFloat(item.precio_unitario).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Box>
        </LayoutDashboard>
    );
}

export default MiStockPage;
