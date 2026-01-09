import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import {
    ArrowBack,
    Save,
    PhotoCamera,
    Person,
} from "@mui/icons-material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import miembrosService from "../../services/miembros.service";
import Swal from "sweetalert2";

// Departamentos de Bolivia
const DEPARTAMENTOS = [
    { value: "LP", label: "La Paz" },
    { value: "SC", label: "Santa Cruz" },
    { value: "CB", label: "Cochabamba" },
    { value: "TJ", label: "Tarija" },
    { value: "OR", label: "Oruro" },
    { value: "PT", label: "Potosí" },
    { value: "CH", label: "Chuquisaca" },
    { value: "BE", label: "Beni" },
    { value: "PA", label: "Pando" },
];

function MiembroCrearPage() {
    const navigate = useNavigate();

    // Estados
    const [formData, setFormData] = useState({
        nombres: "",
        apellidos: "",
        ci: "",
        expedido: "LP",
        fecha_nacimiento: "",
        telefono: "",
    });
    const [foto, setFoto] = useState(null);
    const [fotoPreview, setFotoPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errores, setErrores] = useState({});

    // Manejar cambios en inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
        // Limpiar error del campo
        if (errores[name]) {
            setErrores({
                ...errores,
                [name]: "",
            });
        }
    };

    // Manejar selección de foto
    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Validar tipo de archivo
            if (!file.type.startsWith("image/")) {
                Swal.fire({
                    icon: "error",
                    title: "Archivo inválido",
                    text: "Por favor selecciona una imagen (JPG, PNG)",
                });
                return;
            }

            // Validar tamaño (max 5MB)
            if (file.size > 10 * 1024 * 1024) {
                Swal.fire({
                    icon: "error",
                    title: "Archivo muy grande",
                    text: "La imagen no debe superar los 10MB",
                });
                return;
            }

            setFoto(file);
            console.log("Archivo seleccionado:", file.name, file.size, "bytes");

            // Crear preview
            const reader = new FileReader();
            reader.onloadend = () => {
                console.log("Preview creado, longitud:", reader.result.length);
                setFotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Validar formulario
    const validarFormulario = () => {
        const nuevosErrores = {};

        // Nombres (requerido, solo letras)
        if (!formData.nombres.trim()) {
            nuevosErrores.nombres = "Los nombres son requeridos";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombres)) {
            nuevosErrores.nombres = "Solo se permiten letras";
        }

        // Apellidos (requerido, solo letras)
        if (!formData.apellidos.trim()) {
            nuevosErrores.apellidos = "Los apellidos son requeridos";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.apellidos)) {
            nuevosErrores.apellidos = "Solo se permiten letras";
        }

        // CI (requerido, solo números)
        if (!formData.ci.trim()) {
            nuevosErrores.ci = "El CI es requerido";
        } else if (!/^\d+$/.test(formData.ci)) {
            nuevosErrores.ci = "El CI debe contener solo números";
        }

        // Expedido (requerido)
        if (!formData.expedido) {
            nuevosErrores.expedido = "Selecciona un departamento";
        }

        // Teléfono (opcional, pero si se ingresa debe ser válido)
        if (formData.telefono && !/^\d{8}$/.test(formData.telefono)) {
            nuevosErrores.telefono = "El teléfono debe tener 8 dígitos";
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // Manejar submit
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validar
        if (!validarFormulario()) {
            Swal.fire({
                icon: "error",
                title: "Errores en el formulario",
                text: "Por favor corrige los errores antes de continuar",
            });
            return;
        }

        setLoading(true);

        try {
            // Crear FormData para enviar con foto
            const data = new FormData();
            data.append("nombres", formData.nombres.trim());
            data.append("apellidos", formData.apellidos.trim());
            data.append("ci", formData.ci.trim());
            data.append("expedido", formData.expedido);

            if (formData.fecha_nacimiento) {
                data.append("fecha_nacimiento", formData.fecha_nacimiento);
            }
            if (formData.telefono) {
                data.append("telefono", formData.telefono);
            }
            if (foto) {
                data.append("foto_perfil", foto);
            }

            // Enviar al backend
            const response = await miembrosService.createMiembro(data);
            console.log("Respuesta del backend al crear:", response);

            // Éxito
            Swal.fire({
                icon: "success",
                title: "¡Miembro creado!",
                text: `${formData.nombres} ${formData.apellidos} ha sido registrado exitosamente`,
                timer: 2000,
                showConfirmButton: false,
            });

            // Navegar al listado
            navigate("/miembros");
        } catch (error) {
            console.error("Error al crear miembro:", error);
            Swal.fire({
                icon: "error",
                title: "Error al crear miembro",
                text: error.message || "Ocurrió un error al crear el miembro. Intenta nuevamente.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <LayoutDashboard title="Nuevo Miembro">
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {/* Header */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <IconButton onClick={() => navigate("/miembros")}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" fontWeight={700}>
                        <Person sx={{ mr: 1, verticalAlign: "middle" }} />
                        Nuevo Miembro
                    </Typography>
                </Box>

                {/* Formulario */}
                <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={3}>
                            {/* Foto de Perfil */}
                            <Grid item xs={12} sx={{ textAlign: "center" }}>
                                <Box sx={{ position: "relative", display: "inline-block" }}>
                                    <Avatar
                                        src={fotoPreview}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            margin: "0 auto",
                                            border: `4px solid`,
                                            borderColor: "primary.main",
                                        }}
                                    >
                                        <Person sx={{ fontSize: 60 }} />
                                    </Avatar>
                                    <IconButton
                                        component="label"
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: "primary.main",
                                            color: "white",
                                            "&:hover": {
                                                backgroundColor: "primary.dark",
                                            },
                                        }}
                                    >
                                        <PhotoCamera />
                                        <input
                                            hidden
                                            accept="image/*"
                                            type="file"
                                            onChange={handleFotoChange}
                                        />
                                    </IconButton>
                                </Box>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    JPG o PNG, máximo 10MB
                                </Typography>
                            </Grid>

                            {/* Nombres */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Nombres"
                                    name="nombres"
                                    value={formData.nombres}
                                    onChange={handleChange}
                                    error={!!errores.nombres}
                                    helperText={errores.nombres}
                                    disabled={loading}
                                />
                            </Grid>

                            {/* Apellidos */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Apellidos"
                                    name="apellidos"
                                    value={formData.apellidos}
                                    onChange={handleChange}
                                    error={!!errores.apellidos}
                                    helperText={errores.apellidos}
                                    disabled={loading}
                                />
                            </Grid>

                            {/* CI */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Cédula de Identidad"
                                    name="ci"
                                    value={formData.ci}
                                    onChange={handleChange}
                                    error={!!errores.ci}
                                    helperText={errores.ci}
                                    disabled={loading}
                                    inputProps={{ inputMode: "numeric" }}
                                />
                            </Grid>

                            {/* Expedido */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    select
                                    label="Expedido en"
                                    name="expedido"
                                    value={formData.expedido}
                                    onChange={handleChange}
                                    error={!!errores.expedido}
                                    helperText={errores.expedido}
                                    disabled={loading}
                                >
                                    {DEPARTAMENTOS.map((dept) => (
                                        <MenuItem key={dept.value} value={dept.value}>
                                            {dept.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* Fecha de Nacimiento */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Fecha de Nacimiento"
                                    name="fecha_nacimiento"
                                    type="date"
                                    value={formData.fecha_nacimiento}
                                    onChange={handleChange}
                                    disabled={loading}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>

                            {/* Teléfono */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Teléfono"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    error={!!errores.telefono}
                                    helperText={errores.telefono || "8 dígitos"}
                                    disabled={loading}
                                    inputProps={{ inputMode: "numeric", maxLength: 8 }}
                                />
                            </Grid>

                            {/* Botones */}
                            <Grid item xs={12}>
                                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                    <Button
                                        variant="outlined"
                                        onClick={() => navigate("/miembros")}
                                        disabled={loading}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        startIcon={<Save />}
                                        disabled={loading}
                                    >
                                        {loading ? "Guardando..." : "Guardar Miembro"}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                </Paper>
            </Box>
        </LayoutDashboard>
    );
}

export default MiembroCrearPage;
