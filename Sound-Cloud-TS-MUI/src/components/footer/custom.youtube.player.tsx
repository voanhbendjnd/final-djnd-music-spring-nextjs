'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
import PauseCircleFilledIcon from '@mui/icons-material/PauseCircleFilled';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import ShuffleIcon from '@mui/icons-material/Shuffle';
import RepeatIcon from '@mui/icons-material/Repeat';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useTrackContext } from '@/lib/track.wrapper';

declare global {
    interface Window {
        YT: any;
        onYouTubeIframeAPIReady: () => void;
        _ytApiLoading?: boolean;
    }
}

const CustomYouTubePlayer = ({
                                 minimal = false,
                                 onProgress,
                                 onDuration,
                             }: {
    minimal?: boolean;
    onProgress?: (time: number) => void;
    onDuration?: (duration: number) => void;
}) => {
    const { currentTrack, setCurrentTrack, playNextTrack, playPreviousTrack } = useTrackContext() as any;

    const playerRef = useRef<any>(null);         // YT.Player instance
    const containerRef = useRef<HTMLDivElement>(null);
    const progressTimer = useRef<any>(null);

    const [playing, setPlaying] = useState(false);
    const [playedSeconds, setPlayedSeconds] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(50);
    const [muted, setMuted] = useState(false);
    const [apiReady, setApiReady] = useState(false);

    const currentVideoId = currentTrack?.trackUrl?.startsWith('http')
        ? new URL(currentTrack.trackUrl).searchParams.get('v') ?? currentTrack.trackUrl
        : currentTrack?.trackUrl ?? '';

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return h ? `${h}:${m.toString().padStart(2, '0')}:${s}` : `${m}:${s}`;
    };

    // Tick progress
    const startTick = useCallback(() => {
        if (progressTimer.current) clearInterval(progressTimer.current);
        progressTimer.current = setInterval(() => {
            if (!playerRef.current) return;
            try {
                const t = playerRef.current.getCurrentTime?.() ?? 0;
                const d = playerRef.current.getDuration?.() ?? 0;
                setPlayedSeconds(t);
                if (d && d !== duration) {
                    setDuration(d);
                    onDuration?.(d);
                }
                onProgress?.(t);
            } catch (_) {}
        }, 500);
    }, [duration, onProgress, onDuration]);

    const stopTick = useCallback(() => {
        if (progressTimer.current) {
            clearInterval(progressTimer.current);
            progressTimer.current = null;
        }
    }, []);

    // Load YouTube IFrame API once
    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (window.YT?.Player) {
            setApiReady(true);
            return;
        }

        if (!window._ytApiLoading) {
            window._ytApiLoading = true;
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(tag);
        }

        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            setApiReady(true);
        };
    }, []);

    // Create / re-create player when videoId or apiReady changes
    useEffect(() => {
        if (!apiReady || !currentVideoId || !containerRef.current) return;

        // Destroy old player
        if (playerRef.current) {
            try { playerRef.current.destroy(); } catch (_) {}
            playerRef.current = null;
        }
        stopTick();
        setPlayedSeconds(0);
        setDuration(0);

        // Create a fresh div for the player (YT replaces it with an iframe)
        const div = document.createElement('div');
        div.id = `yt-player-${Date.now()}`;
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(div);

        playerRef.current = new window.YT.Player(div.id, {
            videoId: currentVideoId,
            width: '100%',
            height: '100%',
            playerVars: {
                autoplay: 1,          // autoplay via playerVars (works even when hidden visually)
                controls: 0,
                rel: 0,
                modestbranding: 1,
                playsinline: 1,
                origin: window.location.origin,
                enablejsapi: 1,
            },
            events: {
                onReady: (e: any) => {
                    e.target.setVolume(volume);
                    if (muted) e.target.mute();
                    const d = e.target.getDuration() ?? 0;
                    setDuration(d);
                    onDuration?.(d);
                    // Auto-play on ready
                    e.target.playVideo();
                    setPlaying(true);
                    setCurrentTrack((prev: any) => ({ ...prev, isPlaying: true }));
                    startTick();
                },
                onStateChange: (e: any) => {
                    const YTS = window.YT.PlayerState;
                    if (e.data === YTS.PLAYING) {
                        setPlaying(true);
                        setCurrentTrack((prev: any) => ({ ...prev, isPlaying: true }));
                        startTick();
                    } else if (e.data === YTS.PAUSED || e.data === YTS.BUFFERING) {
                        if (e.data === YTS.PAUSED) {
                            setPlaying(false);
                            setCurrentTrack((prev: any) => ({ ...prev, isPlaying: false }));
                        }
                        stopTick();
                    } else if (e.data === YTS.ENDED) {
                        stopTick();
                        playNextTrack?.();
                    }
                },
                onError: (e: any) => {
                    console.error('YT Player error:', e.data);
                    stopTick();
                },
            },
        });

        return () => {
            stopTick();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apiReady, currentVideoId]);

    // Sync play/pause from external context (e.g. mobile footer button)
    useEffect(() => {
        if (!playerRef.current) return;
        try {
            if (currentTrack.isPlaying && !playing) {
                playerRef.current.playVideo();
            } else if (!currentTrack.isPlaying && playing) {
                playerRef.current.pauseVideo();
            }
        } catch (_) {}
    }, [currentTrack.isPlaying]);

    const togglePlay = () => {
        if (!playerRef.current) return;
        try {
            if (playing) {
                playerRef.current.pauseVideo();
            } else {
                playerRef.current.playVideo();
            }
        } catch (_) {}
    };

    const handleSeek = (_: any, newValue: number | number[]) => {
        const val = newValue as number;
        setPlayedSeconds(val);
        try { playerRef.current?.seekTo?.(val, true); } catch (_) {}
    };

    const handleVolumeChange = (_: any, val: number | number[]) => {
        const v = val as number;
        setVolume(v);
        setMuted(v === 0);
        try { playerRef.current?.setVolume?.(v); } catch (_) {}
    };

    const handleMuteToggle = () => {
        const newMuted = !muted;
        setMuted(newMuted);
        try {
            if (newMuted) playerRef.current?.mute?.();
            else { playerRef.current?.unMute?.(); playerRef.current?.setVolume?.(volume); }
        } catch (_) {}
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
            {/*
              * YouTube IFrame phải được mount vào DOM thật (không dùng display:none hay zIndex:-1)
              * Chỉ thu nhỏ kích thước về 1x1px và đặt ra ngoài vùng nhìn thấy.
              * Đây là cách duy nhất YouTube IFrame API cho phép autoplay.
              */}
            <Box
                ref={containerRef}
                sx={{
                    position: 'fixed',
                    bottom: -2,
                    right: -2,
                    width: 2,
                    height: 2,
                    overflow: 'hidden',
                    // KHÔNG dùng display:none, opacity:0, visibility:hidden hoặc zIndex âm
                    // vì YouTube sẽ block autoplay khi iframe bị ẩn hoàn toàn
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            />

            {!minimal && (
                <>
                    {/* Main Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton size="small" sx={{ color: '#ccc', '&:hover': { color: 'white' } }}>
                            <ShuffleIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                        <IconButton size="small" onClick={playPreviousTrack} sx={{ color: 'white' }}>
                            <SkipPreviousIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                        <IconButton onClick={togglePlay} sx={{ color: 'white', p: 0 }}>
                            {playing
                                ? <PauseCircleFilledIcon sx={{ fontSize: 45 }} />
                                : <PlayCircleFilledIcon sx={{ fontSize: 45 }} />
                            }
                        </IconButton>
                        <IconButton size="small" onClick={playNextTrack} sx={{ color: 'white' }}>
                            <SkipNextIcon sx={{ fontSize: 28 }} />
                        </IconButton>
                    </Box>

                    {/* Progress Bar */}
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 2 }}>
                        <Typography sx={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold', minWidth: 40, textAlign: 'right' }}>
                            {formatTime(playedSeconds)}
                        </Typography>
                        <Slider
                            value={playedSeconds}
                            max={duration || 100}
                            onChange={handleSeek}
                            sx={{
                                color: '#f50',
                                height: 4,
                                py: '13px',
                                '& .MuiSlider-thumb': {
                                    width: 12,
                                    height: 12,
                                    '&::before': { boxShadow: 'none' },
                                    '&:hover, &.Mui-focusVisible': { boxShadow: '0px 0px 0px 8px rgb(255 85 0 / 16%)' },
                                    '&.Mui-active': { width: 14, height: 14 },
                                },
                                '& .MuiSlider-rail': { color: '#555', opacity: 1 },
                            }}
                        />
                        <Typography sx={{ color: '#ccc', fontSize: '12px', fontWeight: 'bold', minWidth: 40 }}>
                            {formatTime(duration)}
                        </Typography>
                    </Box>

                    {/* Volume Control */}
                    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 100 }}>
                        <IconButton size="small" onClick={handleMuteToggle} sx={{ color: '#ccc' }}>
                            {muted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                        </IconButton>
                        <Slider
                            size="small"
                            value={muted ? 0 : volume}
                            min={0}
                            max={100}
                            onChange={handleVolumeChange}
                            sx={{
                                color: '#ccc',
                                ml: 1,
                                width: 60,
                                '& .MuiSlider-thumb': { display: 'none' },
                                '&:hover .MuiSlider-thumb': { display: 'block', width: 10, height: 10 },
                            }}
                        />
                        <IconButton size="small" sx={{ color: '#ccc', ml: 1 }}>
                            <RepeatIcon sx={{ fontSize: 22 }} />
                        </IconButton>
                    </Box>
                </>
            )}
        </Box>
    );
};

export default CustomYouTubePlayer;