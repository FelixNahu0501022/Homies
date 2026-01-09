// src/theme.js - Actualizado con breakpoints más específicos y helpers responsive
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

// Paleta de colores HOMIES - Basada en el logo y mascota
const palette = {
  primary: {
    main: "#7B2998", // Morado HOMIES
    light: "#9B4DB8",
    dark: "#5A1A70",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#FFE500", // Amarillo HOMIES
    light: "#FFEE33",
    dark: "#CCB700",
    contrastText: "#000000",
  },
  info: {
    main: "#00D9D9", // Cyan/Turquesa HOMIES
    light: "#33E3E3",
    dark: "#00A3A3",
    contrastText: "#000000",
  },
  background: {
    default: "#F5F5F5", // Gris muy claro
    paper: "#ffffff",
  },
  text: {
    primary: "#1A1A1A", // Casi negro
    secondary: "#666666", // Gris medio
  },
  success: {
    main: "#4CAF50",
  },
  warning: {
    main: "#FF9800",
  },
  error: {
    main: "#F44336",
  },
};

let theme = createTheme({
  palette,
  breakpoints: {
    values: {
      xs: 0,      // móvil pequeño
      sm: 600,    // móvil grande / tablet pequeña
      md: 900,    // tablet
      lg: 1200,   // desktop
      xl: 1536    // desktop grande
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        size: "medium",
      },
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: "10px 24px",
          // Touch target mínimo de 44px para móviles
          minHeight: 44,
        },
        sizeLarge: {
          padding: "14px 28px",
          minHeight: 48,
        },
        sizeSmall: {
          padding: "6px 16px",
          minHeight: 36,
        },
        containedPrimary: {
          background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.light} 100%)`,
          boxShadow: "0 4px 12px rgba(123, 41, 152, .3)",
          "&:hover": {
            boxShadow: "0 6px 16px rgba(123, 41, 152, .4)",
          },
        },
        containedSecondary: {
          background: palette.secondary.main,
          color: palette.secondary.contrastText,
          "&:hover": {
            background: palette.secondary.dark,
          },
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
          boxShadow: "0px 2px 8px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.06)",
        },
        elevation3: {
          boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
          border: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: "0px 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(0,0,0,0.05)",
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 8,
            // Touch target adecuado en móvil
            minHeight: 48,
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: palette.primary.main,
              borderWidth: 2,
            },
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
        root: {
          // Padding reducido en móvil
          '@media (max-width: 600px)': {
            padding: '8px',
            fontSize: '0.875rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          borderRadius: 8,
          // Touch target mínimo
          minHeight: 32,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#ffffff",
          color: palette.text.primary,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          // Full screen en móvil
          '@media (max-width: 600px)': {
            margin: 16,
            maxHeight: 'calc(100% - 32px)',
            width: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          // Touch target mínimo de 44px
          minWidth: 44,
          minHeight: 44,
        },
      },
    },
  },
});

// Escala tipografías automáticamente según breakpoint
theme = responsiveFontSizes(theme);

// Helper para responsive spacing
export const responsiveSpacing = {
  xs: { xs: 2, sm: 3, md: 4 },     // padding pequeño
  sm: { xs: 3, sm: 4, md: 5 },     // padding medio
  md: { xs: 4, sm: 5, md: 6 },     // padding grande
  lg: { xs: 5, sm: 6, md: 8 },     // padding extra grande
};

// Helper para grid columns responsive
export const responsiveGrid = {
  fullMobile: { xs: 12, sm: 12, md: 12 },           // siempre full width
  halfTablet: { xs: 12, sm: 12, md: 6 },            // mitad en tablet+
  thirdDesktop: { xs: 12, sm: 6, md: 4 },           // tercio en desktop
  quarterDesktop: { xs: 12, sm: 6, md: 4, lg: 3 },  // cuarto en desktop grande
};

export default theme;
