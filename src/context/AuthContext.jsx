import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token") || null,
    isAuthenticated: !!localStorage.getItem("token"),
    user: null, // Datos del usuario (nombre, miembro_id, roles, permisos)
  });

  // Al montar el componente, cargar usuario si hay token
  useEffect(() => {
    if (auth.token) {
      // Intentar cargar datos del usuario desde localStorage
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setAuth(prev => ({
            ...prev,
            user: JSON.parse(userData)
          }));
        } catch (error) {
          console.error("Error parsing user data:", error);
        }
      }
    }
  }, []);

  const login = (token, userData = null) => {
    localStorage.setItem("token", token);

    // Procesar datos del usuario si se proporcionan
    let processedUser = userData;
    if (userData) {
      // Extraer alias de roles y permisos para compatibilidad
      // El backend devuelve: roles: [{id, nombre, alias}], permisos: [{id, nombre, alias}]
      processedUser = {
        ...userData,
        roles: userData.roles?.map(r => r.alias || r) || [],
        permisos: userData.permisos?.map(p => p.alias || p) || []
      };
    }

    setAuth({
      token,
      isAuthenticated: true,
      user: processedUser
    });

    // Guardar datos del usuario si se proporcionan
    if (processedUser) {
      localStorage.setItem("user", JSON.stringify(processedUser));
    }
  };

  const updateUser = (userData) => {
    setAuth(prev => ({
      ...prev,
      user: userData
    }));
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth({ token: null, isAuthenticated: false, user: null });
  };

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permiso) => {
    return auth.user?.permisos?.includes(permiso) || false;
  };

  // Verificar si el usuario tiene un rol específico
  const hasRole = (rol) => {
    return auth.user?.roles?.includes(rol) || false;
  };

  return (
    <AuthContext.Provider value={{
      ...auth,
      login,
      logout,
      updateUser,
      hasPermission,
      hasRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}
