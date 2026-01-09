// src/components/AnimatedBackground.jsx
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

const AnimatedBackground = () => {
    // Colores HOMIES vibrantes
    const colors = [
        '#7B2998', // Morado
        '#FFE500', // Amarillo
        '#FF6B35', // Naranja
        '#00D4FF', // Cyan
        '#FF10F0', // Rosa neón
    ];

    // Generar blobs con posiciones y tamaños aleatorios
    const blobs = Array.from({ length: 8 }, (_, i) => ({
        id: i,
        color: colors[i % colors.length],
        size: Math.random() * 200 + 100,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 10 + 10,
    }));

    return (
        <Box
            sx={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 0,
                background: 'linear-gradient(135deg, #7B2998 0%, #5A1E72 50%, #3D1450 100%)',
            }}
        >
            {/* Blobs flotantes */}
            {blobs.map((blob) => (
                <motion.div
                    key={blob.id}
                    style={{
                        position: 'absolute',
                        left: `${blob.x}%`,
                        top: `${blob.y}%`,
                        width: blob.size,
                        height: blob.size,
                        borderRadius: '50%',
                        background: `radial-gradient(circle, ${blob.color}80 0%, ${blob.color}40 50%, transparent 70%)`,
                        filter: 'blur(40px)',
                    }}
                    animate={{
                        x: [0, Math.random() * 100 - 50, 0],
                        y: [0, Math.random() * 100 - 50, 0],
                        scale: [1, Math.random() * 0.5 + 0.5, 1],
                    }}
                    transition={{
                        duration: blob.duration,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Overlay con gradiente sutil */}
            <Box
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)',
                }}
            />
        </Box>
    );
};

export default AnimatedBackground;
