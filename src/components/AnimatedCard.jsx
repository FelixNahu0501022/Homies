// src/components/AnimatedCard.jsx
import { motion } from 'framer-motion';
import { Card } from '@mui/material';

const AnimatedCard = ({ children, delay = 0, ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{
                y: -8,
                transition: { duration: 0.3 },
            }}
        >
            <Card
                {...props}
                sx={{
                    ...props.sx,
                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                    '&:hover': {
                        boxShadow: '0 12px 40px rgba(123, 41, 152, 0.3)',
                    },
                }}
            >
                {children}
            </Card>
        </motion.div>
    );
};

export default AnimatedCard;
