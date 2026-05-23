'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    Box, Typography, Avatar, Dialog, DialogContent,
    IconButton, Tooltip, Slide,
} from '@mui/material';
import { Close, PlayArrow, MusicNote } from '@mui/icons-material';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useTrackContext } from '@/lib/track.wrapper';

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface ListeningActivityEvent {
    followingId: number;
    followingName: string;
    followingAvatar: string;
    followingTrackId: number;
    followingTrackTitle: string;
    followingTrackUrl: string;
    followingImgUrl: string;
    startedAt: number;
}

// ─── Animated ring (pulse when active) ────────────────────────────────────────
function ActivityRing({ active, isMe, children }: { active: boolean; isMe?: boolean; children: React.ReactNode }) {
    return (
        <Box sx={{
            position: 'relative',
            width: 68,
            height: 68,
            flexShrink: 0,
        }}>
            {/* Gradient ring: Nếu là mình thì màu neon cam hồng nổi bật, người khác màu cam truyền thống */}
            {active && (
                <Box sx={{
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    background: isMe
                        ? 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)' // Xanh dương tươi mát cho chính mình phân biệt với người khác
                        : 'linear-gradient(135deg, #ff5500 0%, #ff9966 50%, #ff5500 100%)',
                    backgroundSize: '200% 200%',
                    animation: 'ringRotate 2s linear infinite',
                    '@keyframes ringRotate': {
                        '0%': { backgroundPosition: '0% 50%' },
                        '100%': { backgroundPosition: '200% 50%' },
                    },
                    zIndex: 0,
                }} />
            )}
            <Box sx={{
                position: 'absolute',
                inset: active ? 1.5 : 0,
                borderRadius: '50%',
                bgcolor: '#121212',
                zIndex: 1,
            }} />
            <Box sx={{ position: 'relative', zIndex: 2, width: '100%', height: '100%' }}>
                {children}
            </Box>
        </Box>
    );
}

// ─── Story Card ────────────────────────────────────────────────────────────────
function StoryCard({
                       activity,
                       onClick,
                       isMe
                   }: {
    activity: ListeningActivityEvent;
    onClick: () => void;
    isMe?: boolean;
}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.75,
                cursor: 'pointer',
                minWidth: 72,
                userSelect: 'none',
                '&:hover .story-name': { color: isMe ? '#4facfe' : '#ff5500' },
                '&:hover .story-avatar': { transform: 'scale(1.06)' },
            }}
        >
            <ActivityRing active isMe={isMe}>
                <Avatar
                    className="story-avatar"
                    src={activity.followingAvatar || undefined}
                    sx={{
                        width: '100%',
                        height: '100%',
                        border: '2px solid #121212',
                        transition: 'transform 0.2s ease',
                        fontSize: '1.2rem',
                        bgcolor: '#2a2a2a',
                    }}
                >
                    {!activity.followingAvatar && activity.followingName?.charAt(0).toUpperCase()}
                </Avatar>
            </ActivityRing>

            <Typography
                className="story-name"
                sx={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: isMe ? '#4facfe' : 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    maxWidth: 68,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.15s',
                    letterSpacing: '-0.01em',
                }}
            >
                {isMe ? 'Your Story' : activity.followingName}
            </Typography>
        </Box>
    );
}

// ─── Empty/Placeholder Card when I'm not listening ────────────────────────────
function EmptyMyStoryCard() {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.75, minWidth: 72, opacity: 0.4 }}>
            <Box sx={{ width: 68, height: 68 }}>
                <Avatar sx={{ width: '100%', height: '100%', bgcolor: '#1e1e1e', border: '1.5px solid #2a2a2a' }}>
                    <MusicNote sx={{ color: 'rgba(255,255,255,0.3)', fontSize: 28 }} />
                </Avatar>
            </Box>
            <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>
                Not playing
            </Typography>
        </Box>
    );
}

// ─── Activity Detail Dialog ────────────────────────────────────────────────────
function ActivityDialog({
                            open,
                            activity,
                            onClose,
                            onPlay,
                            isMe
                        }: {
    open: boolean;
    activity: ListeningActivityEvent | null;
    onClose: () => void;
    onPlay: () => void;
    isMe: boolean;
}) {
    if (!activity) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            TransitionComponent={Slide}
            // @ts-ignore
            TransitionProps={{ direction: 'up' }}
            PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none', overflow: 'visible' } }}
            BackdropProps={{ sx: { backdropFilter: 'blur(12px)', bgcolor: 'rgba(0,0,0,0.75)' } }}
        >
            <DialogContent sx={{ p: 0, overflow: 'visible' }}>
                <Box sx={{
                    borderRadius: 4, overflow: 'hidden', bgcolor: '#141414',
                    border: '1px solid #2a2a2a', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                }}>
                    <Box sx={{ position: 'relative', width: '100%', height: 240 }}>
                        <Image
                            src={activity.followingImgUrl || '/image/playlistdefault.jpg'}
                            alt={activity.followingTrackTitle || 'Track'}
                            fill
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(20,20,20,0.95) 100%)',
                        }} />

                        <IconButton
                            onClick={onClose}
                            size="small"
                            sx={{
                                position: 'absolute', top: 10, right: 10,
                                bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)',
                                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                            }}
                        >
                            <Close fontSize="small" />
                        </IconButton>

                        <Box sx={{
                            position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5,
                            display: 'flex', alignItems: 'center', gap: 1.5,
                        }}>
                            <Avatar
                                src={activity.followingAvatar}
                                sx={{ width: 40, height: 40, border: isMe ? '2px solid #4facfe' : '2px solid #ff5500' }}
                            >
                                {activity.followingName?.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1 }}>
                                    {isMe ? "⚡ You are vibing to" : "🎵 is listening to"}
                                </Typography>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', lineHeight: 1.2, mt: 0.25 }}>
                                    {isMe ? "Your Current Track" : activity.followingName}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={{ p: 2.5 }}>
                        <Typography noWrap sx={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', mb: 0.5 }}>
                            {activity.followingTrackTitle}
                        </Typography>

                        {/* Chỉ hiện nút nghe chung nếu câu chuyện này là của người khác */}
                        {!isMe && (
                            <Box
                                onClick={onPlay}
                                sx={{
                                    mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, py: 1.25,
                                    borderRadius: 2, bgcolor: '#ff5500', cursor: 'pointer', transition: 'all 0.15s',
                                    '&:hover': { bgcolor: '#cc4400', transform: 'translateY(-1px)' },
                                    '&:active': { transform: 'translateY(0)' },
                                }}
                            >
                                <PlayArrow sx={{ color: '#fff', fontSize: 20 }} />
                                <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '0.88rem', letterSpacing: '-0.01em' }}>
                                    Listen together
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ListeningStoryBar() {
    const { data: session } = useSession();
    const { currentTrack, setCurrentTrack } = useTrackContext() as ITrackContext;

    const [activities, setActivities] = useState<ListeningActivityEvent[]>([]);
    const [selected, setSelected] = useState<ListeningActivityEvent | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const stompRef = useRef<Client | null>(null);

    const token = session?.access_token;
    const userId = session?.user?.id;

    // ── Tự động tạo dữ liệu Story cho CHÍNH MÌNH (Facebook Style) ─────────────────
    const myStory: ListeningActivityEvent | null = useMemo(() => {
        if (!userId || !currentTrack?.id || !currentTrack?.trackUrl) return null;
        return {
            followingId: Number(userId),
            followingName: session?.user?.name || 'Me',
            followingAvatar: session?.user?.avatar || '',
            followingTrackId: Number(currentTrack.id),
            followingTrackTitle: currentTrack.title,
            followingTrackUrl: currentTrack.trackUrl,
            followingImgUrl: currentTrack.imgUrl || '',
            startedAt: Date.now(),
        };
    }, [currentTrack, userId, session]);

    // ── Tự động gửi trạng thái nghe của mình lên WebSocket khi đổi bài hát ──────────
    useEffect(() => {
        if (myStory && stompRef.current?.connected) {
            stompRef.current.publish({
                destination: `/app/follow.state`,
                body: JSON.stringify(myStory),
            });
        }
    }, [myStory]);

    // ── Kết nối và nhận tin nhắn WebSocket từ bạn bè ──────────────────────────────
    useEffect(() => {
        if (!token || !userId) return;

        const client = new Client({
            webSocketFactory: () =>
                new SockJS(`${process.env.NEXT_PUBLIC_BE_URL || 'http://localhost:8080'}/ws`),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 8000,
            heartbeatIncoming: 15000,
            heartbeatOutgoing: 15000,
        });

        client.onConnect = () => {
            client.subscribe(`/user/queue/follower/activity`, (message: IMessage) => {
                try {
                    const event: ListeningActivityEvent = JSON.parse(message.body);
                    // Không đẩy sự kiện của chính mình vào danh sách activities chung của bạn bè
                    if (event.followingId === Number(userId)) return;

                    setActivities(prev => {
                        const filtered = prev.filter(a => a.followingId !== event.followingId);
                        return [event, ...filtered].slice(0, 20);
                    });
                } catch (e) {
                    console.error('Failed to parse activity', e);
                }
            });
        };

        client.activate();
        stompRef.current = client;

        return () => {
            client.deactivate();
            stompRef.current = null;
        };
    }, [token, userId]);

    const handlePlay = useCallback(() => {
        if (!selected) return;
        setCurrentTrack({
            id: selected.followingTrackId,
            trackUrl: selected.followingTrackUrl,
            title: selected.followingTrackTitle,
            imgUrl: selected.followingImgUrl,
            isPlaying: true,
            uploader: { name: selected.followingName },
        } as any);
        setDialogOpen(false);
    }, [selected, setCurrentTrack]);

    if (!session) return null;

    return (
        <>
            <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                px: { xs: 2, sm: 3, md: 5 },
                py: 2,
                overflowX: 'auto',
                minHeight: 110,
                bgcolor: '#121212',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                '&::-webkit-scrollbar': { display: 'none' },
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
            }}>
                {/* VỊ TRÍ 1: Luôn hiển thị trạng thái của BẠN (Facebook Style) */}
                {myStory ? (
                    <StoryCard
                        activity={myStory}
                        isMe={true}
                        onClick={() => {
                            setSelected(myStory);
                            setDialogOpen(true);
                        }}
                    />
                ) : (
                    <EmptyMyStoryCard />
                )}

                {/* Thanh dọc ngăn cách giữa "Tôi" và "Bạn bè" */}
                <Box sx={{ width: '1px', height: 48, bgcolor: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />

                {/* VỊ TRÍ TIẾP THEO: Danh sách những người bạn follow đang nghe */}
                {activities.map(activity => (
                    <StoryCard
                        key={`${activity.followingId}-${activity.startedAt}`}
                        activity={activity}
                        isMe={false}
                        onClick={() => {
                            setSelected(activity);
                            setDialogOpen(true);
                        }}
                    />
                ))}

                {/* Empty state khi không có bạn bè nào nghe nhạc */}
                {activities.length === 0 && (
                    <Typography sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.2)', ml: 1, whiteSpace: 'nowrap' }}>
                        When people you follow share what they're listening to, it'll appear here
                    </Typography>
                )}
            </Box>

            {/* Chi tiết câu chuyện khi click vào */}
            <ActivityDialog
                open={dialogOpen}
                activity={selected}
                isMe={selected?.followingId === Number(userId)}
                onClose={() => setDialogOpen(false)}
                onPlay={handlePlay}
            />
        </>
    );
}