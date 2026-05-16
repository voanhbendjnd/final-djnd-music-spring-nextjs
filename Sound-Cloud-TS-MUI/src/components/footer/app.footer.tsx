'use client'
import { useHasMounted } from "@/utils/customHook";
import React, {  useEffect,useState } from "react";
import { ITrackContext, useTrackContext } from "@/lib/track.wrapper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FavoriteIcon from '@mui/icons-material/Favorite';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import IconButton from "@mui/material/IconButton";
import { Container, useMediaQuery, useTheme, Slider } from "@mui/material";
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import RepeatOneIcon from '@mui/icons-material/RepeatOne';
import axiosInstance from "@/utils/axios-instance";
import Link from "next/link";
import { useLikeTrackMutation } from "@/hooks/use-track";
import { useSession } from "next-auth/react";
import Image from 'next/image';
import AddToPlaylistModal from "@/components/playlist/add-to-playlist-modal";
import { generateProfileUrl, generateTrackUrlUp } from "@/utils/generate.slug";
import CustomYouTubePlayer from "./custom.youtube.player";
import Drawer from "@mui/material/Drawer";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import { redirect, useRouter } from "next/navigation";
import { audioEngine } from "@/lib/audio-engine";
import {VolumeDown, VolumeOff, VolumeUp} from "@mui/icons-material";

const AppFooter = () => {
    const {
        currentTrack, setCurrentTrack,  viewedTracks, markTrackAsViewed,
        playNextTrack, playPreviousTrack,
        isShuffle, setIsShuffle,
        repeatMode, setRepeatMode,
        isRoomMode, isHost
    } = useTrackContext() as ITrackContext;
    
    const isControlDisabled = isRoomMode && !isHost;
    
    // Debugging room mode and host status
    useEffect(() => {
        if (isRoomMode) {
            console.log(`🏠 Footer Room Mode: ON | Is Host: ${isHost}`);
        }
    }, [isRoomMode, isHost]);
    const hasMounted = useHasMounted();

    const mutation = useLikeTrackMutation();
    const [isLiked, setIsLiked] = useState<boolean>(currentTrack.isLiked);
    const { data: session } = useSession();
    const keyword = "upload/";
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const [showMobileDrawer, setShowMobileDrawer] = useState(false);
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const index = currentTrack.trackUrl ? currentTrack.trackUrl.indexOf(keyword) : -1;
    const trackUrlCut = index !== -1 ? currentTrack.trackUrl.substring(index + keyword.length) : currentTrack.trackUrl;

    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };

    // Sync footer play/pause with audio element state using singleton audioEngine
    useEffect(() => {
        if (!currentTrack.isYoutube) {
            const updatePlayState = () => {
                const isPlaying = audioEngine.isPlaying();
                if (isPlaying !== currentTrack.isPlaying) {
                    setCurrentTrack({ ...currentTrack, isPlaying });
                }
            };

            audioEngine.on('play', updatePlayState);
            audioEngine.on('pause', updatePlayState);

            return () => {
                audioEngine.off('play', updatePlayState);
                audioEngine.off('pause', updatePlayState);
            };
        }
    }, [currentTrack.trackUrl, currentTrack.isYoutube, currentTrack.isPlaying, setCurrentTrack]);

    const handleLikeClick = () => {
        if (session === null) {
            redirect("/auth/signin")
        }
        mutation.mutate(Number(currentTrack.id), {
            onSuccess: (res) => {
                if (res?.data) {
                    setCurrentTrack({
                        ...currentTrack,
                        isLiked: res.data.isLiked
                    });
                }
            }
        });
    };

    useEffect(() => {
        setIsLiked(currentTrack.isLiked);
    }, [currentTrack.id, currentTrack.isLiked]);

    // Time update effect using singleton audioEngine
    useEffect(() => {
        if (!currentTrack.id || !currentTrack.isPlaying || currentTrack.isYoutube) return;

        const handleTimeUpdate = () => {
            const time = audioEngine.getCurrentTime();
            const dur = audioEngine.getDuration();
            setCurrentTime(time);
            setDuration(dur);

            const trackId = currentTrack.id.toString();

            // When reaching 30 seconds and track not yet viewed
            if (time >= 30 && !viewedTracks.has(trackId)) {
                // Call API to increase view count
                axiosInstance.patch(`/api/v1/tracks/view/increase`, {
                    trackId: currentTrack.id
                }).catch(err => console.error('Failed to increase view count:', err));

                // Mark track as viewed
                markTrackAsViewed(trackId);
            }
        };

        audioEngine.on('timeupdate', handleTimeUpdate);

        return () => {
            audioEngine.off('timeupdate', handleTimeUpdate);
        };
    }, [currentTrack, viewedTracks, markTrackAsViewed]);

    // Sync singleton audioEngine with global isPlaying state
    useEffect(() => {
        if (!currentTrack.trackUrl || currentTrack.isYoutube) return;

        if (currentTrack.isPlaying) {
            audioEngine.play(currentTrack.trackUrl).catch((e: any) => console.log('Footer play failed:', e));
        } else {
            audioEngine.pause();
        }
    }, [currentTrack.isPlaying, currentTrack.trackUrl, currentTrack.isYoutube]);

    // Handle volume changes
    useEffect(() => {
        audioEngine.setVolume(volume);
    }, [volume]);

    // Handle track ended
    useEffect(() => {
        if (isControlDisabled) return;
        const handleEnded = () => {
            playNextTrack();
        };

        audioEngine.on('ended', handleEnded);

        return () => {
            audioEngine.off('ended', handleEnded);
        };
    }, [playNextTrack, isControlDisabled]);

    if (!hasMounted) return (<></>)

    if (!currentTrack || !currentTrack.trackUrl) {
        return null;
    }


    return (
        <div style={{ marginTop: 50, display: 'block' }}>
            <Box
                position="fixed"
                bottom={isMobile ? 70 : 10}
                left={10}
                right={10}
                height={70}
                borderRadius="16px"
                sx={{
                    bgcolor: 'rgba(20,20,20,0.7)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    px: 2,
                    zIndex: 10000,
                    overflow: 'hidden',
                }}
            >
                <Container sx={{ display: "flex", gap: 3, alignItems: "center", py: 1, maxWidth: 'xl', px: 0 }}>

                    {/* Mobile: Simple Layout */}
                    {/* Custom Audio Player - Hidden on mobile, visible on desktop */}
                    <Box sx={{
                        display: isMobile ? 'none' : 'flex',
                        flexGrow: 1,
                        minWidth: 0,
                    }}>
                        {currentTrack.isYoutube ? (
                            <CustomYouTubePlayer
                                onProgress={(time) => setCurrentTime(time)}
                                onDuration={(d) => setDuration(d)}
                            />
                        ) : (
                            <Box sx={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                gap: '12px'
                            }}>
                                {/* Main Controls */}
                                <IconButton
                                    onClick={() => playPreviousTrack()}
                                    sx={{ color: 'white', fontSize: '28px', opacity: isControlDisabled ? 0.3 : 1, pointerEvents: isControlDisabled ? 'none' : 'auto' }}
                                    disabled={isControlDisabled}
                                >
                                    <SkipPreviousIcon sx={{ fontSize: 28 }} />
                                </IconButton>

                                <IconButton
                                    onClick={() => {
                                        if (isControlDisabled) return;
                                        if (currentTrack.isPlaying) {
                                            audioEngine.pause();
                                            setCurrentTrack({ ...currentTrack, isPlaying: false });
                                        } else {
                                            audioEngine.play(currentTrack.trackUrl).catch((e: any) => console.log('Play failed:', e));
                                            setCurrentTrack({ ...currentTrack, isPlaying: true });
                                        }
                                    }}
                                    disabled={isControlDisabled}
                                    sx={{
                                        color: 'white',
                                        borderRadius: '50%',
                                        width: '40px',
                                        height: '40px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        opacity: isControlDisabled ? 0.3 : 1,
                                        pointerEvents: isControlDisabled ? 'none' : 'auto',
                                        '& svg': {
                                            fontSize: '28px'
                                        }
                                    }}
                                >
                                    {currentTrack.isPlaying ? <PauseIcon sx={{ fontSize: 28 }} /> : <PlayArrowIcon sx={{ fontSize: 28 }} />}
                                </IconButton>

                                <IconButton
                                    onClick={() => playNextTrack()}
                                    sx={{ color: 'white', fontSize: '28px', opacity: isControlDisabled ? 0.3 : 1, pointerEvents: isControlDisabled ? 'none' : 'auto' }}
                                    disabled={isControlDisabled}
                                >
                                    <SkipNextIcon sx={{ fontSize: 28 }} />
                                </IconButton>

                                {/* Shuffle Button */}
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (isControlDisabled) return;
                                        setIsShuffle(!isShuffle);
                                    }}
                                    disabled={isControlDisabled}
                                    sx={{
                                        color: isShuffle ? '#f50' : '#ccc',
                                        opacity: isControlDisabled ? 0.4 : 1,
                                        pointerEvents: isControlDisabled ? 'none' : 'auto',
                                        transition: 'all 0.2s',
                                        '&:hover': { color: 'white' }
                                    }}
                                >
                                    <ShuffleIcon sx={{ fontSize: 22 }} />
                                </IconButton>

                                {/* Repeat Button */}
                                <IconButton
                                    size="small"
                                    onClick={() => {
                                        if (isControlDisabled) return;
                                        if (repeatMode === 'none') setRepeatMode('all');
                                        else if (repeatMode === 'all') setRepeatMode('one');
                                        else setRepeatMode('none');
                                    }}
                                    disabled={isControlDisabled}
                                    sx={{
                                        color: repeatMode !== 'none' ? '#f50' : '#ccc',
                                        opacity: isControlDisabled ? 0.4 : 1,
                                        pointerEvents: isControlDisabled ? 'none' : 'auto',
                                        transition: 'all 0.2s',
                                        '&:hover': { color: 'white' }
                                    }}
                                >
                                    {repeatMode === 'one' ? <RepeatOneIcon sx={{ fontSize: 22 }} /> : <RepeatIcon sx={{ fontSize: 22 }} />}
                                </IconButton>

                                {/* Time Display */}
                                <Typography sx={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold', minWidth: '40px' }}>
                                    {formatTime(currentTime)}
                                </Typography>

                                {/* Progress Bar */}
                                <Box sx={{
                                    flexGrow: 1,
                                    height: '4px',
                                    backgroundColor: '#555',
                                    borderRadius: '2px',
                                    position: 'relative',
                                    cursor: isControlDisabled ? 'default' : 'pointer',
                                    opacity: isControlDisabled ? 0.6 : 1,
                                    pointerEvents: isControlDisabled ? 'none' : 'auto'
                                }}>
                                    <Box
                                        sx={{
                                            height: '100%',
                                            backgroundColor: '#f50',
                                            borderRadius: '2px',
                                            width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                                            position: 'relative'
                                        }}
                                    />
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: '-4px',
                                            width: '12px',
                                            height: '12px',
                                            backgroundColor: '#f50',
                                            borderRadius: '50%',
                                            left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                                            transform: 'translateX(-50%)'
                                        }}
                                    />
                                    <Box
                                        onClick={(e) => {
                                            if (isControlDisabled) return;
                                            const rect = e.currentTarget.getBoundingClientRect();
                                            const x = e.clientX - rect.left;
                                            const percentage = x / rect.width;
                                            audioEngine.seek(percentage * duration);
                                        }}
                                        sx={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0
                                        }}
                                    />
                                </Box>

                                {/* Duration */}
                                <Typography sx={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold', minWidth: '40px' }}>
                                    {formatTime(duration)}
                                </Typography>

                                {/* Volume Control */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        minWidth: 140,
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            setVolume(volume === 0 ? 0.5 : 0);
                                        }}
                                        sx={{
                                            color: '#ccc',
                                            transition: '0.2s',

                                            '&:hover': {
                                                color: '#fff'
                                            }
                                        }}
                                    >
                                        {volume === 0 ? (
                                            <VolumeOff />
                                        ) : volume < 0.5 ? (
                                            <VolumeDown />
                                        ) : (
                                            <VolumeUp />
                                        )}
                                    </IconButton>

                                    <Slider
                                        size="small"
                                        value={volume}
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        onChange={(_, value) => {
                                            setVolume(value as number);
                                        }}
                                        sx={{
                                            width: 90,
                                            color: '#f50',

                                            '& .MuiSlider-thumb': {
                                                width: 12,
                                                height: 12,
                                                transition: '0.2s',

                                                '&:hover': {
                                                    boxShadow: '0 0 0 8px rgba(255,85,0,0.15)'
                                                }
                                            },

                                            '& .MuiSlider-track': {
                                                border: 'none',
                                                height: 4,
                                            },

                                            '& .MuiSlider-rail': {
                                                height: 4,
                                                opacity: 0.3,
                                            }
                                        }}
                                    />
                                </Box>
                            </Box>
                        )}
                    </Box>

                    {/* YouTube Engine for Mobile (Invisible) */}
                    {isMobile && currentTrack.isYoutube && (
                        <Box sx={{
                            position: 'absolute',
                            opacity: 0,
                            pointerEvents: 'none',
                            width: 1,
                            height: 1,
                            overflow: 'hidden'
                        }}>
                            <CustomYouTubePlayer
                                minimal={true}
                                onProgress={(time) => setCurrentTime(time)}
                                onDuration={(d) => setDuration(d)}
                            />
                        </Box>
                    )}

                    {isMobile ? (
                        <>
                            {/* Avatar */}
                            <Box sx={{ flexShrink: 0 }}>
                                <Image
                                    src={currentTrack.imgUrl || '/default-avatar.png'}
                                    alt={currentTrack.title}
                                    width={50}
                                    height={50}
                                    style={{
                                        objectFit: 'cover',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setShowMobileDrawer(true)}
                                    unoptimized={true}
                                />
                            </Box>

                            {/* Track Info */}
                            <Box sx={{ flexGrow: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setShowMobileDrawer(true)}>
                                <Typography noWrap sx={{ color: '#fff', fontSize: '14px', fontWeight: 500, mb: 0.5 }}>
                                    {currentTrack.title}
                                </Typography>
                                <Typography noWrap sx={{ color: '#aaa', fontSize: '12px' }}>
                                    {currentTrack.uploader?.name}
                                </Typography>
                            </Box>

                            {/* ✅ Thêm prev/next/play cho mobile */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <IconButton
                                    size="small"
                                    onClick={() => { if (!isControlDisabled) playPreviousTrack(); }}
                                    disabled={isControlDisabled}
                                    sx={{ color: 'white', opacity: isControlDisabled ? 0.3 : 1 }}
                                >
                                    <SkipPreviousIcon sx={{ fontSize: 22 }} />
                                </IconButton>

                                <IconButton
                                    onClick={() => {
                                        if (isControlDisabled) return;
                                        if (currentTrack.isPlaying) {
                                            audioEngine.pause();
                                            setCurrentTrack({ ...currentTrack, isPlaying: false });
                                        } else {
                                            audioEngine.play(currentTrack.trackUrl).catch(err => console.log('Play failed:', err));
                                            setCurrentTrack({ ...currentTrack, isPlaying: true });
                                        }
                                    }}
                                    disabled={isControlDisabled}
                                    sx={{
                                        color: '#fff',
                                        bgcolor: 'rgba(255,255,255,0.1)',
                                        width: 36, height: 36,
                                        opacity: isControlDisabled ? 0.35 : 1,
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
                                    }}
                                >
                                    {currentTrack.isPlaying ? <PauseIcon sx={{ fontSize: 20 }} /> : <PlayArrowIcon sx={{ fontSize: 20 }} />}
                                </IconButton>

                                <IconButton
                                    size="small"
                                    onClick={() => { if (!isControlDisabled) playNextTrack(); }}
                                    disabled={isControlDisabled}
                                    sx={{ color: 'white', opacity: isControlDisabled ? 0.3 : 1 }}
                                >
                                    <SkipNextIcon sx={{ fontSize: 22 }} />
                                </IconButton>
                            </Box>

                            {/* SVG Border Progress (runs around the container) */}
                            <svg
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none',
                                }}
                            >
                                {/* Static background border (optional, replaces standard CSS border) */}
                                <rect
                                    width="100%"
                                    height="100%"
                                    rx="16"
                                    ry="16"
                                    fill="none"
                                    stroke="#333"
                                    strokeWidth="2"
                                />
                                {/* Dynamic progress border */}
                                <rect
                                    width="100%"
                                    height="100%"
                                    rx="16"
                                    ry="16"
                                    fill="none"
                                    stroke="#f50"
                                    strokeWidth="4" // 4px stroke, but 2px will be clipped by parent's overflow:hidden
                                    pathLength="100"
                                    strokeDasharray="100"
                                    strokeDashoffset={100 - (duration ? (currentTime / duration) * 100 : 0)}
                                    style={{
                                        transition: 'stroke-dashoffset 0.1s linear'
                                    }}
                                />
                            </svg>
                        </>
                    ) : (
                        /* Desktop: Track Info (Right Side) */
                        <Box sx={{ display: "flex", alignItems: "center", minWidth: 280, maxWidth: 300 }}>
                            <Box sx={{ width: 40, height: 40, mr: 1.5, flexShrink: 0, backgroundColor: '#444' }}>
                                {!currentTrack.isYoutube ? (
                                    <Link href={generateTrackUrlUp(Number(currentTrack.id), currentTrack.title)} style={{ textDecoration: 'none' }}>
                                        {currentTrack.imgUrl && (
                                            <Image
                                                src={`${currentTrack.imgUrl}`}
                                                alt={currentTrack.title}
                                                width={40}
                                                height={40}
                                                style={{
                                                    objectFit: 'cover',
                                                    borderRadius: '4px'
                                                }}
                                                unoptimized={true}
                                            />
                                        )}
                                    </Link>
                                ) : (
                                    <Image
                                        src={`${currentTrack.imgUrl}`}
                                        alt={currentTrack.title}
                                        width={40}
                                        height={40}
                                        style={{
                                            objectFit: 'cover',
                                            borderRadius: '4px'
                                        }}
                                        unoptimized={true}
                                    />
                                )}
                            </Box>

                            <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, overflow: 'hidden' }}>
                                {!currentTrack.isYoutube ? (
                                    <Link href={generateProfileUrl(currentTrack.uploader.name, currentTrack.uploader.id)} style={{ textDecoration: 'none' }}>
                                        <Typography
                                            noWrap
                                            sx={{
                                                color: "#aaa",
                                                fontSize: 11,
                                                mb: 0.2,
                                                '&:hover': {
                                                    color: "white",
                                                    fontWeight: 'bold'
                                                }
                                            }}
                                        >
                                            {currentTrack.uploader?.name || "Unknown"}
                                        </Typography>
                                    </Link>
                                ) : (
                                    <Typography
                                        noWrap
                                        sx={{
                                            color: "#aaa",
                                            fontSize: 11,
                                            mb: 0.2
                                        }}
                                    >
                                        {currentTrack.uploader?.name || "YouTube"}
                                    </Typography>
                                )}

                                {!currentTrack.isYoutube ? (
                                    <Link href={generateTrackUrlUp(Number(currentTrack.id), currentTrack.title)} style={{ textDecoration: 'none' }}>
                                        <Typography
                                            noWrap
                                            sx={{
                                                color: "white",
                                                fontSize: 13,
                                                fontWeight: 'bold',
                                                transition: "color 0.2s ease",
                                                '&:hover': {
                                                    color: "#f50",
                                                }
                                            }}
                                        >
                                            {currentTrack.title || "No Track Selected"}
                                        </Typography>
                                    </Link>
                                ) : (
                                    <Typography
                                        noWrap
                                        sx={{
                                            color: "white",
                                            fontSize: 13,
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {currentTrack.title || "YouTube Track"}
                                    </Typography>
                                )}
                            </Box>
                            {!currentTrack.isYoutube && (
                                <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            if (session) {
                                                handleLikeClick()

                                            }
                                            else router.push('/auth/signin');

                                        }}
                                        disabled={mutation.isPending}
                                        sx={{
                                            color: '#ccc',
                                            p: 0.5,
                                            transition: 'all 0.2s ease',
                                            '&:hover': {
                                                transform: 'scale(1.2)',
                                                backgroundColor: 'rgba(255, 255, 255, 0.1)'
                                            }
                                        }}
                                    >
                                        <FavoriteIcon
                                            sx={{
                                                fontSize: 'inherit',
                                                color: currentTrack.isLiked ? '#f64a00' : 'inherit',
                                                transition: 'color 0.2s ease'
                                            }}
                                        />
                                    </IconButton>
                                    <IconButton size="small" sx={{ color: '#ccc', p: 0.5 }}>
                                        <PersonAddIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" sx={{ color: '#ccc', p: 0.5 }}>
                                        <PlaylistAddIcon
                                            onClick={() => {
                                                if (session) {
                                                    setShowPlaylistModal(true);
                                                } else {
                                                    router.push('/auth/signin');
                                                }
                                            }}
                                            fontSize="small" />
                                    </IconButton>
                                </Box>
                            )}
                        </Box>
                    )}
                    <AddToPlaylistModal
                        open={showPlaylistModal}
                        onClose={() => setShowPlaylistModal(false)}
                        trackId={Number(currentTrack.id)}
                        imgUrl={currentTrack.imgUrl}
                        title={currentTrack.title}
                        uploader={currentTrack.uploader.name}
                        trackUrl={trackUrlCut}
                        uploaderId={currentTrack.uploader.id}
                    />
                </Container>
            </Box>

            {/* Mobile Full-Screen Drawer */}
            <Drawer
                anchor="bottom"
                open={showMobileDrawer}
                onClose={() => setShowMobileDrawer(false)}
                PaperProps={{
                    sx: {
                        height: '100%',
                        bgcolor: '#121212',
                    }
                }}
            >
                <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h6" sx={{ color: '#fff' }}>
                            Now Playing
                        </Typography>
                        <IconButton onClick={() => setShowMobileDrawer(false)} sx={{ color: '#fff' }}>
                            ×
                        </IconButton>
                    </Box>

                    {/* Track Artwork */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <Image
                            src={currentTrack.imgUrl || '/default-avatar.png'}
                            alt={currentTrack.title}
                            width={200}
                            height={200}
                            style={{
                                objectFit: 'cover',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                            }}
                            unoptimized={true}
                        />
                    </Box>

                    {/* Track Info */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Typography variant="h5" sx={{ color: '#fff', mb: 1 }}>
                            {currentTrack.title}
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#aaa' }}>
                            {currentTrack.uploader?.name}
                        </Typography>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ mb: 3 }}>
                        <Box sx={{ height: 4, bgcolor: '#333', borderRadius: 2, position: 'relative' }}>
                            <Box sx={{
                                height: '100%',
                                width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                                bgcolor: '#f50',
                                borderRadius: 2
                            }} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                            <Typography sx={{ color: '#666', fontSize: '12px' }}>{formatTime(currentTime)}</Typography>
                            <Typography sx={{ color: '#666', fontSize: '12px' }}>{formatTime(duration)}</Typography>
                        </Box>
                    </Box>

                    {/* Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mb: 3 }}>
                        <IconButton
                            sx={{ color: '#fff', opacity: isControlDisabled ? 0.35 : 1, pointerEvents: isControlDisabled ? 'none' : 'auto' }}
                            disabled={isControlDisabled}
                            onClick={() => {
                                if (isControlDisabled) return;
                                playPreviousTrack();
                            }}
                        >
                            <SkipPreviousIcon fontSize="large" />
                        </IconButton>
                        <IconButton
                            onClick={() => {
                                if (isControlDisabled) return;
                                if (currentTrack.isPlaying) {
                                    audioEngine.pause();
                                    setCurrentTrack({ ...currentTrack, isPlaying: false });
                                } else {
                                    audioEngine.play(currentTrack.trackUrl).catch(err => console.log('Drawer play failed:', err));
                                    setCurrentTrack({ ...currentTrack, isPlaying: true });
                                }
                            }}
                            disabled={isControlDisabled}
                            sx={{
                                color: '#fff',
                                bgcolor: '#f50',
                                width: 56,
                                height: 56,
                                opacity: isControlDisabled ? 0.35 : 1,
                                pointerEvents: isControlDisabled ? 'none' : 'auto',
                                '&:hover': { bgcolor: '#e64000' }
                            }}
                        >
                            {currentTrack.isPlaying ? <PauseIcon fontSize="large" /> : <PlayArrowIcon fontSize="large" />}
                        </IconButton>
                        <IconButton
                            sx={{ color: '#fff', opacity: isControlDisabled ? 0.35 : 1, pointerEvents: isControlDisabled ? 'none' : 'auto' }}
                            disabled={isControlDisabled}
                            onClick={() => {
                                if (isControlDisabled) return;
                                playNextTrack();
                            }}
                        >
                            <SkipNextIcon fontSize="large" />
                        </IconButton>
                    </Box>

                    {/* Additional Controls */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mt: 'auto' }}>
                        {!currentTrack.isYoutube && (
                            <>
                                <IconButton sx={{ color: '#ccc' }}>
                                    <FavoriteIcon />
                                </IconButton>
                                <IconButton sx={{ color: '#ccc' }}>
                                    <PlaylistAddIcon />
                                </IconButton>
                            </>
                        )}
                        <IconButton sx={{ color: '#ccc' }}>
                            <ShuffleIcon />
                        </IconButton>
                    </Box>
                </Box>
            </Drawer>

        </div>
    )
}

export default React.memo(AppFooter);