'use client'
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import FavoriteIcon from "@mui/icons-material/Favorite";
import {Headphones, HeartBroken} from "@mui/icons-material";
import React, { useState, useEffect } from "react";
import { useCountTrackMutation, useLikeTrackMutation } from "@/hooks/use-track";
import { useSession } from "next-auth/react";
import { useTrackContext } from "@/lib/track.wrapper";
import Button from "@mui/material/Button";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import AddToPlaylistModal from "@/components/playlist/add-to-playlist-modal";
import {useRouter} from "next/navigation";
import IosShareIcon from "@mui/icons-material/IosShare";
import {generateTrackUrlUp} from "@/utils/generate.slug";
import {
    Alert,
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Snackbar,
    TextField,
    useMediaQuery,
    useTheme
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

interface IProps {
    trackId: number;
    initialLikes: number;
    initialIsLiked: boolean;
    initialCountPlays: number;
    imgUrl:string;
    uploader:string;
    title:string;
    trackUrl:string;
    uploaderId:string;
}

const LikeTrack = (props: IProps) => {
    const { trackId, initialLikes, initialIsLiked, initialCountPlays, imgUrl, uploader , title, trackUrl,  uploaderId} = props;
    const { data: session } = useSession();
    const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const router = useRouter();
    // Chỉ cần 2 state này để quản lý hiển thị
    const [countLikes, setCountLikes] = useState<number>(initialLikes);
    const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
    const [countPlays, setCountPlays] = useState<number>(initialCountPlays);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    // Sync with TrackContext when track ID matches
    useEffect(() => {
        setCountLikes(initialLikes);
        setIsLiked(initialIsLiked);
    }, [trackId, initialLikes, initialIsLiked]);

    // Sync isLiked with currentTrack when track ID matches
    useEffect(() => {
        if (Number(currentTrack.id) === trackId) {
            setIsLiked(currentTrack.isLiked);
        }
    }, [currentTrack.id, currentTrack.isLiked, trackId]);

    const mutation = useLikeTrackMutation();

    const handleLikeClick = () => {
        mutation.mutate(trackId, {
            onSuccess: (res) => {
                // res.data chính là ResTrackLike (Integer countLikes, Boolean isLiked)
                if (res?.data) {
                    setCountLikes(res.data.countLikes);
                    setIsLiked(res.data.isLiked);

                    // Update TrackContext if this is the current track
                    if (Number(currentTrack.id) === trackId) {
                        setCurrentTrack({
                            ...currentTrack,
                            isLiked: res.data.isLiked
                        });
                    }
                }
            }
        });
    };
    const handleIncreaseCountPlay = () => {
        mutation.mutate(trackId, {
            onSuccess: (res) => {
                if (res?.data) {
                    setCountPlays(res.data.countPlays);
                }
            }
        });
    };
    const [openShare, setOpenShare] = useState<boolean>(false);

    const [shareUrl, setShareUrl] = useState<string>('');
    const [openToast, setOpenToast] = useState<boolean>(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setOpenToast(true);
        setOpenShare(false);
    };
    const handleOpenShare = (trackId :number, title:string) => {
        const path = generateTrackUrlUp(trackId, title);
        const fullUrl = `${window.location.origin}${path}`;
        setShareUrl(fullUrl);
        setOpenShare(true);
    };
    return (
        <div style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
                    <Stack direction="row" spacing={1}>
                        <Chip
                            onClick={()=>{
                                if(session) {
                                    handleLikeClick()                                }
                                else router.push('/auth/signin');

                            }}
                            disabled={mutation.isPending}
                            sx={{
                                color: isLiked ? '#f64a00' : 'white',
                                // borderColor: isLiked ? '#f64a00' : 'white',
                                cursor: mutation.isPending ? 'not-allowed' : 'pointer',
                                opacity: mutation.isPending ? 0.8 : 1,
                                '&:hover': {
                                    borderColor: '#f50',
                                    color: isLiked ? '#f50' : '#f50'
                                },
                                '& .MuiChip-icon': {
                                    color: isLiked ? '#f64a00' : 'inherit'
                                },
                                '&:hover .MuiChip-icon': {
                                    color: '#f50'
                                }
                            }}
                            icon={
                                isLiked
                                    ? <FavoriteIcon fontSize="small" />
                                    : <HeartBroken fontSize="small" />
                            }
                            // icon={<FavoriteIcon />}
                            label={isLiked ? countLikes : "Like"}
                            variant="outlined"
                        />
                        <Button variant="outlined" size="small" startIcon={<PlaylistAddIcon fontSize="small" />}
                                onClick={()=>{
                                    if(session) {
                                        setShowPlaylistModal(true)
                                    }
                                    else router.push('/auth/signin');

                                }}
                                sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                            {!isMobile ?'Playlist' : ''}
                        </Button>
                        <Button variant="outlined" size="small" startIcon={<IosShareIcon fontSize="small" />}
                                onClick={(e) => {
                                    // e.stopPropagation();
                                    handleOpenShare(trackId, title);
                                }}
                                sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                            {!isMobile ?'Share' : ''}
                        </Button>
                    </Stack>



            <div style={{ display: 'flex', gap: '10px' }}>

                <Stack direction="row">
                    <Chip
                        sx={{ color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                        icon={<Headphones />}
                        label={(countPlays ?? 0).toLocaleString()}                    />
                </Stack>
                <Stack direction="row">
                    <Chip
                        sx={{ color: 'white', '& .MuiChip-icon': { color: 'white' } }}
                        icon={<FavoriteIcon />}
                        label={(countLikes ?? 0).toLocaleString()}
                    />
                </Stack>
            </div>
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
            <AddToPlaylistModal
                open={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                trackId={Number(trackId)}
                imgUrl={imgUrl}
                title={title}
                uploader={uploader}
                trackUrl={trackUrl}
                uploaderId={uploaderId}
            />
        </div>
    );
}

export default LikeTrack;