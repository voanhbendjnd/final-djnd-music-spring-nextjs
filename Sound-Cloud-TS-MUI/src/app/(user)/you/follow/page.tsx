'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box, Typography, Avatar, Button, Skeleton,
    Container, useMediaQuery, useTheme, Pagination,
    InputAdornment, TextField, Chip, Tabs, Tab
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/utils/axios-instance';
import { generateProfileUrl } from '@/utils/generate.slug';
import { useFollowMutation } from '@/hooks/use.follow';
import { useTrackContext } from '@/lib/track.wrapper';
import UploaderHoverCard from '@/components/profile/uploader.hover.card';

interface IFollowUser {
    id: number;
    name: string;
    avatar: string;
    countFollowers: number;
}

interface IMeta {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
}

const PAGE_SIZE = 20;

// ── Skeleton ──────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <Box sx={{
        display: 'flex', alignItems: 'center', gap: 2,
        p: { xs: '12px 14px', md: '14px 20px' },
        borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
        <Skeleton variant="circular" width={48} height={48} sx={{ bgcolor: 'rgba(255,255,255,0.07)', flexShrink: 0 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="40%" height={18} sx={{ bgcolor: 'rgba(255,255,255,0.07)', mb: 0.5 }} />
            <Skeleton variant="text" width="25%" height={14} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
        </Box>
        <Skeleton variant="rounded" width={86} height={30} sx={{ bgcolor: 'rgba(255,255,255,0.07)', borderRadius: '6px', flexShrink: 0 }} />
    </Box>
);

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyState = ({ search, tab }: { search: string; tab: number }) => (
    <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', py: { xs: 6, md: 10 }, gap: 2,
    }}>
        <Box sx={{
            width: 72, height: 72, borderRadius: '50%',
            bgcolor: 'rgba(255,85,0,0.07)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
            <PeopleOutlineIcon sx={{ fontSize: 34, color: 'rgba(255,85,0,0.4)' }} />
        </Box>
        <Typography sx={{ color: '#777', fontSize: 15, fontWeight: 500 }}>
            {search
                ? `No results for "${search}"`
                : tab === 0
                    ? "You're not following anyone yet"
                    : "No one is following you yet"}
        </Typography>
        {!search && (
            <Typography sx={{ color: '#444', fontSize: 13, textAlign: 'center', maxWidth: 260 }}>
                {tab === 0
                    ? 'Discover artists and follow them to see them here'
                    : 'Share your profile to grow your audience'}
            </Typography>
        )}
    </Box>
);

const UserCard = ({
                      user, index, isFollowingTab, onUnfollow, onFollow,
                  }: {
    user: IFollowUser;
    index: number;
    isFollowingTab: boolean;
    onUnfollow: (id: number) => void;
    onFollow: (user: IFollowUser) => void; // ✅ thêm callback
}) => {
    const { followedUploaders, toggleFollowUploader } = useTrackContext() as ITrackContext;
    const mutationFollow = useFollowMutation();
    const { data: session } = useSession();

    const idStr = String(user.id);
    const followState = followedUploaders?.[idStr];
    const isFollowed = followState !== undefined ? followState.isFollowed : isFollowingTab;
    const displayFollowers = followState?.countFollowers ?? user.countFollowers;
    const isSelf = session && Number(session.user?.id) === user.id;

    const handleToggle = () => {
        mutationFollow.mutate(idStr, {
            onSuccess: (res) => {
                const { isFollowed: newState, countFollowers } = res.data;
                toggleFollowUploader?.(idStr, newState, countFollowers);

                if (!newState && isFollowingTab) {
                    // ✅ Unfollow từ following tab → remove khỏi list
                    onUnfollow(user.id);
                } else if (newState && !isFollowingTab) {
                    // ✅ Follow từ followers tab → add vào following tab
                    onFollow(user);
                } else if (!newState && !isFollowingTab) {
                    // ✅ Unfollow từ followers tab → remove khỏi following tab
                    onUnfollow(user.id);
                }
            },
        });
    };

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center',
            gap: { xs: 1.5, md: 2 },
            p: { xs: '12px 14px', md: '14px 20px' },
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            transition: 'background 0.15s',
            animation: 'fadeUp 0.28s ease both',
            animationDelay: `${Math.min(index * 35, 280)}ms`,
            '@keyframes fadeUp': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' },
            },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' },
            '&:last-child': { borderBottom: 'none' },
        }}>
            {/* Avatar */}
            <UploaderHoverCard uploader={{ ...user, isFollowed, countFollowers: displayFollowers }}>
                <Link href={generateProfileUrl(user.name, idStr)} style={{ textDecoration: 'none', flexShrink: 0 }}>
                    <Avatar
                        src={user.avatar}
                        sx={{
                            width: { xs: 46, md: 50 },
                            height: { xs: 46, md: 50 },
                            border: '1.5px solid rgba(255,85,0,0.18)',
                            transition: 'border-color 0.2s',
                            '&:hover': { borderColor: 'rgba(255,85,0,0.55)' },
                        }}
                    >
                        {user.name?.charAt(0).toUpperCase()}
                    </Avatar>
                </Link>
            </UploaderHoverCard>

            {/* Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <UploaderHoverCard uploader={{ ...user, isFollowed, countFollowers: displayFollowers }}>
                    <Link href={generateProfileUrl(user.name, idStr)} style={{ textDecoration: 'none' }}>
                        <Typography noWrap sx={{
                            color: '#f0f0f0', fontWeight: 600,
                            fontSize: { xs: 13.5, md: 14.5 },
                            letterSpacing: '-0.1px',
                            '&:hover': { color: '#ff5500' },
                            transition: 'color 0.15s',
                        }}>
                            {user.name}
                        </Typography>
                    </Link>
                </UploaderHoverCard>
                <Typography sx={{ color: '#555', fontSize: { xs: 11.5, md: 12 }, mt: 0.2 }}>
                    {(displayFollowers ?? 0).toLocaleString()} followers
                </Typography>
            </Box>

            {/* Button */}
            {session && !isSelf && (
                <Button
                    size="small"
                    onClick={handleToggle}
                    disabled={mutationFollow.isPending}
                    startIcon={
                        isFollowed
                            ? <PersonRemoveIcon sx={{ fontSize: '13px !important' }} />
                            : <PersonAddIcon sx={{ fontSize: '13px !important' }} />
                    }
                    sx={{
                        flexShrink: 0,
                        height: { xs: 30, md: 32 },
                        px: { xs: 1.3, md: 1.6 },
                        fontSize: { xs: 11.5, md: 12 },
                        fontWeight: 700,
                        textTransform: 'none',
                        borderRadius: '6px',
                        boxShadow: 'none',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.15s ease',
                        '& .MuiButton-startIcon': { mr: '4px' },
                        '&.Mui-disabled': { opacity: 0.4 },
                        ...(isFollowed
                            ? {
                                bgcolor: '#242424',
                                color: '#888',
                                border: '1px solid #333',
                                '&:hover': { bgcolor: '#2e2e2e', borderColor: '#3d3d3d', color: '#ff5500' },
                            }
                            : {
                                bgcolor: '#ff5500',
                                color: '#fff',
                                border: '1px solid transparent',
                                '&:hover': { bgcolor: '#cc4400' },
                            }),
                    }}
                >
                    {isFollowed ? 'Following' : 'Follow'}
                </Button>
            )}
        </Box>
    );
};

// ── Tab panel state ───────────────────────────────────────────────────────────
interface TabState {
    users: IFollowUser[];
    meta: IMeta | null;
    page: number;
    loading: boolean;
    fetched: boolean; // cache — không fetch lại khi đã có data
}

const initTab = (): TabState => ({
    users: [], meta: null, page: 1, loading: false, fetched: false,
});

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FollowPage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [tab, setTab] = useState(0); // 0 = following, 1 = followers
    const [tabs, setTabs] = useState<[TabState, TabState]>([initTab(), initTab()]);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const ENDPOINTS = ['/api/v1/follows/followings', '/api/v1/follows/followers'];

    // ── Fetch for a given tab ─────────────────────────────────────────────────
    const fetchTab = useCallback(async (tabIdx: number, page: number) => {
        setTabs(prev => {
            const next: [TabState, TabState] = [{ ...prev[0] }, { ...prev[1] }];
            next[tabIdx] = { ...next[tabIdx], loading: true };
            return next;
        });
        try {
            const res = await axiosInstance.get<any, IBackendRes<IModelPaginate<IFollowUser>>>(
                `${ENDPOINTS[tabIdx]}?page=${page}&size=${PAGE_SIZE}`
            );
            setTabs(prev => {
                const next: [TabState, TabState] = [{ ...prev[0] }, { ...prev[1] }];
                next[tabIdx] = {
                    users: res?.data?.result ?? [],
                    meta: res?.data?.meta ?? null,
                    page,
                    loading: false,
                    fetched: true,
                };
                return next;
            });
        } catch (err) {
            console.error('Fetch error:', err);
            setTabs(prev => {
                const next: [TabState, TabState] = [{ ...prev[0] }, { ...prev[1] }];
                next[tabIdx] = { ...next[tabIdx], loading: false, fetched: true };
                return next;
            });
        }
    }, []);

    // Fetch tab 0 on mount
    useEffect(() => {
        fetchTab(0, 1);
    }, []);

    // Fetch when switching to unfetched tab or page change
    useEffect(() => {
        const t = tabs[tab];
        if (!t.fetched || t.loading) fetchTab(tab, t.page);
    }, [tab]);

    // Page change
    const handlePageChange = (tabIdx: number, newPage: number) => {
        setTabs(prev => {
            const next: [TabState, TabState] = [{ ...prev[0] }, { ...prev[1] }];
            next[tabIdx] = { ...next[tabIdx], fetched: false, page: newPage };
            return next;
        });
        fetchTab(tabIdx, newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Search debounce
    const handleSearchChange = (val: string) => {
        setSearchInput(val);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => setSearch(val.trim().toLowerCase()), 280);
    };

    // Unfollow optimistic remove (only for following tab)
    const handleUnfollow = (id: number) => {
        setTabs(prev => {
            const next: [TabState, TabState] = [{ ...prev[0] }, { ...prev[1] }];
            next[0] = {
                ...next[0],
                users: next[0].users.filter(u => u.id !== id),
                meta: next[0].meta
                    ? { ...next[0].meta, total: Math.max(0, next[0].meta.total - 1) }
                    : null,
            };
            return next;
        });
    };

    const handleFollow = (user: IFollowUser) => {
        setTabs(prev => {
            const next: [TabState, TabState] = [{ ...prev[0] }, { ...prev[1] }];
            const alreadyIn = next[0].users.some(u => u.id === user.id);
            if (!alreadyIn) {
                next[0] = {
                    ...next[0],
                    users: [user, ...next[0].users], // prepend lên đầu
                    meta: next[0].meta
                        ? { ...next[0].meta, total: next[0].meta.total + 1 }
                        : { page: 1, pageSize: PAGE_SIZE, pages: 1, total: 1 },
                };
            }
            return next;
        });
    };

    const current = tabs[tab];
    const filtered = search
        ? current.users.filter(u => u.name.toLowerCase().includes(search))
        : current.users;

    const followingTotal = tabs[0].meta?.total;
    const followersTotal = tabs[1].meta?.total;

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0e0e0e', pb: { xs: 14, md: 8 } }}>
            <Container maxWidth="md" sx={{ px: { xs: 0, sm: 2, md: 3 } }}>

                {/* ── Header ─────────────────────────────────────────────── */}
                <Box sx={{
                    px: { xs: 2, md: 0 },
                    pt: { xs: 3, md: 5 },
                    pb: { xs: 0, md: 0 },
                }}>
                    <Typography sx={{
                        fontSize: { xs: 22, md: 28 },
                        fontWeight: 800,
                        color: '#fff',
                        letterSpacing: '-0.5px',
                        mb: 3,
                    }}>
                        Community
                    </Typography>

                    {/* ── Tabs ───────────────────────────────────────────── */}
                    <Box sx={{
                        borderBottom: '1px solid rgba(255,255,255,0.07)',
                        mb: 0,
                    }}>
                        <Tabs
                            value={tab}
                            onChange={(_, v) => {
                                setTab(v);
                                setSearch('');
                                setSearchInput('');
                            }}
                            TabIndicatorProps={{
                                style: { backgroundColor: '#ff5500', height: 2, borderRadius: '2px 2px 0 0' }
                            }}
                            sx={{
                                minHeight: 44,
                                '& .MuiTab-root': {
                                    minHeight: 44,
                                    color: '#555',
                                    fontSize: { xs: 13, md: 14 },
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    letterSpacing: '-0.1px',
                                    px: { xs: 1.5, md: 2.5 },
                                    transition: 'color 0.15s',
                                    '&:hover': { color: '#aaa' },
                                },
                                '& .MuiTab-root.Mui-selected': {
                                    color: '#fff',
                                },
                            }}
                        >
                            <Tab
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <span>Following</span>
                                        {followingTotal !== undefined && (
                                            <Chip
                                                label={followingTotal.toLocaleString()}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    bgcolor: tab === 0 ? 'rgba(255,85,0,0.18)' : 'rgba(255,255,255,0.07)',
                                                    color: tab === 0 ? '#ff5500' : '#555',
                                                    border: 'none',
                                                    '& .MuiChip-label': { px: '6px' },
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                            />
                            <Tab
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                                        <span>Followers</span>
                                        {followersTotal !== undefined && (
                                            <Chip
                                                label={followersTotal.toLocaleString()}
                                                size="small"
                                                sx={{
                                                    height: 18,
                                                    fontSize: 10,
                                                    fontWeight: 700,
                                                    bgcolor: tab === 1 ? 'rgba(255,85,0,0.18)' : 'rgba(255,255,255,0.07)',
                                                    color: tab === 1 ? '#ff5500' : '#555',
                                                    border: 'none',
                                                    '& .MuiChip-label': { px: '6px' },
                                                }}
                                            />
                                        )}
                                    </Box>
                                }
                                onClick={() => {
                                    // lazy fetch tab 1 lần đầu
                                    if (!tabs[1].fetched && !tabs[1].loading) {
                                        fetchTab(1, 1);
                                    }
                                }}
                            />
                        </Tabs>
                    </Box>
                </Box>

                {/* ── Search bar ─────────────────────────────────────────── */}
                <Box sx={{ px: { xs: 2, md: 0 }, pt: 2, pb: 1.5 }}>
                    <TextField
                        fullWidth
                        size="small"
                        placeholder={tab === 0 ? 'Search following...' : 'Search followers...'}
                        value={searchInput}
                        onChange={e => handleSearchChange(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ fontSize: 17, color: '#444' }} />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#141414',
                                borderRadius: '8px',
                                fontSize: 13,
                                color: '#ddd',
                                '& fieldset': { borderColor: 'rgba(255,255,255,0.07)' },
                                '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.13)' },
                                '&.Mui-focused fieldset': { borderColor: 'rgba(255,85,0,0.35)', borderWidth: 1 },
                            },
                            '& .MuiInputBase-input::placeholder': { color: '#444', opacity: 1 },
                        }}
                    />
                </Box>

                {/* ── List ───────────────────────────────────────────────── */}
                <Box sx={{
                    bgcolor: '#121212',
                    border: { xs: 'none', sm: '1px solid rgba(255,255,255,0.05)' },
                    borderRadius: { xs: 0, sm: '10px' },
                    overflow: 'hidden',
                    mx: { xs: 0, sm: 0 },
                }}>
                    {/* Column label desktop */}
                    {!isMobile && !current.loading && filtered.length > 0 && (
                        <Box sx={{
                            px: '20px', py: '9px',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <Typography sx={{ color: '#333', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em' }}>
                                {tab === 0 ? 'Following' : 'Followers'} · {filtered.length}
                            </Typography>
                        </Box>
                    )}

                    {/* Skeleton */}
                    {current.loading && Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}

                    {/* Empty */}
                    {!current.loading && filtered.length === 0 && (
                        <EmptyState search={search} tab={tab} />
                    )}

                    {/* Items */}
                    {!current.loading && filtered.map((user, i) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            index={i}
                            isFollowingTab={tab === 0}
                            onUnfollow={handleUnfollow}
                            onFollow={handleFollow}
                        />
                    ))}
                </Box>

                {/* ── Pagination ─────────────────────────────────────────── */}
                {!current.loading && current.meta && current.meta.pages > 1 && !search && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3, px: 2 }}>
                        <Pagination
                            count={current.meta.pages}
                            page={current.page}
                            onChange={(_, val) => handlePageChange(tab, val)}
                            size={isMobile ? 'small' : 'medium'}
                            siblingCount={isMobile ? 0 : 1}
                            sx={{
                                '& .MuiPaginationItem-root': {
                                    color: '#555',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    bgcolor: '#141414',
                                    borderRadius: '6px',
                                    fontSize: 13,
                                    '&:hover': { bgcolor: '#1c1c1c', color: '#ccc' },
                                },
                                '& .MuiPaginationItem-root.Mui-selected': {
                                    bgcolor: '#ff5500',
                                    color: '#fff',
                                    border: '1px solid #ff5500',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: '#cc4400' },
                                },
                                '& .MuiPaginationItem-ellipsis': {
                                    color: '#333', border: 'none', bgcolor: 'transparent',
                                },
                            }}
                        />
                    </Box>
                )}

                {/* Search result count */}
                {search && !current.loading && filtered.length > 0 && (
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Chip
                            label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(255,85,0,0.09)',
                                color: '#ff5500',
                                border: '1px solid rgba(255,85,0,0.18)',
                                fontSize: 12, fontWeight: 600,
                            }}
                        />
                    </Box>
                )}
            </Container>
        </Box>
    );
}