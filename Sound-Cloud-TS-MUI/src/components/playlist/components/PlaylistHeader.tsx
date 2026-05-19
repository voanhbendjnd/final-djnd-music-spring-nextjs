import { Grid, Box, Typography, Chip, Button } from '@mui/material';
import Image from 'next/image';
import EditIcon from '@mui/icons-material/Edit';
import { useSession } from 'next-auth/react';

interface IProps {
    playlist: IPlaylist;
    onEditClick?: () => void;
}

const PlaylistHeader = ({ playlist, onEditClick }: IProps) => {
    const { data: session } = useSession();
    const displayImage = playlist?.imgUrl || (playlist?.playlistTracks?.[0]?.imgUrl) || null;
    const isOwner = Number(session?.user?.id) === playlist?.user?.id;

    return (
        <Grid container spacing={4} sx={{ mb: 6 }}>
            <Grid item xs={12} md={4}>
                <Box sx={{ position: 'relative', aspectRatio: '1/1', bgcolor: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                    {displayImage ? (
                        <Image
                            src={displayImage}
                            alt={playlist.title}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                            <Typography sx={{ color: '#444', fontSize: 64 }}>🎵</Typography>
                        </Box>
                    )}
                </Box>
            </Grid>
            <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="caption" sx={{ color: '#f50', textTransform: 'uppercase', letterSpacing: 1, mb: 1, display: 'block' }}>
                            Playlist
                        </Typography>
                        <Typography variant="h3" sx={{ color: '#fff', fontWeight: 700, mb: 2 }}>
                            {playlist.title}
                        </Typography>
                    </Box>
                    {isOwner && (
                        <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={onEditClick}
                            sx={{
                                color: '#ccc',
                                borderColor: '#444',
                                textTransform: 'none',
                                '&:hover': {
                                    borderColor: '#f50',
                                    color: '#fff',
                                    bgcolor: 'rgba(255, 85, 0, 0.1)'
                                }
                            }}
                        >
                            Edit
                        </Button>
                    )}
                </Box>
                
                {playlist.description && (
                    <Typography variant="body1" sx={{ color: '#ccc', mb: 3 }}>
                        {playlist.description}
                    </Typography>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="body2" sx={{ color: '#999' }}>
                        By {playlist.user?.name || 'Unknown'}
                    </Typography>
                    <Chip
                        label={`${playlist.totalTracks} tracks`}
                        size="small"
                        sx={{ bgcolor: '#333', color: '#ccc' }}
                    />
                    <Chip
                        label={playlist.isPublic ? 'PUBLIC' : 'PRIVATE'}
                        size="small"
                        sx={{
                            bgcolor: playlist.isPublic ? '#f50' : '#333',
                            color: '#fff',
                            fontSize: '0.7rem',
                            fontWeight: 600
                        }}
                    />
                </Box>
            </Grid>
        </Grid>
    );
};

export default PlaylistHeader;
