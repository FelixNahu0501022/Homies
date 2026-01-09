// src/components/AnimatedMascot.jsx
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

const AnimatedMascot = ({ size = 150 }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
            animate={{
                opacity: 1,
                scale: 1,
                rotate: 0,
                y: [0, -15, 0],
            }}
            transition={{
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                rotate: { duration: 0.5 },
                y: {
                    duration: 2.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                },
            }}
            whileHover={{
                scale: 1.1,
                rotate: [0, -5, 5, -5, 0],
                transition: { duration: 0.5 },
            }}
            style={{
                cursor: 'pointer',
                filter: 'drop-shadow(0 10px 30px rgba(255, 229, 0, 0.4))',
            }}
        >
            <Box
                component="img"
                src="/mascota-homies.jpg"
                alt="Mascota HOMIES"
                sx={{
                    width: size,
                    height: size,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid',
                    borderColor: 'secondary.main',
                    background: 'linear-gradient(135deg, #FFE500 0%, #FF6B35 100%)',
                }}
            />
        </motion.div>
    );
};

export default AnimatedMascot;
