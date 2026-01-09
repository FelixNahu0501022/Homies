import { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Autocomplete,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    LinearProgress,
} from '@mui/material';
import { Add, Remove, History } from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import usuariosService from '../../services/usuarios.service';
import inventarioService from '../../services/inventario.service';
import productosService from '../../services/productos.service';
import Swal from 'sweetalert2';

function GestionInventarioPage() {
    const [usuarios, setUsuarios] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [userStock, setUserStock] = useState([]);
    const [loadingStock, setLoadingStock] = useState(false);

    // Modal state
    const [openModal, setOpenModal] = useState(false);
    const [modalMode, setModalMode] = useState('ASSIGN'); // 'ASSIGN' or 'RETURN'
    const [productosGlobal, setProductosGlobal] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [amount, setAmount] = useState('');

    useEffect(() => {
        loadUsuarios();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            loadUserStock(selectedUser.id);
        } else {
            setUserStock([]);
        }
    }, [selectedUser]);

    const loadUsuarios = async () => {
        try {
            const res = await usuariosService.getUsuarios();
            if (res.success) setUsuarios(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const loadUserStock = async (id) => {
        setLoadingStock(true);
        try {
            const res = await inventarioService.getStockUsuario(id);
            if (res.success) setUserStock(res.data);
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error de Servidor',
                text: err.response?.data?.message || err.message || 'Error desconocido al cargar stock',
            });
        } finally {
            setLoadingStock(false);
        }
    };

    const handleOpenModal = async (mode) => {
        setModalMode(mode);
        setAmount('');
        setSelectedProduct(null);

        if (mode === 'ASSIGN') {
            // Cargar productos del inventario global para asignar
            try {
                const res = await productosService.getProductos();
                if (res.success) setProductosGlobal(res.data);
            } catch (err) {
                console.error(err);
            }
        }
        setOpenModal(true);
    };

    const handleSubmitMovement = async () => {
        if (!selectedProduct || !amount || amount <= 0) return;

        const payload = {
            usuario_id: selectedUser.id,
            items: [{
                producto_id: selectedProduct.id, // Si es return, hay que asegurar que selectedProduct venga del userStock o compatible
                cantidad: parseInt(amount)
            }]
        };

        try {
            let res;
            if (modalMode === 'ASSIGN') {
                res = await inventarioService.asignarStock(payload);
            } else {
                res = await inventarioService.devolverStock(payload);
            }

            if (res.success) {
                Swal.fire('Éxito', res.message || 'Movimiento realizado', 'success');
                setOpenModal(false);
                loadUserStock(selectedUser.id);
            }
        } catch (err) {
            Swal.fire('Error', err.response?.data?.message || 'Error en operación', 'error');
        }
    };

    return (
        <LayoutDashboard title="Gestión de Inventario RPP">
            <Box sx={{ p: 3 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    Administración de Stock de Vendedores
                </Typography>

                <Paper sx={{ p: 3, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Autocomplete
                                options={usuarios}
                                getOptionLabel={(u) => `${u.nombre_usuario} (${u.miembro_nombre || 'Sin nombre'})`}
                                value={selectedUser}
                                onChange={(_, v) => setSelectedUser(v)}
                                renderInput={(params) => <TextField {...params} label="Seleccionar Vendedor" />}
                            />
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="contained"
                                startIcon={<Add />}
                                disabled={!selectedUser}
                                onClick={() => handleOpenModal('ASSIGN')}
                            >
                                Asignar Stock
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<Remove />}
                                disabled={!selectedUser}
                                onClick={() => handleOpenModal('RETURN')}
                            >
                                Devolver Stock
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>

                {loadingStock && <LinearProgress sx={{ mb: 2 }} />}

                {selectedUser && (
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Producto</TableCell>
                                    <TableCell>Código</TableCell>
                                    <TableCell align="center">Stock Personal</TableCell>
                                    <TableCell align="right">Valorización</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {userStock.map((item) => (
                                    <TableRow key={item.producto_id}>
                                        <TableCell>{item.producto_nombre}</TableCell>
                                        <TableCell>{item.codigo}</TableCell>
                                        <TableCell align="center">
                                            <Chip label={item.cantidad} color="primary" variant="outlined" />
                                        </TableCell>
                                        <TableCell align="right">
                                            Bs. {(item.cantidad * parseFloat(item.precio_unitario)).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {userStock.length === 0 && !loadingStock && (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            El usuario no tiene inventario asignado.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}

                {/* Modal de Movimiento */}
                <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>
                        {modalMode === 'ASSIGN' ? 'Asignar Stock a Vendedor' : 'Devolver Stock al Almacén'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                            <Autocomplete
                                options={modalMode === 'ASSIGN' ? productosGlobal : userStock}
                                getOptionLabel={(p) => modalMode === 'ASSIGN'
                                    ? `${p.nombre} (Stock Global: ${p.stock_actual})`
                                    : `${p.producto_nombre} (En posesión: ${p.cantidad})`
                                }
                                value={selectedProduct}
                                onChange={(_, v) => {
                                    // Adaptar objeto seleccionado para usar ID consistente
                                    if (v) {
                                        const adapted = modalMode === 'ASSIGN' ? v : { id: v.producto_id, ...v };
                                        setSelectedProduct(adapted);
                                    } else {
                                        setSelectedProduct(null);
                                    }
                                }}
                                renderInput={(params) => <TextField {...params} label="Seleccionar Producto" />}
                            />
                            <TextField
                                label="Cantidad"
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                helperText={selectedProduct ? (
                                    modalMode === 'ASSIGN'
                                        ? `Disponible global: ${selectedProduct.stock_actual}`
                                        : `Disponible usuario: ${selectedProduct.cantidad}`
                                ) : ''}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                        <Button variant="contained" onClick={handleSubmitMovement}>
                            Confirmar
                        </Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LayoutDashboard>
    );
}

export default GestionInventarioPage;
