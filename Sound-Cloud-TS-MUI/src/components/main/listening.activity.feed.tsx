'use client';

import React, {
    useEffect, useRef, useState, useCallback,
} from 'react';
import {
    Box, Typography, Avatar, IconButton, Fade,
    CircularProgress, Skeleton, Tooltip, useTheme, useMediaQuery,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import axiosInstance from '@/utils/axios-instance';
import { useTrackContext, ITrackContext } from '@/lib/track.wrapper';
import { generateProfileUrl, generateTrackUrlUp } from '@/utils/generate.slug';

dayjs.extend(relativeTime);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ListeningActivityEvent {
    activityId?: string;
    followingId: number;
    followingName: string;
    followingAvatar: string;
    followingTrackId: number;
    followingTrackTitle: string;
    followingTrackUrl: string;
    followingImgUrl: string;
    startedAt?: number;
    postedAt?: string;
    isLiked?: boolean;
}

interface IFeedPagination {
    result: ListeningActivityEvent[];
    nextCursor: string | null;
    trackId: number | null;
    hasMore: boolean;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

const FeedSkeleton = () => (
    <Box sx={{
        bgcolor: '#1c1c1c',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)',
    }}>
        <Box sx={{ p: '14px 16px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Skeleton variant="circular" width={42} height={42} sx={{ bgcolor: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
            <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="35%" height={16} sx={{ bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Skeleton variant="text" width="55%" height={13} sx={{ bgcolor: 'rgba(255,255,255,0.05)', mt: 0.5 }} />
            </Box>
            <Skeleton variant="text" width={40} height={13} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
        </Box>
        <Skeleton variant="rectangular" height={200} sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
        <Box sx={{ p: '12px 16px', display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width={80} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
            <Skeleton variant="rounded" width={60} height={32} sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: '8px' }} />
        </Box>
    </Box>
);

// ─── Equalizer bars animation ─────────────────────────────────────────────────

const EqBars = () => (
    <Box sx={{
        display: 'flex', alignItems: 'flex-end', gap: '2px', height: 16,
        '& span': {
            display: 'block', width: 3, bgcolor: '#ff5500', borderRadius: '2px',
            transformOrigin: 'bottom',
        },
        '& span:nth-of-type(1)': { height: '60%', animation: 'eq1 0.8s ease-in-out infinite alternate' },
        '& span:nth-of-type(2)': { height: '100%', animation: 'eq2 0.6s ease-in-out infinite alternate' },
        '& span:nth-of-type(3)': { height: '40%', animation: 'eq3 0.9s ease-in-out infinite alternate' },
        '& span:nth-of-type(4)': { height: '80%', animation: 'eq1 0.7s ease-in-out infinite alternate' },
        '@keyframes eq1': { from: { transform: 'scaleY(0.3)' }, to: { transform: 'scaleY(1)' } },
        '@keyframes eq2': { from: { transform: 'scaleY(0.5)' }, to: { transform: 'scaleY(0.2)' } },
        '@keyframes eq3': { from: { transform: 'scaleY(1)' }, to: { transform: 'scaleY(0.4)' } },
    }}>
        <span /><span /><span /><span />
    </Box>
);

// ─── Feed card ────────────────────────────────────────────────────────────────

const FeedCard = ({
                      feed, userId, index, currentTrack, onPlay,
                  }: {
    feed: ListeningActivityEvent;
    userId?: string | number;
    index: number;
    currentTrack: any;
    onPlay: (feed: ListeningActivityEvent) => void;
}) => {
    const isPlaying =
        String(currentTrack?.id) === String(feed.followingTrackId)
        && currentTrack?.isPlaying;

    const isMine = Number(userId) === feed.followingId;

    return (
        <Fade in timeout={280} style={{ transitionDelay: `${Math.min(index * 50, 200)}ms` }}>
            <Box sx={{
                bgcolor: '#1c1c1c',
                borderRadius: '16px',
                overflow: 'hidden',
                border: isPlaying
                    ? '1px solid rgba(255,85,0,0.35)'
                    : '1px solid rgba(255,255,255,0.05)',
                transition: 'border-color 0.25s, box-shadow 0.25s, transform 0.2s',
                boxShadow: isPlaying
                    ? '0 0 0 1px rgba(255,85,0,0.12), 0 8px 32px rgba(255,85,0,0.08)'
                    : '0 2px 12px rgba(0,0,0,0.25)',
                '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                    borderColor: isPlaying ? 'rgba(255,85,0,0.5)' : 'rgba(255,255,255,0.1)',
                },
            }}>

                {/* ── Header: avatar + name + time ──────────────────────── */}
                <Box sx={{ px: 2, pt: 2, pb: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Link href={generateProfileUrl(feed.followingName, String(feed.followingId))} style={{ flexShrink: 0 }}>
                        <Box sx={{ position: 'relative' }}>
                            <Avatar
                                src={feed.followingAvatar}
                                sx={{
                                    width: 42, height: 42,
                                    border: isMine ? '2px solid #4facfe' : '2px solid rgba(255,85,0,0.6)',
                                    transition: 'transform 0.2s',
                                    '&:hover': { transform: 'scale(1.08)' },
                                }}
                            >
                                {feed.followingName?.charAt(0).toUpperCase()}
                            </Avatar>
                            {/* Online dot */}
                            <Box sx={{
                                position: 'absolute', bottom: 0, right: 0,
                                width: 11, height: 11,
                                borderRadius: '50%',
                                bgcolor: '#1DB954',
                                border: '2px solid #1c1c1c',
                            }} />
                        </Box>
                    </Link>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap' }}>
                            <Link href={generateProfileUrl(feed.followingName, String(feed.followingId))} style={{ textDecoration: 'none' }}>
                                <Typography sx={{
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    color: isMine ? '#4facfe' : '#f0f0f0',
                                    lineHeight: 1.2,
                                    '&:hover': { color: '#ff5500' },
                                    transition: 'color 0.15s',
                                }}>
                                    {isMine ? 'You' : feed.followingName}
                                </Typography>
                            </Link>
                            <Typography sx={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.2 }}>
                                shared a track
                            </Typography>
                        </Box>
                        <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.28)', mt: 0.3 }}>
                            {dayjs(feed.postedAt).fromNow()}
                        </Typography>
                    </Box>

                    {/* Playing indicator */}
                    {isPlaying && (
                        <Tooltip title="Now playing" placement="left">
                            <Box><EqBars /></Box>
                        </Tooltip>
                    )}
                </Box>

                {/* ── Track image — full width, FB style ────────────────── */}
                <Box
                    onClick={() => onPlay(feed)}
                    sx={{
                        position: 'relative',
                        width: '100%',
                        aspectRatio: '16/9',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        bgcolor: '#111',
                        '&:hover .play-overlay': { opacity: 1 },
                        '&:hover img': { transform: 'scale(1.04)' },
                    }}
                >
                    <Image
                        src={feed.followingImgUrl || '/image/playlistdefault.jpg'}
                        alt={feed.followingTrackTitle}
                        fill
                        unoptimized
                        style={{ objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    />

                    {/* Gradient overlay */}
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
                    }} />

                    {/* Title on image */}
                    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: '12px 16px' }}>
                        <Link href={generateTrackUrlUp(feed.followingTrackId, feed.followingTrackTitle)} style={{ textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                            <Typography noWrap sx={{
                                fontWeight: 700,
                                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                                color: '#fff',
                                textShadow: '0 1px 8px rgba(0,0,0,0.8)',
                                '&:hover': { color: '#ff9966' },
                                transition: 'color 0.15s',
                            }}>
                                {feed.followingTrackTitle}
                            </Typography>
                        </Link>
                        <Typography sx={{
                            fontSize: '0.75rem',
                            color: 'rgba(255,255,255,0.55)',
                            mt: 0.2,
                            display: 'flex', alignItems: 'center', gap: 0.5,
                        }}>
                            <HeadphonesIcon sx={{ fontSize: 13 }} />
                            {feed.followingName}
                        </Typography>
                    </Box>

                    {/* Play overlay */}
                    <Box className="play-overlay" sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.3)',
                        opacity: isPlaying ? 0.6 : 0,
                        transition: 'opacity 0.2s',
                    }}>
                        <Box sx={{
                            width: 60, height: 60,
                            borderRadius: '50%',
                            bgcolor: isPlaying ? '#ff5500' : 'rgba(255,85,0,0.9)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 24px rgba(255,85,0,0.5)',
                            transform: 'scale(1)',
                            transition: 'transform 0.15s',
                            '&:hover': { transform: 'scale(1.08)' },
                        }}>
                            {isPlaying
                                ? <PauseIcon sx={{ fontSize: 30, color: '#fff' }} />
                                : <PlayArrowIcon sx={{ fontSize: 30, color: '#fff' }} />
                            }
                        </Box>
                    </Box>
                </Box>

                {/* ── Action bar ──────────────────────────────────────────── */}
                <Box sx={{
                    px: 2, py: 1.5,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                    {/* Play button text */}
                    <Box
                        onClick={() => onPlay(feed)}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            cursor: 'pointer',
                            px: 1.5, py: 0.8,
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            bgcolor: isPlaying ? 'rgba(255,85,0,0.12)' : 'rgba(255,255,255,0.04)',
                            transition: 'all 0.15s',
                            '&:hover': {
                                bgcolor: 'rgba(255,85,0,0.15)',
                                borderColor: 'rgba(255,85,0,0.3)',
                            },
                        }}
                    >
                        {isPlaying
                            ? <PauseIcon sx={{ fontSize: 18, color: '#ff5500' }} />
                            : <PlayArrowIcon sx={{ fontSize: 18, color: 'rgba(255,255,255,0.7)' }} />
                        }
                        <Typography sx={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: isPlaying ? '#ff5500' : 'rgba(255,255,255,0.65)',
                        }}>
                            {isPlaying ? 'Playing' : 'Play'}
                        </Typography>
                    </Box>

                    {/* Go to track */}
                    <Link href={generateTrackUrlUp(feed.followingTrackId, feed.followingTrackTitle)} style={{ textDecoration: 'none' }}>
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 0.6,
                            px: 1.5, py: 0.8,
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            bgcolor: 'rgba(255,255,255,0.04)',
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.08)',
                                borderColor: 'rgba(255,255,255,0.15)',
                            },
                        }}>
                            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                                View track
                            </Typography>
                        </Box>
                    </Link>
                </Box>
            </Box>
        </Fade>
    );
};

// ─── Main component ───────────────────────────────────────────────────────────

export default function ListeningActivityFeed() {
    const { data: session } = useSession();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

    const [feeds, setFeeds] = useState<ListeningActivityEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchingMore, setFetchingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [nextTrackId, setNextTrackId] = useState<number | null>(null);

    const stompRef = useRef<Client | null>(null);
    const token = session?.access_token;
    const userId = session?.user?.id;

    const mergeFeeds = useCallback((
        old: ListeningActivityEvent[],
        next: ListeningActivityEvent[],
    ) => {
        const map = new Map<string, ListeningActivityEvent>();
        [...old, ...next].forEach(f => {
            const key = f.activityId || `${f.followingTrackId}-${f.postedAt}`;
            if (!map.has(key)) map.set(key, f);
        });
        return Array.from(map.values());
    }, []);

    const fetchPosts = useCallback(async (append = false) => {
        try {
            append ? setFetchingMore(true) : setLoading(true);
            const body = { size: 10, cursor: nextCursor, trackId: nextTrackId };
            const res = await axiosInstance.post<any, IFeedPagination>('/api/v1/tracks/following/post', body);
            //@ts-ignore
            const items = res?.data?.result || [];
            setFeeds(prev => append ? mergeFeeds(prev, items) : items);
            setHasMore(Boolean(res?.hasMore));
            setNextCursor(res?.nextCursor || null);
            setNextTrackId(res?.trackId || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setFetchingMore(false);
        }
    }, [nextCursor, nextTrackId, mergeFeeds]);

    useEffect(() => {
        if (!session) return;
        fetchPosts(false);
    }, [session]);

    // WebSocket
    useEffect(() => {
        if (!token || !userId) return;
        const client = new Client({
            webSocketFactory: () => new SockJS(`${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 5000,
            heartbeatIncoming: 10000,
            heartbeatOutgoing: 10000,
        });
        client.onConnect = () => {
            client.subscribe('/user/queue/follower/home', (message: IMessage) => {
                try {
                    const payload: ListeningActivityEvent = JSON.parse(message.body);
                    setFeeds(prev => {
                        const exists = prev.find(item =>
                            payload.activityId && item.activityId === payload.activityId
                        );
                        if (exists) return prev;
                        return [{ ...payload, postedAt: payload.postedAt || new Date().toISOString() }, ...prev];
                    });
                } catch (e) { console.error(e); }
            });
        };
        client.activate();
        stompRef.current = client;
        return () => { client.deactivate(); stompRef.current = null; };
    }, [token, userId]);

    const handlePlay = useCallback((feed: ListeningActivityEvent) => {
        const isCurrent = String(currentTrack?.id) === String(feed.followingTrackId);
        setCurrentTrack({
            id: feed.followingTrackId,
            title: feed.followingTrackTitle,
            trackUrl: feed.followingTrackUrl,
            uploader: { id: feed.followingId, name: feed.followingName, avatar: feed.followingAvatar, countFollowers: 0, isFollowed: true },
            imgUrl: feed.followingImgUrl,
            isLiked: feed.isLiked,
            isPlaying: isCurrent ? !currentTrack?.isPlaying : true,
        } as any);
    }, [currentTrack, setCurrentTrack]);

    if (!session) return null;

    return (
        <Box sx={{ width: '100%', mt: { xs: 3, md: 5 }, mb: 20, px: { xs: 0, sm: 0 } }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <Box sx={{ mb: { xs: 2.5, md: 3.5 }, px: { xs: 0, sm: 0 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                    <Box sx={{
                        width: 4, height: 28, borderRadius: 2,
                        background: 'linear-gradient(to bottom, #ff5500, #ff9900)',
                        flexShrink: 0,
                    }} />
                    <Typography sx={{
                        fontSize: { xs: '1.35rem', md: '1.7rem' },
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: '#f0f0f0',
                        lineHeight: 1,
                    }}>
                        Live Feed
                    </Typography>
                </Box>
                <Typography sx={{
                    color: 'rgba(255,255,255,0.35)',
                    fontSize: { xs: '0.8rem', md: '0.88rem' },
                    ml: '20px',
                    mt: 0.5,
                }}>
                    What people you follow are listening to
                </Typography>
            </Box>

            {/* ── Loading ─────────────────────────────────────────────────── */}
            {loading && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {[0, 1, 2].map(i => <FeedSkeleton key={i} />)}
                </Box>
            )}

            {/* ── Empty ───────────────────────────────────────────────────── */}
            {!loading && feeds.length === 0 && (
                <Box sx={{
                    bgcolor: '#181818',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    p: { xs: 5, md: 7 },
                    textAlign: 'center',
                }}>
                    <Box sx={{
                        width: 64, height: 64, borderRadius: '50%',
                        bgcolor: 'rgba(255,85,0,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                    }}>
                        <GraphicEqIcon sx={{ fontSize: 32, color: 'rgba(255,85,0,0.4)' }} />
                    </Box>
                    <Typography sx={{ color: '#555', fontWeight: 600, fontSize: '0.95rem' }}>
                        Nothing here yet
                    </Typography>
                    <Typography sx={{ color: '#3a3a3a', fontSize: '0.82rem', mt: 0.8 }}>
                        Follow artists to see their activity appear here
                    </Typography>
                </Box>
            )}

            {/* ── Feed list — single column, FB style ─────────────────────── */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 2, md: 2.5 },
                // max width for readability on wide screens
                maxWidth: { xs: '100%', sm: 560, md: 600 },
                mx: 'auto',
            }}>
                {feeds.map((feed, i) => (
                    <FeedCard
                        key={feed.activityId || `${feed.followingTrackId}-${feed.postedAt}`}
                        feed={feed}
                        userId={userId}
                        index={i}
                        currentTrack={currentTrack}
                        onPlay={handlePlay}
                    />
                ))}
            </Box>

            {/* ── Load more ───────────────────────────────────────────────── */}
            {!loading && hasMore && (
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', maxWidth: { sm: 560, md: 600 }, mx: 'auto' }}>
                    <Box
                        onClick={() => { if (!fetchingMore) fetchPosts(true); }}
                        sx={{
                            px: 4, py: 1.2,
                            borderRadius: '10px',
                            bgcolor: '#1e1e1e',
                            cursor: fetchingMore ? 'default' : 'pointer',
                            border: '1px solid rgba(255,255,255,0.07)',
                            transition: '0.2s',
                            display: 'flex', alignItems: 'center', gap: 1,
                            '&:hover': { bgcolor: '#262626', borderColor: 'rgba(255,255,255,0.12)' },
                        }}
                    >
                        {fetchingMore && <CircularProgress size={14} sx={{ color: '#ff5500' }} />}
                        <Typography sx={{ fontSize: '0.84rem', fontWeight: 700, color: '#aaa' }}>
                            {fetchingMore ? 'Loading...' : 'Load more'}
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );
}