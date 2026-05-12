'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useWaveSurfer } from "@/utils/customHook";
import { WaveSurferOptions } from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { Avatar, Tooltip, TextField, Button, Box, Modal, Typography, useTheme, useMediaQuery } from "@mui/material";
import './wave.scss';
import { commentKeys, useFetchCommentsAxios, useCreateComment } from "@/hooks/use.comment";
import LikeTrack from "@/components/track/like.track";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import PauseIcon from "@mui/icons-material/Pause";
import Link from "next/link";
import { generateProfileUrl } from "@/utils/generate.slug";
import {useTrackContext} from "@/lib/track.wrapper";

interface IProps {
    comments: IComment[];
    isLiked?: boolean;
    track: ITrack;
    readOnly?: boolean;
}

const WaveTrack = (props: IProps) => {
    const searchParams = useSearchParams()
    const { comments, isLiked, track, readOnly = false } = props;
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const fileName = track.trackUrl;
    const trackId = track.id;
    // const trackId = searchParams.get('id');
    const autoPlay = searchParams.get('autoPlay') === 'true';
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);

    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const [backgroundColor, setBackgroundColor] = useState<string>("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
    const [trackData, setTrackData] = useState<ITrack | null>(null);
    const [commentPreview, setCommentPreview] = useState<{
        show: boolean;
        position: number;
        time: number;
        userAvatar?: string;
        userName?: string;
    }>({ show: false, position: 0, time: 0 });
    // const baseAudio = "https://res.cloudinary.com/dddppjhly/video/upload/";
    const fullAudioUrl = fileName;
    const [commentInput, setCommentInput] = useState({
        open: false,
        content: '',
        selectedTime: 0
    });
    const { data: session } = useSession();
    const [activeCommentId, setActiveCommentId] = useState<string | number | null>(null);
    const [hoveredCommentId, setHoveredCommentId] = useState<string | number | null>(null);
    const [isWaveformPlaying, setIsWaveformPlaying] = useState(false);
    const [waveDuration, setWaveDuration] = useState(0); // Stable duration state for comment positioning

    const {
        currentTrack,
        setCurrentTrack,
        audioRef,
        savedTimes,
        setPlayMode,          // ← thêm
        setQueueType,         // ← thêm
        setPlaylistTracks,    // ← thêm
        setCurrentTrackIndex, // ← thêm
        addToPlayedTracks     // ← thêm
    } = useTrackContext() as ITrackContext;    const isMatched = currentTrack.trackUrl === fullAudioUrl;
    const queryClient = useQueryClient();
    const { data: resComments } = useFetchCommentsAxios({
        current: 1,
        pageSize: 100,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    });

    const commentParams = {
        current: 1,
        pageSize: 100,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };

    const createCommentMutation = useCreateComment(commentParams);

    // Single source of truth for comments displayed on waveform
    const displayComments = useMemo(() => {
        return resComments?.result ?? comments;
    }, [resComments?.result, comments]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }
    const [waveformPeaks, setWaveformPeaks] = useState<number[] | null>(null);
    useEffect(() => {
        const loadWaveform = async () => {
            try {

                // ưu tiên waveform json
                if (trackData?.waveform_url) {

                    const waveformJson = await fetch(trackData.waveform_url)
                        .then(res => res.json());
                    const normalized = waveformJson.data.map(
                        (v: number) => (v / 128)
                    );
                    setWaveformPeaks(normalized);

                    return;
                }

                // fallback peaks cũ
                if (trackData?.peaks) {

                    const rawPeaks = JSON.parse(trackData.peaks);

                    const peaksArray = Array.isArray(rawPeaks)
                        ? rawPeaks
                        : rawPeaks.data;

                    setWaveformPeaks(peaksArray);
                }

            } catch (e) {
                console.warn('Failed to load waveform', e);
            }
        };

        loadWaveform();

    }, [trackData]);
    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient, progressGradient;

        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;

            gradient = ctx.createLinearGradient(0, 0, 0,  isMobile ?135 :90);
            gradient.addColorStop(isMobile? 1:0.8, '#ffffff');
            gradient.addColorStop(isMobile ? 1:1, 'rgb(229 218 218 / 0.74)');

            progressGradient = ctx.createLinearGradient(0, 0, 0, isMobile ?135 :100);
            progressGradient.addColorStop(isMobile ?0.9 :0.7, 'rgb(255 85 0)');
            progressGradient.addColorStop(1, '#ffb199');
        }

        // Use pre-computed peaks if available, otherwise load audio file
        const options: Omit<WaveSurferOptions, 'container'> = {
            waveColor: gradient || '#999',
            progressColor: progressGradient || '#ff5500',
            height: isMobile ? 48: 90,
            barWidth: isMobile ? 1 : 2.4,
            barGap: isMobile ? 0.5 : 1.5,
            barRadius: 4,
            normalize: false,
            cursorWidth: 0,
            // responsive: true,
            url: fullAudioUrl!,
        };

        if (waveformPeaks) {
            options.peaks = [waveformPeaks];
        }
        return options;
    }, [fullAudioUrl, waveformPeaks]);

    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);

    // Calculate stacking positions for avatars to avoid overlap
    // Uses stable waveDuration state instead of wavesurfer?.getDuration() which can be 0 during recalculation
    const avatarPositions = useMemo(() => {
        if (waveDuration === 0 || displayComments.length === 0) return {};

        // Sắp xếp comment theo thời gian phát
        const sortedComments = [...displayComments].sort((a, b) => a.moment - b.moment);
        const positions: { [key: string]: { top: number; left?: number; zIndex: number } } = {};

        // Khoảng cách tối thiểu để coi là "trùng nhau" (tính theo %)
        const minDistance = 4; // Tăng từ 3 lên 4

        // Pattern cho từng tier để phân bố avatar đều nhau
        const tierPattern = [
            { top: isMobile ? 38 : 75, left: 0 },          // Tier 0: center (just below split line)
            { top: isMobile ? 38 : 75, left: -4 },        // Tier 1: bottom-left
            { top: isMobile ? 38 : 75, left: 4 },         // Tier 2: bottom-right
            { top: isMobile ? 38 : 75, left: 0 },          // Tier 3: top (just above split line)
        ];

        sortedComments.forEach((comment, index) => {
            const leftPercent = (comment.moment / waveDuration) * 100;
            let tier = 0;
            let zIndex = 20;

            // Check overlap với tất cả comment đã xếp (không chỉ phía trước liền kề)
            let overlapCount = 0;
            for (let i = 0; i < index; i++) {
                const prevLeft = (sortedComments[i].moment / waveDuration) * 100;
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
    }, [waveDuration, displayComments]);

    // Sync play/pause from global state
    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;

        const handlePointerMove = (e: PointerEvent) => {
            if (hover) {
                hover.style.width = `${e.offsetX}px`;
            }
        };

        if (!readOnly) {
            waveform.addEventListener('pointermove', handlePointerMove);
        }

        // Handle waveform click for comment positioning
        const handleWaveformMouseDown = (e: MouseEvent) => {
            // Only show comment preview on right-click or with modifier key to avoid conflict with seeking
            if (e.button === 2 || e.ctrlKey || e.shiftKey) { // Right click or Ctrl/Shift + click
                e.preventDefault();
                e.stopPropagation();

                if (!wavesurfer || !containerRef.current) return;

                const rect = containerRef.current.getBoundingClientRect();
                const clickX = e.clientX - rect.left;
                const clickPercent = clickX / rect.width;
                const clickTime = clickPercent * (wavesurfer.getDuration() || 0);

                console.log('Waveform clicked for comment:', { clickX, clickPercent, clickTime });

                // Get current user info
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

        if (!readOnly) {
            waveform.addEventListener('mousedown', handleWaveformMouseDown);
        }

        // Also add double-click for comment
        const handleWaveformDoubleClick = (e: MouseEvent) => {
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

        if (!readOnly) {
            waveform.addEventListener('dblclick', handleWaveformDoubleClick);
        }

        const subscriptions = [
            wavesurfer.on('decode', (d) => {
                setDuration(formatTime(d));
                setWaveDuration(d); // Store stable numeric duration for comment positioning
            }),
            wavesurfer.on('interaction', (newTime) => {
                if (isMatched && audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    savedTimes.current[fullAudioUrl || ''] = newTime;
                    if (currentTrack.isPlaying) {
                        audioRef.current.play();
                        setIsWaveformPlaying(true);
                    }
                }
            }),
            wavesurfer.on('play', () => setIsWaveformPlaying(true)),
            wavesurfer.on('pause', () => setIsWaveformPlaying(false))
        ];

        return () => {
            waveform.removeEventListener('pointermove', handlePointerMove);
            waveform.removeEventListener('mousedown', handleWaveformMouseDown);
            waveform.removeEventListener('dblclick', handleWaveformDoubleClick);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, fileName, savedTimes, currentTrack.isPlaying]);

    // Sync playback state with global track
    useEffect(() => {
        if (!wavesurfer) return;

        // If this track becomes the current one, sync and potentially play
        if (isMatched) {
            if (currentTrack.isPlaying) {
                const syncWavesurfer = () => {
                    if (audioRef.current) {
                        const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                        if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                        setTime(formatTime(audioRef.current.currentTime));

                        // Play wavesurfer if it's not playing and audio is playing
                        if (!wavesurfer.isPlaying() && audioRef.current.currentTime > 0) {
                            wavesurfer.play();
                            setIsWaveformPlaying(true);
                        }

                        // Update state based on actual wavesurfer state
                        setIsWaveformPlaying(wavesurfer.isPlaying());
                    }
                };

                // Highlight active comment based on current time
                const handleTimeUpdate = () => {
                    if (!audioRef.current || !isMatched) return;
                    const currentTime = Math.round(audioRef.current.currentTime);

                    // Find comment with moment matching current time
                    const found = displayComments.find(c => Math.round(c.moment) === currentTime);

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

                    // Initial sync and play
                    syncWavesurfer();
                    if (!wavesurfer.isPlaying() && audioEl.currentTime > 0) {
                        wavesurfer.play();
                        setIsWaveformPlaying(true);
                    }

                    return () => {
                        audioEl.removeEventListener('timeupdate', syncWavesurfer);
                        audioEl.removeEventListener('seeked', syncWavesurfer);
                        audioEl.removeEventListener('timeupdate', handleTimeUpdate);
                    };
                }
            } else {
                // Explicitly pause wavesurfer when global track is paused
                wavesurfer.pause();
                setIsWaveformPlaying(false);
            }
        } else {
            // If another track is playing and this is not the current track, pause this wavesurfer
            if (currentTrack.trackUrl && currentTrack.isPlaying) {
                wavesurfer.pause();
                setIsWaveformPlaying(false);
            }
        }
    }, [currentTrack.trackUrl, currentTrack.isPlaying, isMatched, wavesurfer, audioRef, displayComments, fileName]);

    const onPlayClick = useCallback(() => {
        // No useTrackContext() here — just use the destructured values from above
        if (isMatched && currentTrack.trackUrl) {
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
                if (wavesurfer && !wavesurfer.isPlaying()) {
                    wavesurfer.play();
                    setIsWaveformPlaying(true);
                }
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                savedTimes.current[fullAudioUrl || ''] = audioRef.current.currentTime;
                if (wavesurfer && wavesurfer.isPlaying()) {
                    wavesurfer.pause();
                    setIsWaveformPlaying(false);
                }
            }
        } else {
            if (currentTrack.trackUrl && audioRef.current) {
                savedTimes.current[currentTrack.trackUrl] = audioRef.current.currentTime;
            }

            const source = trackData || currentTrack;
            const newTrack = {
                id: trackData?.id || fileName || `track-${Date.now()}`,
                trackUrl: fullAudioUrl,
                title: source.title || "Unknown Track",
                uploader: source.uploader || { name: "Unknown Artist" },
                imgUrl: source.imgUrl || "",
                description: source.description || "",
                isPlaying: true,
                isLiked: isLiked || source.isLiked || false
            };

            setPlayMode('dynamic');
            setQueueType('trending');
            setPlaylistTracks([newTrack]);
            setCurrentTrackIndex(0);
            addToPlayedTracks(String(newTrack.id));
            setCurrentTrack(newTrack as any);

            if (wavesurfer) {
                const savedTime = savedTimes.current[fullAudioUrl || ''] || 0;
                wavesurfer.setTime(savedTime);
                wavesurfer.play();
                setIsWaveformPlaying(true);
            }

            if (audioRef.current) {
                const savedTime = savedTimes.current[fullAudioUrl || ''] || 0;
                audioRef.current.src = fullAudioUrl;
                audioRef.current.currentTime = savedTime;
                audioRef.current.play().catch(e => console.log('Audio play failed:', e));
            }
        }
    }, [isMatched, currentTrack, fileName, setCurrentTrack, audioRef, savedTimes, wavesurfer,
        trackData, fullAudioUrl, setPlayMode, setQueueType, setPlaylistTracks,
        setCurrentTrackIndex, addToPlayedTracks]); // ← add new deps here
    // Extract color from track image using Canvas API
    useEffect(() => {
        const extractColor = () => {
            if (trackData?.imgUrl && typeof window !== "undefined") {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;

                    // Set canvas size to smaller for performance
                    const sampleSize = 100;
                    canvas.width = sampleSize;
                    canvas.height = sampleSize;

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

                    // Get image data from center area
                    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                    const data = imageData.data;

                    let r = 0, g = 0, b = 0;
                    let pixelCount = 0;

                    // Sample pixels from center area
                    for (let i = 0; i < data.length; i += 4) {
                        // Skip very light or very dark pixels
                        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        if (brightness > 30 && brightness < 225) {
                            r += data[i];
                            g += data[i + 1];
                            b += data[i + 2];
                            pixelCount++;
                        }
                    }

                    if (pixelCount > 0) {
                        // Calculate average color
                        r = Math.floor(r / pixelCount);
                        g = Math.floor(g / pixelCount);
                        b = Math.floor(b / pixelCount);

                        // Create gradient with overlay for better readability
                        const dominantColor = `rgb(${r}, ${g}, ${b})`;
                        const gradient = `linear-gradient(135deg, ${dominantColor} 0%, rgba(0, 0, 0, 0.8) 100%)`;
                        setBackgroundColor(gradient);
                    } else {
                        // Fallback to default gradient
                        setBackgroundColor("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
                    }
                };

                img.onerror = () => {
                    console.error('Error loading image for color extraction');
                    // Fallback to default gradient
                    setBackgroundColor("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
                };

                img.src = `${trackData.imgUrl}`;
            }
        };

        extractColor();
    }, [trackData?.imgUrl]);

    // Fetch track data and handle autoPlay
    useEffect(() => {
        const fetchTrackData = async () => {
            // CHỐT CHẶN 1: Chỉ chạy khi có ID và fileName
            if (!trackId || !fileName) return;

            // CHỐT CHẶN 2: Kiểm tra token hợp lệ trước khi gọi API có Auth
            const token = session?.access_token;
            const isValidToken = token && token !== "undefined";

            try {
                const res = await axios.get<IBackendRes<ITrack>>(
                    `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${trackId}`,
                    {
                        headers: {
                            // Chỉ thêm Authorization nếu token thực sự tồn tại
                            ...(isValidToken && { Authorization: `Bearer ${token}` })
                        }
                    }
                );

                if (res?.data?.data) {
                    setTrackData(res.data.data);
                    setIsWaveformPlaying(false);
                }
            } catch (error: any) {
                // Nếu lỗi 401 (chưa auth) hoặc 403, mới đẩy về trang chủ
                if (error.response?.status === 401 || error.response?.status === 403) {
                    router.push("/");
                }
                console.error("Fetch track error:", error);
            }
        };

        fetchTrackData();
    }, [trackId, fileName, session?.access_token]);

    // Sync isWaveformPlaying with actual wavesurfer state and currentTrack.isPlaying
    useEffect(() => {
        if (wavesurfer) {
            setIsWaveformPlaying(wavesurfer.isPlaying());
        }
    }, [wavesurfer, fileName, currentTrack.isPlaying]);
    const totalDuration = waveDuration;

    const calculateLeft = useCallback((moment: number) => {
        if (totalDuration === 0) return "0%";
        const percent = (moment / totalDuration) * 100;
        return `${percent}%`;
    }, [totalDuration]);

    // Handle comment preview click
    const handleCommentPreviewClick = () => {
        setCommentInput({
            open: true,
            content: '',
            selectedTime: commentPreview.time
        });
    };

    // Clear comment preview
    const clearCommentPreview = () => {
        setCommentPreview({ show: false, position: 0, time: 0 });
        setCommentInput({ open: false, content: '', selectedTime: 0 });
    };

    // Handle comment submission
    const handleSubmitComment = () => {
        if (!commentInput.content.trim()) return;

        createCommentMutation.mutate(
            {
                track_id: Number(trackId),
                content: commentInput.content,
                moment: commentInput.selectedTime
            },
            {
                onSuccess: () => {
                    clearCommentPreview();
                    // Invalidate ALL comment queries so CommentSection also refreshes
                    queryClient.invalidateQueries({ queryKey: commentKeys.all });
                },
                onError: (error) => {
                    console.error('Failed to submit comment:', error);
                }
            }
        );
    };
    const uploaderId = trackData?.uploader.id;

    return (
        <Box sx={{ pt: 2, px: { xs: 1, sm: 2, md: 3 } }}>
            <Box
                sx={{
                    background: backgroundColor,
                    borderRadius: 2,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    position: 'relative'
                }}
            >
                {/* Overlay */}
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.3)',
                    zIndex: 1
                }} />

                {/* 🔥 IMAGE (Mobile lên trên) */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '25%' },
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        p: { xs: 1, md: 2 },
                        zIndex: 2
                    }}
                >
                    <Box
                        sx={{
                            width: '100%',
                            maxWidth: { md: 250 },
                            height: { xs: 200, md: 250 },
                            borderRadius: 2,
                            overflow: 'hidden',
                            boxShadow: 3,
                            bgcolor: '#333'
                        }}
                    >
                        <img
                            src={trackData?.imgUrl || currentTrack.imgUrl || '/image/earth.jpg'}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    </Box>
                </Box>

                {/* 🎧 LEFT CONTENT */}
                <Box
                    sx={{
                        width: { xs: '100%', md: '75%' },
                        p: { xs: 1, md: 3 },
                        zIndex: 2
                    }}
                >
                    {/* HEADER */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {!readOnly && (
                            <Box
                                onClick={onPlayClick}
                                sx={{
                                    width: 50,
                                    height: 50,
                                    minWidth: 50, // 🔥 chặn flex co lại
                                    minHeight: 50,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: '50%',
                                    flexShrink: 0, // 🔥 QUAN TRỌNG
                                    bgcolor: '#ff5500',
                                    cursor: 'pointer'
                                }}
                            >
                                {isWaveformPlaying ? (
                                    <PauseIcon sx={{ fontSize: 28 }} />
                                ) : (
                                    <PlayArrowIcon sx={{ fontSize: 28 }} />
                                )}
                            </Box>
                        )}

                        <Box sx={{ ml: 2, overflow: 'hidden' }}>
                            <Typography
                                sx={{
                                    fontSize: { xs: 18, md: 28 },
                                    fontWeight: 600,
                                    color: '#fff',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                            >
                                {trackData?.title || currentTrack.title}
                            </Typography>

                            <Link
                                href={generateProfileUrl(trackData?.uploader.name!, trackData?.uploader.id!)}
                                style={{ textDecoration: 'none' }}
                            >
                                <Typography sx={{ color: '#ccc', fontSize: 14 }}>
                                    {trackData?.uploader?.name}
                                </Typography>
                            </Link>
                        </Box>
                    </Box>

                    {/* 🎵 WAVEFORM */}
                    <Box
                        ref={containerRef}
                        sx={{
                            position: 'relative',
                            height: { xs: 80, md: 130 },
                            mb: 2,
                            // paddingTop:isMobile? "0" : 2
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                top:isMobile? "41%": "50%",
                                // top: "71%",

                                left: 0,
                                right: 0,
                                height: "1px",
                                background: "#464646",
                                zIndex: 15,
                                pointerEvents: "none"
                            }}
                        ></div>
                        <Box className="time">{time}</Box>
                        <Box className="duration">{duration}</Box>
                        <Box ref={hoverRef} className="hover-wave" />

                        {/* Comments Overlay */}
                        <Box
                            sx={{
                                position: 'absolute',
                                inset: 0,
                                pointerEvents: 'none',
                                zIndex: 30 // Ensure it's above wavesurfer
                            }}
                        >
                            {displayComments.map(it => {
                                const isActive = activeCommentId === it.id;
                                const isHovered = hoveredCommentId === it.id;
                                const position = avatarPositions[it.id] || { top: isMobile ? 60 : 120, zIndex: 20 };
                                const shouldShowTooltip = isActive || isHovered;
                                const resContent = it.user?.name + ': ' + it.content;

                                return (
                                    <Tooltip
                                        key={it.id}
                                        title={resContent}
                                        open={shouldShowTooltip}
                                        arrow
                                        placement="top"
                                    >
                                        <Avatar
                                            src={it.user?.avatar}
                                            onMouseEnter={() => setHoveredCommentId(it.id)}
                                            onMouseLeave={() => setHoveredCommentId(null)}
                                            sx={{
                                                position: 'absolute',
                                                left: calculateLeft(it.moment),
                                                top: position.top,
                                                width: isMobile ? (isActive ? 12 : 10) : (isActive ? 20 : 22),
                                                height: isMobile ? (isActive ? 12 : 10) : (isActive ? 20 : 22),
                                                transform: position.left ? `translate(calc(-50% + ${position.left}px), -50%)` : 'translate(-50%, -50%)',
                                                border: isActive ? '2px solid #ff5500' : '1px solid #333',
                                                pointerEvents: 'auto',
                                                cursor: 'pointer',
                                                zIndex: isActive ? 100 : position.zIndex,
                                                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                                boxShadow: isActive ? '0 0 12px rgba(255, 85, 0, 0.6)' : '0 2px 4px rgba(0,0,0,0.3)',
                                                '&:hover': {
                                                    width: 24,
                                                    height: 24,
                                                    zIndex: 101,
                                                    border: '2px solid #fff'
                                                }
                                            }}
                                        >
                                            {it.user?.name?.charAt(0).toUpperCase()}
                                        </Avatar>
                                    </Tooltip>
                                );
                            })}
                        </Box>

                    </Box>
                    {trackData && (
                        <LikeTrack
                            trackId={Number(trackId)}
                            initialLikes={trackData.countLike}
                            initialIsLiked={isLiked || trackData.isLiked}
                            initialCountPlays={trackData.countPlay}
                            imgUrl={trackData.imgUrl}
                            title={trackData.title}
                            uploader={trackData.uploader.name}
                            trackUrl={fileName!}
                            uploaderId={trackData.uploader.id}
                        />
                    )}

                </Box>
            </Box>
        </Box>
    );
}

export default WaveTrack;