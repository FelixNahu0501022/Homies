import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Grid,
    Autocomplete,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    InputAdornment,
    Divider,
    Alert,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Avatar,
} from '@mui/material';
import {
    ArrowBack,
    Save,
    Add,
    Remove,
    Delete,
    Search,
    ShoppingCart,
    Image as ImageIcon,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import miembrosService from '../../services/miembros.service';
import productosService from '../../services/productos.service';
import ventasService from '../../services/ventas.service';
import inventarioService from '../../services/inventario.service';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/imageUtils';
import Swal from 'sweetalert2';

function VentaCrearPage() {
    const navigate = useNavigate();
    const { hasPermission, hasRole, user } = useAuth();

    // Definición estricta: Es RPP si tiene el rol 'rpp' y NO es 'admin'.
    // Si es admin, siempre ve todo el stock.
    const isRPP = hasRole('rpp') && !hasRole('admin');

    const [miembros, setMiembros] = useState([]);
    const [productos, setProductos] = useState([]);
    const [compradorSeleccionado, setCompradorSeleccionado] = useState(null);
    const [busquedaProducto, setBusquedaProducto] = useState('');
    const [carrito, setCarrito] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadMiembros();
        loadProductos();
    }, []);

    const loadMiembros = async () => {
        try {
            const response = await miembrosService.getMiembros({ estado: true, limite: 500 });
            if (response.success) {
                setMiembros(response.data || []);
            }
        } catch (err) {
            console.error('Error al cargar miembros:', err);
        }
    };

    const loadProductos = async () => {
        try {
            if (isRPP) {
                // Modo RPP: Cargar Mi Stock
                const response = await inventarioService.getMiStock();
                if (response.success) {
                    // Adaptar respuesta de mi-stock a estructura de productos
                    const stockPersonal = response.data.map(item => ({
                        id: item.producto_id,
                        nombre: item.producto_nombre,
                        precio_unitario: item.precio_unitario,
                        stock_actual: item.cantidad,
                        tipo: "ASIGNADO", // O el tipo real si viene
                        ruta_imagen: item.imagen_url,
                        codigo: item.codigo
                    }));
                    setProductos(stockPersonal);
                }
            } else {
                // Modo Admin: Cargar Productos Globales
                const response = await productosService.getProductos({ habilitado_venta: true });
                if (response.success) {
                    setProductos(response.data || []);
                }
            }
        } catch (err) {
            console.error('Error al cargar productos/stock:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error de Sistema',
                text: `No se pudo cargar el inventario: ${err.response?.data?.message || err.message}`,
            });
        }
    };

    const productosFiltrados = productos.filter(
        (p) =>
            p.stock_actual > 0 &&
            (p.nombre.toLowerCase().includes(busquedaProducto.toLowerCase()) ||
                p.tipo.toLowerCase().includes(busquedaProducto.toLowerCase()))
    );

    const agregarAlCarrito = (producto) => {
        const existe = carrito.find((item) => item.producto_id === producto.id);
        if (existe) {
            if (existe.cantidad < producto.stock_actual) {
                setCarrito(
                    carrito.map((item) =>
                        item.producto_id === producto.id
                            ? { ...item, cantidad: item.cantidad + 1 }
                            : item
                    )
                );
            } else {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stock insuficiente',
                    text: `Solo hay ${producto.stock_actual} unidades disponibles`,
                    timer: 2000,
                    showConfirmButton: false,
                });
            }
        } else {
            setCarrito([
                ...carrito,
                {
                    producto_id: producto.id,
                    nombre: producto.nombre,
                    precio: producto.precio_unitario,
                    cantidad: 1,
                    stock_disponible: producto.stock_actual,
                },
            ]);
        }
    };

    const modificarCantidad = (producto_id, delta) => {
        setCarrito((prev) =>
            prev
                .map((item) => {
                    if (item.producto_id === producto_id) {
                        const nuevaCantidad = item.cantidad + delta;
                        if (nuevaCantidad <= 0) return null;
                        if (nuevaCantidad > item.stock_disponible) {
                            Swal.fire({
                                icon: 'warning',
                                title: 'Stock insuficiente',
                                timer: 1500,
                                showConfirmButton: false,
                            });
                            return item;
                        }
                        return { ...item, cantidad: nuevaCantidad };
                    }
                    return item;
                })
                .filter(Boolean)
        );
    };

    const eliminarDelCarrito = (producto_id) => {
        setCarrito(carrito.filter((item) => item.producto_id !== producto_id));
    };

    const calcularTotal = () => {
        return carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0).toFixed(2);
    };

    const handleSubmit = async () => {
        if (!compradorSeleccionado) {
            Swal.fire({
                icon: 'warning',
                title: 'Comprador requerido',
                text: 'Por favor selecciona un comprador',
            });
            return;
        }

        if (carrito.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Carrito vacío',
                text: 'Agrega al menos un producto',
            });
            return;
        }

        setLoading(true);

        try {
            const data = {
                comprador_miembro_id: compradorSeleccionado.id,
                items: carrito.map((item) => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                })),
            };

            const response = await ventasService.createVenta(data);

            if (response.success) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Venta creada',
                    text: `Venta #${response.data.id} creada correctamente`,
                    timer: 2000,
                    showConfirmButton: false,
                });
                navigate(`/ventas/${response.data.id}`);
            }
        } catch (err) {
            console.error('Error al crear venta:', err);

            // Manejo específico para error de stock (400)
            if (err.response?.status === 400 && err.response?.data?.message?.includes('stock')) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Stock Insuficiente',
                    text: err.response.data.message,
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: err.response?.data?.message || 'No se pudo crear la venta',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutDashboard title="Nueva Venta">
            <Box sx={{ p: 3 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/ventas')} sx={{ mb: 2 }}>
                    Volver
                </Button>

                <Grid container spacing={3}>
                    {/* Columna Izquierda: Selector de Comprador + Productos */}
                    <Grid item xs={12} md={8}>
                        {/* Selector de Comprador */}
                        <Paper sx={{ p: 3, mb: 3 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                1. Selecciona el Comprador
                            </Typography>
                            <Autocomplete
                                options={miembros}
                                getOptionLabel={(option) =>
                                    `${option.nombres} ${option.apellidos} (CI: ${option.ci})`
                                }
                                value={compradorSeleccionado}
                                onChange={(e, newValue) => setCompradorSeleccionado(newValue)}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Buscar miembro"
                                        placeholder="Escribe nombre, apellido o CI..."
                                    />
                                )}
                            />
                        </Paper>

                        {/* Productos Disponibles */}
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom fontWeight="bold">
                                2. Agrega Productos al Carrito
                                <Typography component="span" variant="subtitle2" sx={{ ml: 2, color: isRPP ? 'info.main' : 'warning.main' }}>
                                    ({isRPP ? 'Stock Personal' : 'Stock Global'})
                                </Typography>
                            </Typography>
                            <TextField
                                fullWidth
                                placeholder="Buscar productos..."
                                value={busquedaProducto}
                                onChange={(e) => setBusquedaProducto(e.target.value)}
                                sx={{ mb: 3 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search />
                                        </InputAdornment>
                                    ),
                                }}
                            />

                            <Grid container spacing={2}>
                                {productosFiltrados.length === 0 ? (
                                    <Grid item xs={12}>
                                        <Alert severity="info">
                                            No hay productos disponibles con stock
                                        </Alert>
                                    </Grid>
                                ) : (
                                    productosFiltrados.map((producto) => {
                                        const enCarrito = carrito.find(
                                            (item) => item.producto_id === producto.id
                                        );
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={producto.id}>
                                                <Card
                                                    sx={{
                                                        height: '100%',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        cursor: 'pointer',
                                                        '&:hover': {
                                                            boxShadow: 4,
                                                        },
                                                    }}
                                                    onClick={() => agregarAlCarrito(producto)}
                                                >
                                                    <Box
                                                        sx={{
                                                            height: 120,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: '#f5f5f5',
                                                        }}
                                                    >
                                                        {producto.ruta_imagen ? (
                                                            <CardMedia
                                                                component="img"
                                                                height="120"
                                                                image={getImageUrl(producto.ruta_imagen)}
                                                                alt={producto.nombre}
                                                                sx={{ objectFit: 'contain' }}
                                                            />
                                                        ) : (
                                                            <Avatar sx={{ width: 60, height: 60 }}>
                                                                <ImageIcon />
                                                            </Avatar>
                                                        )}
                                                    </Box>
                                                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                                                        <Typography
                                                            variant="subtitle2"
                                                            fontWeight="bold"
                                                            gutterBottom
                                                            noWrap
                                                        >
                                                            {producto.nombre}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="text.secondary"
                                                            display="block"
                                                        >
                                                            {producto.tipo}
                                                        </Typography>
                                                        <Typography
                                                            variant="h6"
                                                            color="primary"
                                                            fontWeight="bold"
                                                        >
                                                            Bs. {producto.precio_unitario}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Stock: {producto.stock_actual}
                                                        </Typography>
                                                    </CardContent>
                                                    <CardActions>
                                                        <Button
                                                            fullWidth
                                                            variant={enCarrito ? 'contained' : 'outlined'}
                                                            startIcon={<Add />}
                                                            size="small"
                                                        >
                                                            {enCarrito
                                                                ? `En carrito (${enCarrito.cantidad})`
                                                                : 'Agregar'}
                                                        </Button>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        );
                                    })
                                )}
                            </Grid>
                        </Paper>
                    </Grid>

                    {/* Columna Derecha: Carrito */}
                    <Grid item xs={12} md={4}>
                        <Paper
                            sx={{
                                p: 3,
                                position: 'sticky',
                                top: 16,
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                <ShoppingCart />
                                <Typography variant="h6" fontWeight="bold">
                                    Carrito ({carrito.length})
                                </Typography>
                            </Box>

                            <Divider sx={{ mb: 2 }} />

                            {carrito.length === 0 ? (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    El carrito está vacío
                                </Alert>
                            ) : (
                                <>
                                    <Box sx={{ maxHeight: 400, overflow: 'auto', mb: 2 }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Producto</TableCell>
                                                    <TableCell align="center">Cant.</TableCell>
                                                    <TableCell align="right">Subtotal</TableCell>
                                                    <TableCell></TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {carrito.map((item) => (
                                                    <TableRow key={item.producto_id}>
                                                        <TableCell>
                                                            <Typography variant="caption">
                                                                {item.nombre}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Box
                                                                sx={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 0.5,
                                                                }}
                                                            >
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        modificarCantidad(
                                                                            item.producto_id,
                                                                            -1
                                                                        )
                                                                    }
                                                                >
                                                                    <Remove fontSize="small" />
                                                                </IconButton>
                                                                <Typography variant="body2">
                                                                    {item.cantidad}
                                                                </Typography>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={() =>
                                                                        modificarCantidad(item.producto_id, 1)
                                                                    }
                                                                >
                                                                    <Add fontSize="small" />
                                                                </IconButton>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {(item.precio * item.cantidad).toFixed(2)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <IconButton
                                                                size="small"
                                                                color="error"
                                                                onClick={() =>
                                                                    eliminarDelCarrito(item.producto_id)
                                                                }
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    <Box
                                        sx={{
                                            p: 2,
                                            bgcolor: 'primary.main',
                                            color: 'white',
                                            borderRadius: 2,
                                            mb: 2,
                                        }}
                                    >
                                        <Typography variant="body2">Total</Typography>
                                        <Typography variant="h4" fontWeight="bold">
                                            Bs. {calcularTotal()}
                                        </Typography>
                                    </Box>

                                    <Button
                                        fullWidth
                                        variant="contained"
                                        size="large"
                                        startIcon={<Save />}
                                        onClick={handleSubmit}
                                        disabled={loading || !compradorSeleccionado}
                                    >
                                        {loading ? 'Creando...' : 'Crear Venta'}
                                    </Button>
                                </>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </LayoutDashboard>
    );
}

export default VentaCrearPage;
