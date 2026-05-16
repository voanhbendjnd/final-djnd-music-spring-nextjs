'use client'

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Box, Container, Typography, Grid, Paper,
    Button, Avatar, Chip, Skeleton, Stack,
    Pagination, TextField, InputAdornment,
    IconButton, Drawer, useMediaQuery, useTheme,
    Fab, Badge, Divider
} from '@mui/material';
import {
    Lock, Public, People, Add, Refresh,
    Search, Close, FilterList, Tag,
    KeyboardArrowRight
} from '@mui/icons-material';

import axiosInstance from '@/utils/axios-instance';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { generateRoomUrl } from '@/utils/generate.slug';
import { useDebounce } from 'use-debounce';

dayjs.extend(relativeTime);

// ─── Types ────────────────────────────────────────────────────────────────────

interface IRoomMeta {
    id: number;
    name: string;
    code: string;
    isPublic: boolean;
    isActive: boolean;
    listenerCount: number;
    hostUserName: string;
    createdAt: string;
}

// ─── Room Card ────────────────────────────────────────────────────────────────

function RoomCard({ room, onClick }: { room: IRoomMeta; onClick: () => void }) {
    const isDisabled = !room.isActive;

    return (
        <Paper
            onClick={isDisabled ? undefined : onClick}
            elevation={0}
            sx={{
                p: { xs: 2.5, sm: 3 },
                bgcolor: '#141414',
                color: '#fff',
                borderRadius: { xs: 3, sm: 4 },
                border: `1px solid ${isDisabled ? '#1a1a1a' : '#222'}`,
                transition: 'border-color 0.25s, transform 0.25s, background-color 0.25s',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                opacity: isDisabled ? 0.5 : 1, // ← mờ đi khi inactive
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    inset: 0,
                    background: 'radial-gradient(ellipse at top left, rgba(255,85,0,0.06) 0%, transparent 60%)',
                    opacity: 0,
                    transition: 'opacity 0.3s',
                    pointerEvents: 'none',
                },
                '&:hover': isDisabled ? {} : {
                    borderColor: '#ff5500',
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    bgcolor: '#1a1a1a',
                    '&::before': { opacity: 1 },
                },
                '&:active': isDisabled ? {} : {
                    transform: 'scale(0.98)',
                },
            }}
        >
            {/* Top row: visibility chip + listener count */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Chip
                    size="small"
                    icon={room.isPublic
                        ? <Public sx={{ fontSize: '13px !important' }} />
                        : <Lock sx={{ fontSize: '13px !important' }} />}
                    label={room.isPublic ? 'Public' : 'Private'}
                    sx={{
                        bgcolor: room.isPublic ? 'rgba(76,175,80,0.1)' : 'rgba(255,152,0,0.1)',
                        color: room.isPublic ? '#4caf50' : '#ff9800',
                        border: `1px solid ${room.isPublic ? 'rgba(76,175,80,0.25)' : 'rgba(255,152,0,0.25)'}`,
                        fontWeight: 700, fontSize: '11px', height: 24,
                        '& .MuiChip-icon': { color: 'inherit' },
                    }}
                />

                {/* ✅ Thay live dot bằng inactive badge nếu không active */}
                {isDisabled ? (
                    <Chip
                        size="small"
                        label="Inactive"
                        sx={{
                            bgcolor: 'rgba(255,255,255,0.05)',
                            color: 'rgba(255,255,255,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            fontSize: '10px', height: 20, fontWeight: 600,
                        }}
                    />
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{
                            width: 7, height: 7, borderRadius: '50%',
                            bgcolor: '#ff5500',
                            boxShadow: '0 0 6px #ff5500',
                            animation: 'pulse 2s ease-in-out infinite',
                            '@keyframes pulse': {
                                '0%, 100%': { opacity: 1 },
                                '50%': { opacity: 0.4 },
                            },
                        }} />
                        <Typography variant="caption" color="rgba(255,255,255,0.45)" sx={{ fontSize: '11px' }}>
                            {room.listenerCount} live
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Room name */}
            <Typography
                variant="h6"
                fontWeight={800}
                noWrap
                sx={{ mb: 0.75, fontSize: { xs: '1rem', sm: '1.1rem' }, letterSpacing: '-0.3px' }}
            >
                {room.name}
            </Typography>

            {/* Room code */}
            {room.code && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                    <Tag sx={{ fontSize: 12, color: '#ff5500' }} />
                    <Typography sx={{
                        fontFamily: 'monospace', fontSize: '0.72rem', fontWeight: 700,
                        letterSpacing: '0.15em', color: 'rgba(255,85,0,0.7)',
                    }}>
                        {room.code}
                    </Typography>
                </Box>
            )}

            {/* Host + timestamp */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Avatar sx={{ width: 22, height: 22, fontSize: '0.65rem', bgcolor: '#ff5500', flexShrink: 0 }}>
                        {room.hostUserName?.charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography variant="body2" color="rgba(255,255,255,0.5)" noWrap sx={{ fontSize: '0.78rem' }}>
                        {room.hostUserName}
                    </Typography>
                </Box>
                <Typography variant="caption" color="rgba(255,255,255,0.25)" sx={{ fontSize: '0.7rem', flexShrink: 0, ml: 1 }}>
                    {dayjs(room.createdAt).fromNow()}
                </Typography>
            </Box>

            {/* ✅ Overlay khi inactive */}
            {isDisabled && (
                <Box sx={{
                    position: 'absolute', inset: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.3)',
                    borderRadius: 'inherit',
                }}>
                    <Typography sx={{
                        fontSize: '0.75rem', fontWeight: 700,
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                        Room Paused
                    </Typography>
                </Box>
            )}

            <KeyboardArrowRight sx={{
                position: 'absolute', right: 12, bottom: 12,
                fontSize: 16, color: 'rgba(255,255,255,0.12)',
                display: { sm: 'none' },
            }} />
        </Paper>
    );
}
// ─── Skeleton Card ────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <Skeleton
            variant="rectangular"
            height={168}
            sx={{ borderRadius: { xs: 3, sm: 4 }, bgcolor: '#1a1a1a' }}
        />
    );
}

// ─── Search Field — defined OUTSIDE RoomsPage to prevent remount on every keystroke ─
// Root cause: defining a component inside another component means React sees a NEW
// component type on every render → unmounts old TextField → focus lost after 1 char.

interface SearchFieldProps {
    value: string;
    onChange: (v: string) => void;
    inputRef?: React.Ref<HTMLInputElement>;
    autoFocus?: boolean;
}

function SearchField({ value, onChange, inputRef, autoFocus = false }: SearchFieldProps) {
    return (
        <TextField
            inputRef={inputRef}
            size="small"
            placeholder="Search rooms or code..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus={autoFocus}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: '#555' }} />
                    </InputAdornment>
                ),
                endAdornment: value ? (
                    <InputAdornment position="end">
                        <IconButton size="small" onClick={() => onChange('')} sx={{ color: '#555' }}>
                            <Close fontSize="small" />
                        </IconButton>
                    </InputAdornment>
                ) : null,
            }}
            sx={{
                width: '100%',
                '& .MuiOutlinedInput-root': {
                    color: '#fff',
                    bgcolor: '#111',
                    borderRadius: 2,
                    fontSize: '0.9rem',
                    '& fieldset': { borderColor: '#2a2a2a' },
                    '&:hover fieldset': { borderColor: '#ff5500' },
                    '&.Mui-focused fieldset': { borderColor: '#ff5500', borderWidth: '1px' },
                },
                '& input::placeholder': { color: '#555', opacity: 1 },
            }}
        />
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RoomsPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const theme = useTheme();

    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

    const [keyword, setKeyword] = useState(searchParams.get('key') || '');
    const [debouncedKeyword] = useDebounce(keyword, 500);
    const [rooms, setRooms] = useState<IRoomMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);

    // Mobile: search drawer
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);

    const pageSize = isMobile ? 4 : isTablet ? 4 : 6;

    const fetchRooms = async (currentPage = page, searchKey = debouncedKeyword) => {
        setLoading(true);
        try {
            const res: any = await axiosInstance.get('/api/v1/rooms', {
                params: {
                    page: currentPage,
                    size: pageSize,
                    sort: 'id,desc',
                    key: searchKey || undefined,
                },
            });
            const apiData = res.data;
            setRooms(apiData.result || []);
            setPages(apiData.meta?.pages || 1);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load rooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const params = new URLSearchParams();
        if (debouncedKeyword) params.set('key', debouncedKeyword);
        params.set('page', String(page));
        router.replace(`/room?${params.toString()}`);
        fetchRooms(page, debouncedKeyword);
    }, [page, debouncedKeyword]);

    // const handleJoin = (room: IRoomMeta) => {
    //     router.push(generateRoomUrl(String(room.id), room.name));
    // };
    const handleJoin = (room: IRoomMeta) => {
        if (!room.isActive) {
            toast.dark('This room is currently paused and not accepting listeners.');
            return;
        }
        router.push(generateRoomUrl(String(room.id), room.name));
    };

    const handleSearchOpen = () => {
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
    };



    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a'}}>
            <Container
                maxWidth="lg"
                sx={{
                    py: { xs: 4, sm: 5, md: 6 },
                    px: { xs: 2, sm: 3 },
                    pb: {
                        xs: 14,
                        sm: 6,
                    }
                }}
            >

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>

                    {/* Title row */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: { xs: 3, sm: 3 },
                        gap: 2,
                    }}>
                        <Box>
                            <Typography
                                variant="h3"
                                fontWeight={900}
                                sx={{
                                    fontSize: { xs: '1.75rem', sm: '2.2rem', md: '2.8rem' },
                                    letterSpacing: '-1px',
                                    lineHeight: 1.1,
                                }}
                            >
                                Live Sessions
                            </Typography>
                            <Typography
                                color="rgba(255,255,255,0.45)"
                                sx={{ mt: 0.5, fontSize: { xs: '0.82rem', sm: '0.9rem' } }}
                            >
                                Join a room · listen together in real-time
                            </Typography>
                        </Box>

                        {/* Mobile: icon buttons only */}
                        {isMobile ? (
                            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, mt: 0.5 }}>
                                <IconButton
                                    onClick={handleSearchOpen}
                                    sx={{
                                        bgcolor: '#1a1a1a', color: '#fff',
                                        border: `1px solid ${keyword ? '#ff5500' : '#2a2a2a'}`,
                                        borderRadius: 2, width: 40, height: 40,
                                    }}
                                >
                                    <Badge color="error" variant="dot" invisible={!keyword}>
                                        <Search fontSize="small" />
                                    </Badge>
                                </IconButton>
                                <IconButton
                                    onClick={() => fetchRooms(page, keyword)}
                                    sx={{
                                        bgcolor: '#1a1a1a', color: '#fff',
                                        border: '1px solid #2a2a2a',
                                        borderRadius: 2, width: 40, height: 40,
                                    }}
                                >
                                    <Refresh fontSize="small" />
                                </IconButton>
                            </Stack>
                        ) : (
                            /* Tablet/Desktop: full action row */
                            <Stack direction="row" spacing={1.5} sx={{ flexShrink: 0 }}>
                                <Button
                                    startIcon={<Refresh sx={{ fontSize: '18px !important' }} />}
                                    onClick={() => fetchRooms(page, keyword)}
                                    sx={{
                                        color: 'rgba(255,255,255,0.6)',
                                        borderRadius: 2,
                                        fontSize: '0.82rem',
                                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: '#fff' },
                                    }}
                                >
                                    Refresh
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<Add sx={{ fontSize: '18px !important' }} />}
                                    onClick={() => router.push('/rooms/create')}
                                    disableElevation
                                    sx={{
                                        bgcolor: '#ff5500', fontWeight: 700, borderRadius: 2,
                                        fontSize: '0.85rem',
                                        transition: 'background-color 0.2s, transform 0.15s',
                                        '&:hover': { bgcolor: '#e64d00', transform: 'translateY(-1px)' },
                                        '&:active': { transform: 'translateY(0)' },
                                    }}
                                >
                                    {isTablet ? 'Create' : 'Create Room'}
                                </Button>
                            </Stack>
                        )}
                    </Box>

                    {/* Search bar — desktop + tablet only (mobile uses drawer) */}
                    {!isMobile && (
                        <Box sx={{ maxWidth: { sm: '100%', md: 360 } }}>
                            <SearchField value={keyword} onChange={(v) => { setPage(1); setKeyword(v); }} />
                        </Box>
                    )}

                    {/* Mobile: active search indicator */}
                    {isMobile && keyword && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 1,
                            mt: -1, mb: 1,
                        }}>
                            <Typography variant="caption" color="rgba(255,255,255,0.4)">
                                Searching:
                            </Typography>
                            <Chip
                                size="small"
                                label={keyword}
                                onDelete={() => setKeyword('')}
                                sx={{
                                    bgcolor: 'rgba(255,85,0,0.12)', color: '#ff5500',
                                    border: '1px solid rgba(255,85,0,0.25)',
                                    height: 22, fontSize: '0.72rem',
                                    '& .MuiChip-deleteIcon': { color: '#ff5500', fontSize: 14 },
                                }}
                            />
                        </Box>
                    )}
                </Box>

                {/* ── GRID ───────────────────────────────────────────────── */}
                {loading ? (
                    <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                        {Array.from({ length: pageSize }).map((_, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <SkeletonCard />
                            </Grid>
                        ))}
                    </Grid>
                ) : rooms.length === 0 ? (
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 6, sm: 8 },
                            textAlign: 'center',
                            bgcolor: '#111',
                            borderRadius: { xs: 3, sm: 4 },
                            border: '1px dashed #2a2a2a',
                        }}
                    >
                        <People sx={{ fontSize: { xs: 48, sm: 64 }, color: '#2a2a2a', mb: 2 }} />
                        <Typography
                            variant="h5"
                            color="rgba(255,255,255,0.25)"
                            sx={{ fontSize: { xs: '1.1rem', sm: '1.3rem' } }}
                            gutterBottom
                        >
                            {keyword ? `No rooms matching "${keyword}"` : 'No active rooms right now'}
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.2)" sx={{ mb: 3 }}>
                            {keyword ? 'Try a different search term or room code' : 'Be the first to start a jam session!'}
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => router.push('/rooms/create')}
                            disableElevation
                            sx={{
                                bgcolor: '#ff5500', fontWeight: 700, borderRadius: 2,
                                '&:hover': { bgcolor: '#e64d00' },
                            }}
                        >
                            Create Room
                        </Button>
                    </Paper>
                ) : (
                    <>
                        <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
                            {rooms.map((room) => (
                                <Grid item xs={12} sm={6} md={4} key={room.id}>
                                    <RoomCard room={room} onClick={() => handleJoin(room)} />
                                </Grid>
                            ))}
                        </Grid>

                        {/* PAGINATION */}
                        {pages > 1 && (
                            <Box sx={{ mt: { xs: 4, sm: 5 }, display: 'flex', justifyContent: 'center' }}>
                                <Pagination
                                    page={page}
                                    count={pages}
                                    size={isMobile ? 'small' : 'medium'}
                                    siblingCount={isMobile ? 0 : 1}
                                    onChange={(_, value) => {
                                        setPage(value);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    sx={{
                                        '& .MuiPaginationItem-root': {
                                            color: '#777',
                                            border: '1px solid #222',
                                            bgcolor: '#111',
                                            borderRadius: 2,
                                            minWidth: { xs: 32, sm: 36 },
                                            height: { xs: 32, sm: 36 },
                                            fontSize: { xs: '0.8rem', sm: '0.875rem' },
                                            transition: 'all 0.2s',
                                            '&:hover': { bgcolor: '#1a1a1a', borderColor: '#ff5500', color: '#fff' },
                                        },
                                        '& .Mui-selected': {
                                            bgcolor: '#ff5500 !important',
                                            color: '#fff',
                                            borderColor: '#ff5500',
                                            fontWeight: 700,
                                            '&:hover': { bgcolor: '#e64d00 !important' },
                                        },
                                        '& .MuiPaginationItem-ellipsis': {
                                            border: 'none', bgcolor: 'transparent',
                                        },
                                    }}
                                />
                            </Box>
                        )}
                    </>
                )}
            </Container>

            {/* ── MOBILE FAB: Create Room ───────────────────────────────── */}
            {isMobile && (
                <Fab
                    onClick={() => router.push('/rooms/create')}
                    sx={{
                        position: 'fixed',
                        bottom: 80, // tránh footer player
                        right: 20,
                        bgcolor: '#ff5500',
                        color: '#fff',
                        width: 52,
                        height: 52,
                        boxShadow: '0 4px 20px rgba(255,85,0,0.4)',
                        '&:hover': { bgcolor: '#e64d00' },
                        '&:active': { transform: 'scale(0.94)' },
                        zIndex: 1200,
                    }}
                >
                    <Add />
                </Fab>
            )}

            {/* ── MOBILE SEARCH DRAWER ──────────────────────────────────── */}
            <Drawer
                anchor="bottom"
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
                PaperProps={{
                    sx: {
                        bgcolor: '#111',
                        borderRadius: '20px 20px 0 0',
                        px: 2,
                        pt: 2,
                        pb: 4,
                        border: '1px solid #222',
                        borderBottom: 'none',
                    },
                }}
            >
                {/* Drag handle */}
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: '#333' }} />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography fontWeight={700} fontSize="1rem">Search Rooms</Typography>
                    <IconButton size="small" onClick={() => setSearchOpen(false)} sx={{ color: '#555' }}>
                        <Close fontSize="small" />
                    </IconButton>
                </Box>

                <SearchField value={keyword} onChange={(v) => { setPage(1); setKeyword(v); }} inputRef={searchInputRef} autoFocus />

                {keyword && (
                    <Box sx={{ mt: 2 }}>
                        <Divider sx={{ borderColor: '#222', mb: 1.5 }} />
                        <Typography variant="caption" color="rgba(255,255,255,0.3)">
                            Tip: enter a 6-character room code to find a specific room
                        </Typography>
                    </Box>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    disableElevation
                    onClick={() => setSearchOpen(false)}
                    sx={{
                        mt: 2.5, bgcolor: '#ff5500', fontWeight: 700, borderRadius: 2,
                        height: 48, '&:hover': { bgcolor: '#e64d00' },
                    }}
                >
                    Search
                </Button>
            </Drawer>
        </Box>
    );
}