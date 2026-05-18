'use client'
import React, { useState, useRef, useCallback } from 'react';
import { Box, Avatar, Typography, Button } from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import PeopleIcon from '@mui/icons-material/People';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFollowMutation } from '@/hooks/use.follow';
import { useTrackContext } from '@/lib/track.wrapper';
import { generateProfileUrl } from '@/utils/generate.slug';

interface UploaderHoverCardProps {
    uploader: {
        id: string | number;
        name: string;
        avatar?: string;
        countFollowers?: number;
        location?: string;
        isFollowed?: boolean;
    };
    children: React.ReactNode; // the trigger element (name text, avatar, etc.)
    profileUrl?: string;
}

const UploaderHoverCard = ({ uploader, children, profileUrl }: UploaderHoverCardProps) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLSpanElement>(null);

    const { data: session } = useSession();
    const { followedUploaders, toggleFollowUploader } = useTrackContext() as ITrackContext;
    const mutationFollow = useFollowMutation();

    const uploaderIdStr = String(uploader.id);
    const isSelf = session && Number(session.user?.id) === Number(uploader.id);

    const followState = (followedUploaders ?? {})[uploaderIdStr];
    const isFollowed = followState !== undefined
        ? followState.isFollowed
        : (uploader.isFollowed ?? false);
    const displayFollowers = followState?.countFollowers ?? uploader.countFollowers;

    const href = profileUrl ?? generateProfileUrl(uploader.name, uploaderIdStr);

    // ── Position calculation ──────────────────────────────────────────────────
    const calcPosition = useCallback(() => {
        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();

        const cardWidth = 220;
        const cardHeight = 200;
        const margin = 10;

        // căn giữa ngang
        let left = rect.left + rect.width / 2 - cardWidth / 2;

        // clamp ngang
        left = Math.max(
            8,
            Math.min(left, window.innerWidth - cardWidth - 8)
        );

        // check trigger nằm nửa trên hay nửa dưới màn hình
        const isBottomHalf = rect.top > window.innerHeight / 2;

        let top: number;

        if (isBottomHalf) {
            // hiện phía trên
            top = rect.top - cardHeight - margin;

            // nếu phía trên không đủ chỗ -> hiện xuống dưới
            if (top < 8) {
                top = rect.bottom + margin;
            }
        } else {
            // hiện phía dưới
            top = rect.bottom + margin;

            // nếu phía dưới không đủ chỗ -> hiện lên trên
            if (top + cardHeight > window.innerHeight - 8) {
                top = rect.top - cardHeight - margin;
            }
        }

        setPos({ top, left });
    }, []);

    // ── Hover handlers ────────────────────────────────────────────────────────
    const handleMouseEnter = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        showTimer.current = setTimeout(() => {
            calcPosition();
            setOpen(true);
        }, 220); // slight delay to avoid flicker
    }, [calcPosition]);

    const handleMouseLeave = useCallback(() => {
        if (showTimer.current) clearTimeout(showTimer.current);
        hideTimer.current = setTimeout(() => setOpen(false), 180);
    }, []);

    const handleCardEnter = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
    }, []);

    const handleCardLeave = useCallback(() => {
        hideTimer.current = setTimeout(() => setOpen(false), 180);
    }, []);

    // ── Follow ────────────────────────────────────────────────────────────────
    const handleFollow = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session) return;
        mutationFollow.mutate(uploaderIdStr, {
            onSuccess: (res) => {
                const { isFollowed, countFollowers } = res.data;
                toggleFollowUploader?.(uploaderIdStr, isFollowed, countFollowers); // ← thêm countFollowers
            },
        });
    };

    return (
        <>
            {/* Trigger wrapper */}
            <span
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
            >
                {children}
            </span>

            {/* Portal-style card rendered at document level via fixed positioning */}
            {open && pos && (
                <Box
                    ref={cardRef}
                    onMouseEnter={handleCardEnter}
                    onMouseLeave={handleCardLeave}
                    sx={{
                        position: 'fixed',
                        top: pos.top,
                        left: pos.left,
                        width: 220,
                        zIndex: 99999,
                        bgcolor: '#1a1a1a',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '14px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
                        p: 2.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                        animation: 'hoverCardIn 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                        '@keyframes hoverCardIn': {
                            from: { opacity: 0, transform: 'translateY(-6px) scale(0.96)' },
                            to:   { opacity: 1, transform: 'translateY(0)    scale(1)'    },
                        },
                        // subtle noise texture overlay
                        '&::before': {
                            content: '""',
                            position: 'absolute',
                            inset: 0,
                            borderRadius: '14px',
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
                            pointerEvents: 'none',
                            opacity: 0.4,
                        },
                    }}
                >
                    {/* Avatar — clickable to profile */}
                    <Link href={href} style={{ textDecoration: 'none' }}>
                        <Avatar
                            src={uploader.avatar}
                            sx={{
                                width: 72,
                                height: 72,
                                border: '2px solid rgba(255,85,0,0.5)',
                                boxShadow: '0 0 0 3px rgba(255,85,0,0.12)',
                                transition: 'box-shadow 0.2s',
                                '&:hover': {
                                    boxShadow: '0 0 0 4px rgba(255,85,0,0.3)',
                                },
                            }}
                        >
                            {uploader.name?.charAt(0).toUpperCase()}
                        </Avatar>
                    </Link>

                    {/* Name — clickable to profile */}
                    <Link href={href} style={{ textDecoration: 'none' }}>
                        <Typography
                            sx={{
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: 15,
                                letterSpacing: '-0.2px',
                                textAlign: 'center',
                                '&:hover': { color: '#ff5500' },
                                transition: 'color 0.15s',
                            }}
                        >
                            {uploader.name}
                        </Typography>
                    </Link>

                    {/* Followers count */}
                    {displayFollowers !== undefined && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                            <PeopleIcon sx={{ fontSize: 13, color: '#888' }} />
                            <Typography sx={{ fontSize: 12, color: '#888' }}>
                                {displayFollowers.toLocaleString()}
                            </Typography>
                        </Box>
                    )}

                    {/* Location */}
                    {uploader.location && (
                        <Typography sx={{ fontSize: 12, color: '#666', textAlign: 'center' }}>
                            {uploader.location}
                        </Typography>
                    )}

                    {/* Follow button — only for others when logged in */}
                    {session && !isSelf && (
                        <Button
                            variant={isFollowed ? 'outlined' : 'contained'}
                            size="small"
                            // startIcon={
                            //     isFollowed
                            //         ? <PersonRemove sx={{ fontSize: 15 }} />
                            //         : <PersonAdd sx={{ fontSize: 15 }} />
                            // }
                            onClick={handleFollow}
                            disabled={mutationFollow.isPending}
                            fullWidth
                            sx={{
                                mt: 0.5,
                                height: 36,

                                borderRadius: '4px',
                                textTransform: 'none',

                                fontWeight: 700,
                                fontSize: 14,

                                boxShadow: 'none',

                                ...(isFollowed
                                    ? {
                                        // FOLLOWING
                                        bgcolor: '#2f2f2f',
                                        color: '#fff',

                                        border: '1px solid #3a3a3a',

                                        '&:hover': {
                                            bgcolor: '#3a3a3a',
                                            borderColor: '#4a4a4a',
                                        },

                                        '&:active': {
                                            bgcolor: '#262626',
                                        },
                                    }
                                    : {
                                        // FOLLOW
                                        bgcolor: '#f2f2f2',
                                        color: '#111',

                                        border: '1px solid #d0d0d0',

                                        '&:hover': {
                                            bgcolor: '#e8e8e8',
                                            borderColor: '#bdbdbd',
                                        },

                                        '&:active': {
                                            bgcolor: '#dedede',
                                        },
                                    }),

                                '& .MuiButton-startIcon': {
                                    marginRight: '4px',
                                },

                                '&.Mui-disabled': {
                                    opacity: 0.5,
                                },
                            }}
                        >
                            {isFollowed ? 'Following' : 'Follow'}
                        </Button>
                    )}
                </Box>
            )}
        </>
    );
};

export default UploaderHoverCard;