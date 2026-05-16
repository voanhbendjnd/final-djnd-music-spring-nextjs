'use client'

import { useSession } from 'next-auth/react';
import { useRoomSocket } from '@/hooks/use-room-socket';
import {
    Box, Container, Typography, Chip,
    IconButton, Paper, CircularProgress, Divider, List, ListItem,
    ListItemAvatar, ListItemText, Button, useMediaQuery, useTheme,
    Drawer, Tooltip, Stack
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import { ContentCopy, Tag, People, KeyboardArrowDown } from '@mui/icons-material';
import { Avatar } from '@mui/material';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import JoinRoomModal from './JoinRoomModal';
import WaveTrack from '@/components/track/wave.track';
import SearchBar from '@/components/search/search-bar';
import axios from 'axios';
import { useTrackContext, ITrackContext } from '@/lib/track.wrapper';
import { audioEngine } from '@/lib/audio-engine';
import { toast } from 'react-toastify';

interface IProps {
    roomId: number;
    initialData: IRoomMeta | undefined;
}

// ─── Live dot indicator ───────────────────────────────────────────────────────
function LiveDot() {
    return (
        <Box sx={{
            width: 8, height: 8, borderRadius: '50%',
            bgcolor: '#ff5500',
            boxShadow: '0 0 8px #ff5500',
            animation: 'livePulse 2s ease-in-out infinite',
            '@keyframes livePulse': {
                '0%,100%': { opacity: 1, transform: 'scale(1)' },
                '50%': { opacity: 0.4, transform: 'scale(0.8)' },
            },
            flexShrink: 0,
        }} />
    );
}

// ─── Room Code Badge ──────────────────────────────────────────────────────────
function RoomCodeBadge({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            toast.dark('Room code copied!');
            setTimeout(() => setCopied(false), 2000);
        });
    };
    return (
        <Box
            onClick={handleCopy}
            sx={{
                display: 'inline-flex', alignItems: 'center', gap: 1,
                px: 1.5, py: 0.75,
                borderRadius: 2,
                bgcolor: copied ? 'rgba(76,175,80,0.1)' : 'rgba(255,85,0,0.08)',
                border: `1px solid ${copied ? 'rgba(76,175,80,0.3)' : 'rgba(255,85,0,0.2)'}`,
                cursor: 'pointer',
                transition: 'all 0.2s',
                userSelect: 'none',
                '&:hover': { bgcolor: 'rgba(255,85,0,0.14)', borderColor: 'rgba(255,85,0,0.4)' },
                '&:active': { transform: 'scale(0.97)' },
            }}
        >
            <Tag sx={{ fontSize: 13, color: copied ? '#4caf50' : '#ff5500' }} />
            <Typography sx={{
                fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem',
                letterSpacing: '0.3em', color: copied ? '#4caf50' : '#ff5500',
            }}>
                {code}
            </Typography>
            <ContentCopy sx={{ fontSize: 13, color: copied ? '#4caf50' : 'rgba(255,255,255,0.3)' }} />
        </Box>
    );
}

// ─── Queue item ───────────────────────────────────────────────────────────────
function QueueItem({
                       track, index, isHost, onPlay, onRemove, isFirst,
                   }: {
    track: ITrack; index: number; isHost: boolean;
    onPlay: () => void; onRemove: () => void; isFirst: boolean;
}) {
    return (
        <Box>
            {!isFirst && <Divider sx={{ borderColor: '#1e1e1e', mx: 2 }} />}
            <ListItem
                secondaryAction={isHost && (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Play now">
                            <IconButton size="small" onClick={onPlay}
                                        sx={{ color: '#4caf50', '&:hover': { bgcolor: 'rgba(76,175,80,0.1)' } }}>
                                <PlayArrowIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove">
                            <IconButton size="small" onClick={onRemove}
                                        sx={{ color: '#555', '&:hover': { color: '#f44336', bgcolor: 'rgba(244,67,54,0.1)' } }}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                )}
                sx={{
                    py: { xs: 1.5, sm: 2 },
                    pr: isHost ? 10 : 2,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                }}
            >
                <ListItemAvatar>
                    <Box sx={{
                        position: 'relative', width: { xs: 40, sm: 48 }, height: { xs: 40, sm: 48 },
                        borderRadius: 1.5, overflow: 'hidden', flexShrink: 0,
                    }}>
                        <Image src={track.imgUrl} alt={track.title} fill style={{ objectFit: 'cover' }} unoptimized />
                    </Box>
                </ListItemAvatar>
                <ListItemText
                    primary={track.title}
                    secondary={track.uploader?.name}
                    primaryTypographyProps={{
                        fontWeight: 600, color: '#fff', noWrap: true,
                        fontSize: { xs: '0.85rem', sm: '0.95rem' },
                    }}
                    secondaryTypographyProps={{ color: '#666', fontSize: '0.75rem' }}
                    sx={{ ml: { xs: 0.5, sm: 1 } }}
                />
            </ListItem>
        </Box>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function RoomClient({ roomId, initialData }: IProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const { currentTrack, setCurrentTrack, audioRef, setIsRoomMode, setIsHost } = useTrackContext() as ITrackContext;
    const isSyncingRef = useRef(false);

    const [passwordVerified, setPasswordVerified] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [activeTrackData, setActiveTrackData] = useState<ITrack | null>(null);
    const [queueData, setQueueData] = useState<ITrack[]>([]);
    const [queueDrawerOpen, setQueueDrawerOpen] = useState(false);

    const userId = session?.user?.id ? Number(session.user.id) : 0;
    const token = session?.access_token || '';

    // Password logic
    useEffect(() => {
        if (initialData && !initialData.isPublic && !passwordVerified) {
            if (userId && initialData.hostUserId === userId) {
                setPasswordVerified(true);
            } else {
                setShowPasswordModal(true);
            }
        }
    }, [initialData, passwordVerified, userId]);

    const shouldConnect = useMemo(() => {
        const isPublic = initialData?.isPublic ?? true;
        const authReady = status === 'authenticated' && (userId || 0) > 0 && !!token;
        const accessReady = isPublic || passwordVerified;
        return authReady && accessReady && !isNaN(roomId) && roomId > 0;
    }, [status, userId, token, roomId, initialData, passwordVerified]);

    const { roomState, isConnected, play, pause, seek, addToQueue, removeFromQueue, clearQueue, leaveRoom } = useRoomSocket(
        shouldConnect ? roomId : 0,
        shouldConnect ? (userId || 0) : 0,
        shouldConnect ? token : '',
        {
            onRoomDeleted: () => {
                toast.dark('Room closed');
                setTimeout(() => router.replace('/room'), 1500);
            }
        }
    );

    const isHost = useMemo(() => {
        if (!userId) return false;
        return roomState?.hostUserId === userId || initialData?.hostUserId === userId;
    }, [roomState, userId, initialData]);

    const playbackState = useMemo(() => {
        if (!roomState) return null;
        return {
            currentTrackId: roomState.currentTrackId,
            currentTime: roomState.currentTime,
            isPlaying: roomState.isPlaying,
            updatedAt: roomState.updatedAt,
            version: roomState.version,
        };
    }, [
        roomState?.currentTrackId, roomState?.currentTime,
        roomState?.isPlaying, roomState?.updatedAt, roomState?.version,
    ]);

    useEffect(() => {
        if (!setIsRoomMode || !setIsHost) return;
        if (shouldConnect) { setIsRoomMode(true); setIsHost(Boolean(isHost)); }
        else { setIsRoomMode(false); setIsHost(false); }
        return () => {
            setIsRoomMode(false); setIsHost(false);
            audioEngine.pause();
            if (currentTrack.id) setCurrentTrack({ ...currentTrack, isPlaying: false });
        };
    }, [shouldConnect, isHost, setIsRoomMode, setIsHost]);

    // Fetch active track
    useEffect(() => {
        let isCancelled = false;
        const fetchTrack = async (id: number) => {
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${id}`);
                if (isCancelled) return;
                const track = res.data.data;
                setActiveTrackData(track);
                setCurrentTrack({ ...track, isPlaying: roomState?.isPlaying ?? true });
            } catch (e) {
                console.error('❌ Failed to fetch track metadata', e);
            }
        };
        if (roomState?.currentTrackId) fetchTrack(Number(roomState.currentTrackId));
        else setActiveTrackData(null);
        return () => { isCancelled = true; };
    }, [roomState?.currentTrackId, roomState?.isPlaying, setCurrentTrack]);

    // Fetch queue metadata
    useEffect(() => {
        const fetchQueue = async () => {
            if (!roomState?.queue || roomState.queue.length === 0) { setQueueData([]); return; }
            try {
                const results = await Promise.all(
                    roomState.queue.map(id => axios.get(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${id}`))
                );
                setQueueData(results.map(r => r.data.data));
            } catch (e) { console.error('Failed to fetch queue', e); }
        };
        fetchQueue();
    }, [roomState?.queue]);

    // Host: emit playback events
    useEffect(() => {
        const footer = audioRef.current;
        if (!footer || !isHost || !activeTrackData) return;
        const handlePlay = () => { if (!isSyncingRef.current) play(Number(activeTrackData.id), footer.currentTime); };
        const handlePause = () => { if (!isSyncingRef.current) pause(); };
        const handleSeeked = () => { if (!isSyncingRef.current) seek(footer.currentTime); };
        footer.addEventListener('play', handlePlay);
        footer.addEventListener('pause', handlePause);
        footer.addEventListener('seeked', handleSeeked);
        return () => {
            footer.removeEventListener('play', handlePlay);
            footer.removeEventListener('pause', handlePause);
            footer.removeEventListener('seeked', handleSeeked);
        };
    }, [isHost, activeTrackData, play, pause, seek, audioRef]);

    // Listener: sync from room state
    useEffect(() => {
        if (isHost) return;
        if (!playbackState || !audioRef.current || !activeTrackData) return;
        const footer = audioRef.current;
        const capturedState = playbackState;
        let aborted = false;

        const calcTargetTime = (): number => {
            let t = capturedState.currentTime;
            if (capturedState.isPlaying && capturedState.updatedAt)
                t += (Date.now() - capturedState.updatedAt) / 1000;
            return Math.max(0, t);
        };

        const performSync = async () => {
            if (aborted) return;
            isSyncingRef.current = true;
            try {
                if (capturedState.isPlaying && footer.paused) await footer.play();
                else if (!capturedState.isPlaying && !footer.paused) footer.pause();
            } catch {}
            if (aborted) { isSyncingRef.current = false; return; }
            const targetTime = calcTargetTime();
            if (Math.abs(footer.currentTime - targetTime) > 1.5) footer.currentTime = targetTime;
            setTimeout(() => { if (!aborted) isSyncingRef.current = false; }, 300);
        };

        const waitForReady = () => {
            if (aborted) return;
            if (footer.readyState >= 2) { performSync(); return; }
            const onCanPlay = () => { footer.removeEventListener('canplay', onCanPlay); if (!aborted) performSync(); };
            footer.addEventListener('canplay', onCanPlay);
        };

        waitForReady();
        const onLoaded = () => waitForReady();
        footer.addEventListener('loadedmetadata', onLoaded);
        return () => {
            aborted = true;
            isSyncingRef.current = false;
            footer.removeEventListener('loadedmetadata', onLoaded);
        };
    }, [playbackState, activeTrackData, audioRef, isHost]);

    // Auto-next track
    useEffect(() => {
        const footer = audioRef.current;
        if (!footer || !isHost || !activeTrackData) return;
        const handleEnded = () => {
            const q = roomState?.queue ?? [];
            if (q.length > 0) {
                const nextId = Number(q[0]);
                removeFromQueue(0);
                setTimeout(() => play(nextId, 0), 100);
            } else { pause(); }
        };
        footer.addEventListener('ended', handleEnded);
        return () => footer.removeEventListener('ended', handleEnded);
    }, [isHost, activeTrackData, roomState?.queue, play, removeFromQueue, pause, audioRef]);

    // ─── Loading / Error states ───────────────────────────────────────────────
    if (status === 'loading') {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#ff5500' }} />
            </Box>
        );
    }

    if (!initialData) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                <Typography color="rgba(255,255,255,0.4)">Room not found or no longer available.</Typography>
                <Button variant="outlined" onClick={() => { leaveRoom(); router.push('/room'); }}
                        sx={{ color: '#ff5500', borderColor: '#ff5500', borderRadius: 2, textTransform: 'none' }}>
                    Back to Rooms
                </Button>
            </Box>
        );
    }

    if (showPasswordModal) {
        return (
            <JoinRoomModal open={showPasswordModal} onClose={() => router.back()}
                           onSuccess={() => { setPasswordVerified(true); setShowPasswordModal(false); }}
                           roomId={roomId}
            />
        );
    }

    const listenerCount = roomState?.connectedUserIds?.length || 0;

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#080808', pt: { xs: 7, sm: 9, md: 10 }, pb: { xs: 14, sm: 12 } }}>
            <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>

                {/* ── HEADER ─────────────────────────────────────────────── */}
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: { xs: 'flex-start', sm: 'flex-end' },
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 2.5, sm: 0 },
                    mb: { xs: 4, sm: 5, md: 6 },
                }}>
                    <Box sx={{ minWidth: 0 }}>
                        {/* Connection status */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LiveDot />
                            <Typography variant="caption" color="rgba(255,255,255,0.35)" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                                Live Session
                            </Typography>
                        </Box>

                        {/* Room name */}
                        <Typography
                            variant="h3"
                            sx={{
                                fontWeight: 900, color: '#fff',
                                fontSize: { xs: '1.6rem', sm: '2rem', md: '2.5rem' },
                                letterSpacing: '-0.5px', lineHeight: 1.1,
                                mb: 1.5, wordBreak: 'break-word',
                            }}
                        >
                            {initialData.name}
                        </Typography>

                        {/* Code badge + role chip + listener count */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
                            {initialData.code && <RoomCodeBadge code={initialData.code} />}
                            <Chip
                                label={isHost ? 'HOST' : 'LISTENER'}
                                size="small"
                                sx={{
                                    bgcolor: isHost ? 'rgba(255,85,0,0.15)' : 'rgba(255,255,255,0.07)',
                                    color: isHost ? '#ff5500' : 'rgba(255,255,255,0.6)',
                                    border: isHost ? '1px solid rgba(255,85,0,0.3)' : '1px solid rgba(255,255,255,0.1)',
                                    fontWeight: 800, fontSize: '0.7rem', letterSpacing: '0.08em',
                                    height: 24,
                                }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                <People sx={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                                <Typography variant="caption" color="rgba(255,255,255,0.35)" sx={{ fontSize: '0.75rem' }}>
                                    {listenerCount} listening
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        {/* Mobile: queue badge button */}
                        {isMobile && (
                            <Button
                                variant="outlined"
                                onClick={() => setQueueDrawerOpen(true)}
                                startIcon={<QueueMusicIcon />}
                                size="small"
                                sx={{
                                    color: 'rgba(255,255,255,0.6)',
                                    borderColor: '#2a2a2a',
                                    borderRadius: 2,
                                    textTransform: 'none',
                                    position: 'relative',
                                    '&:hover': { borderColor: '#ff5500', color: '#fff' },
                                }}
                            >
                                Queue {queueData.length > 0 && `(${queueData.length})`}
                            </Button>
                        )}

                        <Button
                            variant="outlined"
                            color="error"
                            startIcon={<LogoutIcon />}
                            size={isMobile ? 'small' : 'medium'}
                            onClick={() => { leaveRoom(); setTimeout(() => router.push('/room'), 300); }}
                            sx={{
                                borderRadius: 2, textTransform: 'none', fontWeight: 600,
                                borderColor: 'rgba(244,67,54,0.4)',
                                color: 'rgba(244,67,54,0.8)',
                                '&:hover': { borderColor: '#f44336', color: '#f44336', bgcolor: 'rgba(244,67,54,0.06)' },
                            }}
                        >
                            Leave
                        </Button>
                    </Stack>
                </Box>

                {/* ── SEARCH / ADD TO QUEUE ──────────────────────────────── */}
                <Box sx={{ mb: { xs: 3, sm: 4 } }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.3)"
                                sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.68rem' }}>
                        {isHost ? 'Add to queue' : 'Queue (host only)'}
                    </Typography>
                    <Box sx={{ opacity: isHost ? 1 : 0.45, pointerEvents: isHost ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
                        <SearchBar
                            onSelect={(suggestion) => {
                                if (!isHost) return;
                                const trackId = Number(suggestion.id);
                                if (trackId) addToQueue(trackId);
                            }}
                        />
                    </Box>
                </Box>

                {/* ── ACTIVE PLAYER ─────────────────────────────────────── */}
                {activeTrackData ? (
                    <Box sx={{ mb: { xs: 4, sm: 6 } }}>
                        {isHost ? (
                            <WaveTrack track={activeTrackData} comments={[]} readOnly={false} />
                        ) : (
                            /* Listener player card */
                            <Paper elevation={0} sx={{
                                p: { xs: 2.5, sm: 4 },
                                bgcolor: '#0f0f0f',
                                borderRadius: { xs: 3, sm: 4 },
                                border: '1px solid #1e1e1e',
                                display: 'flex',
                                flexDirection: { xs: 'column', sm: 'row' },
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                gap: { xs: 2.5, sm: 4 },
                                background: 'linear-gradient(135deg, #0f0f0f 0%, #080808 100%)',
                                position: 'relative',
                                overflow: 'hidden',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute', inset: 0,
                                    background: 'radial-gradient(ellipse at top left, rgba(255,85,0,0.04) 0%, transparent 60%)',
                                    pointerEvents: 'none',
                                },
                            }}>
                                {/* Album art */}
                                <Box sx={{
                                    width: { xs: 80, sm: 140, md: 180 },
                                    height: { xs: 80, sm: 140, md: 180 },
                                    position: 'relative', borderRadius: { xs: 2, sm: 3 },
                                    overflow: 'hidden', flexShrink: 0,
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                                }}>
                                    <Image src={activeTrackData.imgUrl} alt={activeTrackData.title}
                                           fill style={{ objectFit: 'cover' }} unoptimized />
                                </Box>

                                {/* Track info */}
                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                    {/* Playing indicator */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <LiveDot />
                                        <Typography variant="caption" color="rgba(255,255,255,0.3)"
                                                    sx={{ textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: 1 }}>
                                            Now Playing
                                        </Typography>
                                    </Box>

                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 800, color: '#fff',
                                            fontSize: { xs: '1.1rem', sm: '1.5rem', md: '1.8rem' },
                                            mb: 0.5, wordBreak: 'break-word',
                                            letterSpacing: '-0.3px',
                                        }}
                                        noWrap
                                    >
                                        {activeTrackData.title}
                                    </Typography>
                                    <Typography
                                        sx={{ color: '#ff5500', fontWeight: 600, fontSize: { xs: '0.85rem', sm: '1rem' } }}
                                    >
                                        {activeTrackData.uploader?.name}
                                    </Typography>
                                </Box>
                            </Paper>
                        )}
                    </Box>
                ) : (
                    <Paper elevation={0} sx={{
                        p: { xs: 5, sm: 8 }, textAlign: 'center',
                        bgcolor: '#0a0a0a', borderRadius: { xs: 3, sm: 4 },
                        border: '1px dashed #222', mb: { xs: 4, sm: 6 },
                    }}>
                        <LibraryMusicIcon sx={{ fontSize: { xs: 44, sm: 60 }, color: '#222', mb: 2 }} />
                        <Typography variant="h5" color="rgba(255,255,255,0.2)"
                                    sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }} gutterBottom>
                            No track playing
                        </Typography>
                        <Typography variant="body2" color="rgba(255,255,255,0.15)" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {isHost ? 'Search and add a song to get started!' : 'Waiting for the host to play something...'}
                        </Typography>
                    </Paper>
                )}

                {/* ── QUEUE — desktop/tablet inline ─────────────────────── */}
                {!isMobile && (
                    <QueueSection
                        queueData={queueData}
                        isHost={isHost}
                        onPlay={(track, index) => { play(Number(track.id), 0); removeFromQueue(index); }}
                        onRemove={removeFromQueue}
                        onClear={clearQueue}
                    />
                )}
            </Container>

            {/* ── QUEUE DRAWER — mobile ─────────────────────────────────── */}
            {isMobile && (
                <Drawer
                    anchor="top"
                    open={queueDrawerOpen}
                    onClose={() => setQueueDrawerOpen(false)}
                    // ModalProps: cho phép scroll page khi drawer mở
                    // keepMounted=false để unmount khi đóng → giải phóng bộ nhớ
                    ModalProps={{ keepMounted: false }}
                    sx={{
                        '& .MuiPaper-root': {
                            // Navbar mobile ~56px — drawer bắt đầu từ dưới navbar
                            top: '0px',
                            maxHeight: 'calc(85vh - 56px)',
                            bgcolor: '#0f0f0f',
                            borderRadius: '0 0 20px 20px',
                            border: '1px solid #1e1e1e',
                            borderTop: 'none',
                            zIndex: 1250,
                        },
                    }}
                >

                    {/* Drawer header */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5 }}>
                        <Typography fontWeight={700} sx={{ fontSize: '1rem' }}>
                            Queue {queueData.length > 0 && `· ${queueData.length} tracks`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {isHost && queueData.length > 0 && (
                                <Button size="small" color="error" onClick={() => { clearQueue(); setQueueDrawerOpen(false); }}
                                        sx={{ fontSize: '0.75rem', textTransform: 'none' }}>
                                    Clear all
                                </Button>
                            )}
                            <IconButton size="small" onClick={() => setQueueDrawerOpen(false)} sx={{ color: '#555' }}>
                                <KeyboardArrowDown />
                            </IconButton>
                        </Box>
                    </Box>
                    <Divider sx={{ borderColor: '#1e1e1e' }} />

                    {/* Queue list */}
                    <Box sx={{
                        overflowY: 'auto',
                        // padding bottom trong scroll area để item cuối không bị clip
                        pb: 2,
                        // Chiều cao scroll area = maxHeight drawer - header (~100px)
                        // overflow tự xử lý, không cần set height cứng
                    }}>
                        <QueueList
                            queueData={queueData}
                            isHost={isHost}
                            onPlay={(track, index) => { play(Number(track.id), 0); removeFromQueue(index); }}
                            onRemove={removeFromQueue}
                        />
                    </Box>

                    {/* Drag handle ở dưới — kéo lên để đóng */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}>
                        <Box sx={{ width: 36, height: 4, borderRadius: 2, bgcolor: '#2a2a2a' }} />
                    </Box>
                </Drawer>
            )}

            <JoinRoomModal
                open={showPasswordModal}
                onClose={() => router.push('/room')}
                roomId={roomId}
                onSuccess={() => setPasswordVerified(true)}
            />
        </Box>
    );
}

// ─── Queue List (shared between inline and drawer) ────────────────────────────
function QueueList({
                       queueData, isHost,
                       onPlay, onRemove,
                   }: {
    queueData: ITrack[]; isHost: boolean;
    onPlay: (track: ITrack, index: number) => void;
    onRemove: (index: number) => void;
}) {
    if (queueData.length === 0) {
        return (
            <Box sx={{ p: 5, textAlign: 'center' }}>
                <Typography color="rgba(255,255,255,0.2)" sx={{ fontSize: '0.875rem' }}>
                    Queue is empty
                </Typography>
            </Box>
        );
    }
    return (
        <List sx={{ p: 0 }}>
            {queueData.map((track, index) => (
                <QueueItem
                    key={`${track.id}-${index}`}
                    track={track} index={index} isHost={isHost} isFirst={index === 0}
                    onPlay={() => onPlay(track, index)}
                    onRemove={() => onRemove(index)}
                />
            ))}
        </List>
    );
}

// ─── Queue Section (desktop/tablet) ──────────────────────────────────────────
function QueueSection({
                          queueData, isHost, onPlay, onRemove, onClear,
                      }: {
    queueData: ITrack[]; isHost: boolean;
    onPlay: (track: ITrack, index: number) => void;
    onRemove: (index: number) => void;
    onClear: () => void;
}) {
    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <QueueMusicIcon sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }} />
                    <Typography fontWeight={700} sx={{ fontSize: { sm: '1rem', md: '1.1rem' } }}>
                        Up Next
                    </Typography>
                    {queueData.length > 0 && (
                        <Chip label={queueData.length} size="small" sx={{
                            bgcolor: 'rgba(255,85,0,0.1)', color: '#ff5500',
                            border: '1px solid rgba(255,85,0,0.2)',
                            height: 20, fontSize: '0.7rem', fontWeight: 700,
                        }} />
                    )}
                </Box>
                {isHost && queueData.length > 0 && (
                    <Button size="small" color="error" onClick={onClear}
                            sx={{ fontSize: '0.75rem', textTransform: 'none', borderRadius: 1.5 }}>
                        Clear all
                    </Button>
                )}
            </Box>

            <Paper elevation={0} sx={{
                bgcolor: '#0f0f0f', borderRadius: { sm: 3, md: 4 },
                overflow: 'hidden', border: '1px solid #1e1e1e',
            }}>
                <QueueList queueData={queueData} isHost={isHost} onPlay={onPlay} onRemove={onRemove} />
            </Paper>
        </Box>
    );
}