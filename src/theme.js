// src/theme.js
import { createTheme, responsiveFontSizes } from "@mui/material/styles";

let theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 },
  },
  typography: {
    fontSize: 14, // base un poco más pequeña para pantallas chicas
  },
  components: {
    MuiButton:    { defaultProps: { size: "small" } },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiTable:     { defaultProps: { size: "small" } },
    MuiContainer: { defaultProps: { maxWidth: "xl" } },
  },
});

// Escala tipografías automáticamente según breakpoint
theme = responsiveFontSizes(theme);

export default theme;
