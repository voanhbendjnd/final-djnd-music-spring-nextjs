'use client';

import React, { useState } from 'react';
import {
    Modal,
    Box,
    Typography,
    TextField,
    Button,
    IconButton,
    Divider,
    CircularProgress,
    Tabs,
    Tab, useTheme, useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import { usePlaylists, useCreatePlaylist, useToggleTrackInPlaylist } from '@/hooks/use-playlist';
import { toast } from 'react-toastify';
import Image from "next/image";
import Link from "next/link";
import {generatePlaylistUrl, generateProfileUrl, generateTrackUrlUp} from "@/utils/generate.slug";

interface AddToPlaylistModalProps {
    open: boolean;
    onClose: () => void;
    trackId: number;
    imgUrl: string;
    title: string;
    uploader: string;
    trackUrl: string;
    uploaderId: string;
}

const PLAYER_HEIGHT = 72;
const BOTTOM_NAV_HEIGHT = 56;

const AddToPlaylistModal = ({ open, onClose, trackId, title, uploader, imgUrl, trackUrl, uploaderId }: AddToPlaylistModalProps) => {
    const [tabValue, setTabValue] = useState(0);
    const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [isPublic, setIsPublic] = useState(false);
    const [includeCurrentTrack, setIncludeCurrentTrack] = useState(false);

    const { data: playlists, isLoading } = usePlaylists();
    const createPlaylistMutation = useCreatePlaylist();
    const toggleTrackMutation = useToggleTrackInPlaylist();

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const handleCreatePlaylist = async () => {
        if (!newPlaylistTitle.trim()) {
            toast.error('Playlist title is required');
            return;
        }
        try {
            await createPlaylistMutation.mutateAsync({
                title: newPlaylistTitle,
                description: newPlaylistDescription,
                isPublic,
                trackIds: includeCurrentTrack ? [trackId] : []
            });
            toast.dark('Playlist created successfully');
            setNewPlaylistTitle('');
            setNewPlaylistDescription('');
            setIsPublic(false);
            setIncludeCurrentTrack(false);
            setTabValue(0);
        } catch (error) {
            toast.error('Failed to create playlist');
        }
    };

    const handleToggleTrack = async (playlistId: number, isAdded: boolean) => {
        try {
            await toggleTrackMutation.mutateAsync({ playlistId, trackId, isAdded: !isAdded });
            if (isAdded) toast.dark('Track removed from playlist');
            if (!isAdded) toast.dark('Track added to playlist');
        } catch (error) {
            toast.error('Failed to update playlist');
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            sx={{
                display: 'flex',
                // Mobile: modal trượt lên từ dưới nhưng dừng trên player
                // Desktop: modal giữa màn hình
                alignItems: isMobile ? 'flex-end' : 'center',
                justifyContent: 'center',
                zIndex: 1000,
                // Padding bottom = player + bottom nav để modal không bị che
                pb: isMobile ? `${PLAYER_HEIGHT + BOTTOM_NAV_HEIGHT}px` : 0,
            }}
        >
            <Box
                sx={{
                    bgcolor: '#1a1a1a',
                    color: '#fff',
                    width: '100%',
                    maxWidth: 500,
                    // Mobile: bo góc trên như bottom sheet
                    borderRadius: isMobile ? '12px 12px 0 0' : 1,
                    // maxHeight trừ đi chiều cao player + bottom nav trên mobile
                    maxHeight: isMobile
                        ? `calc(85vh - ${PLAYER_HEIGHT + BOTTOM_NAV_HEIGHT}px)`
                        : '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
            >
                {/* Header với Tabs */}
                <Box sx={{ px: 3, pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Tabs
                        value={tabValue}
                        onChange={(_, val) => setTabValue(val)}
                        TabIndicatorProps={{ style: { backgroundColor: '#f50', height: 2 } }}
                        sx={{
                            '& .MuiTab-root': {
                                color: '#999',
                                textTransform: 'none',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                minWidth: 'auto',
                                mr: 3,
                                px: 0,
                                '&.Mui-selected': { color: '#fff' }
                            }
                        }}
                    >
                        <Tab label="Add to playlist" />
                        <Tab label="Create a playlist" />
                    </Tabs>
                    <IconButton onClick={onClose} sx={{ color: '#999', mt: 0.5 }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Divider sx={{ borderColor: '#333' }} />

                {/* Nội dung scroll được */}
                <Box
                    sx={{
                        flex: 1,
                        overflowY: 'auto',
                        px: 3,
                        pb: 2,
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}
                >
                    {tabValue === 0 ? (
                        <>
                            {isLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                    <CircularProgress sx={{ color: '#f50' }} />
                                </Box>
                            ) : playlists && playlists.length > 0 ? (
                                playlists.map((playlist) => {
                                    const isAdded = playlist.trackIds?.includes(trackId);
                                    return (
                                        <Box
                                            key={playlist.id}
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                p: 1.5,
                                                mb: 1,
                                                borderRadius: 1,
                                                '&:hover': { bgcolor: '#2a2a2a' },
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 40, height: 40, bgcolor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {playlist.imgUrl != null ? (
                                                        <Link href={generatePlaylistUrl(playlist.title, String(playlist.id))} style={{ textDecoration: 'none', color: '#fff' }}>
                                                            <Image
                                                                width={40} height={40}
                                                                alt="Image"
                                                                src={`${playlist.imgUrl}`}
                                                                style={{ objectFit: 'cover', borderRadius: '4px' }}
                                                                unoptimized={true}
                                                            />
                                                        </Link>
                                                    ) : (
                                                        <Link href={generatePlaylistUrl(playlist.title, String(playlist.id))} style={{ textDecoration: 'none', color: '#fff' }}>
                                                            <PlaylistAddIcon sx={{ color: '#666' }} />
                                                        </Link>
                                                    )}
                                                </Box>
                                                <Box>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Link href={generatePlaylistUrl(playlist.title, String(playlist.id))} style={{ textDecoration: 'none', color: '#fff' }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {playlist.title}
                                                            </Typography>
                                                        </Link>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                color: playlist.isPublic ? '#f64a00' : '#666',
                                                                fontSize: '0.7rem',
                                                                fontWeight: 600,
                                                                textTransform: 'uppercase',
                                                                letterSpacing: 0.5
                                                            }}
                                                        >
                                                            {playlist.isPublic ? 'PUBLIC' : 'PRIVATE'}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" sx={{ color: '#666' }}>
                                                        {playlist.totalTracks} tracks
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                onClick={() => handleToggleTrack(playlist.id, isAdded)}
                                                sx={{
                                                    borderColor: isAdded ? '#f50' : '#444',
                                                    color: isAdded ? '#fff' : '#ccc',
                                                    bgcolor: isAdded ? '#f50' : 'transparent',
                                                    textTransform: 'none',
                                                    '&:hover': {
                                                        borderColor: isAdded ? '#e40' : '#666',
                                                        bgcolor: isAdded ? '#e40' : 'rgba(255,255,255,0.05)',
                                                    },
                                                    ml: 1
                                                }}
                                            >
                                                {isAdded ? 'Added' : 'Add'}
                                            </Button>
                                        </Box>
                                    );
                                })
                            ) : (
                                <Typography variant="body2" sx={{ color: '#666', textAlign: 'center', py: 4 }}>
                                    No playlists yet.
                                </Typography>
                            )}
                        </>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                            <Box>
                                <Typography variant="caption" sx={{ color: '#ccc', display: 'block', mb: 0.5 }}>
                                    Playlist title <span style={{ color: '#f50' }}>*</span>
                                </Typography>
                                <TextField
                                    value={newPlaylistTitle}
                                    onChange={(e) => {
                                        if (e.target.value.length <= 100) setNewPlaylistTitle(e.target.value);
                                    }}
                                    fullWidth
                                    size="small"
                                    inputProps={{ maxLength: 100 }}
                                    helperText={`${newPlaylistTitle.length}/100`}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            bgcolor: '#2a2a2a',
                                            color: '#fff',
                                            '& fieldset': { borderColor: '#444' },
                                            '&:hover fieldset': { borderColor: '#666' },
                                            '&.Mui-focused fieldset': { borderColor: '#f50' },
                                        },
                                        '& .MuiFormHelperText-root': {
                                            color: '#666',
                                            fontSize: '0.75rem',
                                            textAlign: 'right',
                                            mt: 0.5
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#2a2a2a', borderRadius: 1 }}>
                                <Box sx={{ width: 48, height: 48, bgcolor: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 0.5, overflow: 'hidden' }}>
                                    {imgUrl ? (
                                        <Link href={generateTrackUrlUp(trackId, title)} style={{ textDecoration: 'none', color: '#fff' }}>
                                            <Image src={imgUrl} alt="Track" width={40} height={40}
                                                   style={{ objectFit: 'cover', borderRadius: '4px' }}
                                                   unoptimized={true}
                                            />
                                        </Link>
                                    ) : (
                                        <PlaylistAddIcon sx={{ color: '#666' }} />
                                    )}
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link href={generateTrackUrlUp(trackId, title)} style={{ textDecoration: 'none', color: '#fff' }}>
                                            {title || 'Unknown Track'}
                                        </Link>
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        <Link href={generateProfileUrl(uploader, uploaderId)} style={{ textDecoration: 'none', color: '#fff' }}>
                                            {uploader || 'Unknown Artist'}
                                        </Link>
                                    </Typography>
                                </Box>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setIncludeCurrentTrack(!includeCurrentTrack)}
                                    sx={{
                                        borderColor: '#444',
                                        color: includeCurrentTrack ? '#f64a00' : '#ccc',
                                        bgcolor: includeCurrentTrack ? '#444' : 'transparent',
                                        textTransform: 'none',
                                        minWidth: 60,
                                        '&:hover': {
                                            borderColor: includeCurrentTrack ? '#444' : '#666',
                                            bgcolor: includeCurrentTrack ? '#444' : 'rgba(255,255,255,0.05)',
                                        },
                                    }}
                                >
                                    {includeCurrentTrack ? 'Added' : 'Add to Playlist'}
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Typography variant="body2" sx={{ color: '#ccc' }}>Privacy:</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <input type="radio" checked={isPublic} onChange={() => setIsPublic(true)} style={{ accentColor: '#f50' }} />
                                        <Typography variant="body2">Public</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <input type="radio" checked={!isPublic} onChange={() => setIsPublic(false)} style={{ accentColor: '#f50' }} />
                                        <Typography variant="body2">Private</Typography>
                                    </Box>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={handleCreatePlaylist}
                                    disabled={createPlaylistMutation.isPending}
                                    sx={{
                                        bgcolor: '#fff',
                                        color: '#000',
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        px: 3,
                                        '&:hover': { bgcolor: '#eee' },
                                        '&.Mui-disabled': { bgcolor: '#444', color: '#888' }
                                    }}
                                >
                                    Save
                                </Button>
                            </Box>

                            <Divider sx={{ borderColor: '#333', my: 1 }} />

                            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                                Looking for more tracks? Add some from your likes.
                            </Typography>
                            <Box sx={{ color: '#666', fontSize: '0.85rem' }}>
                                (Your recently liked tracks would appear here)
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </Modal>
    );
};

export default AddToPlaylistModal;