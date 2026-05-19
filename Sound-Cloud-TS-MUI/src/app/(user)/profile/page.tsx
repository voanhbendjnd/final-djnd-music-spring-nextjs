'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
    Box, Typography, Avatar, TextField, Button,
    CircularProgress, Snackbar, Alert, useTheme,
    useMediaQuery, Skeleton, IconButton, Tooltip,
} from '@mui/material';
import {
    CameraAlt, Edit, Check, Close,
    MailOutline, PersonOutline, CalendarToday, ArrowOutward,
} from '@mui/icons-material';
import axiosInstance from '@/utils/axios-instance';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from "next/link";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";
import {generateProfileUrl} from "@/utils/generate.slug";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ProfileData {
    id: number;
    email: string;
    name: string;
    status: string | null;
    avatar: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    role: string | null;
}

// ─── Animated grain overlay ────────────────────────────────────────────────────
const GrainOverlay = () => (
    <Box
        sx={{
            position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px',
        }}
    />
);

// ─── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.25,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 2,
            transition: 'border-color 0.2s, background-color 0.2s',
            '&:hover': { borderColor: 'rgba(255,85,0,0.3)', bgcolor: 'rgba(255,85,0,0.04)' },
        }}>
            <Box sx={{ color: '#ff5500', opacity: 0.8, display: 'flex', lineHeight: 0 }}>{icon}</Box>
            <Box>
                <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>
                    {label}
                </Typography>
                <Typography sx={{ fontSize: '0.82rem', color: '#fff', fontWeight: 600, mt: 0.25, lineHeight: 1 }}>
                    {value}
                </Typography>
            </Box>
        </Box>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const { data: session, update: updateSession } = useSession();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    // Editable fields
    const [editName, setEditName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);

    // Avatar
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    // Submit
    const [submitting, setSubmitting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    // Feedback
    const [snack, setSnack] = useState<{ open: boolean; msg: string; severity: 'success' | 'error' }>({
        open: false, msg: '', severity: 'success',
    });
    const [followStats, setFollowStats] = useState<{ following: number; followers: number } | null>(null);
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const [profileRes, followingRes, followersRes]: any = await Promise.all([
                    axiosInstance.get('/api/v1/profiles'),
                    axiosInstance.get('/api/v1/follows/followings?page=1&size=1'),
                    axiosInstance.get('/api/v1/follows/followers?page=1&size=1'),
                ]);
                const data: ProfileData = profileRes.data;
                setProfile(data);
                setEditName(data.name);
                setFollowStats({
                    following: followingRes?.data?.meta?.total ?? 0,
                    followers: followersRes?.data?.meta?.total ?? 0,
                });
            } catch (e) {
                console.error('Failed to fetch profile', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);
    // ── Fetch profile ──────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res: any = await axiosInstance.get('/api/v1/profiles');
                const data: ProfileData = res.data;
                setProfile(data);
                setEditName(data.name);
            } catch (e) {
                console.error('Failed to fetch profile', e);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    // ── Track changes ──────────────────────────────────────────────────────────
    useEffect(() => {
        if (!profile) return;
        setHasChanges(editName !== profile.name || avatarFile !== null);
    }, [editName, avatarFile, profile]);

    // ── File handling ──────────────────────────────────────────────────────────
    const handleFile = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            setSnack({ open: true, msg: 'Please upload an image file', severity: 'error' });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setSnack({ open: true, msg: 'Image must be under 5MB', severity: 'error' });
            return;
        }
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFile(e.target.files[0]);
    };

    // Drag and drop
    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    };

    // ── Submit ─────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!hasChanges || !editName.trim()) return;
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', editName.trim());

            // API requires avatar — if no new file, use a dummy (reupload existing blob)
            if (avatarFile) {
                formData.append('avatar', avatarFile);
            } else {
                // Fetch current avatar as blob to satisfy required field
                const blob = await fetch(profile!.avatar!).then(r => r.blob());
                formData.append('avatar', blob, 'avatar.jpg');
            }

            const res: any = await axiosInstance.patch('/api/v1/profiles', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const updated: ProfileData = res.data;

            // Update local state immediately — no refresh needed
            setProfile(updated);
            setEditName(updated.name);
            setAvatarFile(null);
            setAvatarPreview(null);
            setIsEditingName(false);
            const avatarUrl = `${updated.avatar}?t=${Date.now()}`;
            // Update session if available
            // await updateSession({ name: updated.name, avatar: updated.avatar });
            await updateSession({
                user: {
                    ...session?.user,
                    name: updated.name,
                    avatar: avatarUrl,
                }
            });

            setSnack({ open: true, msg: 'Profile updated!', severity: 'success' });
        } catch (e) {
            console.error('Failed to update profile', e);
            setSnack({ open: true, msg: 'Failed to update profile', severity: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDiscardChanges = () => {
        if (!profile) return;
        setEditName(profile.name);
        setAvatarFile(null);
        setAvatarPreview(null);
        setIsEditingName(false);
    };

    // ── Displayed avatar src ───────────────────────────────────────────────────
    const displayAvatar = avatarPreview || profile?.avatar || '';

    // ── Loading state ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <Box sx={{ minHeight: '100vh', bgcolor: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress sx={{ color: '#ff5500' }} />
            </Box>
        );
    }

    if (!profile) return null;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#070707', position: 'relative', overflowX: 'hidden' }}>
            <GrainOverlay />

            {/* Ambient glow — top left accent */}
            <Box sx={{
                position: 'fixed', top: -120, left: -120, width: 480, height: 480,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,85,0,0.06) 0%, transparent 70%)',
                pointerEvents: 'none', zIndex: 0,
            }} />

            <Box sx={{
                position: 'relative',
                zIndex: 1,
                maxWidth: 900,
                mx: 'auto',
                px: { xs: 2, sm: 4 },

                pt: {
                    xs: 6,
                    sm: 7,
                    md: 8,
                },

                pb: 12,
            }}>

                {/* ── Header label ───────────────────────────────────────────── */}
                <Box sx={{ mb: { xs: 4, sm: 6 }}}>
                    <Typography sx={{
                        fontSize: '0.65rem',
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        color: '#ff5500',
                        fontWeight: 700,
                        mb: 1,
                    }}>
                        Account
                    </Typography>
                    <Typography sx={{
                        fontSize: { xs: '2rem', sm: '2.8rem', md: '3.5rem' },
                        fontWeight: 900,
                        color: '#fff',
                        letterSpacing: '-0.04em',
                        lineHeight: 0.95,
                        // fontFamily: '"Bebas Neue", "Impact", sans-serif',
                    }}>
                        Your Profile
                    </Typography>
                </Box>

                {/* ── Main card ──────────────────────────────────────────────── */}
                <Box sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 4, sm: 6 },
                    alignItems: { xs: 'center', sm: 'flex-start' },
                }}>

                    {/* ── Avatar column ─────────────────────────────────────── */}
                    <Box sx={{
                        flexShrink: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}>
                        {/* Drop zone wrapper */}
                        <Box
                            ref={dropZoneRef}
                            onDragEnter={handleDragEnter}
                            onDragLeave={handleDragLeave}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            sx={{
                                position: 'relative',
                                width: { xs: 160, sm: 200 },
                                height: { xs: 160, sm: 200 },
                                borderRadius: '50%',
                                cursor: 'pointer',
                                // Ring animation when dragging
                                outline: isDragging ? '3px solid #ff5500' : '3px solid transparent',
                                outlineOffset: 4,
                                transition: 'outline-color 0.2s, transform 0.2s',
                                '&:hover .avatar-overlay': { opacity: 1 },
                                '&:hover': { transform: 'scale(1.02)' },
                            }}
                        >
                            {/* Avatar image */}
                            {displayAvatar ? (
                                <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                                    <Image
                                        src={displayAvatar}
                                        alt={profile.name}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        unoptimized
                                    />
                                </Box>
                            ) : (
                                <Avatar sx={{
                                    width: '100%', height: '100%',
                                    fontSize: { xs: '3rem', sm: '4rem' },
                                    bgcolor: '#1a1a1a',
                                    border: '2px solid #2a2a2a',
                                    color: '#ff5500',
                                    fontFamily: '"Bebas Neue", sans-serif',
                                }}>
                                    {profile.name?.charAt(0).toUpperCase()}
                                </Avatar>
                            )}

                            {/* Hover overlay */}
                            <Box
                                className="avatar-overlay"
                                sx={{
                                    position: 'absolute', inset: 0,
                                    borderRadius: '50%',
                                    bgcolor: isDragging ? 'rgba(255,85,0,0.35)' : 'rgba(0,0,0,0.55)',
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                    gap: 0.75,
                                    opacity: isDragging ? 1 : 0,
                                    transition: 'opacity 0.2s, background-color 0.2s',
                                    backdropFilter: 'blur(2px)',
                                }}
                            >
                                <CameraAlt sx={{ color: '#fff', fontSize: { xs: 28, sm: 32 } }} />
                                <Typography sx={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700, textAlign: 'center', px: 2, letterSpacing: '0.05em' }}>
                                    {isDragging ? 'Drop here' : 'Change photo'}
                                </Typography>
                            </Box>

                            {/* New badge */}
                            {avatarPreview && (
                                <Box sx={{
                                    position: 'absolute', bottom: 6, right: 6,
                                    bgcolor: '#ff5500', borderRadius: '50%',
                                    width: 28, height: 28,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid #070707',
                                    animation: 'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                    '@keyframes badgePop': {
                                        '0%': { transform: 'scale(0)' },
                                        '100%': { transform: 'scale(1)' },
                                    },
                                }}>
                                    <Check sx={{ fontSize: 14, color: '#fff' }} />
                                </Box>
                            )}
                        </Box>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileInput}
                        />

                        <Typography sx={{
                            fontSize: '0.65rem',
                            color: 'rgba(255,255,255,0.25)',
                            letterSpacing: '0.06em',
                            textAlign: 'center',
                            lineHeight: 1.4,
                        }}>
                            Click or drag to<br />change avatar
                        </Typography>
                    </Box>

                    {/* ── Info column ───────────────────────────────────────── */}
                    <Box sx={{ flex: 1, minWidth: 0, width: '100%' }}>

                        {/* Name field */}
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{
                                fontSize: '0.6rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.35)',
                                mb: 1.5,
                                fontWeight: 600,
                            }}>
                                Display Name
                            </Typography>

                            {isEditingName ? (
                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                    <TextField
                                        value={editName}
                                        onChange={e => setEditName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Escape') { setEditName(profile.name); setIsEditingName(false); } }}
                                        autoFocus
                                        fullWidth
                                        variant="standard"
                                        inputProps={{ maxLength: 50 }}
                                        sx={{
                                            '& .MuiInputBase-input': {
                                                color: '#fff',
                                                fontSize: { xs: '1.6rem', sm: '2rem' },
                                                fontWeight: 800,
                                                letterSpacing: '-0.03em',
                                                fontFamily: 'sans-serif',
                                                pb: 0.5,
                                            },
                                            '& .MuiInput-underline:before': { borderBottomColor: '#2a2a2a' },
                                            '& .MuiInput-underline:after': { borderBottomColor: '#ff5500' },
                                        }}
                                    />
                                    <Tooltip title="Done">
                                        <IconButton size="small" onClick={() => setIsEditingName(false)}
                                                    sx={{ color: '#4caf50', '&:hover': { bgcolor: 'rgba(76,175,80,0.1)' } }}>
                                            <Check fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Cancel">
                                        <IconButton size="small"
                                                    onClick={() => { setEditName(profile.name); setIsEditingName(false); }}
                                                    sx={{ color: '#666', '&:hover': { color: '#f44336', bgcolor: 'rgba(244,67,54,0.08)' } }}>
                                            <Close fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            ) : (
                                <Box
                                    onClick={() => setIsEditingName(true)}
                                    sx={{
                                        display: 'inline-flex', alignItems: 'center', gap: 1.5,
                                        cursor: 'text',
                                        '&:hover .edit-icon': { opacity: 1 },
                                        '&:hover': { '& .name-text': { color: 'rgba(255,255,255,0.85)' } },
                                    }}
                                >
                                    <Typography className="name-text" sx={{
                                        fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
                                        fontWeight: 900,
                                        color: '#fff',
                                        letterSpacing: '-0.04em',
                                        lineHeight: 1,
                                        fontFamily: 'sans-serif',
                                        transition: 'color 0.15s',
                                    }}>
                                        {editName || profile.name}
                                    </Typography>
                                    <Edit className="edit-icon" sx={{
                                        fontSize: 16,
                                        color: '#ff5500',
                                        opacity: 0,
                                        transition: 'opacity 0.15s',
                                        mt: 0.5,
                                    }} />
                                </Box>
                            )}
                        </Box>

                        {/* Stats pills */}
                        <Box sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 1.5,
                            mb: 4,
                        }}>
                            <StatPill
                                icon={<MailOutline sx={{ fontSize: 15 }} />}
                                label="Email"
                                value={profile.email}
                            />
                            {/*<StatPill*/}
                            {/*    icon={<PersonOutline sx={{ fontSize: 15 }} />}*/}
                            {/*    label="Role"*/}
                            {/*    value={profile.role || 'User'}*/}
                            {/*/>*/}
                            {profile.status && (
                                <StatPill
                                    icon={<PersonOutline sx={{ fontSize: 15 }} />}
                                    label="Status"
                                    value={profile.status}
                                />
                            )}
                        </Box>
                        {/* ── Follow stats ──────────────────────────────────────────── */}
                        <Box sx={{ mb: 4 }}>
                            <Typography sx={{
                                fontSize: '0.6rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: 'rgba(255,255,255,0.35)',
                                mb: 1.5,
                                fontWeight: 600,
                            }}>
                                Community
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                {/* Following card */}
                                <Link href="/you/follow" style={{ textDecoration: 'none', flex: '1 1 140px', minWidth: 130 }}>
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            borderColor: 'rgba(255,85,0,0.35)',
                                            bgcolor: 'rgba(255,85,0,0.05)',
                                            transform: 'translateY(-2px)',
                                            '& .follow-arrow': { opacity: 1, transform: 'translateX(0)' },
                                        },
                                    }}>
                                        <Typography sx={{
                                            fontSize: { xs: '0.7rem', sm: '0.7rem' },
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: 1,
                                            letterSpacing: '-0.04em',
                                            fontFamily: '"Bebas Neue", "Impact", sans-serif',
                                        }}>
                                            {followStats?.following?.toLocaleString() ?? '—'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{
                                                fontSize: '0.7rem',
                                                color: 'rgba(255,255,255,0.35)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontWeight: 600,
                                            }}>
                                                Following
                                            </Typography>
                                            <ArrowOutward
                                                className="follow-arrow"
                                                sx={{
                                                    fontSize: 13,
                                                    color: '#ff5500',
                                                    opacity: 0,
                                                    transform: 'translateX(-4px)',
                                                    transition: 'all 0.2s',
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Link>

                                {/* Followers card */}
                                <Link href="/you/follow" style={{ textDecoration: 'none', flex: '1 1 140px', minWidth: 130 }}>
                                    <Box sx={{
                                        p: 2,
                                        bgcolor: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.07)',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            borderColor: 'rgba(255,85,0,0.35)',
                                            bgcolor: 'rgba(255,85,0,0.05)',
                                            transform: 'translateY(-2px)',
                                            '& .follow-arrow': { opacity: 1, transform: 'translateX(0)' },
                                        },
                                    }}>
                                        <Typography sx={{
                                            fontSize: { xs: '0.7rem', sm: '0.7rem' },
                                            fontWeight: 900,
                                            color: '#fff',
                                            lineHeight: 1,
                                            letterSpacing: '-0.04em',
                                            fontFamily: '"Bebas Neue", "Impact", sans-serif',
                                        }}>
                                            {followStats?.followers?.toLocaleString() ?? '—'}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 0.5 }}>
                                            <Typography sx={{
                                                fontSize: '0.7rem',
                                                color: 'rgba(255,255,255,0.35)',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.1em',
                                                fontWeight: 600,
                                            }}>
                                                Followers
                                            </Typography>
                                            <ArrowOutward
                                                className="follow-arrow"
                                                sx={{
                                                    fontSize: 13,
                                                    color: '#ff5500',
                                                    opacity: 0,
                                                    transform: 'translateX(-4px)',
                                                    transition: 'all 0.2s',
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Link>

                                {/* View all button */}
                                <Link href="/you/follow" style={{ textDecoration: 'none', flex: '0 0 auto', alignSelf: 'stretch' }}>
                                    <Box sx={{
                                        height: '100%',
                                        minHeight: 50,
                                        px: 2,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 0.5,
                                        bgcolor: 'rgba(255,85,0,0.06)',
                                        border: '1px solid rgba(255,85,0,0.2)',
                                        borderRadius: 2,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            bgcolor: 'rgba(255,85,0,0.12)',
                                            borderColor: 'rgba(255,85,0,0.4)',
                                            transform: 'translateY(-2px)',
                                        },
                                    }}>
                                        <ArrowOutward sx={{ fontSize: 18, color: '#ff5500' }} />
                                        <Typography sx={{
                                            fontSize: '0.65rem',
                                            color: '#ff5500',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.08em',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            View all
                                        </Typography>
                                    </Box>
                                </Link>
                            </Box>
                        </Box>
                        {/* ── Action bar ─────────────────────────────────────── */}
                        {hasChanges && (
                            <Box
                                sx={{
                                    display: 'flex', gap: 1.5, alignItems: 'center',
                                    p: 2,
                                    bgcolor: 'rgba(255,85,0,0.06)',
                                    border: '1px solid rgba(255,85,0,0.2)',
                                    borderRadius: 2,
                                    animation: 'slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                                    '@keyframes slideUp': {
                                        '0%': { opacity: 0, transform: 'translateY(8px)' },
                                        '100%': { opacity: 1, transform: 'translateY(0)' },
                                    },
                                }}
                            >
                                <Box sx={{
                                    width: 6, height: 6, borderRadius: '50%',
                                    bgcolor: '#ff5500',
                                    boxShadow: '0 0 6px #ff5500',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                    '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
                                    flexShrink: 0,
                                }} />
                                <Typography sx={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', flexGrow: 1 }}>
                                    You have unsaved changes
                                </Typography>

                                <Button
                                    size="small"
                                    onClick={handleDiscardChanges}
                                    sx={{
                                        color: 'rgba(255,255,255,0.35)',
                                        textTransform: 'none',
                                        fontSize: '0.78rem',
                                        borderRadius: 1.5,
                                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.05)' },
                                    }}
                                >
                                    Discard
                                </Button>

                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handleSubmit}
                                    disabled={submitting || !editName.trim()}
                                    disableElevation
                                    sx={{
                                        bgcolor: '#ff5500',
                                        color: '#fff',
                                        textTransform: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.82rem',
                                        borderRadius: 1.5,
                                        px: 2,
                                        transition: 'background-color 0.15s, transform 0.15s',
                                        '&:hover': { bgcolor: '#e64d00', transform: 'translateY(-1px)' },
                                        '&:active': { transform: 'translateY(0)' },
                                        '&.Mui-disabled': { bgcolor: '#2a2a2a', color: '#555' },
                                    }}
                                >
                                    {submitting ? <CircularProgress size={14} sx={{ color: '#888' }} /> : 'Save changes'}
                                </Button>
                            </Box>
                        )}

                        {/* Email readonly notice */}

                        <Box sx={{
                            mt: hasChanges ? 2 : 0,
                            display: 'flex', alignItems: 'center', gap: 1,
                        }}>
                            <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.15)' }} />
                            <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
                                Email address cannot be changed
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                {/* ── Decorative bottom rule ─────────────────────────────────── */}
                <Box sx={{
                    mt: 8,
                    height: 1,
                    background: 'linear-gradient(90deg, #ff5500 0%, rgba(255,85,0,0.3) 30%, transparent 70%)',
                }} />
                {/* ── My Tracks Section ───────────────────────────────────── */}
                <Box sx={{ mt: 6 }}>
                    <Typography sx={{
                        fontSize: '0.7rem',
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.3)',
                        mb: 2,
                        fontWeight: 700,
                    }}>
                        Music
                    </Typography>
                    {session ?
                        <Link href={generateProfileUrl(session?.user.name, session.user.id)} style={{ textDecoration: 'none' }}>
                            <Box sx={{
                                position: 'relative',
                                overflow: 'hidden',
                                p: { xs: 2.5, sm: 3 },
                                borderRadius: 3,
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: `
                linear-gradient(
                    135deg,
                    rgba(255,85,0,0.12),
                    rgba(255,85,0,0.03)
                )
            `,
                                transition: 'all 0.25s ease',
                                cursor: 'pointer',

                                '&:hover': {
                                    borderColor: 'rgba(255,85,0,0.35)',
                                    transform: 'translateY(-2px)',
                                    background: `
                    linear-gradient(
                        135deg,
                        rgba(255,85,0,0.18),
                        rgba(255,85,0,0.05)
                    )
                `,
                                    '& .track-arrow': {
                                        transform: 'translateX(4px)',
                                    }
                                }
                            }}>
                                {/* Glow */}
                                <Box sx={{
                                    position: 'absolute',
                                    top: -40,
                                    right: -40,
                                    width: 140,
                                    height: 140,
                                    borderRadius: '50%',
                                    background: 'radial-gradient(circle, rgba(255,85,0,0.18), transparent 70%)',
                                    pointerEvents: 'none',
                                }} />

                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 2,
                                    position: 'relative',
                                    zIndex: 1,
                                }}>
                                    <Box sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                    }}>
                                        <Box sx={{
                                            width: 56,
                                            height: 56,
                                            borderRadius: 2,
                                            bgcolor: 'rgba(255,85,0,0.12)',
                                            border: '1px solid rgba(255,85,0,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <LibraryMusicIcon sx={{
                                                color: '#ff5500',
                                                fontSize: 28,
                                            }} />
                                        </Box>

                                        <Box>
                                            <Typography sx={{
                                                color: '#fff',
                                                fontWeight: 800,
                                                fontSize: {
                                                    xs: '1rem',
                                                    sm: '1.15rem'
                                                },
                                                letterSpacing: '-0.02em',
                                                mb: 0.5,
                                            }}>
                                                My Tracks
                                            </Typography>

                                            <Typography sx={{
                                                color: 'rgba(255,255,255,0.45)',
                                                fontSize: '0.82rem',
                                                lineHeight: 1.5,
                                            }}>
                                                Manage uploaded tracks, edits and music library
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <ArrowOutward
                                        className="track-arrow"
                                        sx={{
                                            color: '#ff5500',
                                            transition: 'transform 0.2s ease',
                                            flexShrink: 0,
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Link>
                        : null
                    }
                </Box>
            </Box>

            {/* ── Snackbar feedback ──────────────────────────────────────────── */}
            <Snackbar
                open={snack.open}
                autoHideDuration={3500}
                onClose={() => setSnack(s => ({ ...s, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setSnack(s => ({ ...s, open: false }))}
                    severity={snack.severity}
                    variant="filled"
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
        </Box>
    );
}