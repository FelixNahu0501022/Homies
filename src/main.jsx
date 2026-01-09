import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";

// 👉 importa MUI Theme
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme"; // tu nuevo archivo

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <SidebarProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </SidebarProvider>
    </AuthProvider>
  </BrowserRouter>
);
