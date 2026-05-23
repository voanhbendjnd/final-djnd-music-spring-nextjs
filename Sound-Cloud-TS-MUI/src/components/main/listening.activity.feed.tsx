'use client';

import React, {
    useEffect,
    useRef,
    useState,
    useCallback,
} from 'react';

import {
    Box,
    Typography,
    Avatar,
    Card,
    IconButton,
    Fade,
    CircularProgress,
} from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';

import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

import { useTrackContext, ITrackContext } from '@/lib/track.wrapper';
import axiosInstance from "@/utils/axios-instance";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {generateProfileUrl, generateTrackUrlUp} from "@/utils/generate.slug";
import Link from "next/link";
import UploaderHoverCard from "@/components/profile/uploader.hover.card";
dayjs.extend(relativeTime);

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
}

interface IBackendPagination<T> {
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
    result: T[];
}

// ─────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────

export default function ListeningActivityFeed() {

    const { data: session } = useSession();

    const {
        currentTrack,
        setCurrentTrack,
    } = useTrackContext() as ITrackContext;

    const [feeds, setFeeds] = useState<ListeningActivityEvent[]>([]);

    const [connected, setConnected] = useState(false);

    const [loading, setLoading] = useState(true);

    const [page, setPage] = useState(1);

    const [hasMore, setHasMore] = useState(true);

    const [fetchingMore, setFetchingMore] = useState(false);

    const stompRef = useRef<Client | null>(null);

    const token = session?.access_token;

    const userId = session?.user?.id;

    // ─────────────────────────────────────────────────────────
    // FETCH INITIAL POSTS
    // ─────────────────────────────────────────────────────────

    const fetchPosts = useCallback(async (
        targetPage = 1,
        append = false
    ) => {

        try {

            if (targetPage === 1) {
                setLoading(true);
            } else {
                setFetchingMore(true);
            }

            const res = await axiosInstance.get(
                `/api/v1/tracks/following/post?page=${targetPage}&size=10`,
                {
                    headers: {
                        ...(session?.access_token && {
                            Authorization: `Bearer ${session.access_token}`
                        }),
                    },
                }
            );

            const data: IBackendPagination<ListeningActivityEvent> =
                res?.data;

            const items = data?.result || [];

            setHasMore(targetPage < data.meta.pages);

            setFeeds(prev => {

                const current = append ? [...prev] : [];

                items.forEach(item => {

                    const existed = current.find(
                        x =>
                            String(x.followingTrackId)
                            === String(item.followingTrackId)
                    );

                    if (!existed) {
                        current.push(item);
                    }
                });

                return current;
            });

        } catch (error) {

            console.error(error);

        } finally {

            setLoading(false);

            setFetchingMore(false);
        }

    }, []);

    // ─────────────────────────────────────────────────────────
    // INITIAL LOAD
    // ─────────────────────────────────────────────────────────

    useEffect(() => {

        if (!session) return;

        fetchPosts(1);

    }, [session, fetchPosts]);

    // ─────────────────────────────────────────────────────────
    // WEBSOCKET CONNECTION
    // ─────────────────────────────────────────────────────────

    useEffect(() => {

        if (!token || !userId) return;

        const client = new Client({

            webSocketFactory: () =>
                new SockJS(
                    `${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/ws`
                ),

            connectHeaders: {
                Authorization: `Bearer ${token}`,
            },

            reconnectDelay: 5000,

            heartbeatIncoming: 10000,

            heartbeatOutgoing: 10000,
        });

        client.onConnect = () => {

            console.log('CONNECTED FEED SOCKET');

            setConnected(true);

            client.subscribe(
                `/user/queue/follower/home`,
                (message: IMessage) => {

                    try {

                        const payload: ListeningActivityEvent =
                            JSON.parse(message.body);

                        console.log('NEW FEED POST', payload);

                        setFeeds(prev => {

                            const existed = prev.find(item => {

                                if (
                                    payload.activityId
                                    && item.activityId
                                ) {
                                    return item.activityId === payload.activityId;
                                }

                                return (
                                    String(item.followingTrackId)
                                    === String(payload.followingTrackId)
                                );
                            });

                            if (existed) return prev;

                            return [
                                {
                                    ...payload,
                                    startedAt: payload.startedAt || Date.now(),
                                },
                                ...prev,
                            ];
                        });

                    } catch (error) {

                        console.error(error);
                    }
                }
            );
        };

        client.onDisconnect = () => {
            setConnected(false);
        };

        client.onStompError = (frame) => {
            console.error(frame);
        };

        client.activate();

        stompRef.current = client;

        return () => {

            client.deactivate();

            stompRef.current = null;
        };

    }, [token, userId]);

    // ─────────────────────────────────────────────────────────
    // LOAD MORE
    // ─────────────────────────────────────────────────────────

    const handleLoadMore = async () => {

        if (!hasMore || fetchingMore) return;

        const nextPage = page + 1;

        setPage(nextPage);

        await fetchPosts(nextPage, true);
    };

    // ─────────────────────────────────────────────────────────
    // PLAY TRACK
    // ─────────────────────────────────────────────────────────

    const handlePlay = useCallback((feed: ListeningActivityEvent) => {

        const isCurrent =
            String(currentTrack?.id)
            === String(feed.followingTrackId);

        setCurrentTrack({
            id: feed.followingTrackId,

            title: feed.followingTrackTitle,

            trackUrl: feed.followingTrackUrl,

            imgUrl: feed.followingImgUrl,

            isPlaying: isCurrent
                ? !currentTrack?.isPlaying
                : true,

            uploader: {
                name: feed.followingName,
            },

        } as any);

    }, [currentTrack, setCurrentTrack]);

    // ─────────────────────────────────────────────────────────
    // EMPTY
    // ─────────────────────────────────────────────────────────

    if (!session) return null;

    // ─────────────────────────────────────────────────────────
    // UI
    // ─────────────────────────────────────────────────────────

    return (

        <Box
            sx={{
                width: '100%',
                mt: 5,
                mb: 20,
                // marginBottom:10
            }}
        >

            {/* HEADER */}

            <Box sx={{ mb: 3 }}>

                <Typography
                    sx={{
                        fontSize: '1.7rem',
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                    }}
                >
                    Live Feed
                </Typography>

                <Typography
                    sx={{
                        color: 'rgba(255,255,255,0.45)',
                        fontSize: '0.9rem',
                        mt: 0.5,
                    }}
                >
                    Real-time music posts from people you follow
                </Typography>

            </Box>

            {/* STATUS */}

            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 3,
                }}
            >

                <Box
                    sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        // bgcolor: connected
                        //     ? '#1DB954'
                        //     : '#ff4444',
                    }}
                />

                {/*<Typography*/}
                {/*    sx={{*/}
                {/*        fontSize: '0.78rem',*/}
                {/*        color: 'rgba(255,255,255,0.45)',*/}
                {/*    }}*/}
                {/*>*/}
                {/*    {connected*/}
                {/*        ? 'Realtime connected'*/}
                {/*        : 'Connecting realtime...'}*/}
                {/*</Typography>*/}

            </Box>

            {/* LOADING */}

            {loading && (

                <Box
                    sx={{
                        py: 10,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >
                    <CircularProgress sx={{ color: '#ff5500' }} />
                </Box>
            )}

            {/* EMPTY */}

            {!loading && feeds.length === 0 && (

                <Card
                    sx={{
                        bgcolor: '#151515',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 4,
                        p: 5,
                        textAlign: 'center',
                    }}
                >

                    <GraphicEqIcon
                        sx={{
                            fontSize: 50,
                            color: 'rgba(255,255,255,0.15)',
                            mb: 1,
                        }}
                    />

                    <Typography
                        sx={{
                            color: 'rgba(255,255,255,0.3)',
                            fontWeight: 600,
                        }}
                    >
                        No posts from people you follow yet
                    </Typography>

                </Card>
            )}

            {/* FEEDS */}

            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                }}
            >

                {feeds.map((feed) => {

                    const isPlaying =
                        String(currentTrack?.id)
                        === String(feed.followingTrackId)
                        && currentTrack?.isPlaying;

                    const isMine =
                        Number(userId) === feed.followingId;

                    return (

                        <Fade
                            in
                            timeout={400}
                            key={
                                feed.activityId
                                || `${feed.followingTrackId}-${feed.postedAt}`
                            }
                        >

                            <Card
                                sx={{
                                    bgcolor: '#181818',

                                    borderRadius: 4,

                                    overflow: 'hidden',

                                    border:
                                        '1px solid rgba(255,255,255,0.04)',

                                    transition: '0.2s ease',

                                    '&:hover': {
                                        transform: 'translateY(-2px)',

                                        borderColor:
                                            'rgba(255,85,0,0.25)',
                                    },
                                }}
                            >

                                {/* USER */}

                                <Box
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                    }}
                                >
                                    <Link href={generateProfileUrl(feed.followingName,String(feed.followingId))}>
                                        <Avatar
                                            src={feed.followingAvatar}
                                            sx={{
                                                width: 44,
                                                height: 44,

                                                border:
                                                    isMine
                                                        ? '2px solid #4facfe'
                                                        : '2px solid #ff5500',
                                            }}
                                        />
                                    </Link>


                                    <Box sx={{ flex: 1 }}>
                                        <Link href={generateProfileUrl(feed.followingName,String(feed.followingId))} style={{textDecoration: 'none'}}>
                                            <Typography
                                                sx={{
                                                    fontWeight: 700,
                                                    fontSize: '0.92rem',

                                                    color:
                                                        isMine
                                                            ? '#4facfe'
                                                            : '#fff',
                                                    '&:hover': {
                                                        color: "#f50",
                                                    }
                                                }}

                                            >
                                                {isMine
                                                    ? 'You'
                                                    : feed.followingName}
                                            </Typography>

                                        </Link>

                                        <Typography
                                            sx={{
                                                fontSize: '0.75rem',

                                                color:
                                                    'rgba(255,255,255,0.4)',

                                                mt: 0.2,
                                            }}
                                        >
                                            shared a new track
                                        </Typography>

                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: '0.72rem',
                                            color: 'rgba(255,255,255,0.25)',
                                        }}
                                    >
                                        {dayjs(feed.postedAt).fromNow()}

                                    </Typography>

                                </Box>

                                {/* TRACK */}

                                <Box
                                    sx={{
                                        px: 2,
                                        pb: 2,
                                    }}
                                >

                                    <Box
                                        sx={{
                                            display: 'flex',

                                            alignItems: 'center',

                                            gap: 2,

                                            bgcolor: '#121212',

                                            borderRadius: 3,

                                            p: 1.5,
                                        }}
                                    >

                                        {/* IMAGE */}

                                        <Box
                                            sx={{
                                                width: 72,

                                                height: 72,

                                                borderRadius: 2,

                                                overflow: 'hidden',

                                                position: 'relative',

                                                flexShrink: 0,
                                            }}
                                        >

                                            <Image
                                                src={
                                                    feed.followingImgUrl
                                                    || '/image/playlistdefault.jpg'
                                                }

                                                alt={
                                                    feed.followingTrackTitle
                                                }

                                                fill

                                                unoptimized

                                                style={{
                                                    objectFit: 'cover',
                                                }}
                                            />

                                        </Box>

                                        {/* INFO */}

                                        <Box
                                            sx={{
                                                flex: 1,
                                                minWidth: 0,
                                            }}
                                        >
                                            <Link href={generateTrackUrlUp(feed.followingTrackId, feed.followingTrackTitle)}  style={{textDecoration: 'none'}}>
                                                <Typography
                                                    noWrap
                                                    sx={{
                                                        fontWeight: 700,

                                                        fontSize: '0.98rem',

                                                        color:
                                                            isPlaying
                                                                ? '#ff5500'
                                                                : '#fff',
                                                        '&:hover': {
                                                            color: "#f50",
                                                        }
                                                    }}
                                                >
                                                    {feed.followingTrackTitle}
                                                </Typography>
                                            </Link>


                                            <Typography
                                                sx={{
                                                    mt: 0.5,

                                                    fontSize: '0.78rem',

                                                    color:
                                                        'rgba(255,255,255,0.4)',
                                                }}
                                            >
                                                Posted on live feed
                                            </Typography>

                                        </Box>

                                        {/* PLAY */}

                                        <IconButton
                                            onClick={() =>
                                                handlePlay(feed)
                                            }

                                            sx={{
                                                bgcolor: '#ff5500',

                                                color: '#fff',

                                                '&:hover': {
                                                    bgcolor: '#e64d00',
                                                },

                                                width: 42,

                                                height: 42,
                                            }}
                                        >

                                            {isPlaying
                                                ? <PauseIcon />
                                                : <PlayArrowIcon />}

                                        </IconButton>

                                    </Box>

                                </Box>

                            </Card>

                        </Fade>
                    );
                })}

            </Box>

            {/* LOAD MORE */}

            {!loading && hasMore && (

                <Box
                    sx={{
                        mt: 3,
                        display: 'flex',
                        justifyContent: 'center',
                    }}
                >

                    <Box
                        onClick={handleLoadMore}
                        sx={{
                            px: 3,
                            py: 1.2,
                            borderRadius: 999,
                            bgcolor: '#1f1f1f',
                            cursor: 'pointer',

                            border:
                                '1px solid rgba(255,255,255,0.06)',

                            transition: '0.2s',

                            '&:hover': {
                                bgcolor: '#282828',
                            },
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: '0.85rem',
                                fontWeight: 700,
                            }}
                        >
                            {
                                fetchingMore
                                    ? 'Loading...'
                                    : 'Load more'
                            }
                        </Typography>

                    </Box>

                </Box>
            )}

        </Box>
    );
}