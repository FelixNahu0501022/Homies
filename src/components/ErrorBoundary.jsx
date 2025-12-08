import { Component } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        if (import.meta.env.DEV) {
            console.error('Error capturado por ErrorBoundary:', error, errorInfo);
        }
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <Container maxWidth="sm" sx={{ mt: 8 }}>
                    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
                        <ErrorOutline sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom color="error">
                            Algo salió mal
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                            Lo sentimos, ha ocurrido un error inesperado. Por favor, intenta recargar la página.
                        </Typography>
                        {import.meta.env.DEV && this.state.error && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1, textAlign: 'left' }}>
                                <Typography variant="caption" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                    {this.state.error.toString()}
                                </Typography>
                            </Box>
                        )}
                        <Button variant="contained" color="primary" onClick={this.handleReload}>
                            Recargar Página
                        </Button>
                    </Paper>
                </Container>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
