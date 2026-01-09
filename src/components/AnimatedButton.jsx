// src/components/AnimatedButton.jsx
import { motion } from 'framer-motion';
import { Button } from '@mui/material';

const AnimatedButton = ({ children, ...props }) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{ display: 'inline-block', width: props.fullWidth ? '100%' : 'auto' }}
        >
            <Button
                {...props}
                sx={{
                    ...props.sx,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: 0,
                        height: 0,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.3)',
                        transform: 'translate(-50%, -50%)',
                        transition: 'width 0.6s, height 0.6s',
                    },
                    '&:active::before': {
                        width: '300px',
                        height: '300px',
                    },
                }}
            >
                {children}
            </Button>
        </motion.div>
    );
};

export default AnimatedButton;
