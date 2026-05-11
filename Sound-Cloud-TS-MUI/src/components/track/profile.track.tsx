'use client'

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useWaveSurfer } from "@/utils/customHook";
import { WaveSurferOptions } from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RepeatIcon from '@mui/icons-material/Repeat';
import IosShareIcon from '@mui/icons-material/IosShare';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import {
    Avatar,
    Tooltip,
    TextField,
    Button as MuiButton,
    Box,
    Modal,
    Typography,
    Dialog,
    DialogTitle, IconButton, DialogContent, Snackbar, Alert
} from "@mui/material";
import Button from "@mui/material/Button";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTrackContext } from "@/lib/track.wrapper";
import { useCreateComment, useFetchCommentsAxios } from "@/hooks/use.comment";
import { useLikeTrackMutation } from "@/hooks/use-track";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";
import AddToPlaylistModal from "@/components/playlist/add-to-playlist-modal";
import { useRouter } from "next/navigation";
import { useTheme, useMediaQuery } from "@mui/material";
import {generatePlaylistUrl, generateProfileUrl, generateTrackUrl, generateTrackUrlUp} from "@/utils/generate.slug";
import Link from "next/link";
import {FavoriteBorder, Hearing, HeartBroken} from "@mui/icons-material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CloseIcon from "@mui/icons-material/Close";
dayjs.extend(relativeTime);

export interface ProfileTrackProps {
    track: ITrack;
    tracks?: ITrack[]; // The full list of tracks on the current page
}

const ProfileTrack = ({ track, tracks }: ProfileTrackProps) => {
    const [wsReady, setWsReady] = useState(false);
    const [waveDuration, setWaveDuration] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);
    const { 
        currentTrack, setCurrentTrack, audioRef, savedTimes,
        setPlaylistTracks, setCurrentTrackIndex,
        setPlayMode, setQueueType, addToPlayedTracks
    } = useTrackContext() as ITrackContext;
    const { data: session } = useSession();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down("md"));
    const router = useRouter();
    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const [showPlaylistModal, setShowPlaylistModal] = useState(false);
    const fullAudioUrl = track.trackUrl;
    const isMatched = currentTrack.trackUrl === fullAudioUrl;
    const [countLikes, setCountLikes] = useState<number>(track.countLike || 0);
    const mutation = useLikeTrackMutation();
    const [isLove, setIsLove] = useState<boolean>(track.isLiked);
    useEffect(() => {
        if (isMatched && isLove !== undefined) {
            setCurrentTrack({
                ...currentTrack,
                isLiked: isLove
            });
        }
    }, [currentTrack.id, isLove, isMatched]);

    const handleLikeClick = () => {
        if (!session) {
            // Redirect to signin with callback URL
            router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.href)}`);
            return;
        }
        mutation.mutate(Number(track.id), {
            onSuccess: (res) => {
                if (res?.data) {
                    setCountLikes(res.data.countLikes);

                    setIsLove(res.data.isLiked);

                    // Update TrackContext if this is the current track
                    if (isMatched) {
                        setCurrentTrack({
                            ...currentTrack,
                            isLiked: res.data.isLiked
                        });
                    }
                }
            }
        });
    };

    // Comment states
    const [showComments, setShowComments] = useState<boolean>(false);
    const [activeCommentId, setActiveCommentId] = useState<string | number | null>(null);
    const [hoveredCommentId, setHoveredCommentId] = useState<string | number | null>(null);
    const [commentPreview, setCommentPreview] = useState<{
        show: boolean;
        position: number;
        time: number;
        userAvatar?: string;
        userName?: string;
    }>({ show: false, position: 0, time: 0 });

    const [commentInput, setCommentInput] = useState({
        open: false,
        content: '',
        selectedTime: 0
    });

    // Fetch comments for this track
    const { data: resComments } = useFetchCommentsAxios({
        current: 1,
        pageSize: 50,
        trackId: Number(track.id),
        sort: "updatedAt,desc"
    });
    const comments = resComments?.result ?? [];

    const formatTimeUtil = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secondsRemainder = Math.round(seconds) % 60;
        const paddedSeconds = `0${secondsRemainder}`.slice(-2);
        return `${minutes}:${paddedSeconds}`;
    };

    // Comment handlers
    const handleWaveformMouseDown = (e: MouseEvent) => {
        if (!showComments) return; // Only allow comments when track is playing

        // Only show comment preview on right-click or with modifier key
        if (e.button === 2 || e.ctrlKey || e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            if (!wavesurfer || !containerRef.current) return;

            const rect = containerRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickPercent = clickX / rect.width;
            const clickTime = clickPercent * (wavesurfer.getDuration() || 0);

            const currentUser = {
                name: "Current User",
                avatar: "default-avatar"
            };

            setCommentPreview({
                show: true,
                position: clickPercent * 100,
                time: clickTime,
                userName: currentUser.name,
                userAvatar: currentUser.avatar
            });
        }
    };

    const handleWaveformDoubleClick = (e: MouseEvent) => {
        if (!showComments) return; // Only allow comments when track is playing

        e.preventDefault();
        e.stopPropagation();

        if (!wavesurfer || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickPercent = clickX / rect.width;
        const clickTime = clickPercent * (wavesurfer.getDuration() || 0);

        const currentUser = {
            name: "Current User",
            avatar: "default-avatar"
        };

        setCommentPreview({
            show: true,
            position: clickPercent * 100,
            time: clickTime,
            userName: currentUser.name,
            userAvatar: currentUser.avatar
        });
    };

    const handleCommentPreviewClick = () => {
        setCommentInput({
            open: true,
            content: '',
            selectedTime: commentPreview.time
        });
    };

    const clearCommentPreview = () => {
        setCommentPreview({ show: false, position: 0, time: 0 });
        setCommentInput({ open: false, content: '', selectedTime: 0 });
    };


    // 1. Định nghĩa params cho comment (giống như lúc bạn fetch)
    const commentParams = {
        current: 1,
        pageSize: 50,
        trackId: Number(track.id),
        sort: "updatedAt,desc"
    };

    const [shareUrl, setShareUrl] = useState<string>('');
    const [openToast, setOpenToast] = useState<boolean>(false);
    const handleCopy = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setOpenToast(true);
        setOpenShare(false);
    };
    // 2. Khai báo mutation hook
    const createCommentMutation = useCreateComment(commentParams);
    const handleSubmitComment = async () => {
        if (!commentInput.content.trim()) return;

        // Ưu tiên thời gian chọn trên waveform (selectedTime), nếu không có mới dùng thời gian thực
        const momentToPost = commentInput.open
            ? Math.round(commentInput.selectedTime)
            : (audioRef.current ? Math.round(audioRef.current.currentTime) : 0);

        createCommentMutation.mutate({
            content: commentInput.content,
            moment: momentToPost,
            track_id: Number(track.id)
        }, {
            onSuccess: () => {
                clearCommentPreview();
                // Reset text sau khi post thành công
                setCommentInput(prev => ({ ...prev, content: '' }));
                toast.dark("Post comment success!");
            },
            onError: (error: any) => {
                const msg = error?.response?.data?.message || "Please log in to continue!";
                toast.warning(msg);
            }
        });
    };
    const calculateLeft = useCallback((moment: number) => {
        if (waveDuration === 0) return "0%";
        const percent = (moment / waveDuration) * 100;
        return `${percent}%`;
    }, [waveDuration]);
    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient, progressGradient;

        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            gradient = ctx.createLinearGradient(0, 0, 0, isMobile?60 :80);
            gradient.addColorStop(0.89, '#fff');
            gradient.addColorStop(1, '#ffffff');

            progressGradient = ctx.createLinearGradient(0, 0, 0, isMobile?100: 80);
            progressGradient.addColorStop(0.86, '#ff5500');
            progressGradient.addColorStop(1, '#ffd2c7');
        }

        return {
            waveColor: gradient || '#999',
            progressColor: progressGradient || '#ff5500',

            height: isMobile ? 60 : 80, // 🔥 FIX
            barWidth: isMobile ? 1.5 : 2,
            barGap: isMobile ? 0.8 : 1,

            normalize: true,
            url: fullAudioUrl || '',
        };
    }, [fullAudioUrl,track?.peaks]);



    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);
    const [openShare, setOpenShare] = useState<boolean>(false);

    // Calculate stacking positions for avatars to avoid overlap
    const avatarPositions = useMemo(() => {
        if (waveDuration === 0 || comments.length === 0) return {};

        // Sắp xếp comment theo thời gian phát
        const sortedComments = [...comments].sort((a, b) => a.moment - b.moment);
        const totalDuration = waveDuration;
        const positions: { [key: string]: { top: number; left?: number; zIndex: number } } = {};

        // Khoảng cách tối thiểu để coi là "trùng nhau" (tính theo %)
        const minDistance = 4; // Tăng từ 3 lên 4

        // Pattern cho từng tier để phân bố avatar đều nhau
        const tierPattern = [
            { top:isMobile? 40: 57, left: 0 },          // Tier 0: center bottom
            { top: isMobile? 40: 57, left: -4 },        // Tier 1: bottom-left
            { top: isMobile? 40: 57, left: 4 },         // Tier 2: bottom-right
            { top: isMobile? 40: 57, left: 0 },         // Tier 3: top
        ];

        sortedComments.forEach((comment, index) => {
            const leftPercent = (comment.moment / totalDuration) * 100;
            let tier = 0;
            let zIndex = 20;

            // Check overlap với tất cả comment đã xếp (không chỉ phía trước liền kề)
            let overlapCount = 0;
            for (let i = 0; i < index; i++) {
                const prevLeft = (sortedComments[i].moment / totalDuration) * 100;
                if (Math.abs(leftPercent - prevLeft) < minDistance) {
                    overlapCount++;
                }
            }

            // Giới hạn tối đa 4 tier
            tier = Math.min(overlapCount, 3);
            zIndex = 20 + tier;

            positions[comment.id] = {
                top: tierPattern[tier].top,
                left: tierPattern[tier].left,
                zIndex
            };
        });

        return positions;
    }, [waveDuration, comments]);
    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;
        // const handlePointerMove = (e: PointerEvent) => (hover.style.width = `${e.offsetX}px`);
        // waveform.addEventListener('pointermove', handlePointerMove);

        // Add waveform click listeners for comments
        waveform.addEventListener('mousedown', handleWaveformMouseDown);
        waveform.addEventListener('dblclick', handleWaveformDoubleClick);

        const subscriptions = [
            wavesurfer.on('decode', (duration) => {
                setDuration(formatTime(duration));
                setWaveDuration(duration);
                setWsReady(true);
            }),
            wavesurfer.on('interaction', (newTime) => {
                if (isMatched && audioRef.current) {

                    audioRef.current.currentTime = newTime;
                    savedTimes.current[track.id] = newTime;
                    audioRef.current.play();
                }
            }),
        ];

        return () => {
            // waveform.removeEventListener('pointermove', handlePointerMove);
            waveform.removeEventListener('mousedown', handleWaveformMouseDown);
            waveform.removeEventListener('dblclick', handleWaveformDoubleClick);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, track.id, savedTimes]);

    // TỐI ƯU 1: Logic hiển thị comment nên tách bạch và dọn dẹp triệt để
    useEffect(() => {
        // Nếu không còn khớp (isMatched false) hoặc nhạc dừng (isPlaying false)
        if (!isMatched || !currentTrack.isPlaying) {
            setShowComments(false);
            setCommentInput(prev => ({ ...prev, content: '', open: false }));
            setCommentPreview({ show: false, position: 0, time: 0 });
        } else {
            setShowComments(true);
        }
    }, [isMatched, currentTrack.isPlaying]);

    // Pause this wavesurfer when another track is playing
    useEffect(() => {
        if (!wavesurfer) return;

        // If another track is playing and this is not the current track, pause this wavesurfer
        if (currentTrack.trackUrl && currentTrack.isPlaying && !isMatched) {
            wavesurfer.pause();
        }

        // If this track becomes the current one, sync and potentially play
        if (isMatched && currentTrack.isPlaying) {
            const syncWavesurfer = () => {
                if (audioRef.current) {
                    const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                    if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                    setTime(formatTime(audioRef.current.currentTime));
                }
            };

            // Highlight active comment based on current time
            const handleTimeUpdate = () => {
                if (!audioRef.current || !isMatched) return;
                const currentTime = Math.round(audioRef.current.currentTime);

                // Find comment with moment matching current time
                const found = comments.find(c => Math.round(c.moment) === currentTime);

                if (found) {
                    setActiveCommentId(found.id);
                    // Clear highlight after 3 seconds
                    setTimeout(() => {
                        setActiveCommentId(null);
                    }, 3000);
                }
            };

            const audioEl = audioRef.current;
            if (audioEl) {
                audioEl.addEventListener('timeupdate', syncWavesurfer);
                audioEl.addEventListener('seeked', syncWavesurfer);
                audioEl.addEventListener('timeupdate', handleTimeUpdate);

                // Initial sync in case it's already ahead
                syncWavesurfer();

                return () => {
                    audioEl.removeEventListener('timeupdate', syncWavesurfer);
                    audioEl.removeEventListener('seeked', syncWavesurfer);
                    audioEl.removeEventListener('timeupdate', handleTimeUpdate);
                };
            }
            return () => { };
        }

        // If this track is paused and it's the current track, pause wavesurfer
        if (isMatched && !currentTrack.isPlaying) {
            wavesurfer.pause();
        }
    }, [currentTrack.trackUrl, currentTrack.isPlaying, isMatched, wavesurfer, audioRef, comments]);
    const handleOpenShare = (track: ITrack) => {
        const path = generateTrackUrl(track);
        const fullUrl = `${window.location.origin}${path}`;
        setShareUrl(fullUrl);
        setOpenShare(true);
    };
    const onPlayClick = useCallback(() => {
        // Determine playMode and queueType based on current URL
        const pathname = window.location.pathname;
        let mode: 'queue' | 'dynamic' = 'dynamic';
        let type: any = null;

        if (pathname.includes('/history')) { mode = 'queue'; type = 'history'; }
        else if (pathname.includes('/like')) { mode = 'queue'; type = 'likes'; }
        else if (pathname.includes('/playlist')) { mode = 'queue'; type = 'playlist'; }
        else if (pathname.includes('/profile')) { mode = 'queue'; type = 'profile'; }
        else if (pathname.includes('/search')) { mode = 'dynamic'; type = 'search'; }
        else { mode = 'dynamic'; type = 'trending'; }

        if (isMatched) {
            // Toggle
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
                if (wavesurfer) wavesurfer.play();
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                if (wavesurfer) wavesurfer.pause();
                savedTimes.current[track.id] = audioRef.current.currentTime;
            }
        } else {
            // New track playback
            if (currentTrack.id && audioRef.current) {
                savedTimes.current[currentTrack.id] = audioRef.current.currentTime;
            }

            setPlayMode(mode);
            setQueueType(type);

            // Populate queue with all tracks on the current page
            if (tracks && tracks.length > 0) {
                setPlaylistTracks(tracks);
                const index = tracks.findIndex(t => String(t.id) === String(track.id));
                if (index !== -1) setCurrentTrackIndex(index);
            } else {
                // Fallback: just this track
                setPlaylistTracks([track]);
                setCurrentTrackIndex(0);
            }

            setCurrentTrack({ ...track, trackUrl: fullAudioUrl, isPlaying: true } as any);
            addToPlayedTracks(String(track.id));

            if (wavesurfer) {
                const savedTime = savedTimes.current[track.id] || 0;
                wavesurfer.setTime(savedTime);
                wavesurfer.play();
            }

            setTimeout(() => {
                if (audioRef.current) {
                    const savedTime = savedTimes.current[track.id] || 0;
                    audioRef.current.currentTime = savedTime;
                    audioRef.current.play().catch(e => console.log('Footer audio play failed:', e));
                }
            }, 100);
        }
    }, [isMatched, currentTrack, track, tracks, setCurrentTrack, audioRef, savedTimes, wavesurfer, setPlaylistTracks, setCurrentTrackIndex, setPlayMode, setQueueType, addToPlayedTracks]);
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
                mb: 4,
                p: 2,
                borderBottom: '1px solid #333',
                color: 'white'
            }}
        >

            {/* IMAGE */}
            <Box
                sx={{
                    width: { xs: '100%', md: 160 },
                    height: { xs: 200, md: 160 },
                    flexShrink: 0
                }}
            >
                <img
                    src={track.imgUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: isMobile ? '20px': 0 }}
                />
            </Box>

            {/* RIGHT */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* HEADER */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>

                        {/* PLAY BUTTON */}
                        <Box
                            onClick={onPlayClick}
                            sx={{
                                width: { xs: 40, md: 50 },
                                height: { xs: 40, md: 50 },
                                minWidth: { xs: 40, md: 50 },
                                borderRadius: '50%',
                                background: '#f50',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mr: 2,
                                flexShrink: 0,
                                cursor: 'pointer'
                            }}
                        >
                            {currentTrack.isPlaying && isMatched
                                ? <PauseIcon sx={{ fontSize: 28 }} />
                                : <PlayArrowIcon sx={{ fontSize: 28 }} />}
                        </Box>

                        {/* INFO */}
                        <Box>
                            <Typography sx={{ color: '#ccc', fontSize: 13 }}>
                                <Link href={generateProfileUrl(track.uploader.name, track.uploader.id)} style={{ textDecoration: 'none', color:'#fff' }}>
                                    {track.uploader.name}

                                </Link>
                            </Typography>

                            <Typography sx={{ fontSize: { xs: 14, md: 18 } }}>
                                <Link href={generateTrackUrlUp(Number(track.id), track.title)} style={{ textDecoration: 'none', color:'#fff'  }}>
                                    {track.title}
                                </Link>

                            </Typography>
                        </Box>
                    </Box>

                    <Typography sx={{ fontSize: 12, color: '#999' }}>
                        {dayjs(track.createdAt).fromNow()}
                    </Typography>
                </Box>

                {/* WAVEFORM */}
                <Box
                    sx={{
                        position: 'relative',
                        my: 1,
                        minHeight: { xs: 60, md: 100 }
                    }}
                >
                    <Box ref={containerRef} sx={{ width: '100%', position: 'relative' }}>
                        <Box ref={hoverRef} sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            zIndex: 10,
                            pointerEvents: 'none',
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            height: '100%',
                            borderRight: '1px solid white'
                        }} />
                        <div
                            style={{
                                position: "absolute",
                                top: "71%",
                                left: 0,
                                right: 0,
                                height: "0.5px",
                                background: "#464646",
                                zIndex: 15,
                                pointerEvents: "none"
                            }}
                        ></div>
                        {/* Dark overlay under avatars for better visibility */}
                        <Box sx={{
                            position: 'absolute',
                            height: '35%',
                            width: '100%',
                            bottom: 0,
                            background: 'linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.2) 70%, transparent 100%)',
                            zIndex: 15,
                            pointerEvents: 'none'
                        }} />

                        {/* Comment avatars on waveform - Always visible */}
                        <Box sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: '100%',
                            pointerEvents: 'none',
                            zIndex: 20
                        }}>
                            {comments.map(comment => {
                                const userAvatarSrc = comment.user?.avatar;
                                const isActive = activeCommentId === comment.id;
                                const isHovered = hoveredCommentId === comment.id;
                                const position = avatarPositions[comment.id] || { top: 70, zIndex: 20 };
                                const shouldShowTooltip = isActive || isHovered;
                                const resContent = comment.user.name + ': ' + comment.content;
                                return (
                                    <Tooltip
                                        key={comment.id}
                                        title={resContent}
                                        open={shouldShowTooltip}
                                        arrow
                                        onMouseEnter={() => setHoveredCommentId(comment.id)}
                                        onMouseLeave={() => setHoveredCommentId(null)}
                                    >
                                        <Avatar
                                            src={userAvatarSrc}
                                            sx={{
                                                position: 'absolute',
                                                left: calculateLeft(comment.moment),
                                                top: position.top,
                                                width: isActive ? 16 : 12,
                                                height: isActive ? 16 : 12,
                                                transform: position.left ? `translateX(calc(-50% + ${position.left}px))` : 'translateX(-50%)',
                                                border: isActive ? '2px solid #f50' : '1px solid #333',
                                                pointerEvents: 'auto',
                                                cursor: 'pointer',
                                                zIndex: isActive ? 100 : position.zIndex,
                                                transition: 'all 0.2s ease',
                                                boxShadow: isActive ? '0 0 8px #f50' : 'none',
                                            }}
                                        >
                                            {comment.user?.name?.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                );
                            })}

                            {/* Comment preview avatar */}
                            {commentPreview.show && (
                                <Box
                                    onClick={handleCommentPreviewClick}
                                    sx={{
                                        position: 'absolute',
                                        left: `${commentPreview.position}%`,
                                        top: 0,
                                        bottom: 0,
                                        width: '2px',
                                        bgcolor: '#f50',
                                        pointerEvents: 'auto',
                                        cursor: 'pointer',
                                        '&::after': {
                                            content: '"+"',
                                            position: 'absolute',
                                            top: -20,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            color: '#f50',
                                            fontWeight: 'bold'
                                        }
                                    }}
                                />
                            )}
                        </Box>
                    </Box>

                    {/* TIME */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 5,
                            right: 5,
                            fontSize: 12,
                            color: '#ccc'
                        }}
                    >
                        {time} / {duration}
                    </Box>
                </Box>

                {/* ACTIONS */}
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1
                    }}
                >
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={handleLikeClick}

                        sx={{ color: isLove ? '#f50' : 'white', borderColor: '#444',
                            '&:hover': {
                                borderColor: '#f50',
                                color: isLove ? '#f50' : '#f50'
                            },
                            '& .MuiChip-icon': {
                                color: isLove ? '#f64a00' : 'inherit'
                            },
                            '&:hover .MuiChip-icon': {
                                color: '#f50'
                            }}}
                        startIcon={
                            isLove
                                ? <FavoriteIcon fontSize="small" />
                                : <HeartBroken fontSize="small" />
                        }                    >
                         {countLikes}
                    </Button>

                    <Button variant="outlined" size="small" startIcon={<RepeatIcon fontSize="small" />}
                            onClick={()=>{
                                if(session) {
                                    setShowPlaylistModal(true)
                                }
                                else router.push('/auth/signin');

                            }}
                            sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Repost
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<PlaylistAddIcon fontSize="small" />}
                            onClick={()=>{
                                if(session) {
                                    setShowPlaylistModal(true)
                                }
                                else router.push('/auth/signin');

                            }}
                            sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Playlist
                    </Button>
                    <Button variant="outlined" size="small" startIcon={<IosShareIcon fontSize="small" />}
                            onClick={(e) => {
                                // e.stopPropagation();
                                handleOpenShare(track);
                            }}
                            sx={{ color: 'white', borderColor: '#444', textTransform: 'none', padding: '2px 8px', minWidth: 0, '&:hover': { borderColor: '#ccc' } }}>
                        Share
                    </Button>
                    <Box sx={{ ml: 'auto', display: 'flex', gap: 2 }}>
                        <span>▶ {track.countPlay}</span>
                        <span>💬 {comments.length}</span>
                    </Box>
                </Box>

                {/* COMMENT INPUT */}
                {isMatched && currentTrack.isPlaying && (
                    <Box sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            placeholder="Write comment..."
                            value={commentInput.content}
                            onChange={(e) =>
                                setCommentInput(prev => ({
                                    ...prev,
                                    content: e.target.value
                                }))
                            }
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: '#1a1a1a', // Nền hơi sáng hơn nền tổng thể một chút
                                    color: '#fff',
                                    borderRadius: '8px', // Bo góc mềm mại hơn
                                    transition: 'all 0.2s ease-in-out',

                                    // 1. Viền mặc định
                                    '& fieldset': {
                                        borderColor: '#444',
                                    },
                                    // 2. Viền khi di chuột qua
                                    '&:hover fieldset': {
                                        borderColor: '#666',
                                    },
                                    // 3. Viền khi đang focus (nhập liệu)
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#f50', // Màu cam thương hiệu của bạn
                                        borderWidth: '1px',  // Không nên để quá dày, 1px là đủ tinh tế
                                    },
                                },
                                '& .MuiInputBase-input::placeholder': {
                                    color: '#888', // Màu chữ placeholder dễ nhìn hơn
                                    opacity: 1,
                                },
                            }}
                        />

                        <Box sx={{ textAlign: 'right', mt: 1 }}>
                            <MuiButton
                                onClick={handleSubmitComment}
                                disabled={!commentInput.content.trim()}
                                variant="contained"
                                sx={{
                                    bgcolor: '#f50',
                                    color: '#fff', // Màu chữ khi nút active
                                    borderRadius: '20px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    '&:hover': {
                                        bgcolor: '#ff4500',
                                    },
                                    '&.Mui-disabled': {
                                        bgcolor: '#333', // Màu nền nút khi bị disabled (xám nhẹ thay vì đen)
                                        color: '#666',   // Màu chữ khi bị disabled
                                    }
                                }}
                            >
                                Post
                            </MuiButton>
                        </Box>
                    </Box>
                )}

            </Box>
            <AddToPlaylistModal
                open={showPlaylistModal}
                onClose={() => setShowPlaylistModal(false)}
                trackId={Number(track.id)}
                imgUrl={track.imgUrl}
                title={track.title}
                uploader={track.uploader.name}
                trackUrl={track.trackUrl}
                uploaderId={track.uploader.id}
            />

            {/* Comment Input Modal for timestamped comments */}
            <Modal
                open={commentInput.open}
                onClose={clearCommentPreview}
                aria-labelledby="comment-modal-title"
                aria-describedby="comment-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: '#282828',
                    border: '1px solid #333',
                    borderRadius: 2,
                    boxShadow: 24,
                    p: 4,
                    minWidth: 400,
                    color: 'white'
                }}>
                    <Typography id="comment-modal-title" variant="h6" sx={{ mb: 2, color: 'white' }}>
                        Comment at {formatTimeUtil(commentInput.selectedTime)}
                    </Typography>
                    <TextField
                        id="comment-modal-description"
                        multiline
                        rows={4}
                        fullWidth
                        variant="outlined"
                        placeholder="Write your comment..."
                        value={commentInput.content}
                        onChange={(e) => setCommentInput(prev => ({ ...prev, content: e.target.value }))}
                        sx={{
                            mb: 3,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                    borderColor: '#555',
                                },
                                '&:hover fieldset': {
                                    borderColor: '#777',
                                },
                                '&.Mui-focused fieldset': {
                                    borderColor: '#f50',
                                },
                            },
                            '& .MuiInputBase-input': {
                                color: 'white',
                            },
                        }}
                    />
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                        <MuiButton
                            onClick={clearCommentPreview}
                            sx={{
                                color: '#999',
                                borderColor: '#555',
                                '&:hover': {
                                    borderColor: '#777',
                                    bgcolor: 'rgba(255,255,255,0.05)'
                                }
                            }}
                            variant="outlined"
                        >
                            Cancel
                        </MuiButton>
                        <MuiButton
                            onClick={handleSubmitComment}
                            disabled={!commentInput.content.trim()}
                            sx={{
                                bgcolor: '#f50',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: '#e04800',
                                },
                                '&:disabled': {
                                    bgcolor: '#555',
                                    color: '#999'
                                }
                            }}
                            variant="contained"
                        >
                            Post Comment
                        </MuiButton>
                    </Box>
                </Box>
            </Modal>
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
export default ProfileTrack;