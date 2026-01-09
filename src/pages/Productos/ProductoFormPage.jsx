import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    TextField,
    Button,
    Typography,
    Grid,
    MenuItem,
    Avatar,
    IconButton,
    Alert,
    FormControlLabel,
    Switch,
    InputAdornment,
} from '@mui/material';
import {
    ArrowBack,
    Save,
    PhotoCamera,
    Image as ImageIcon,
} from '@mui/icons-material';
import LayoutDashboard from '../../layouts/LayoutDashboard';
import productosService from '../../services/productos.service';
import { getImageUrl } from '../../utils/imageUtils';
import Swal from 'sweetalert2';

// Tipos de productos
const TIPOS = [
    { value: 'MANILLA', label: 'Manilla' },
    { value: 'ROPA', label: 'Ropa' },
    { value: 'SOUVENIR', label: 'Souvenir' },
    { value: 'OTRO', label: 'Otro' },
];

function ProductoFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    // Estados
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        tipo: 'MANILLA',
        precio_unitario: '',
        stock_inicial: '',
        stock_actual: '',
        habilitado_venta: true,
    });
    const [imagen, setImagen] = useState(null);
    const [imagenPreview, setImagenPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errores, setErrores] = useState({});

    useEffect(() => {
        if (isEditing) {
            loadProducto();
        }
    }, [id]);

    const loadProducto = async () => {
        try {
            const response = await productosService.getProducto(id);
            if (response.success && response.data) {
                const prod = response.data;
                setFormData({
                    nombre: prod.nombre,
                    descripcion: prod.descripcion || '',
                    tipo: prod.tipo,
                    precio_unitario: prod.precio_unitario,
                    stock_inicial: prod.stock_inicial,
                    stock_actual: prod.stock_actual,
                    habilitado_venta: prod.habilitado_venta,
                });
                if (prod.ruta_imagen) {
                    setImagenPreview(getImageUrl(prod.ruta_imagen));
                }
            }
        } catch (err) {
            console.error('Error cargando producto:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo cargar el producto',
            });
        }
    };

    const handleChange = (e) => {
        const { name, value, checked } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'habilitado_venta' ? checked : value,
        });
        if (errores[name]) {
            setErrores({ ...errores, [name]: '' });
        }
    };

    const handleImagenChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo inválido',
                    text: 'Por favor selecciona una imagen (JPG, PNG)',
                });
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                Swal.fire({
                    icon: 'error',
                    title: 'Archivo muy grande',
                    text: 'La imagen no debe superar los 10MB',
                });
                return;
            }

            setImagen(file);
            console.log('Imagen seleccionada:', file.name, file.size, 'bytes');

            const reader = new FileReader();
            reader.onloadend = () => {
                setImagenPreview(reader.result);
                console.log('Preview creado correctamente');
            };
            reader.readAsDataURL(file);
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.nombre.trim()) {
            nuevosErrores.nombre = 'El nombre es obligatorio';
        }
        if (!formData.tipo) {
            nuevosErrores.tipo = 'Selecciona un tipo de producto';
        }
        if (!formData.precio_unitario || formData.precio_unitario <= 0) {
            nuevosErrores.precio_unitario = 'El precio debe ser mayor a 0';
        }
        if (!isEditing && (!formData.stock_inicial || formData.stock_inicial < 0)) {
            nuevosErrores.stock_inicial = 'El stock inicial es obligatorio';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validarFormulario()) {
            Swal.fire({
                icon: 'warning',
                title: 'Formulario incompleto',
                text: 'Por favor completa todos los campos obligatorios',
            });
            return;
        }

        setLoading(true);

        try {
            const data = new FormData();
            data.append('nombre', formData.nombre);
            data.append('descripcion', formData.descripcion);
            data.append('tipo', formData.tipo);
            data.append('precio_unitario', formData.precio_unitario);
            data.append('habilitado_venta', formData.habilitado_venta);

            if (!isEditing) {
                data.append('stock_inicial', formData.stock_inicial);
            } else {
                data.append('stock_actual', formData.stock_actual);
            }

            if (imagen) {
                data.append('imagen', imagen);
                console.log('Imagen añadida al FormData');
            }

            let response;
            if (isEditing) {
                response = await productosService.updateProducto(id, data);
            } else {
                response = await productosService.createProducto(data);
            }

            console.log('Respuesta del backend:', response);

            if (response.success) {
                await Swal.fire({
                    icon: 'success',
                    title: isEditing ? 'Producto actualizado' : 'Producto creado',
                    text: `El producto se ha ${isEditing ? 'actualizado' : 'creado'} correctamente`,
                    timer: 1500,
                    showConfirmButton: false,
                });
                navigate('/productos');
            } else {
                throw new Error(response.message || 'Error al guardar producto');
            }
        } catch (error) {
            console.error('Error al guardar producto:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response?.data?.message || error.message || 'No se pudo guardar el producto',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutDashboard title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}>
            <Box sx={{ p: 3 }}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/productos')}
                    sx={{ mb: 2 }}
                >
                    Volver
                </Button>

                <Paper sx={{ p: 3 }}>
                    <Typography variant="h5" gutterBottom fontWeight="bold">
                        {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
                    </Typography>

                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                        <Grid container spacing={3}>
                            {/* Columna Izquierda: Foto */}
                            <Grid item xs={12} md={4}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}
                                >
                                    <Avatar
                                        src={imagenPreview}
                                        variant="rounded"
                                        sx={{ width: 200, height: 200 }}
                                    >
                                        <ImageIcon sx={{ fontSize: 80 }} />
                                    </Avatar>
                                    <Button
                                        component="label"
                                        variant="outlined"
                                        startIcon={<PhotoCamera />}
                                        fullWidth
                                    >
                                        {imagenPreview ? 'Cambiar Imagen' : 'Subir Imagen'}
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleImagenChange}
                                        />
                                    </Button>
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        align="center"
                                    >
                                        JPG, PNG (Máx. 10MB)
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Columna Derecha: Formulario */}
                            <Grid item xs={12} md={8}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Nombre del Producto"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleChange}
                                            error={!!errores.nombre}
                                            helperText={errores.nombre}
                                        />
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            select
                                            label="Tipo"
                                            name="tipo"
                                            value={formData.tipo}
                                            onChange={handleChange}
                                            error={!!errores.tipo}
                                            helperText={errores.tipo}
                                        >
                                            {TIPOS.map((option) => (
                                                <MenuItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            required
                                            label="Precio Unitario"
                                            name="precio_unitario"
                                            type="number"
                                            value={formData.precio_unitario}
                                            onChange={handleChange}
                                            error={!!errores.precio_unitario}
                                            helperText={errores.precio_unitario}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">Bs.</InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>

                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            multiline
                                            rows={3}
                                            label="Descripción"
                                            name="descripcion"
                                            value={formData.descripcion}
                                            onChange={handleChange}
                                        />
                                    </Grid>

                                    {!isEditing ? (
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                required
                                                label="Stock Inicial"
                                                name="stock_inicial"
                                                type="number"
                                                value={formData.stock_inicial}
                                                onChange={handleChange}
                                                error={!!errores.stock_inicial}
                                                helperText={errores.stock_inicial}
                                            />
                                        </Grid>
                                    ) : (
                                        <>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    disabled
                                                    label="Stock Inicial"
                                                    value={formData.stock_inicial}
                                                />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField
                                                    fullWidth
                                                    required
                                                    label="Stock Actual"
                                                    name="stock_actual"
                                                    type="number"
                                                    value={formData.stock_actual}
                                                    onChange={handleChange}
                                                />
                                            </Grid>
                                        </>
                                    )}

                                    <Grid item xs={12}>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={formData.habilitado_venta}
                                                    onChange={handleChange}
                                                    name="habilitado_venta"
                                                    color="success"
                                                />
                                            }
                                            label="Habilitado para la venta"
                                        />
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>

                        {/* Botones */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: 2,
                                mt: 4,
                            }}
                        >
                            <Button variant="outlined" onClick={() => navigate('/productos')}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="contained"
                                startIcon={<Save />}
                                disabled={loading}
                            >
                                {loading ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </LayoutDashboard>
    );
}

export default ProductoFormPage;
