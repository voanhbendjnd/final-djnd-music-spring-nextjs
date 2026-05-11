import { Container, Grid, Box, Skeleton, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';

export default function Loading() {
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 4 }}>
            <Container maxWidth="lg">
                <Grid container spacing={4} sx={{ mb: 6 }}>
                    <Grid item xs={12} md={4}>
                        <Skeleton variant="rectangular" sx={{ aspectRatio: '1/1', borderRadius: 2, bgcolor: '#1a1a1a' }} />
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Skeleton variant="text" width="100px" sx={{ mb: 1, bgcolor: '#1a1a1a' }} />
                        <Skeleton variant="text" height={60} width="60%" sx={{ mb: 2, bgcolor: '#1a1a1a' }} />
                        <Skeleton variant="text" height={30} width="80%" sx={{ mb: 3, bgcolor: '#1a1a1a' }} />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <Skeleton variant="text" width="150px" sx={{ bgcolor: '#1a1a1a' }} />
                            <Skeleton variant="rectangular" width="80px" height={24} sx={{ borderRadius: 12, bgcolor: '#1a1a1a' }} />
                            <Skeleton variant="rectangular" width="80px" height={24} sx={{ borderRadius: 12, bgcolor: '#1a1a1a' }} />
                        </Box>
                    </Grid>
                </Grid>

                <Skeleton variant="text" height={40} width="200px" sx={{ mt: 5, mb: 3, bgcolor: '#1a1a1a' }} />

                <List sx={{ bgcolor: '#1a1a1a', borderRadius: 2 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <ListItem key={i} sx={{ borderBottom: '1px solid #333' }}>
                            <ListItemAvatar>
                                <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: '#333' }} />
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Skeleton variant="text" width="40%" sx={{ bgcolor: '#333' }} />}
                                secondary={<Skeleton variant="text" width="20%" sx={{ bgcolor: '#333' }} />}
                            />
                        </ListItem>
                    ))}
                </List>
            </Container>
        </Box>
    );
}
