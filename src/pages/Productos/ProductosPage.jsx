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
    Avatar,
    Tabs,
    Tab,
} from '@mui/material';
import {
    Add,
    Search,
    Edit,
    Inventory2,
    ShoppingBasket,
    Image as ImageIcon,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import { useAuth } from '../../context/AuthContext';
import productosService from '../../services/productos.service';
import { getImageUrl } from '../../utils/imageUtils';
import Swal from 'sweetalert2';

function ProductosPage() {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { hasPermission } = useAuth();

    // Estados
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filtroTipo, setFiltroTipo] = useState('TODOS');
    const [busqueda, setBusqueda] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Tipos de productos
    const tipos = ['TODOS', 'MANILLA', 'ROPA', 'SOUVENIR', 'OTRO'];

    const puedeGestionar = hasPermission('productos.gestion');

    useEffect(() => {
        loadProductos();
    }, [filtroTipo, busqueda]);

    const loadProductos = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filtroTipo !== 'TODOS') params.tipo = filtroTipo;
            if (busqueda) params.busqueda = busqueda;

            const response = await productosService.getProductos(params);
            if (response.success) {
                setProductos(response.data || []);
            }
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudieron cargar los productos',
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

    const handleEdit = (id) => {
        navigate(`/productos/editar/${id}`);
    };

    const handleToggleStatus = async (id, nuevoEstado) => {
        try {
            const response = await productosService.toggleEstado(id, nuevoEstado);
            if (response.success) {
                setProductos(prev =>
                    prev.map(p => (p.id === id ? { ...p, habilitado_venta: nuevoEstado } : p))
                );
                Swal.fire({
                    icon: 'success',
                    title: 'Éxito',
                    text: `Producto ${nuevoEstado ? 'habilitado' : 'deshabilitado'} correctamente`,
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        } catch (err) {
            console.error('Error al cambiar estado:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cambiar el estado del producto',
            });
        }
    };

    // Paginación local
    const productosPaginados = productos.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    return (
        <LayoutDashboard title="Productos">
            <Box>
                {/* Barra superior de acciones */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        mb: 3,
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                    }}
                >
                    <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                        Gestión de Productos
                    </Typography>
                    {puedeGestionar && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => navigate('/productos/crear')}
                            fullWidth={isMobile}
                            size={isMobile ? "medium" : "large"}
                        >
                            Nuevo Producto
                        </Button>
                    )}
                </Box>

                {/* Filtros y Búsqueda */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                placeholder="Buscar productos..."
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
                                value={filtroTipo}
                                onChange={(e, v) => setFiltroTipo(v)}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                {tipos.map((tipo) => (
                                    <Tab key={tipo} label={tipo} value={tipo} />
                                ))}
                            </Tabs>
                        </Grid>
                    </Grid>
                </Paper>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                        <CircularProgress />
                    </Box>
                ) : productos.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center' }}>
                        <ShoppingBasket sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No se encontraron productos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {busqueda
                                ? 'Intenta cambiar los filtros de búsqueda'
                                : 'Comienza agregando tu primer producto'}
                        </Typography>
                    </Paper>
                ) : isMobile ? (
                    /* Vista móvil: Cards */
                    <>
                        <Grid container spacing={2}>
                            {productosPaginados.map((producto) => (
                                <Grid item xs={12} key={producto.id}>
                                    <Card>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Avatar
                                                    src={getImageUrl(producto.ruta_imagen)}
                                                    variant="rounded"
                                                    sx={{ width: 80, height: 80 }}
                                                >
                                                    <ImageIcon />
                                                </Avatar>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="h6" gutterBottom>
                                                        {producto.nombre}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                                                        <Chip
                                                            label={producto.tipo}
                                                            size="small"
                                                            color="primary"
                                                            variant="outlined"
                                                        />
                                                        <Chip
                                                            label={
                                                                producto.habilitado_venta
                                                                    ? 'En Venta'
                                                                    : 'No Disponible'
                                                            }
                                                            size="small"
                                                            color={
                                                                producto.habilitado_venta
                                                                    ? 'success'
                                                                    : 'default'
                                                            }
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Precio: Bs. {producto.precio_unitario}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Stock: {producto.stock_actual}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                        <CardActions>
                                            {puedeGestionar && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        startIcon={<Edit />}
                                                        onClick={() => handleEdit(producto.id)}
                                                    >
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        size="small"
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                producto.id,
                                                                !producto.habilitado_venta
                                                            )
                                                        }
                                                    >
                                                        {producto.habilitado_venta
                                                            ? 'Deshabilitar'
                                                            : 'Habilitar'}
                                                    </Button>
                                                </>
                                            )}
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                        <TablePagination
                            component="div"
                            count={productos.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Productos por página:"
                            labelDisplayedRows={({ from, to, count }) =>
                                `${from}-${to} de ${count}`
                            }
                        />
                    </>
                ) : (
                    /* Vista escritorio: Tabla */
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Imagen</TableCell>
                                    <TableCell>Nombre</TableCell>
                                    <TableCell>Tipo</TableCell>
                                    <TableCell align="right">Precio</TableCell>
                                    <TableCell align="center">Stock</TableCell>
                                    <TableCell align="center">Estado</TableCell>
                                    {puedeGestionar && <TableCell align="center">Acciones</TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {productosPaginados.map((producto) => (
                                    <TableRow key={producto.id} hover>
                                        <TableCell>
                                            <Avatar
                                                src={getImageUrl(producto.ruta_imagen)}
                                                variant="rounded"
                                            >
                                                <ImageIcon />
                                            </Avatar>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" fontWeight="bold">
                                                {producto.nombre}
                                            </Typography>
                                            {producto.descripcion && (
                                                <Typography
                                                    variant="caption"
                                                    color="text.secondary"
                                                    sx={{
                                                        display: '-webkit-box',
                                                        WebkitLineClamp: 1,
                                                        WebkitBoxOrient: 'vertical',
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    {producto.descripcion}
                                                </Typography>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                label={producto.tipo}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" fontWeight="bold">
                                                Bs. {producto.precio_unitario}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={producto.stock_actual}
                                                size="small"
                                                color={producto.stock_actual > 0 ? 'success' : 'error'}
                                            />
                                        </TableCell>
                                        <TableCell align="center">
                                            <Chip
                                                label={
                                                    producto.habilitado_venta ? 'En Venta' : 'No Disponible'
                                                }
                                                size="small"
                                                color={producto.habilitado_venta ? 'success' : 'default'}
                                            />
                                        </TableCell>
                                        {puedeGestionar && (
                                            <TableCell align="center">
                                                <Tooltip title="Editar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEdit(producto.id)}
                                                    >
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip
                                                    title={
                                                        producto.habilitado_venta
                                                            ? 'Deshabilitar'
                                                            : 'Habilitar'
                                                    }
                                                >
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            handleToggleStatus(
                                                                producto.id,
                                                                !producto.habilitado_venta
                                                            )
                                                        }
                                                    >
                                                        <Inventory2 fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        <TablePagination
                            component="div"
                            count={productos.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            labelRowsPerPage="Productos por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                        />
                    </TableContainer>
                )}
            </Box>
        </LayoutDashboard>
    );
}

export default ProductosPage;
