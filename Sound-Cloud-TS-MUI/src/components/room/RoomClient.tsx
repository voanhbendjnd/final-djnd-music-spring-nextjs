'use client'

import { useSession } from 'next-auth/react';
import { useRoomSocket } from '@/hooks/use-room-socket';
import { 
    Box, Container, Typography, Avatar, AvatarGroup, Tooltip, Chip, 
    IconButton, Paper, CircularProgress, Divider, List, ListItem, 
    ListItemAvatar, ListItemText, Button
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SyncIcon from '@mui/icons-material/Sync';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import LockIcon from '@mui/icons-material/Lock';
import DeleteIcon from '@mui/icons-material/Delete';
import LogoutIcon from '@mui/icons-material/Logout';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import JoinRoomModal from './JoinRoomModal';
import WaveTrack from '@/components/track/wave.track';
import SearchBar from '@/components/search/search-bar';
import axios from 'axios';
import { useTrackContext, ITrackContext } from '@/lib/track.wrapper';
import { audioEngine } from '@/lib/audio-engine';
import {toast} from "react-toastify";

interface IProps {
    roomId: number;
    initialData: any;
}

export default function RoomClient({ roomId, initialData }: IProps) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { currentTrack, setCurrentTrack, audioRef, setIsRoomMode, setIsHost } = useTrackContext() as ITrackContext;
    const isSyncingRef = useRef(false);
    
    const [passwordVerified, setPasswordVerified] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [activeTrackData, setActiveTrackData] = useState<ITrack | null>(null);
    const [queueData, setQueueData] = useState<ITrack[]>([]);

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
                console.log('ROOM_DELETED received');

                toast.dark("Room closed");

                setTimeout(() => {
                    router.replace('/rooms');
                }, 1500);
            }
        }
    );

    const isHost = useMemo(() => {
        if (!userId) return false;
        return roomState?.hostUserId === userId || initialData?.hostUserId === userId;
    }, [roomState, userId, initialData]);

    // Expose room-mode + role to global player UI (footer)
    useEffect(() => {
        if (!setIsRoomMode || !setIsHost) return;

        if (shouldConnect) {
            setIsRoomMode(true);
            setIsHost(Boolean(isHost));
        } else {
            setIsRoomMode(false);
            setIsHost(false);
        }

        return () => {
            setIsRoomMode(false);
            setIsHost(false);
            // Stop music when leaving the room
            audioEngine.pause();
            if (currentTrack.id) {
                setCurrentTrack({ ...currentTrack, isPlaying: false });
            }
        };
    }, [shouldConnect, isHost, setIsRoomMode, setIsHost]);

    // Bỏ toàn bộ leaveRoomRef, hasConnectedRef, useEffect phức tạp
// Thay bằng cái này — đơn giản và đúng:

    // const hasConnectedRef = useRef(false);
    // useEffect(() => {
    //     if (isConnected) hasConnectedRef.current = true;
    // }, [isConnected]);
    //
    // const leaveRoomRef = useRef(leaveRoom);
    //
    // useEffect(() => {
    //     leaveRoomRef.current = leaveRoom;
    // }, [leaveRoom]);
    //
    // useEffect(() => {
    //     return () => {
    //         if (hasConnectedRef.current) {
    //             leaveRoomRef.current?.();
    //         }
    //     };
    // }, []);

    // Fetch active track metadata when it changes in room state
    useEffect(() => {
        let isCancelled = false;
        const fetchTrack = async (id: number) => {
            console.log(`🎵 Room State: Fetching metadata for Track ID ${id}...`);
            try {
                const res = await axios.get(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${id}`);
                if (isCancelled) return;
                
                const track = res.data.data;
                console.log(`✅ Room State: Track metadata loaded: "${track.title}"`);
                
                setActiveTrackData(track);
                
                // CRITICAL: Sync with global player immediately
                // We use the roomState's isPlaying as the source of truth
                setCurrentTrack({ 
                    ...track, 
                    isPlaying: roomState?.isPlaying ?? true 
                });
            } catch (e) {
                console.error("❌ Room State: Failed to fetch active track metadata", e);
            }
        };

        if (roomState?.currentTrackId) {
            fetchTrack(Number(roomState.currentTrackId));
        } else {
            setActiveTrackData(null);
        }

        return () => { isCancelled = true; };
    }, [roomState?.currentTrackId, roomState?.isPlaying, setCurrentTrack]);

    // Fetch queue metadata
    useEffect(() => {
        const fetchQueue = async () => {
            if (!roomState?.queue || roomState.queue.length === 0) {
                setQueueData([]);
                return;
            }
            try {
                // For simplicity, fetch individually or create a bulk endpoint later
                const promises = roomState.queue.map(id => 
                    axios.get(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${id}`)
                );
                const results = await Promise.all(promises);
                setQueueData(results.map(r => r.data.data));
            } catch (e) {
                console.error("Failed to fetch queue data", e);
            }
        };
        fetchQueue();
    }, [roomState?.queue]);

    // Sync local playback events to room (Host only)
    useEffect(() => {
        const footer = audioRef.current;
        if (!footer || !isHost || !activeTrackData) return;

        const handlePlay = () => {
            if (isSyncingRef.current) return;
            console.log('📤 Host triggered Play');
            play(Number(activeTrackData.id), footer.currentTime);
        };
        const handlePause = () => {
            if (isSyncingRef.current) return;
            console.log('📤 Host triggered Pause');
            pause();
        };
        const handleSeeked = () => {
            if (isSyncingRef.current) return;
            console.log('📤 Host triggered Seek');
            seek(footer.currentTime);
        };

        footer.addEventListener('play', handlePlay);
        footer.addEventListener('pause', handlePause);
        footer.addEventListener('seeked', handleSeeked);

        return () => {
            footer.removeEventListener('play', handlePlay);
            footer.removeEventListener('pause', handlePause);
            footer.removeEventListener('seeked', handleSeeked);
        };
    }, [isHost, activeTrackData, play, pause, seek, audioRef]);

    // Handle audio sync from Room State to Footer Player
    useEffect(() => {
        if (!roomState || !audioRef.current || !activeTrackData) return;

        const footer = audioRef.current;
        
        const performSync = () => {
            // Set syncing flag to prevent event loop
            isSyncingRef.current = true;

            let targetTime = roomState.currentTime;
            if (roomState.isPlaying && roomState.updatedAt) {
                const timePassed = (Date.now() - roomState.updatedAt) / 1000;
                targetTime += timePassed;
            }

            const drift = Math.abs(footer.currentTime - targetTime);

            // Sync playing status
            if (roomState.isPlaying && footer.paused) {
                console.log('🔄 Syncing: Play');
                footer.play().catch(() => {});
            } else if (!roomState.isPlaying && !footer.paused) {
                console.log('🔄 Syncing: Pause');
                footer.pause();
            }

            // Sync time
            if (drift > 1.5) {
                console.log(`🔄 Syncing: Seek to ${targetTime}`);
                footer.currentTime = targetTime;
            }

            // Reset syncing flag after a short delay to allow browser events to fire and be ignored
            setTimeout(() => {
                isSyncingRef.current = false;
            }, 100);
        };

        performSync();
        footer.addEventListener('loadedmetadata', performSync);
        return () => footer.removeEventListener('loadedmetadata', performSync);
    }, [roomState, activeTrackData, audioRef]);

    // Auto-play next track in queue when current ends (Host only)
    useEffect(() => {
        const footer = audioRef.current;
        if (!footer || !isHost || !activeTrackData) return;

        const handleEnded = () => {
            console.log('⏭️ Track ended, playing next from queue');
            if (roomState?.queue && roomState.queue.length > 0) {
                const nextTrackId = Number(roomState.queue[0]);
                play(nextTrackId, 0);
                removeFromQueue(0);
            } else {
                pause();
            }
        };

        footer.addEventListener('ended', handleEnded);
        return () => footer.removeEventListener('ended', handleEnded);
    }, [isHost, activeTrackData, roomState?.queue, play, removeFromQueue, pause, audioRef]);

    if (status === 'loading') {
        return <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress sx={{ color: '#f50' }} /></Box>;
    }
    if (!initialData) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
                <Typography color="gray">Room not found or no longer available.</Typography>
                <Button variant="outlined" onClick={() => {
                    leaveRoom();
                    router.push('/rooms');
                }} sx={{ color: '#f50', borderColor: '#f50' }}>
                    Back to Rooms
                </Button>
            </Box>
        );
    }

    if (showPasswordModal) {
        return (
            <JoinRoomModal
                open={showPasswordModal}
                onClose={() => router.back()}
                onSuccess={() => {
                    setPasswordVerified(true);
                    setShowPasswordModal(false);
                }}
                roomId={roomId}
            />
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#000', pt: 10, pb: 10 }}>
            <Container maxWidth="lg">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, color: '#fff', mb: 1 }}>
                            {initialData.name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Chip 
                                label={isHost ? "HOST" : "LISTENER"} 
                                sx={{ bgcolor: isHost ? '#f50' : '#333', color: '#fff', fontWeight: 'bold' }} 
                            />
                            <Typography variant="body1" color="gray">
                                {roomState?.connectedUserIds?.length || 0} people listening
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AvatarGroup max={5}>
                            {roomState?.connectedUserIds?.map(id => (
                                <Avatar key={id} sx={{ bgcolor: id === roomState.hostUserId ? '#f50' : '#333' }}>{id}</Avatar>
                            ))}
                        </AvatarGroup>

                        {/*<Button */}
                        {/*    variant="outlined" */}
                        {/*    color="error" */}
                        {/*    startIcon={<LogoutIcon />}*/}
                        {/*    onClick={() => router.push('/')}*/}
                        {/*>*/}
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<LogoutIcon />}
                                onClick={() => {
                                    leaveRoom();
                                    router.push('/rooms');
                                }}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}

                            >
                            Leave Room
                        </Button>
                    </Box>
                </Box>

                <Box sx={{ mb: 4, maxWidth: '100%' }}>
                    <Typography variant="body2" color="gray" sx={{ mb: 1, ml: 1 }}>
                        Find tracks to add to the shared queue:
                    </Typography>
                    <Box sx={{ opacity: isHost ? 1 : 0.55, pointerEvents: isHost ? 'auto' : 'none' }}>
                        <SearchBar 
                            onSelect={(suggestion) => {
                                if (!isHost) return;
                                const trackId = Number(suggestion.id);
                                if (trackId) {
                                    addToQueue(trackId);
                                }
                            }} 
                        />
                    </Box>
                    {!isHost && (
                        <Typography variant="caption" color="#888" sx={{ display: 'block', mt: 1, ml: 1 }}>
                            Only the host can add tracks to the queue.
                        </Typography>
                    )}
                </Box>

                {/* ACTIVE PLAYER */}
                {activeTrackData ? (
                    <Box sx={{ mb: 6 }}>
                        {isHost ? (
                            <WaveTrack 
                                track={activeTrackData} 
                                comments={[]} 
                                readOnly={false}
                            />
                        ) : (
                            <Paper sx={{ 
                                p: 4, bgcolor: '#111', borderRadius: 4, border: '1px solid #222',
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'linear-gradient(135deg, #111 0%, #050505 100%)'
                            }}>
                                <Box sx={{ 
                                    width: 180, height: 180, position: 'relative', 
                                    borderRadius: 3, overflow: 'hidden', flexShrink: 0,
                                    boxShadow: '0 12px 40px rgba(0,0,0,0.8)'
                                }}>
                                    <Image 
                                        src={activeTrackData.imgUrl} 
                                        alt={activeTrackData.title} 
                                        fill 
                                        style={{ objectFit: 'cover' }}
                                        unoptimized={true}
                                    />
                                </Box>
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#fff', mb: 1 }}>
                                        {activeTrackData.title}
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: '#f50', fontWeight: 500, mb: 3 }}>
                                        {activeTrackData.uploader.name}
                                    </Typography>
                                    {/*<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>*/}
                                    {/*    <CircularProgress size={20} sx={{ color: '#f50' }} />*/}
                                    {/*    <Typography variant="body2" color="gray">*/}
                                    {/*        Synchronized with host playback...*/}
                                    {/*    </Typography>*/}
                                    {/*</Box>*/}
                                </Box>
                            </Paper>
                        )}
                    </Box>
                ) : (
                    <Paper sx={{ p: 8, bgcolor: '#0a0a0a', textAlign: 'center', borderRadius: 4, border: '1px dashed #333', mb: 6 }}>
                        <LibraryMusicIcon sx={{ fontSize: 60, color: '#333', mb: 2 }} />
                        <Typography variant="h5" color="gray">No track is currently playing.</Typography>
                        <Typography variant="body2" color="#666">Add a song to the queue to get started!</Typography>
                    </Paper>
                )}

                {/* QUEUE SECTION */}
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight={700}>Upcoming in Queue</Typography>
                        {isHost && queueData.length > 0 && (
                            <Button size="small" color="error" onClick={clearQueue}>Clear All</Button>
                        )}
                    </Box>
                    
                    <Paper sx={{ bgcolor: '#1a1a1a', borderRadius: 4, overflow: 'hidden', border: '1px solid #333' }}>
                        {queueData.length > 0 ? (
                            <List sx={{ p: 0 }}>
                                {queueData.map((track, index) => (
                                    <Box key={`${track.id}-${index}`}>
                                        <ListItem
                                            secondaryAction={
                                                isHost && (
                                                    <Box>
                                                        <IconButton 
                                                            onClick={() => {
                                                                play(Number(track.id), 0);
                                                                removeFromQueue(index);
                                                            }}
                                                            sx={{ color: '#4caf50', mr: 1 }}
                                                            title="Play Now"
                                                        >
                                                            <PlayArrowIcon />
                                                        </IconButton>
                                                        <IconButton 
                                                            edge="end" 
                                                            onClick={() => removeFromQueue(index)} 
                                                            sx={{ color: '#666', '&:hover': { color: '#f44336' } }}
                                                            title="Remove"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Box>
                                                )
                                            }
                                            sx={{ py: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' } }}
                                        >
                                            <ListItemAvatar>
                                                <Avatar variant="rounded" src={track.imgUrl} sx={{ width: 48, height: 48 }} />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={track.title}
                                                secondary={track.uploader.name}
                                                primaryTypographyProps={{ fontWeight: 600, color: '#fff' }}
                                                secondaryTypographyProps={{ color: '#999' }}
                                            />
                                        </ListItem>
                                        {index < queueData.length - 1 && <Divider sx={{ borderColor: '#333', mx: 2 }} />}
                                    </Box>
                                ))}
                            </List>
                        ) : (
                            <Box sx={{ p: 6, textAlign: 'center' }}>
                                <Typography color="rgba(255,255,255,0.3)">Queue is empty.</Typography>
                            </Box>
                        )}
                    </Paper>
                </Box>
            </Container>

            <JoinRoomModal 
                open={showPasswordModal}
                onClose={() => router.push('/rooms')}
                roomId={roomId}
                onSuccess={() => setPasswordVerified(true)}
            />
        </Box>
    );
}
