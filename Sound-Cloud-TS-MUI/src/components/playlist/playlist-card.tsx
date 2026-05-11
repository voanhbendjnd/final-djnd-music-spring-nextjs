'use client'

import {Box, Typography, Card, CardMedia, CardContent, Chip, Alert, Snackbar} from '@mui/material';
import Link from 'next/link';
import Image from 'next/image';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import React, {useEffect, useState} from "react";
import {usePlaylistsPaginated} from "@/hooks/use-playlist";
import IconButton from "@mui/material/IconButton";
import IosShareIcon from "@mui/icons-material/IosShare";
import { Dialog, DialogTitle, DialogContent, TextField, Button } from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import {useRouter} from "next/navigation";
import EditIcon from "@mui/icons-material/Edit";
import {useSession} from "next-auth/react";
import ModalUpdatePlaylist from "./ModalUpdatePlaylist";
interface PlaylistCardProps {
    playlist: IPlaylist;
}

const slugify = (text: string) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
};

const PlaylistCard = ({ playlist }: PlaylistCardProps) => {
    const slug = `${playlist.id}-${slugify(playlist.title)}`;
    const [openShare, setOpenShare] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [openToast, setOpenToast] = useState(false);
    const { data: session } = useSession();
    //@ts-ignore
    const isOwner = session?.user?.id === playlist?.user?.id;
    useEffect(() => {
        setShareUrl(`${window.location.origin}/playlist/${slug}`);
    }, [slug]);
    useEffect(() => {
        router.prefetch(`/playlist/${slug}`);
    }, [slug]);
    const router = useRouter();
    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setOpenToast(true);
    };
    return (
        <>
            {/*<Link href={`/playlist/${slug}`} style={{ textDecoration: 'none' }}>*/}
                <Card
                    onMouseEnter={() => router.prefetch(`/playlist/${slug}`)}
                    onClick={() => router.push(`/playlist/${slug}`)}
                    sx={{
                        bgcolor: '#2a2a2a',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        height: 280,
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                            bgcolor: '#333',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                        }
                    }}
                >
                    <Box sx={{ position: 'relative', aspectRatio: '1/1', bgcolor: '#1a1a1a' }}>
                        <IconButton
                            onClick={(e) => {
                                // e.preventDefault();
                                e.stopPropagation();
                                setOpenShare(true);
                            }}
                            sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                zIndex: 2,
                                bgcolor: 'rgba(0,0,0,0.6)',
                                color: '#fff',
                                '&:hover': { bgcolor: '#f50' }
                            }}
                        >
                            <IosShareIcon fontSize="small" />
                        </IconButton>
                        {isOwner && (
                            <IconButton
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenEdit(true);
                                }}
                                sx={{
                                    position: 'absolute',
                                    bottom: 8,
                                    right: 50,
                                    zIndex: 2,
                                    bgcolor: 'rgba(0,0,0,0.6)',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#f50' }
                                }}
                            >
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}
                        <Chip
                            label={playlist.isPublic ? 'PUBLIC' : 'PRIVATE'}
                            size="small"
                            sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                zIndex: 2,
                                bgcolor: playlist.isPublic ? '#f50' : '#333',
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: 600
                            }}
                            // sx={{
                            //     position: 'absolute',
                            //     top: 8,
                            //     right: 8,
                            //     zIndex: 2,
                            //     bgcolor: 'rgba(0,0,0,0.6)',
                            //     backdropFilter: 'blur(4px)',
                            //     color: '#fff',
                            // }}
                        />
                        {playlist.imgUrl ? (
                            <Image
                                src={playlist.imgUrl}
                                alt={playlist.title}
                                width={180}
                                height={170}
                                style={{
                                    objectFit: 'cover', // Giúp ảnh không bị móp méo, tự động cắt trung tâm
                                    borderRadius: '4px' // Thêm bo góc cho đẹp giống SoundCloud
                                }}
                                unoptimized={true} // Bật cái này nếu link Cloudinary đã tự tối ưu rồi
                            />
                        ) : (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    bgcolor: '#1a1a1a'
                                }}
                            >
                                <PlaylistAddIcon sx={{ fontSize: 64, color: '#444' }} />
                            </Box>
                        )}
                    </Box>
                    <CardContent sx={{ p: 2 }}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: 600,
                                color: '#fff',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                mb: 0.5
                            }}
                        >
                            {playlist.title}

                        </Typography>

                        <Typography
                            variant="caption"
                            sx={{
                                color: '#999',
                                display: 'block',
                                mb: 1
                            }}
                        >
                            By {playlist.createdBy || playlist.user?.name || 'Unknown'}
                        </Typography>
                        <Chip
                            label={`${playlist.totalTracks} tracks`}
                            size="small"
                            sx={{
                                bgcolor: '#333',
                                color: '#ccc',
                                fontSize: '0.75rem',
                                height: 24
                            }}
                        />
                    </CardContent>
                </Card>

            {/*</Link>*/}
            <Dialog
                open={openShare}
                onClose={() => setOpenShare(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: '#1a1a1a', // nền tối
                        color: '#fff',      // chữ trắng
                        borderRadius: 3
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    Share Playlist

                    <IconButton onClick={() => setOpenShare(false)}>
                        <CloseIcon                         style={{color:'#fff'}}
                        />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ bgcolor: '#1a1a1a' }}>
                    <TextField
                        fullWidth
                        value={shareUrl}
                        variant="outlined"
                        size="small"
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
                        style={{backgroundColor:'#f50'}}
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

            <ModalUpdatePlaylist
                open={openEdit}
                setOpen={setOpenEdit}
                playlist={playlist}
            />
        </>

    );
};

export default PlaylistCard;
