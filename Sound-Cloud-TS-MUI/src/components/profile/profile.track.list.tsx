'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Box, Tabs, Tab, Typography, CircularProgress,
    Avatar, useTheme, useMediaQuery,
} from '@mui/material';
import {
    GridView, AudiotrackOutlined, FavoriteBorder, History,
} from '@mui/icons-material';
import { sendRequest } from '@/utils/api';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { generateProfileUrl } from '@/utils/generate.slug';
import ProfileTrack from "@/components/track/profile.track";

interface IProps {
    userId: string;
    initialTracks: ITrack[];
    initialTotal: number;
    initialHasMore: boolean;
}

type TabKey = 'all' | 'myTracks' | 'liked' | 'history';

const TAB_CONFIG: { key: TabKey; label: string; icon: React.ReactElement }[] = [
    { key: 'all', label: 'All', icon: <GridView sx={{ fontSize: 16 }} /> },
    { key: 'myTracks', label: 'Tracks', icon: <AudiotrackOutlined sx={{ fontSize: 16 }} /> },
    { key: 'liked', label: 'Liked', icon: <FavoriteBorder sx={{ fontSize: 16 }} /> },
    { key: 'history', label: 'History', icon: <History sx={{ fontSize: 16 }} /> },
];

const PAGE_SIZE = 5;

// ── Sidebar: unique uploaders ──────────────────────────────────────────────────
function UploaderSidebar({ tracks }: { tracks: ITrack[] }) {
    const uniqueUploaders = useMemo(() => {
        const map = new Map<string | number, ITrack['uploader']>();
        tracks.forEach(t => {
            if (t.uploader?.id && !map.has(t.uploader.id)) {
                map.set(t.uploader.id, t.uploader);
            }
        });
        return Array.from(map.values());
    }, [tracks]);

    if (uniqueUploaders.length === 0) return null;

    return (
        <Box sx={{
            width: 180,
            flexShrink: 0,
            // sticky on desktop
            position: { md: 'sticky' },
            top: { md: 64 },
            alignSelf: { md: 'flex-start' },
            pt: { md: 1 },
        }}>
            <Typography sx={{
                fontSize: '0.6rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.25)',
                fontWeight: 700,
                mb: 1.5,
                px: 0.5,
            }}>
                Artists
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {uniqueUploaders.map((uploader, i) => (
                    <Link
                        key={uploader.id ?? i}
                        href={generateProfileUrl(uploader.name, String(uploader.id))}
                        style={{ textDecoration: 'none' }}
                    >
                        <Box sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            px: 1,
                            py: 0.75,
                            borderRadius: 2,
                            transition: 'background 0.15s',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.05)',
                                '& .uploader-name': { color: '#ff5500' },
                            },
                        }}>
                            <Avatar
                                src={uploader.avatar}
                                sx={{
                                    width: 34,
                                    height: 34,
                                    fontSize: '0.85rem',
                                    bgcolor: '#2a2a2a',
                                    border: '1.5px solid rgba(255,85,0,0.15)',
                                    flexShrink: 0,
                                }}
                            >
                                {uploader.name?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography
                                className="uploader-name"
                                noWrap
                                sx={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.75)',
                                    transition: 'color 0.15s',
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {uploader.name}
                            </Typography>
                        </Box>
                    </Link>
                ))}
            </Box>
        </Box>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function ProfileTrackList({
                                             userId, initialTracks, initialTotal, initialHasMore,
                                         }: IProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    const { data: session } = useSession();

    const [activeTab, setActiveTab] = useState<TabKey>('all');

    const [tabCache, setTabCache] = useState<Record<TabKey, {
        tracks: ITrack[];
        page: number;
        hasMore: boolean;
        loaded: boolean;
        loading: boolean;
    }>>({
        all: { tracks: initialTracks, page: 1, hasMore: initialHasMore, loaded: true, loading: false },
        myTracks: { tracks: [], page: 1, hasMore: true, loaded: false, loading: false },
        liked: { tracks: [], page: 1, hasMore: true, loaded: false, loading: false },
        history: { tracks: [], page: 1, hasMore: true, loaded: false, loading: false },
    });

    const loaderRef = useRef<HTMLDivElement | null>(null);

    const getUrl = (tab: TabKey) => {
        switch (tab) {
            case 'all': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks`;
            case 'myTracks': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/users/${userId}`;
            case 'liked': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/likes`;
            case 'history': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/histories/main`;
        }
    };

    const fetchTracks = useCallback(async (tab: TabKey, page: number, append = false) => {
        setTabCache(prev => ({ ...prev, [tab]: { ...prev[tab], loading: true } }));
        try {
            const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
                url: getUrl(tab),
                method: 'GET',
                queryParams: { page, size: PAGE_SIZE, sort: 'createdAt,desc' },
                headers: {
                    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
                },
                nextOption: { cache: 'no-store' },
            });
            const result = res?.data?.result ?? [];
            const meta = res?.data?.meta;
            const hasMore = meta ? meta.page < meta.pages : false;
            setTabCache(prev => ({
                ...prev,
                [tab]: {
                    tracks: append ? [...prev[tab].tracks, ...result] : result,
                    page, hasMore, loaded: true, loading: false,
                },
            }));
        } catch (e) {
            console.error('Failed to fetch tracks for tab', tab, e);
            setTabCache(prev => ({ ...prev, [tab]: { ...prev[tab], loading: false, loaded: true } }));
        }
    }, [session?.access_token, userId]);

    useEffect(() => {
        const state = tabCache[activeTab];
        if (!state.loaded && !state.loading) fetchTracks(activeTab, 1);
    }, [activeTab]);

    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (!entries[0].isIntersecting) return;
            const state = tabCache[activeTab];
            if (state.hasMore && !state.loading && state.loaded) {
                fetchTracks(activeTab, state.page + 1, true);
            }
        }, { threshold: 0.1 });
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [activeTab, tabCache, fetchTracks]);

    const current = tabCache[activeTab];

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ mt: 0, pb: { xs: 14, sm: 8 } }}>

            {/* ── TABS (full width, sticky) ─────────────────────────────────── */}
            <Box sx={{
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                mb: 0,
                position: 'sticky',
                top: 0,
                zIndex: 10,
                bgcolor: '#121212',
                backdropFilter: 'blur(12px)',
            }}>
                <Tabs
                    value={activeTab}
                    onChange={(_, v) => setActiveTab(v as TabKey)}
                    variant={isMobile ? 'fullWidth' : 'standard'}
                    TabIndicatorProps={{
                        style: { backgroundColor: '#ff5500', height: 2, borderRadius: '2px 2px 0 0' },
                    }}
                    sx={{
                        minHeight: 46,
                        '& .MuiTab-root': {
                            minHeight: 46,
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: { xs: '0.78rem', sm: '0.85rem' },
                            fontWeight: 600,
                            textTransform: 'none',
                            letterSpacing: '-0.01em',
                            gap: 0.5,
                            transition: 'color 0.15s',
                            '&:hover': { color: 'rgba(255,255,255,0.75)' },
                        },
                        '& .MuiTab-root.Mui-selected': { color: '#fff' },
                        '& .MuiTab-iconWrapper': { mb: '0 !important' },
                    }}
                >
                    {TAB_CONFIG.map(({ key, label, icon }) => (
                        <Tab key={key} value={key} label={label} icon={icon} iconPosition="start" />
                    ))}
                </Tabs>
            </Box>

            {/* ── 2-COLUMN LAYOUT ──────────────────────────────────────────── */}
            <Box sx={{
                display: 'flex',
                gap: { md: 4 },
                alignItems: 'flex-start',
                pt: 3,
            }}>

                {/* LEFT: Unique uploaders — hidden on mobile */}
                {!isTablet && (
                    <UploaderSidebar tracks={current.tracks} />
                )}

                {/* RIGHT: Track list */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    {current.loaded && current.tracks.length === 0 && !current.loading ? (
                        <Box sx={{
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            py: 10, gap: 2,
                        }}>
                            <Box sx={{
                                width: 64, height: 64, borderRadius: '50%',
                                bgcolor: 'rgba(255,85,0,0.06)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {TAB_CONFIG.find(t => t.key === activeTab)?.icon}
                            </Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: 14 }}>
                                No tracks here yet
                            </Typography>
                        </Box>
                    ) : (
                        current.tracks.map((track, i) => (
                            <ProfileTrack
                                key={`${track.id}-${i}`}
                                track={track}
                                tracks={current.tracks}
                            />
                        ))
                    )}

                    {/* Infinite scroll trigger */}
                    <Box ref={loaderRef} sx={{ py: 3, display: 'flex', justifyContent: 'center' }}>
                        {current.loading && (
                            <CircularProgress size={24} sx={{ color: '#ff5500' }} />
                        )}
                        {!current.loading && !current.hasMore && current.tracks.length > 0 && (
                            <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.15)' }}>
                                · end ·
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Box>

            {/* Mobile: uploaders row dưới tabs */}
            {isTablet && current.tracks.length > 0 && (
                <Box sx={{
                    px: 1,
                    pb: 2,
                    display: 'flex',
                    gap: 1.5,
                    flexWrap: 'wrap',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    mb: 2,
                }}>
                    {Array.from(
                        new Map(current.tracks.map(t => [t.uploader?.id, t.uploader])).values()
                    ).map((uploader, i) => (
                        <Link
                            key={uploader?.id ?? i}
                            href={generateProfileUrl(uploader?.name ?? '', String(uploader?.id))}
                            style={{ textDecoration: 'none' }}
                        >
                            <Box sx={{
                                display: 'flex', alignItems: 'center', gap: 1,
                                px: 1.25, py: 0.6,
                                borderRadius: 2,
                                bgcolor: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.07)',
                                transition: 'all 0.15s',
                                '&:hover': {
                                    bgcolor: 'rgba(255,85,0,0.08)',
                                    borderColor: 'rgba(255,85,0,0.25)',
                                },
                            }}>
                                <Avatar
                                    src={uploader?.avatar}
                                    sx={{ width: 22, height: 22, fontSize: '0.6rem', bgcolor: '#2a2a2a' }}
                                >
                                    {uploader?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Typography sx={{
                                    fontSize: '0.72rem',
                                    fontWeight: 600,
                                    color: 'rgba(255,255,255,0.65)',
                                    letterSpacing: '-0.01em',
                                }}>
                                    {uploader?.name}
                                </Typography>
                            </Box>
                        </Link>
                    ))}
                </Box>
            )}
        </Box>
    );
}