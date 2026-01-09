import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
    CircularProgress,
} from "@mui/material";
import {
    ArrowBack,
    Save,
    PhotoCamera,
    Person,
} from "@mui/icons-material";
import LayoutDashboard from "../../layouts/LayoutDashboard";
import miembrosService from "../../services/miembros.service";
import { getImageUrl } from "../../utils/imageUtils";
import Swal from "sweetalert2";

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

function MiembroEditarPage() {
    const { id } = useParams();
    const navigate = useNavigate();

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
    const [fotoActual, setFotoActual] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errores, setErrores] = useState({});

    // Cargar datos del miembro
    useEffect(() => {
        loadMiembro();
    }, [id]);

    const loadMiembro = async () => {
        try {
            const response = await miembrosService.getMiembroById(id);
            const miembro = response.data;

            setFormData({
                nombres: miembro.nombres || "",
                apellidos: miembro.apellidos || "",
                ci: miembro.ci || "",
                expedido: miembro.expedido || "LP",
                fecha_nacimiento: miembro.fecha_nacimiento?.split("T")[0] || "",
                telefono: miembro.telefono || "",
            });
            setFotoActual(miembro.ruta_foto_perfil);
        } catch (error) {
            console.error("Error al cargar miembro:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "No se pudo cargar el miembro",
            }).then(() => navigate("/miembros"));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (errores[name]) {
            setErrores({ ...errores, [name]: "" });
        }
    };

    const handleFotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                Swal.fire({
                    icon: "error",
                    title: "Archivo inválido",
                    text: "Por favor selecciona una imagen (JPG, PNG)",
                });
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                Swal.fire({
                    icon: "error",
                    title: "Archivo muy grande",
                    text: "La imagen no debe superar los 10MB",
                });
                return;
            }

            setFoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotoPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};
        if (!formData.nombres.trim()) {
            nuevosErrores.nombres = "Los nombres son requeridos";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.nombres)) {
            nuevosErrores.nombres = "Solo se permiten letras";
        }
        if (!formData.apellidos.trim()) {
            nuevosErrores.apellidos = "Los apellidos son requeridos";
        } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formData.apellidos)) {
            nuevosErrores.apellidos = "Solo se permiten letras";
        }
        if (!formData.ci.trim()) {
            nuevosErrores.ci = "El CI es requerido";
        } else if (!/^\d+$/.test(formData.ci)) {
            nuevosErrores.ci = "El CI debe contener solo números";
        }
        if (formData.telefono && !/^\d{8}$/.test(formData.telefono)) {
            nuevosErrores.telefono = "El teléfono debe tener 8 dígitos";
        }
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validarFormulario()) {
            Swal.fire({
                icon: "error",
                title: "Errores en el formulario",
                text: "Por favor corrige los errores antes de continuar",
            });
            return;
        }

        setSaving(true);
        try {
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

            await miembrosService.updateMiembro(id, data);

            Swal.fire({
                icon: "success",
                title: "¡Miembro actualizado!",
                text: `${formData.nombres} ${formData.apellidos} ha sido actualizado exitosamente`,
                timer: 2000,
                showConfirmButton: false,
            });

            navigate("/miembros");
        } catch (error) {
            console.error("Error al actualizar miembro:", error);
            Swal.fire({
                icon: "error",
                title: "Error al actualizar",
                text: error.message || "Ocurrió un error al actualizar el miembro",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <LayoutDashboard title="Editar Miembro">
                <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                    <CircularProgress />
                </Box>
            </LayoutDashboard>
        );
    }

    const imagenMostrar = fotoPreview || getImageUrl(fotoActual);

    return (
        <LayoutDashboard title="Editar Miembro">
            <Box sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
                    <IconButton onClick={() => navigate("/miembros")}>
                        <ArrowBack />
                    </IconButton>
                    <Typography variant="h5" fontWeight={700}>
                        <Person sx={{ mr: 1, verticalAlign: "middle" }} />
                        Editar Miembro
                    </Typography>
                </Box>

                <Paper sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sx={{ textAlign: "center" }}>
                                <Box sx={{ position: "relative", display: "inline-block" }}>
                                    <Avatar
                                        src={imagenMostrar}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            margin: "0 auto",
                                            border: `4px solid`,
                                            borderColor: "primary.main",
                                        }}
                                    >
                                        {formData.nombres[0]}{formData.apellidos[0]}
                                    </Avatar>
                                    <IconButton
                                        component="label"
                                        sx={{
                                            position: "absolute",
                                            bottom: 0,
                                            right: 0,
                                            backgroundColor: "primary.main",
                                            color: "white",
                                            "&:hover": { backgroundColor: "primary.dark" },
                                        }}
                                    >
                                        <PhotoCamera />
                                        <input hidden accept="image/*" type="file" onChange={handleFotoChange} />
                                    </IconButton>
                                </Box>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    {foto ? "Nueva imagen seleccionada" : "JPG o PNG, máximo 10MB"}
                                </Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField fullWidth required label="Nombres" name="nombres" value={formData.nombres} onChange={handleChange} error={!!errores.nombres} helperText={errores.nombres} disabled={saving} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth required label="Apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} error={!!errores.apellidos} helperText={errores.apellidos} disabled={saving} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth required label="Cédula de Identidad" name="ci" value={formData.ci} onChange={handleChange} error={!!errores.ci} helperText={errores.ci} disabled={saving} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth required select label="Expedido en" name="expedido" value={formData.expedido} onChange={handleChange} disabled={saving}>
                                    {DEPARTAMENTOS.map((dept) => (
                                        <MenuItem key={dept.value} value={dept.value}>{dept.label}</MenuItem>
                                    ))}
                                </TextField>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Fecha de Nacimiento" name="fecha_nacimiento" type="date" value={formData.fecha_nacimiento} onChange={handleChange} disabled={saving} InputLabelProps={{ shrink: true }} />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField fullWidth label="Teléfono" name="telefono" value={formData.telefono} onChange={handleChange} error={!!errores.telefono} helperText={errores.telefono || "8 dígitos"} disabled={saving} inputProps={{ maxLength: 8 }} />
                            </Grid>

                            <Grid item xs={12}>
                                <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                                    <Button variant="outlined" onClick={() => navigate("/miembros")} disabled={saving}>Cancelar</Button>
                                    <Button type="submit" variant="contained" startIcon={<Save />} disabled={saving}>
                                        {saving ? "Guardando..." : "Guardar Cambios"}
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

export default MiembroEditarPage;
