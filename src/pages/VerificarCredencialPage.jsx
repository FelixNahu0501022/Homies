import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Container,
    Paper,
    Typography,
    Avatar,
    Chip,
    CircularProgress,
    Alert,
} from "@mui/material";
import {
    CheckCircle,
    Cancel,
    Person,
} from "@mui/icons-material";
import miembrosService from "../services/miembros.service";
import { getImageUrl } from "../utils/imageUtils";

/**
 * Página PÚBLICA de verificación de credencial
 * Accesible sin autenticación mediante escaneo de QR
 */
function VerificarCredencialPage() {
    const { uuid } = useParams();
    const [loading, setLoading] = useState(true);
    const [miembro, setMiembro] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadMiembro();
    }, [uuid]);

    const loadMiembro = async () => {
        setLoading(true);
        try {
            const response = await miembrosService.getMiembroPorCredencial(uuid);
            if (response.success && response.data) {
                setMiembro(response.data);
            } else {
                setError("Credencial no encontrada");
            }
        } catch (err) {
            console.error("Error al verificar credencial:", err);
            setError("No se pudo conectar con el servidor. Por favor, intente nuevamente más tarde.");
        } finally {
            setLoading(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #7B2998 0%, #5A1A70 100%)",
                }}
            >
                <CircularProgress size={60} sx={{ color: "#FFE500" }} />
            </Box>
        );
    }

    // Error state
    if (error || !miembro) {
        return (
            <Box
                sx={{
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, #7B2998 0%, #5A1A70 100%)",
                    p: 2,
                }}
            >
                <Container maxWidth="sm">
                    {/* Logo */}
                    <Box sx={{ textAlign: "center", mb: 4 }}>
                        <img
                            src="/logo-homies.png"
                            alt="HOMIES"
                            style={{ width: "100%", maxWidth: "250px", height: "auto" }}
                        />
                    </Box>

                    <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
                        <Cancel sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
                        <Typography variant="h5" gutterBottom fontWeight={700}>
                            Credencial No Válida
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            {error}
                        </Typography>
                    </Paper>
                </Container>
            </Box>
        );
    }

    // Success state
    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(135deg, #7B2998 0%, #5A1A70 100%)",
                py: { xs: 4, sm: 6 },
                px: 2,
            }}
        >
            <Container maxWidth="sm">
                {/* Logo */}
                <Box sx={{ textAlign: "center", mb: 4 }}>
                    <img
                        src="/logo-homies.png"
                        alt="HOMIES"
                        style={{ width: "100%", maxWidth: "300px", height: "auto" }}
                    />
                </Box>

                {/* Tarjeta de verificación */}
                <Paper
                    elevation={5}
                    sx={{
                        p: { xs: 3, sm: 4 },
                        borderRadius: 4,
                        border: "3px solid #FFE500",
                    }}
                >
                    {/* Indicador de verificación */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        {miembro.es_activo ? (
                            <>
                                <CheckCircle sx={{ fontSize: 60, color: "#00D9D9", mb: 1 }} />
                                <Typography variant="h5" fontWeight={700} color="success.main">
                                    ✓ Credencial Verificada
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Miembro activo de Estación HOMIES
                                </Typography>
                            </>
                        ) : (
                            <>
                                <Cancel sx={{ fontSize: 60, color: "error.main", mb: 1 }} />
                                <Typography variant="h5" fontWeight={700} color="error.main">
                                    Credencial Inactiva
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Este miembro ya no pertenece a la estación
                                </Typography>
                            </>
                        )}
                    </Box>

                    {/* Foto y datos del miembro */}
                    <Box sx={{ textAlign: "center", mb: 3 }}>
                        <Avatar
                            src={getImageUrl(miembro.ruta_foto_perfil)}
                            alt={`${miembro.nombres} ${miembro.apellidos}`}
                            sx={{
                                width: { xs: 120, sm: 150 },
                                height: { xs: 120, sm: 150 },
                                margin: "0 auto",
                                mb: 2,
                                border: "4px solid #7B2998",
                            }}
                        >
                            <Person sx={{ fontSize: 80 }} />
                        </Avatar>

                        <Typography variant="h4" fontWeight={700} gutterBottom>
                            {miembro.nombres} {miembro.apellidos}
                        </Typography>

                        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 2 }}>
                            <Chip
                                label={`CI: ${miembro.ci}`}
                                color="primary"
                                variant="outlined"
                            />
                            <Chip label={miembro.expedido} size="small" variant="outlined" />
                        </Box>

                        {miembro.telefono && (
                            <Typography variant="body2" color="text.secondary">
                                Tel: {miembro.telefono}
                            </Typography>
                        )}
                    </Box>

                    {/* Estado */}
                    <Box sx={{ textAlign: "center", mb: 2 }}>
                        <Chip
                            label={miembro.es_activo ? "ACTIVO" : "INACTIVO"}
                            color={miembro.es_activo ? "success" : "default"}
                            sx={{ fontSize: "1rem", px: 2, py: 2.5 }}
                        />
                    </Box>

                    {/* Información adicional */}
                    <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="body2">
                            Esta credencial ha sido verificada exitosamente. Los datos mostrados
                            corresponden a un miembro registrado de la Agrupacion HOMIES.
                        </Typography>
                    </Alert>

                    {/* Fecha de emisión */}
                    <Typography
                        variant="caption"
                        display="block"
                        textAlign="center"
                        color="text.secondary"
                        sx={{ mt: 2 }}
                    >
                        Credencial emitida el{" "}
                        {new Date(miembro.fecha_creacion).toLocaleDateString("es-BO", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </Typography>
                </Paper>

                {/* Footer */}
                <Typography
                    variant="body2"
                    color="white"
                    textAlign="center"
                    sx={{ mt: 3 }}
                >
                    © {new Date().getFullYear()} Estación HOMIES
                </Typography>
            </Container>
        </Box>
    );
}

export default VerificarCredencialPage;
