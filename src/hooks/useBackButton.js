// src/hooks/useBackButton.js
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

/**
 * Hook personalizado para manejar el botón/gesto "Atrás" en dispositivos móviles
 * Previene que la app se cierre inesperadamente
 */
const useBackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Solo activar en plataformas nativas (Android/iOS)
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleBackButton = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      // Lista de rutas "raíz" donde preguntar antes de salir
      const rootPaths = ['/dashboard', '/'];

      const isRootPath = rootPaths.includes(location.pathname);

      if (!canGoBack || isRootPath) {
        // Estamos en una ruta raíz: preguntar si quiere salir
        if (window.confirm('¿Deseas salir de la aplicación?')) {
          CapacitorApp.exitApp();
        }
      } else {
        // Hay historial: navegar atrás con React Router
        navigate(-1);
      }
    });

    // Cleanup: remover listener al desmontar
    return () => {
      handleBackButton.remove();
    };
  }, [location.pathname, navigate]);
};

export default useBackButton;
