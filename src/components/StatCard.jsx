import {
  Card,
  CardContent,
  Typography,
  Box,
  Fade,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { Person, LocalFireDepartment, School } from "@mui/icons-material";

export default function StatCard({ title, value, color, icon }) {
  const theme = useTheme();
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

  const iconMap = {
    person: <Person sx={{ fontSize: isSmall ? 36 : 46 }} />,
    local_fire_department: <LocalFireDepartment sx={{ fontSize: isSmall ? 36 : 46 }} />,
    school: <School sx={{ fontSize: isSmall ? 36 : 46 }} />,
  };

  const gradientMap = {
    primary: `linear-gradient(135deg, ${theme.palette.primary.light}, ${theme.palette.primary.main})`,
    success: `linear-gradient(135deg, ${theme.palette.success.light}, ${theme.palette.success.main})`,
    error: `linear-gradient(135deg, ${theme.palette.error.light}, ${theme.palette.error.main})`,
  };

  return (
    <Fade in timeout={600}>
      <Card
        elevation={6}
        sx={{
          borderRadius: 3,
          color: "#fff",
          background: gradientMap[color] || theme.palette.primary.main,
          boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
          transition: "transform 0.25s ease, box-shadow 0.25s ease",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          },
        }}
      >
        <CardContent sx={{ p: isSmall ? 2 : 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ opacity: 0.9, fontSize: isSmall ? "0.8rem" : "0.9rem" }}
              >
                {title}
              </Typography>
              <Typography
                variant={isSmall ? "h5" : "h4"}
                sx={{ fontWeight: 700, mt: 0.5, lineHeight: 1 }}
              >
                {value}
              </Typography>
            </Box>
            <Box
              sx={{
                opacity: 0.85,
                background: "rgba(255,255,255,0.15)",
                borderRadius: "50%",
                p: isSmall ? 1 : 1.5,
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
