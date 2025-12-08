import {
  Card,
  CardContent,
  Typography,
  Box,
  Fade,
  useTheme,
  useMediaQuery,
  Skeleton,
  CircularProgress,
} from "@mui/material";
import {
  Person,
  LocalFireDepartment,
  School,
  Inventory,
  Warning,
  DirectionsCar
} from "@mui/icons-material";

export default function StatCard({
  title,
  value,
  subtitle,
  color,
  icon,
  loading = false,
  onClick,
  showWarning = false
}) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const iconMap = {
    person: <Person sx={{ fontSize: { xs: 32, sm: 38, md: 46 } }} />,
    local_fire_department: <LocalFireDepartment sx={{ fontSize: { xs: 32, sm: 38, md: 46 } }} />,
    school: <School sx={{ fontSize: { xs: 32, sm: 38, md: 46 } }} />,
    inventory: <Inventory sx={{ fontSize: { xs: 32, sm: 38, md: 46 } }} />,
    directions_car: <DirectionsCar sx={{ fontSize: { xs: 32, sm: 38, md: 46 } }} />,
    warning: <Warning sx={{ fontSize: { xs: 32, sm: 38, md: 46 } }} />,
  };

  const gradientMap = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    success: `linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
    error: `linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`,
    warning: `linear-gradient(135deg, ${theme.palette.warning.light}, ${theme.palette.warning.main})`,
    info: `linear-gradient(135deg, ${theme.palette.info.light}, ${theme.palette.info.main})`,
  };

  return (
    <Fade in timeout={600}>
      <Card
        elevation={3}
        onClick={onClick}
        sx={{
          borderRadius: { xs: 2, sm: 2.5, md: 3 },
          color: "#fff",
          background: gradientMap[color] || theme.palette.primary.main,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          cursor: onClick ? "pointer" : "default",
          position: "relative",
          height: "100%",
          minHeight: { xs: 140, sm: 150, md: 160 },
          "&:hover": {
            transform: onClick ? "translateY(-6px)" : "translateY(-2px)",
            boxShadow: onClick ? "0 12px 32px rgba(0,0,0,0.18)" : "0 10px 28px rgba(0,0,0,0.15)",
          },
        }}
      >
        {showWarning && (
          <Box
            sx={{
              position: "absolute",
              top: { xs: 8, sm: 10, md: 12 },
              right: { xs: 8, sm: 10, md: 12 },
              background: "rgba(255,255,255,0.25)",
              borderRadius: "50%",
              p: { xs: 0.5, sm: 0.625, md: 0.75 },
              animation: "pulse 2s infinite",
              "@keyframes pulse": {
                "0%, 100%": {
                  opacity: 1,
                },
                "50%": {
                  opacity: 0.6,
                },
              },
            }}
          >
            <Warning sx={{ fontSize: { xs: 16, sm: 18, md: 20 } }} />
          </Box>
        )}

        <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 }, height: "100%" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              height: "100%",
            }}
          >
            <Box sx={{ flex: 1, pr: { xs: 1, sm: 1.5, md: 2 } }}>
              <Typography
                variant="subtitle2"
                sx={{
                  opacity: 0.95,
                  fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.9rem" },
                  fontWeight: 600,
                  mb: { xs: 0.5, sm: 0.75, md: 1 },
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {title}
              </Typography>

              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                  <CircularProgress size={isSmall ? 24 : 28} sx={{ color: "#fff" }} />
                  <Typography variant="body2" sx={{ ml: 1.5, opacity: 0.9, fontSize: { xs: "0.75rem", sm: "0.875rem" } }}>
                    Cargando...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography
                    variant={isSmall ? "h5" : "h3"}
                    sx={{
                      fontWeight: 800,
                      mt: 0.5,
                      lineHeight: 1,
                      mb: subtitle ? { xs: 0.5, sm: 0.75, md: 1 } : 0,
                      fontSize: { xs: "1.75rem", sm: "2.25rem", md: "3rem" },
                    }}
                  >
                    {value}
                  </Typography>
                  {subtitle && (
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.9,
                        fontSize: { xs: "0.65rem", sm: "0.7rem", md: "0.75rem" },
                        display: "block",
                        fontWeight: 500,
                      }}
                    >
                      {subtitle}
                    </Typography>
                  )}
                </>
              )}
            </Box>

            <Box
              sx={{
                opacity: 0.9,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                p: { xs: 1.25, sm: 1.5, md: 2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(10px)",
              }}
            >
              {iconMap[icon]}
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Fade>
  );
}
