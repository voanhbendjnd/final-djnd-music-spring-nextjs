'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Tabs, Tab, Typography, CircularProgress,
    useTheme, useMediaQuery,
} from '@mui/material';
import {
    GridView, AudiotrackOutlined, FavoriteBorder, History,
} from '@mui/icons-material';
import { sendRequest } from '@/utils/api';
import { useSession } from 'next-auth/react';
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
    { key: 'myTracks', label: 'Uploaded', icon: <AudiotrackOutlined sx={{ fontSize: 16 }} /> },
    { key: 'liked', label: 'Liked', icon: <FavoriteBorder sx={{ fontSize: 16 }} /> },
    { key: 'history', label: 'History', icon: <History sx={{ fontSize: 16 }} /> },
];

const PAGE_SIZE = 5;

export default function ProfileTrackListPublic({
                                             userId, initialTracks, initialTotal, initialHasMore,
                                         }: IProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { data: session } = useSession();
    let isOwner = false
    if(session){
         isOwner = Number(userId) === Number(session?.user.id);
    }
    const [activeTab, setActiveTab] = useState<TabKey>('all');

    // Per-tab state cache
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

    // ── API URLs per tab ───────────────────────────────────────────────────────
    const getUrl = (tab: TabKey) => {
        switch (tab) {
            case 'all': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks`;
            case 'myTracks': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/users/${userId}`;
            case 'liked': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/likes`;
            case 'history': return `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/histories/main`;
        }
    };

    // ── Fetch tracks ───────────────────────────────────────────────────────────
    const fetchTracks = useCallback(async (tab: TabKey, page: number, append = false) => {
        setTabCache(prev => ({
            ...prev,
            [tab]: { ...prev[tab], loading: true },
        }));

        try {
            const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
                url: getUrl(tab),
                method: 'GET',
                queryParams: { page, size: PAGE_SIZE, sort: (tab !== 'liked' && tab !== 'history') ? 'createdAt,desc': '' },
                headers: {
                    ...(session?.access_token && {
                        Authorization: `Bearer ${session.access_token}`,
                    }),
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
                    page,
                    hasMore,
                    loaded: true,
                    loading: false,
                },
            }));
        } catch (e) {
            console.error('Failed to fetch tracks for tab', tab, e);
            setTabCache(prev => ({
                ...prev,
                [tab]: { ...prev[tab], loading: false, loaded: true },
            }));
        }
    }, [session?.access_token, userId]);

    // ── Load tab on switch ─────────────────────────────────────────────────────
    useEffect(() => {
        const state = tabCache[activeTab];
        if (!state.loaded && !state.loading) {
            fetchTracks(activeTab, 1);
        }
    }, [activeTab]);

    // ── Infinite scroll ────────────────────────────────────────────────────────
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry.isIntersecting) return;
                const state = tabCache[activeTab];
                if (state.hasMore && !state.loading && state.loaded) {
                    fetchTracks(activeTab, state.page + 1, true);
                }
            },
            { threshold: 0.1 },
        );
        if (loaderRef.current) observer.observe(loaderRef.current);
        return () => observer.disconnect();
    }, [activeTab, tabCache, fetchTracks]);

    const current = tabCache[activeTab];

    return (
        <Box sx={{ mt: 0, pb: { xs: 14, sm: 8 } }}>
            {/* ── TABS ─────────────────────────────────────────────────────── */}
            <Box sx={{
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                mb: 3,
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
                        style: {
                            backgroundColor: '#ff5500',
                            height: 2,
                            borderRadius: '2px 2px 0 0',
                        },
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
                        '& .MuiTab-root.Mui-selected': {
                            color: '#fff',
                        },
                        '& .MuiTab-iconWrapper': {
                            mb: '0 !important',
                        },
                    }}
                >
                    {TAB_CONFIG.map(({ key, label, icon }) => (
                        <Tab
                            key={key}
                            value={key}
                            label={label}
                            icon={icon}
                            iconPosition="start"
                        />
                    ))}
                </Tabs>
            </Box>

            {/* ── TRACK LIST ───────────────────────────────────────────────── */}
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

            {/* ── LOADER / infinite scroll trigger ─────────────────────────── */}
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
    );
}