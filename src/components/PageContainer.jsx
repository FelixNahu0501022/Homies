// src/components/PageContainer.jsx
// Contenedor responsive para páginas con padding y spacing consistente
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

const PageContainer = ({ children, maxWidth = 'xl', animate = true, ...props }) => {
    const content = (
        <Box
            sx={{
                width: '100%',
                maxWidth: maxWidth === 'full' ? '100%' : maxWidth,
                mx: 'auto',
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 2, sm: 3 },
                ...props.sx,
            }}
            {...props}
        >
            {children}
        </Box>
    );

    if (!animate) return content;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ width: '100%' }}
        >
            {content}
        </motion.div>
    );
};

export default PageContainer;
