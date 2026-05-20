'use client';

import {
    useState, useRef, useCallback, useEffect,
} from 'react';
import {
    Box, Typography, Avatar, IconButton, Tooltip,
    Chip, CircularProgress, Snackbar, Alert, Button,
    useTheme, useMediaQuery, Skeleton,
} from '@mui/material';
import {
    CameraAlt, Edit, Check, PersonAdd, PersonRemove,
    MusicNote, People, PersonOutline,
} from '@mui/icons-material';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import axiosInstance from '@/utils/axios-instance';
import { useFollowMutation } from '@/hooks/use.follow';
import { useTrackContext } from '@/lib/track.wrapper';

interface ProfileData {
    id: number;
    name: string;
    email: string;
    avatar: string | null;
    backgroundUrl: string | null;
    countFollowers: number;
    role: string | null;
    status: string | null;
    createdAt: string | null;
    isFollowed?: boolean;
}

interface FollowStats {
    following: number;
    followers: number;
    tracks: number;
}

interface IProps {
    profile: ProfileData;
    isOwnProfile: boolean;
    followStats: FollowStats;
    userId: string;
}

export default function ProfileHeader({ profile, isOwnProfile, followStats, userId }: IProps) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { data: session, update: updateSession } = useSession();
    const { followedUploaders, toggleFollowUploader } = useTrackContext() as ITrackContext;
    const mutationFollow = useFollowMutation();
    // Local state — starts from SSR data, updates optimistically
    const [localProfile, setLocalProfile] = useState(profile);
    const [localStats, setLocalStats] = useState(followStats);

    // Avatar editing
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarDragging, setAvatarDragging] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    // Background editing
    const [bgFile, setBgFile] = useState<File | null>(null);
    const [bgPreview, setBgPreview] = useState<string | null>(null);
    const [bgDragging, setBgDragging] = useState(false);
    const bgInputRef = useRef<HTMLInputElement>(null);

    // Saving state
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [savingBg, setSavingBg] = useState(false);

    // Snackbar
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
        open: false, msg: '', severity: 'success',
    });

    // Follow state from context (reactive) or SSR data
    const idStr = String(userId);
    const followState = followedUploaders?.[idStr];
    const isFollowed = followState !== undefined ? followState.isFollowed : (localProfile.isFollowed ?? false);
    const displayFollowers = followState?.countFollowers ?? localStats.followers;
    const isSelf = session && Number(session.user?.id) === Number(userId);
    // ── File helpers ──────────────────────────────────────────────────────────
    const handleFile = useCallback((
        file: File,
        setPreview: (v: string | null) => void,
        setFile: (f: File | null) => void,
        maxMB = 5,
        aspectHint?: string,
    ) => {
        if (!file.type.startsWith('image/')) {
            setSnack({ open: true, msg: 'Please upload an image file', severity: 'error' });
            return;
        }
        if (file.size > maxMB * 1024 * 1024) {
            setSnack({ open: true, msg: `Image must be under ${maxMB}MB`, severity: 'error' });
            return;
        }
        setFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    // ── Save avatar ───────────────────────────────────────────────────────────
    const saveAvatar = async () => {
        if (!avatarFile) return;
        setSavingAvatar(true);
        try {
            const form = new FormData();
            form.append('name', localProfile.name);
            form.append('avatar', avatarFile);
            const res: any = await axiosInstance.patch('/api/v1/profiles', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const updated = res.data;
            const newAvatar = `${updated.avatar}?t=${Date.now()}`;
            setLocalProfile(p => ({ ...p, avatar: newAvatar }));
            setAvatarFile(null);
            setAvatarPreview(null);
            await updateSession({ user: { ...session?.user, avatar: newAvatar } });
            setSnack({ open: true, msg: 'Avatar updated!', severity: 'success' });
        } catch {
            setSnack({ open: true, msg: 'Failed to update avatar', severity: 'error' });
        } finally {
            setSavingAvatar(false);
        }
    };

    // ── Save background ───────────────────────────────────────────────────────
    const saveBg = async () => {
        if (!bgFile) return;
        setSavingBg(true);
        try {
            const form = new FormData();
            form.append('backgroundUrl', bgFile);
            const res: any = await axiosInstance.patch('/api/v1/profiles/background', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // API returns the new URL in data.email field per spec
            const newBg = res.data?.email || res.data?.backgroundUrl || bgPreview;
            setLocalProfile(p => ({ ...p, backgroundUrl: newBg }));
            setBgFile(null);
            setBgPreview(null);
            setSnack({ open: true, msg: 'Background updated!', severity: 'success' });
        } catch {
            setSnack({ open: true, msg: 'Failed to update background', severity: 'error' });
        } finally {
            setSavingBg(false);
        }
    };

    // ── Follow toggle ─────────────────────────────────────────────────────────
    const handleFollow = () => {
        if (!session) return;
        mutationFollow.mutate(idStr, {
            onSuccess: (res) => {
                const { isFollowed: newState, countFollowers } = res.data;
                toggleFollowUploader?.(idStr, newState, countFollowers);
                setLocalStats(s => ({ ...s, followers: countFollowers }));
            },
        });
    };

    const displayAvatar = avatarPreview || localProfile.avatar || '';
    const displayBg = bgPreview || localProfile.backgroundUrl || '';

    // ── Banner height ─────────────────────────────────────────────────────────
    const bannerH = isMobile ? 200 : 300;
    const avatarSize = isMobile ? 88 : 130;

    return (
        <>
            {/* ── BANNER ─────────────────────────────────────────────────────── */}
            <Box
                sx={{
                    position: 'relative',
                    width: '100%',
                    height: bannerH,
                    bgcolor: '#1a1a1a',
                    overflow: 'hidden',
                }}
            >
                {/* Background image */}
                {displayBg ? (
                    <Image
                        src={displayBg}
                        alt="Profile background"
                        fill
                        style={{ objectFit: 'cover', objectPosition: 'center' }}
                        unoptimized
                        priority
                    />
                ) : (
                    <Box sx={{
                        width: '100%', height: '100%',
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a1a0a 50%, #0a0a0a 100%)',
                    }} />
                )}

                {/* Dark scrim so text is readable */}
                <Box sx={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
                    zIndex: 1,
                }} />

                {/* Edit background button — own profile only */}
                {isOwnProfile && (
                    <Box sx={{ position: 'absolute', top: 12, right: 12, zIndex: 10, display: 'flex', gap: 1 }}>
                        <input
                            ref={bgInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                                if (e.target.files?.[0])
                                    handleFile(e.target.files[0], setBgPreview, setBgFile, 8, '16:9 recommended');
                            }}
                        />

                        {bgFile ? (
                            <>
                                <Tooltip title="Save background">
                                    <IconButton
                                        onClick={saveBg}
                                        disabled={savingBg}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgb(211 89 27)',
                                            backdropFilter: 'blur(6px)',
                                            color: '#fff',
                                            '&:hover': { bgcolor: 'rgb(255 85 0)' },
                                        }}
                                    >
                                        {savingBg
                                            ? <CircularProgress size={14} sx={{ color: '#fff' }} />
                                            : <Check fontSize="small" />}
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Cancel">
                                    <IconButton
                                        onClick={() => { setBgFile(null); setBgPreview(null); }}
                                        size="small"
                                        sx={{
                                            bgcolor: 'rgba(30,30,30,0.8)',
                                            backdropFilter: 'blur(6px)',
                                            color: '#ccc',
                                            '&:hover': { color: '#fff' },
                                        }}
                                    >
                                        ×
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <Tooltip title="Change background (16:9, max 8MB)">
                                <IconButton
                                    onClick={() => bgInputRef.current?.click()}
                                    onDragOver={e => { e.preventDefault(); setBgDragging(true); }}
                                    onDragLeave={() => setBgDragging(false)}
                                    onDrop={e => {
                                        e.preventDefault();
                                        setBgDragging(false);
                                        if (e.dataTransfer.files?.[0])
                                            handleFile(e.dataTransfer.files[0], setBgPreview, setBgFile, 8);
                                    }}
                                    size="small"
                                    sx={{
                                        bgcolor: bgDragging ? 'rgba(255,85,0,0.8)' : 'rgba(0,0,0,0.55)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.15)',
                                        color: '#fff',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,85,0,0.7)',
                                            borderColor: 'rgba(255,85,0,0.5)',
                                        },
                                    }}
                                >
                                    <CameraAlt fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>
                )}

                {/* Name overlay on banner */}
                <Box sx={{
                    position: 'absolute',
                    bottom: { xs: 16, sm: 20 },
                    left: { xs: avatarSize + 24, sm: avatarSize + 32 },
                    zIndex: 2,
                }}>
                    <Typography sx={{
                        fontSize: { xs: '1.4rem', sm: '2rem', md: '2.6rem' },
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                        fontFamily: 'sans-serif',
                    }}>
                        {localProfile.name}
                    </Typography>
                    {localProfile.status && (
                        <Typography sx={{
                            fontSize: { xs: '0.75rem', sm: '0.85rem' },
                            color: 'rgba(255,255,255,0.65)',
                            mt: 0.25,
                            textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                        }}>
                            {localProfile.status}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* ── AVATAR + INFO ROW ─────────────────────────────────────────── */}
            <Box sx={{
                position: 'relative',
                px: { xs: 2, sm: 3, md: 4 },
                pb: 0,
                bgcolor: '#121212',
            }}>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: { xs: 1.5, sm: 2.5 },
                    // Pull avatar up so it overlaps the banner
                    mt: -(avatarSize / 2) + 'px',
                }}>
                    {/* ── Avatar ──────────────────────────────────────────────── */}
                    <Box sx={{ position: 'relative', flexShrink: 0, zIndex: 3 }}>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={e => {
                                if (e.target.files?.[0])
                                    handleFile(e.target.files[0], setAvatarPreview, setAvatarFile);
                            }}
                        />

                        <Box
                            onClick={isOwnProfile ? () => avatarInputRef.current?.click() : undefined}
                            onDragOver={isOwnProfile ? e => { e.preventDefault(); setAvatarDragging(true); } : undefined}
                            onDragLeave={isOwnProfile ? () => setAvatarDragging(false) : undefined}
                            onDrop={isOwnProfile ? e => {
                                e.preventDefault();
                                setAvatarDragging(false);
                                if (e.dataTransfer.files?.[0])
                                    handleFile(e.dataTransfer.files[0], setAvatarPreview, setAvatarFile);
                            } : undefined}
                            sx={{
                                position: 'relative',
                                width: avatarSize,
                                height: avatarSize,
                                borderRadius: '50%',
                                cursor: isOwnProfile ? 'pointer' : 'default',
                                outline: avatarDragging ? '3px solid #ff5500' : '3px solid #121212',
                                outlineOffset: 2,
                                transition: 'outline-color 0.2s, transform 0.2s',
                                '&:hover .av-overlay': isOwnProfile ? { opacity: 1 } : {},
                                '&:hover': isOwnProfile ? { transform: 'scale(1.03)' } : {},
                            }}
                        >
                            {displayAvatar ? (
                                <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                                    <Image
                                        src={displayAvatar}
                                        alt={localProfile.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                </Box>
                            ) : (
                                <Avatar sx={{
                                    width: '100%', height: '100%',
                                    bgcolor: '#2a2a2a',
                                    fontSize: avatarSize * 0.4,
                                    color: '#ff5500',
                                    fontFamily: '"Bebas Neue", sans-serif',
                                }}>
                                    {localProfile.name?.charAt(0).toUpperCase()}
                                </Avatar>
                            )}

                            {/* Hover overlay */}
                            {isOwnProfile && (
                                <Box className="av-overlay" sx={{
                                    position: 'absolute', inset: 0, borderRadius: '50%',
                                    bgcolor: avatarDragging ? 'rgba(255,85,0,0.45)' : 'rgba(0,0,0,0.55)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center', gap: 0.5,
                                    opacity: avatarDragging ? 1 : 0,
                                    transition: 'opacity 0.2s',
                                }}>
                                    <CameraAlt sx={{ color: '#fff', fontSize: avatarSize * 0.28 }} />
                                    <Typography sx={{ color: '#fff', fontSize: '0.6rem', fontWeight: 700 }}>
                                        {avatarDragging ? 'Drop' : 'Edit'}
                                    </Typography>
                                </Box>
                            )}

                            {/* Pending badge */}
                            {avatarFile && (
                                <Box sx={{
                                    position: 'absolute', bottom: 2, right: 2,
                                    width: 22, height: 22, borderRadius: '50%',
                                    bgcolor: '#ff5500',
                                    border: '2px solid #121212',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Edit sx={{ fontSize: 11, color: '#fff' }} />
                                </Box>
                            )}
                        </Box>

                        {/* Save avatar CTA */}
                        {avatarFile && (
                            <Box
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    display: 'flex',
                                    gap: 0.5,
                                    zIndex: 30,
                                }}
                            >
                                <Tooltip title="Save avatar">
                                    <IconButton
                                        onClick={saveAvatar}
                                        disabled={savingAvatar}
                                        size="small"
                                        sx={{
                                            bgcolor: '#ff5500',
                                            color: '#fff',
                                            width: 32,
                                            height: 32,
                                            '&:hover': {
                                                bgcolor: '#ff6600',
                                            },
                                        }}
                                    >
                                        {savingAvatar ? (
                                            <CircularProgress size={14} sx={{ color: '#fff' }} />
                                        ) : (
                                            <Check sx={{ fontSize: 16 }} />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </Box>
                        )}
                    </Box>

                    {/* ── Right side: stats + actions ───────────────────────── */}
                    <Box sx={{
                        flex: 1,
                        minWidth: 0,
                        pb: 1.5,
                        // On mobile the name is on the banner, so just show stats
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { xs: 'flex-start', sm: 'flex-end' },
                        justifyContent: 'space-between',
                        gap: { xs: 1.5, sm: 0 },
                    }}>
                        {/* Stats row */}
                        <Box sx={{ display: 'flex', gap: { xs: 2.5, sm: 3.5 } }}>
                            {[
                                { label: 'Followers', value: displayFollowers },
                                { label: 'Following', value: localStats.following },
                                { label: 'Tracks', value: localStats.tracks },
                            ].map(({ label, value }) => (
                                <Box key={label} sx={{ textAlign: 'center' }}>
                                    <Typography sx={{
                                        fontSize: { xs: '1.1rem', sm: '1.4rem' },
                                        fontWeight: 900,
                                        color: '#fff',
                                        lineHeight: 1,
                                        letterSpacing: '-0.03em',
                                    }}>
                                        {(value ?? 0).toLocaleString()}
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '0.65rem',
                                        color: 'rgba(255,255,255,0.4)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.08em',
                                        fontWeight: 600,
                                        mt: 0.25,
                                    }}>
                                        {label}
                                    </Typography>
                                </Box>
                            ))}
                        </Box>

                        {/* Action buttons */}
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            {session && !isSelf && (
                                <Button
                                    size="small"
                                    onClick={handleFollow}
                                    disabled={mutationFollow.isPending}
                                    startIcon={isFollowed ? <PersonRemove sx={{ fontSize: '14px !important' }} /> : <PersonAdd sx={{ fontSize: '14px !important' }} />}
                                    sx={{
                                        height: 34,
                                        px: 2,
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        textTransform: 'none',
                                        borderRadius: '6px',
                                        boxShadow: 'none',
                                        transition: 'all 0.15s',
                                        '& .MuiButton-startIcon': { mr: '5px' },
                                        '&.Mui-disabled': { opacity: 0.45 },
                                        ...(isFollowed ? {
                                            bgcolor: '#242424',
                                            color: '#999',
                                            border: '1px solid #333',
                                            '&:hover': { bgcolor: '#2e2e2e', color: '#ff5500', borderColor: '#3d3d3d' },
                                        } : {
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

                            {isOwnProfile && (
                                <Link href="/profile" style={{ textDecoration: 'none' }}>
                                    <Button
                                        size="small"
                                        startIcon={<Edit sx={{ fontSize: '14px !important' }} />}
                                        sx={{
                                            height: 34,
                                            px: 2,
                                            fontSize: '0.8rem',
                                            fontWeight: 700,
                                            textTransform: 'none',
                                            borderRadius: '6px',
                                            bgcolor: '#1e1e1e',
                                            color: '#ccc',
                                            border: '1px solid #2e2e2e',
                                            '& .MuiButton-startIcon': { mr: '5px' },
                                            '&:hover': { bgcolor: '#2a2a2a', borderColor: '#3a3a3a', color: '#fff' },
                                        }}
                                    >
                                        Edit profile
                                    </Button>
                                </Link>
                            )}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* Snackbar */}
            <Snackbar
                open={snack.open}
                autoHideDuration={3000}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    severity={snack.severity}
                    variant="filled"
                    onClose={() => setSnack(s => ({ ...s, open: false }))}
                    sx={{
                        bgcolor: snack.severity === 'success' ? '#1a2a1a' : '#2a1a1a',
                        color: snack.severity === 'success' ? '#4caf50' : '#f44336',
                        border: `1px solid ${snack.severity === 'success' ? 'rgba(76,175,80,0.3)' : 'rgba(244,67,54,0.3)'}`,
                        borderRadius: 2,
                        fontWeight: 600,
                        '& .MuiAlert-icon': { color: 'inherit' },
                    }}
                >
                    {snack.msg}
                </Alert>
            </Snackbar>
        </>
    );
}