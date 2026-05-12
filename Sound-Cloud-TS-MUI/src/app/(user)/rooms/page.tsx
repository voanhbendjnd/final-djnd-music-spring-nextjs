'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Box, Container, Typography, Grid, Paper, 
    Button, Avatar, Chip, Skeleton, Stack
} from '@mui/material';
import { 
    Lock, Public, People, PlayArrow, 
    Add, Refresh, Person
} from '@mui/icons-material';
import axiosInstance from '@/utils/axios-instance';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface Room {
    id: number;
    name: string;
    hostUserId: number;
    hostUserName: string;
    isPublic: boolean;
    createdAt: string;
    listenerCount: number;
}

export default function RoomsPage() {
    const [rooms, setRooms] = useState<Room[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res: any = await axiosInstance.get('/api/v1/rooms');
            setRooms(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load rooms");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, []);

    const handleJoin = (room: Room) => {
        if (!room.isPublic) {
            // We will implement the Password Modal later
            // For now, let's redirect and let the RoomClient handle it if it can
            // But better to handle it here.
            router.push(`/rooms/${room.id}`);
        } else {
            router.push(`/rooms/${room.id}`);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 6 }}>
                <Box>
                    <Typography variant="h3" fontWeight={900} sx={{ letterSpacing: '-1px' }}>
                        Live Sessions
                    </Typography>
                    <Typography color="rgba(255,255,255,0.6)">
                        Join a room and discover what others are listening to in real-time.
                    </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                    <Button 
                        startIcon={<Refresh />}
                        onClick={fetchRooms}
                        sx={{ color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}
                    >
                        Refresh
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={() => router.push('/rooms/create')}
                        sx={{ 
                            bgcolor: '#f50', 
                            fontWeight: 700,
                            borderRadius: 2,
                            '&:hover': { bgcolor: '#e40' } 
                        }}
                    >
                        Create Room
                    </Button>
                </Stack>
            </Box>

            {loading ? (
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Grid item xs={12} sm={6} md={4} key={i}>
                            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 4, bgcolor: '#1a1a1a' }} />
                        </Grid>
                    ))}
                </Grid>
            ) : rooms.length === 0 ? (
                <Paper sx={{ p: 8, textAlign: 'center', bgcolor: '#121212', borderRadius: 4, border: '1px dashed #333' }}>
                    <People sx={{ fontSize: 64, color: '#333', mb: 2 }} />
                    <Typography variant="h5" color="rgba(255,255,255,0.4)" gutterBottom>
                        No active rooms right now
                    </Typography>
                    <Button 
                        variant="outlined" 
                        onClick={() => router.push('/rooms/create')}
                        sx={{ color: '#f50', borderColor: '#f50', mt: 2 }}
                    >
                        Be the first to start a session
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {rooms.map((room) => (
                        <Grid item xs={12} sm={6} md={4} key={room.id}>
                            <Paper 
                                sx={{ 
                                    p: 3, 
                                    bgcolor: '#1a1a1a', 
                                    color: '#fff', 
                                    borderRadius: 4,
                                    border: '1px solid #333',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    '&:hover': {
                                        borderColor: '#f50',
                                        transform: 'translateY(-4px)',
                                        bgcolor: '#222'
                                    }
                                }}
                                onClick={() => handleJoin(room)}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Chip 
                                        size="small"
                                        icon={room.isPublic ? <Public sx={{ fontSize: '12px !important' }} /> : <Lock sx={{ fontSize: '12px !important' }} />}
                                        label={room.isPublic ? "Public" : "Private"}
                                        sx={{ 
                                            bgcolor: room.isPublic ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                                            color: room.isPublic ? '#4caf50' : '#ff9800',
                                            fontWeight: 600,
                                            fontSize: '10px'
                                        }}
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)' }}>
                                        <People sx={{ fontSize: 16, mr: 0.5 }} />
                                        <Typography variant="caption" fontWeight={600}>
                                            {room.listenerCount} listening
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography variant="h6" fontWeight={800} noWrap sx={{ mb: 1 }}>
                                    {room.name}
                                </Typography>

                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Avatar sx={{ width: 24, height: 24, mr: 1, bgcolor: '#333', fontSize: 12 }}>
                                        {room.hostUserName?.charAt(0)}
                                    </Avatar>
                                    <Typography variant="body2" color="rgba(255,255,255,0.6)">
                                        Hosted by <span style={{ color: '#fff', fontWeight: 600 }}>{room.hostUserName}</span>
                                    </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Typography variant="caption" color="rgba(255,255,255,0.3)">
                                        Started {dayjs(room.createdAt).fromNow()}
                                    </Typography>
                                    <Button 
                                        size="small"
                                        variant="contained"
                                        sx={{ 
                                            minWidth: 40, 
                                            height: 40, 
                                            borderRadius: '50%',
                                            bgcolor: '#f50',
                                            '&:hover': { bgcolor: '#e40' }
                                        }}
                                    >
                                        <PlayArrow />
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Container>
    );
}
