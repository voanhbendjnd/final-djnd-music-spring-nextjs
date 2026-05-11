'use client';

import React, {useState} from 'react';
import {
    Container,
    Typography,
    Box,
    TextField,
    Grid,
    Pagination,
    CircularProgress,
    useMediaQuery, IconButton, Dialog, DialogTitle, DialogContent, Button, Snackbar, Alert
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { usePlaylistsPaginated } from '@/hooks/use-playlist';
import PlaylistCard from '@/components/playlist/playlist-card';
import Link from "next/link";
import {generatePlaylistUrl, generateProfileUrl} from "@/utils/generate.slug";
import IosShareIcon from "@mui/icons-material/IosShare";
import CloseIcon from "@mui/icons-material/Close";

const PlaylistPage = () => {
    const [searchTitle, setSearchTitle] = useState('');
    const [page, setPage] = useState(1);
    const pageSize = 12;
    const [openShare, setOpenShare] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [openToast, setOpenToast] = useState(false);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { data, isLoading } = usePlaylistsPaginated({
        title: searchTitle || undefined,
        page,
        size: pageSize
    });

    //@ts-ignore
    const playlists = data?.data?.result ?? [];
    //@ts-ignore
    const meta = data?.data?.meta;

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTitle(e.target.value);
        setPage(1);
    };

    const handlePageChange = (_: any, value: number) => {
        setPage(value);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOpenShare = (playlist: IPlaylist) => {
        const path = generatePlaylistUrl(playlist.title, String(playlist.id));
        const fullUrl = `${window.location.origin}${path}`;
        setShareUrl(fullUrl);
        setOpenShare(true);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setOpenToast(true);
        setOpenShare(false);
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 3, pb: 10 }}>
            <Container maxWidth="lg">
                <Typography variant="h5" sx={{ color: '#fff', mb: 2, fontWeight: 700 }}>
                    Playlists
                </Typography>

                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="Search playlists..."
                        value={searchTitle}
                        onChange={handleSearchChange}
                        size="small"
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#2a2a2a',
                                color: '#fff',
                                borderRadius: '20px',
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#f50' }
                            }
                        }}
                    />
                </Box>

                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress sx={{ color: '#f50' }} />
                    </Box>
                )}

                {!isLoading && (
                    <>
                        {playlists.length > 0 ? (
                            <>
                                {isMobile ? (
                                    <Box>
                                        {playlists.map((playlist: IPlaylist) => (
                                            <Box
                                                key={playlist.id}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    position: 'relative',
                                                    py: 1.2,
                                                    borderBottom: '1px solid #222'
                                                }}
                                            >
                                                <Box
                                                    component="img"
                                                    src={playlist.imgUrl !== null ? playlist.imgUrl : '/image/playlistdefault.jpg'}
                                                    alt={playlist?.title}
                                                    sx={{
                                                        width: 56,
                                                        height: 56,
                                                        borderRadius: '6px',
                                                        objectFit: 'cover',
                                                        mr: 2
                                                    }}
                                                />

                                                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                                                    <Link href={generatePlaylistUrl(playlist.title, String(playlist.id))}>
                                                        <Typography
                                                            sx={{
                                                                color: '#fff',
                                                                fontSize: '0.95rem',
                                                                fontWeight: 500,
                                                                whiteSpace: 'nowrap',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis'
                                                            }}
                                                        >
                                                            {playlist?.title}
                                                        </Typography>
                                                    </Link>

                                                    <Link href={generateProfileUrl(playlist.createdBy, playlist.userId)}>
                                                        <Typography sx={{ color: '#aaa', fontSize: '0.8rem' }}>
                                                            by {playlist.createdBy || 'Unknown'} •{' '}
                                                            {playlist.totalTracks || 0} tracks
                                                        </Typography>
                                                    </Link>
                                                </Box>

                                                <IconButton
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenShare(playlist);
                                                    }}
                                                    sx={{
                                                        ml: 1,
                                                        bgcolor: 'rgba(0,0,0,0.6)',
                                                        color: '#fff',
                                                        '&:hover': { bgcolor: '#f50' }
                                                    }}
                                                >
                                                    <IosShareIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Grid container spacing={3}>
                                        {playlists.map((playlist: any) => (
                                            <Grid item xs={12} sm={6} md={4} lg={2} key={playlist.id}>
                                                <PlaylistCard playlist={playlist} />
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </>
                        ) : (
                            <Box sx={{ textAlign: 'center', py: 6 }}>
                                <Typography sx={{ color: '#666' }}>
                                    {searchTitle ? 'No playlists found' : 'No playlists yet'}
                                </Typography>
                            </Box>
                        )}

                        {meta && meta.pages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                <Pagination
                                    count={meta.pages}
                                    page={page}
                                    onChange={handlePageChange}
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            color: '#fff',
                                            bgcolor: '#2a2a2a',
                                            '&.Mui-selected': { bgcolor: '#f50' }
                                        }
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>

            {/* ✅ Dialog và Snackbar để bên ngoài loop, dùng chung cho toàn trang */}
            <Dialog
                open={openShare}
                onClose={() => setOpenShare(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: { bgcolor: '#1a1a1a', color: '#fff', borderRadius: 3 }
                }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Share Playlist
                    <IconButton onClick={() => setOpenShare(false)}>
                        <CloseIcon style={{ color: '#fff' }} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: '#1a1a1a' }}>
                    <TextField
                        fullWidth
                        value={shareUrl}
                        variant="outlined"
                        size="small"
                        InputProps={{ readOnly: true }}
                        sx={{
                            mt: 1,
                            mb: 2,
                            input: { color: '#fff' },
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#555' },
                                '&:hover fieldset': { borderColor: '#f50' },
                                '&.Mui-focused fieldset': { borderColor: '#f50' }
                            }
                        }}
                    />
                    <Button
                        style={{ backgroundColor: '#f50' }}
                        variant="contained"
                        fullWidth
                        onClick={handleCopy}
                    >
                        Copy Link
                    </Button>
                </DialogContent>
            </Dialog>

            <Snackbar
                open={openToast}
                autoHideDuration={2000}
                onClose={() => setOpenToast(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ bgcolor: '#1a1a1a', color: '#fff' }}>
                    Copied successfully!
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default PlaylistPage;