// src/theme.js
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// Paleta de colores "Premium" - Institucional y Moderna
const palette = {
  primary: {
    main: "#0D47A1", // Azul profundo / Navy Blue
    light: "#5472D3",
    dark: "#002171",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#D32F2F", // Rojo vibrante (Emergencias/Bomberos)
    light: "#FF6659",
    dark: "#9A0007",
    contrastText: "#ffffff",
  },
  background: {
    default: "#F4F6F8", // Gris muy claro para el fondo general
    paper: "#ffffff",
  },
  text: {
    primary: "#1A2027", // Gris muy oscuro, casi negro (mejor lectura)
    secondary: "#5E6C84", // Gris medio para subtítulos
  },
  success: {
    main: "#2E7D32",
  },
  warning: {
    main: "#ED6C02",
  },
  error: {
    main: "#D32F2F",
  },
};

let theme = createTheme({
  palette,
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 }, // Botones sin mayúsculas forzadas
  },
  shape: {
    borderRadius: 12, // Bordes más redondeados y modernos
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Botones planos por defecto (más limpio)
        size: "medium",
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "8px 20px",
        },
        containedPrimary: {
          background: `linear-gradient(45deg, ${palette.primary.main} 30%, ${palette.primary.light} 90%)`,
          boxShadow: "0 3px 5px 2px rgba(13, 71, 161, .3)",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        elevation1: {
          boxShadow: "0px 2px 8px rgba(0,0,0,0.05)", // Sombra muy suave
          border: "1px solid rgba(0,0,0,0.08)",
        },
        elevation3: {
          boxShadow: "0px 4px 20px rgba(0,0,0,0.08)", // Sombra más pronunciada para tarjetas destacadas
          border: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.06)",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
          backgroundColor: "#F9FAFB",
          color: palette.text.primary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
        },
      },
    },
  },
});

// Escala tipografías automáticamente según breakpoint
theme = responsiveFontSizes(theme);

export default theme;
