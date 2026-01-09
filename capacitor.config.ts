import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.homies.estacion',
    appName: 'Estación HOMIES',
    webDir: 'dist',
    server: {
        androidScheme: 'https', // Producción: HTTPS estándar
        // La URL base se configura en src/services/axios.js
        cleartext: true, // Se mantiene por compatibilidad, aunque ya usamos HTTPS
    },
    android: {
        buildOptions: {
            keystorePath: undefined,
            keystorePassword: undefined,
            keystoreAlias: undefined,
            keystoreAliasPassword: undefined,
        }
    }
};

export default config;
