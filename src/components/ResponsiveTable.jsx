// src/components/ResponsiveTable.jsx
// Wrapper para tablas que se convierten en cards en móvil
import { useTheme, useMediaQuery, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Card, CardContent, Typography, Divider } from '@mui/material';

const ResponsiveTable = ({ headers, data, renderRow, renderCard, ...props }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    if (isMobile && renderCard) {
        // Vista de cards para móvil
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {data.map((item, index) => renderCard(item, index))}
            </Box>
        );
    }

    // Vista de tabla para desktop/tablet
    return (
        <TableContainer component={Paper} {...props}>
            <Table>
                <TableHead>
                    <TableRow>
                        {headers.map((header, index) => (
                            <TableCell key={index} sx={{ fontWeight: 700 }}>
                                {header}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((item, index) => renderRow(item, index))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ResponsiveTable;
