import { useEffect, useState } from "react";
import { Typography, Box, Paper, Chip, Avatar, Grid } from "@mui/material";
import { Person, Security, VerifiedUser } from "@mui/icons-material";
import { motion } from "framer-motion";
import LayoutDashboard from "../layouts/LayoutDashboard";
import { useAuth } from "../context/AuthContext";
import authService from "../services/auth.service";
import AnimatedCard from "../components/AnimatedCard";

function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Cargar datos actualizados del usuario al montar
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        const response = await authService.getMe();
        if (response.success) {
          updateUser(response.data);
        }
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
      } finally {
        setLoading(false);
      }
    };

    // Solo cargar si no tenemos datos completos del usuario
    if (user && !user.permisos) {
      fetchUserData();
    }
  }, []);

  return (
    <LayoutDashboard title="Dashboard">
      <Box>
        {/* Tarjeta de Bienvenida */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper
            sx={{
              p: { xs: 3, sm: 4 },
              mb: 3,
              background: 'linear-gradient(135deg, #7B2998 0%, #5A1E72 50%, #3D1450 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(123, 41, 152, 0.4)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(255, 229, 0, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, position: 'relative', zIndex: 1 }}>
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0 0 0px rgba(255, 229, 0, 0.4)',
                    '0 0 20px rgba(255, 229, 0, 0.8)',
                    '0 0 0px rgba(255, 229, 0, 0.4)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                style={{ borderRadius: '50%' }}
              >
                <Avatar sx={{ width: 70, height: 70, bgcolor: '#FFE500', color: '#000', border: '3px solid rgba(255,255,255,0.3)' }}>
                  <Person fontSize="large" />
                </Avatar>
              </motion.div>
              <Box>
                <Typography variant="h4" fontWeight={800} sx={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
                  ¡Bienvenido{user?.miembro_nombre ? `, ${user.miembro_nombre}!` : '!'}
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 500 }}>
                  @{user?.nombre_usuario}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </motion.div>

        {/* Información del Usuario */}
        {user && (
          <Grid container spacing={3}>
            {/* Roles */}
            <Grid item xs={12} md={6}>
              <AnimatedCard delay={0.2} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ display: 'flex' }}
                  >
                    <Security sx={{ color: 'primary.main', fontSize: 28 }} />
                  </motion.div>
                  <Typography variant="h6" fontWeight={700} sx={{
                    background: 'linear-gradient(135deg, #7B2998 0%, #FF6B35 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Roles
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {user.roles && user.roles.length > 0 ? (
                    user.roles.map((rol, index) => (
                      <motion.div
                        key={rol}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <Chip
                          label={rol.toUpperCase()}
                          sx={{
                            background: 'linear-gradient(135deg, #7B2998 0%, #9B4DB8 100%)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            boxShadow: '0 2px 10px rgba(123, 41, 152, 0.3)',
                          }}
                        />
                      </motion.div>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Sin roles asignados
                    </Typography>
                  )}
                </Box>
              </AnimatedCard>
            </Grid>

            {/* Permisos */}
            <Grid item xs={12} md={6}>
              <AnimatedCard delay={0.4} sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ display: 'flex' }}
                  >
                    <VerifiedUser sx={{ color: 'secondary.main', fontSize: 28 }} />
                  </motion.div>
                  <Typography variant="h6" fontWeight={700} sx={{
                    background: 'linear-gradient(135deg, #FFE500 0%, #00D4FF 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    Permisos
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, maxHeight: 200, overflow: 'auto' }}>
                  {user.permisos && user.permisos.length > 0 ? (
                    user.permisos.map((permiso, index) => (
                      <motion.div
                        key={permiso}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <Chip
                          label={permiso}
                          sx={{
                            background: 'rgba(255, 229, 0, 0.1)',
                            color: '#FFE500',
                            borderColor: '#FFE500',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            border: '1.5px solid',
                          }}
                          size="small"
                        />
                      </motion.div>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Cargando permisos...
                    </Typography>
                  )}
                </Box>
              </AnimatedCard>
            </Grid>

            {/* Información Adicional */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="h5" gutterBottom fontWeight={600}>
                    Estación HOMIES
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Sistema de Gestión
                  </Typography>
                  <Box sx={{ mt: 3 }}>
                    <motion.img
                      src="/mascota-homies.jpg"
                      alt="Mascota HOMIES"
                      style={{
                        width: '150px',
                        height: 'auto',
                        borderRadius: '50%',
                        border: '4px solid #FFE500'
                      }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Comienza a gestionar tus módulos desde el menú lateral
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        )
        }
      </Box >
    </LayoutDashboard >
  );
}

export default DashboardPage;
