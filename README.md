# Aplicación Base - React + Vite + Material-UI

Esta es una **base limpia y profesional** para desarrollar aplicaciones web modernas con React, Vite y Material-UI. Incluye toda la infraestructura técnica necesaria para comenzar un proyecto rápidamente.

## 🚀 Stack Tecnológico

### Core
- **React 19.1.0**: Biblioteca principal para construir interfaces de usuario
- **Vite 6.3.5**: Build tool moderno y rápido
- **React Router DOM 7.6.1**: Enrutamiento y navegación

### UI Framework
- **Material-UI (MUI) 7.3.2**: Sistema completo de diseño
  - `@mui/material`: Componentes UI
  - `@mui/icons-material`: Iconografía
  - `@emotion/react` & `@emotion/styled`: CSS-in-JS

### Utilidades
- **Axios 1.9.0**: Cliente HTTP con interceptores
- **React Hook Form 7.56.4**: Gestión de formularios
- **Yup 1.6.1**: Validación de esquemas
- **SweetAlert2 11.22.0**: Alertas y diálogos elegantes

## 📁 Estructura del Proyecto

```
frontend/
├── public/                      # Recursos estáticos
├── src/
│   ├── assets/                  # Imágenes y recursos
│   ├── components/              # Componentes reutilizables
│   │   ├── ErrorBoundary.jsx   # Manejo de errores
│   │   ├── PrivateRoute.jsx    # Guard de autenticación
│   │   ├── Sidebar.jsx         # Menú lateral
│   │   └── Topbar.jsx          # Barra superior
│   ├── context/                # Contextos de React
│   │   ├── AuthContext.jsx    # Estado de autenticación
│   │   └── SidebarContext.jsx # Estado del sidebar
│   ├── layouts/
│   │   └── LayoutDashboard.jsx # Layout principal
│   ├── pages/                  # Páginas de la aplicación
│   │   ├── LoginPage.jsx      # Página de login
│   │   └── DashboardPage.jsx  # Dashboard de ejemplo
│   ├── services/
│   │   └── axios.js           # Configuración de Axios
│   ├── utils/
│   │   └── dateUtils.js       # Utilidades de fechas
│   ├── App.jsx                # Componente principal con rutas
│   ├── App.css                # Estilos globales
│   ├── main.jsx               # Punto de entrada
│   ├── index.css              # Estilos base
│   └── theme.js               # Tema personalizado de MUI
├── .env.example               # Variables de entorno ejemplo
├── index.html                 # HTML principal
├── package.json
├── vite.config.js            # Configuración de Vite
└── README.md
```

## ✨ Características Incluidas

### 🔐 Sistema de Autenticación
- Context API para manejo de estado de autenticación
- Almacenamiento de JWT en localStorage
- Interceptores Axios para inyección automática de tokens
- Manejo automático de sesiones expiradas (401)
- Componente `PrivateRoute` para proteger rutas

### 🎨 Tema Material-UI Premium
- Paleta de colores institucional moderna
- Tipografía responsive (escalado automático)
- Componentes customizados (botones, cards, inputs)
- Border radius moderno
- Sombras suaves y elegantes

### 📱 Layout Responsive
- Sidebar persistente en desktop
- Drawer temporal en mobile
- Topbar con información de usuario
- Breakpoints configurados (xs, sm, md, lg, xl)

### ⚡ Optimizaciones
- **Lazy Loading**: Todas las páginas cargadas dinámicamente
- **Code Splitting**: Chunks manuales para vendor y MUI
- **Error Boundaries**: Manejo robusto de errores
- **Suspense**: Loading states elegantes

### 🛠️ Configuración Lista
- Axios configurado con interceptores
- ESLint configurado
- Variables de entorno setup
- Build optimizado para producción

## 🚦 Inicio Rápido

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

Edita `.env` y configura tu URL de backend:

```
VITE_API_URL=http://localhost:3000/api
```

### 3. Iniciar Servidor de Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:5173`

### 4. Build para Producción

```bash
npm run build
```

Los archivos optimizados se generarán en el directorio `dist/`.

## 📝 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo
- `npm run build`: Genera build de producción
- `npm run preview`: Preview del build de producción
- `npm run lint`: Ejecuta ESLint

## 🔧 Configuración del Backend

El proyecto espera un backend que:

1. **Autenticación**: Endpoint `POST /api/auth/login` que retorne un JWT
2. **Formato de respuesta**:
   ```json
   {
     "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "user": { ... }
   }
   ```
3. **Headers**: Todas las peticiones autenticadas deben aceptar:
   ```
   Authorization: Bearer <token>
   ```

## 📚 Cómo Agregar Nuevos Módulos

### 1. Crear una Nueva Página

```javascript
// src/pages/MiModulo/MiModuloPage.jsx
import { Typography, Box } from "@mui/material";
import LayoutDashboard from "../../layouts/LayoutDashboard";

function MiModuloPage() {
  return (
    <LayoutDashboard title="Mi Módulo">
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Contenido de mi módulo</Typography>
      </Box>
    </LayoutDashboard>
  );
}

export default MiModuloPage;
```

### 2. Agregar Ruta en App.jsx

```javascript
// En App.jsx
const MiModuloPage = lazy(() => import("./pages/MiModulo/MiModuloPage"));

// Dentro de <Routes>
<Route path="/mi-modulo" element={<PrivateRoute><MiModuloPage /></PrivateRoute>} />
```

### 3. Agregar Item al Sidebar

```javascript
// En Sidebar.jsx
import { Extension } from "@mui/icons-material";

const menuItems = [
  { text: "Dashboard", icon: <Dashboard />, path: "/dashboard" },
  { text: "Mi Módulo", icon: <Extension />, path: "/mi-modulo" },
];
```

### 4. Crear Servicio API (opcional)

```javascript
// src/services/mi-modulo.service.js
import api from './axios';

export const getMiModuloItems = async () => {
  const response = await api.get('/mi-modulo');
  return response.data;
};

export const createMiModuloItem = async (data) => {
  const response = await api.post('/mi-modulo', data);
  return response.data;
};
```

## 🎨 Personalizar el Tema

Edita `src/theme.js` para customizar colores, tipografía, componentes y más:

```javascript
const palette = {
  primary: {
    main: "#0D47A1",  // Cambia el color primario
  },
  secondary: {
    main: "#D32F2F",  // Cambia el color secundario
  },
  // ...
};
```

## 🔐 Autenticación

### Login

```javascript
// En LoginPage.jsx o similar
import { useAuth } from "../context/AuthContext";

const { login } = useAuth();

// Después de validar credenciales con el backend
const response = await axios.post('/api/auth/login', { username, password });
login(response.data.token);  // Guarda el token
navigate('/dashboard');       // Redirige
```

### Logout

```javascript
import { useAuth } from "../context/AuthContext";

const { logout } = useAuth();

const handleLogout = () => {
  logout();  // Limpia el token
  navigate('/');  // Redirige a login
};
```

### Verificar Autenticación

```javascript
import { useAuth } from "../context/AuthContext";

const { isAuthenticated } = useAuth();

if (isAuthenticated) {
  // Usuario autenticado
}
```

## 📦 Agregar Más Dependencias

Ejemplo para agregar una librería de gráficos:

```bash
npm install recharts
```

Luego actualiza `vite.config.js` si quieres un chunk separado:

```javascript
manualChunks: {
  'vendor': ['react', 'react-dom', 'react-router-dom'],
  'mui': ['@mui/material', '@mui/icons-material'],
  'charts': ['recharts']  // ← Nuevo chunk
}
```

## 🌐 Deploy

### Netlify / Vercel

1. Conecta tu repositorio
2. Configura:
   - Build command: `npm run build`
   - Output directory: `dist`
3. Agrega variables de entorno: `VITE_API_URL`

### Servidor tradicional

```bash
npm run build
# Sube el contenido de dist/ a tu servidor
```

## 🤝 Contribuir

Este proyecto es una base genérica. Siéntete libre de:
- Agregar tus propios módulos
- Customizar el tema
- Agregar más utilidades
- Mejorar componentes existentes

## 📄 Licencia

MIT

## 🎯 Siguiente Pasos

1. ✅ Instalar dependencias (`npm install`)
2. ✅ Configurar `.env`
3. ✅ Iniciar desarrollo (`npm run dev`)
4. 🚀 Crear tus propios módulos
5. 🎨 Personalizar el tema
6. 🔌 Conectar con tu backend
7. 📱 Agregar funcionalidades específicas

---

**¡Feliz desarrollo! 🚀**

Si tienes dudas, revisa el código existente en `LoginPage.jsx` y `DashboardPage.jsx` como ejemplos de implementación.
