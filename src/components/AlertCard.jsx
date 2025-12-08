import {
    Card,
    CardContent,
    Typography,
    Box,
    Fade,
    useTheme,
    useMediaQuery,
    List,
    ListItem,
    ListItemText,
    Chip,
    Divider,
    CircularProgress,
} from "@mui/material";
import { Warning, CheckCircle, Error, Info } from "@mui/icons-material";

export default function AlertCard({
    title,
    alerts = [],
    loading = false,
    severity = "warning", // warning, error, info, success
    icon,
    emptyMessage = "No hay alertas"
}) {
    const theme = useTheme();
    const isSmall = useMediaQuery(theme.breakpoints.down("sm"));

    const severityConfig = {
        warning: {
            color: theme.palette.warning.main,
            bgColor: theme.palette.warning.light,
            lightBg: "rgba(255, 152, 0, 0.08)",
            icon: <Warning />,
        },
        error: {
            color: theme.palette.error.main,
            bgColor: theme.palette.error.light,
            lightBg: "rgba(211, 47, 47, 0.08)",
            icon: <Error />,
        },
        info: {
            color: theme.palette.info.main,
            bgColor: theme.palette.info.light,
            lightBg: "rgba(2, 136, 209, 0.08)",
            icon: <Info />,
        },
        success: {
            color: theme.palette.success.main,
            bgColor: theme.palette.success.light,
            lightBg: "rgba(46, 125, 50, 0.08)",
            icon: <CheckCircle />,
        },
    };

    const config = severityConfig[severity] || severityConfig.warning;

    return (
        <Fade in timeout={600}>
            <Card
                elevation={2}
                sx={{
                    borderRadius: 3,
                    borderLeft: `5px solid ${config.color}`,
                    height: "100%",
                    minHeight: 350,
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.3s ease",
                    "&:hover": {
                        elevation: 4,
                        transform: "translateY(-2px)",
                    },
                }}
            >
                <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", p: 3 }}>
                    {/* Header */}
                    <Box sx={{ display: "flex", alignItems: "flex-start", mb: 2 }}>
                        <Box
                            sx={{
                                background: config.lightBg,
                                borderRadius: 2,
                                p: 1.5,
                                mr: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: config.color,
                            }}
                        >
                            {icon || config.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 600,
                                    mb: 1,
                                    color: "text.primary",
                                }}
                            >
                                {title}
                            </Typography>
                            <Chip
                                label={`${alerts.length} ${alerts.length === 1 ? 'alerta' : 'alertas'}`}
                                size="small"
                                sx={{
                                    backgroundColor: config.bgColor,
                                    color: config.color,
                                    fontWeight: 600,
                                    fontSize: "0.75rem",
                                }}
                            />
                        </Box>
                    </Box>

                    <Divider sx={{ mb: 2 }} />

                    {/* Content */}
                    <Box sx={{ flex: 1, overflow: "hidden" }}>
                        {loading ? (
                            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
                                <CircularProgress size={40} sx={{ color: config.color }} />
                            </Box>
                        ) : alerts.length === 0 ? (
                            <Box
                                sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    py: 4,
                                    textAlign: "center",
                                }}
                            >
                                <CheckCircle sx={{ fontSize: 48, color: "success.main", mb: 2 }} />
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ fontWeight: 500 }}
                                >
                                    {emptyMessage}
                                </Typography>
                            </Box>
                        ) : (
                            <List
                                dense
                                sx={{
                                    maxHeight: 220,
                                    overflow: "auto",
                                    "&::-webkit-scrollbar": {
                                        width: "6px",
                                    },
                                    "&::-webkit-scrollbar-track": {
                                        background: "rgba(0,0,0,0.05)",
                                        borderRadius: "10px",
                                    },
                                    "&::-webkit-scrollbar-thumb": {
                                        background: config.color,
                                        borderRadius: "10px",
                                        opacity: 0.5,
                                    },
                                }}
                            >
                                {alerts.slice(0, 10).map((alert, index) => (
                                    <ListItem
                                        key={index}
                                        sx={{
                                            px: 1,
                                            py: 1,
                                            mb: 0.5,
                                            borderRadius: 1,
                                            "&:hover": {
                                                backgroundColor: config.lightBg,
                                            },
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                backgroundColor: config.color,
                                                mr: 1.5,
                                                flexShrink: 0,
                                            }}
                                        />
                                        <ListItemText
                                            primary={alert.primary}
                                            secondary={alert.secondary}
                                            primaryTypographyProps={{
                                                variant: "body2",
                                                fontWeight: 600,
                                                color: "text.primary",
                                            }}
                                            secondaryTypographyProps={{
                                                variant: "caption",
                                                color: "text.secondary",
                                            }}
                                        />
                                    </ListItem>
                                ))}
                                {alerts.length > 10 && (
                                    <Box sx={{ textAlign: "center", mt: 2 }}>
                                        <Chip
                                            label={`+${alerts.length - 10} más`}
                                            size="small"
                                            sx={{
                                                backgroundColor: config.lightBg,
                                                color: config.color,
                                                fontWeight: 600,
                                            }}
                                        />
                                    </Box>
                                )}
                            </List>
                        )}
                    </Box>
                </CardContent>
            </Card>
        </Fade>
    );
}
