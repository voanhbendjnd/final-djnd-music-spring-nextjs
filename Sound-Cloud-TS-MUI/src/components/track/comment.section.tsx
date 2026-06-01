'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, TextField, Avatar, Typography, Divider, IconButton, Button, Tooltip } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSession } from "next-auth/react";
import { useTrackContext } from "@/lib/track.wrapper";
import { SendSharp } from "@mui/icons-material";
import { useCreateComment, useFetchCommentsAxios } from "@/hooks/use.comment";
import Link from "next/link";
import { generateProfileUrl } from "@/utils/generate.slug";
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { PersonRemove } from "@mui/icons-material";
import { useFollowMutation } from "@/hooks/use.follow";
import UploaderHoverCard from "@/components/profile/uploader.hover.card";
import axiosInstance from "@/utils/axios-instance";

dayjs.extend(relativeTime);

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ICommentLikeState {
    isLiked: boolean;
    countLikes: number;
    pending: boolean;
}

interface IProps {
    comments: IComment[];
    trackId: string | null;
    trackProp: ITrack;
    onInputFocus?: (momentAtFocus: number) => void;
    onInputBlur?: () => void;
    onCommentPosted?: () => void;
}

// ─── Like button ───────────────────────────────────────────────────────────────

function CommentLikeButton({
                               commentId,
                               initialIsLiked,
                               initialCount,
                               disabled,
                           }: {
    commentId: number | string;
    initialIsLiked: boolean;
    initialCount: number;
    disabled: boolean;
}) {
    const [state, setState] = useState<ICommentLikeState>({
        isLiked: initialIsLiked,
        countLikes: initialCount,
        pending: false,
    });

    // Sync if props change (e.g. optimistic comment replaced by real one)
    useEffect(() => {
        setState(prev => ({
            ...prev,
            isLiked: initialIsLiked,
            countLikes: initialCount,
        }));
    }, [commentId, initialIsLiked, initialCount]);

    const handleLike = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (state.pending || disabled) return;

        // Optimistic update
        setState(prev => ({
            isLiked: !prev.isLiked,
            countLikes: prev.isLiked ? Math.max(0, prev.countLikes - 1) : prev.countLikes + 1,
            pending: true,
        }));

        try {
            const res = await axiosInstance.post<{ isLiked: boolean; countLikes: number }>(
                `/api/v1/comments/${commentId}/like`
            );
            // Use exact values from backend
            setState({
                isLiked: res.data.isLiked,
                countLikes: res.data.countLikes,
                pending: false,
            });
        } catch {
            // Rollback on error
            setState(prev => ({
                isLiked: !prev.isLiked,
                countLikes: prev.isLiked ? Math.max(0, prev.countLikes - 1) : prev.countLikes + 1,
                pending: false,
            }));
        }
    }, [commentId, state.pending, disabled]);

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.3,
                ml: 'auto',
                flexShrink: 0,
            }}
        >
            <Tooltip
                title={disabled ? 'Sign in to like' : state.isLiked ? 'Unlike' : 'Like'}
                placement="top"
                arrow
            >
                <span>
                    <IconButton
                        size="small"
                        onClick={handleLike}
                        disabled={state.pending || disabled}
                        disableRipple
                        sx={{
                            p: 0.4,
                            color: state.isLiked ? '#f50' : 'rgba(255,255,255,0.25)',
                            transition: 'color 0.15s ease, transform 0.15s ease',
                            '&:hover': {
                                color: state.isLiked ? '#ff7733' : 'rgba(255,255,255,0.6)',
                                bgcolor: 'transparent',
                                transform: 'scale(1.15)',
                            },
                            '&:active': { transform: 'scale(0.9)' },
                            '&.Mui-disabled': { opacity: 0.3 },
                        }}
                    >
                        {state.isLiked
                            ? <FavoriteIcon sx={{ fontSize: 13 }} />
                            : <FavoriteBorderIcon sx={{ fontSize: 13 }} />
                        }
                    </IconButton>
                </span>
            </Tooltip>

            {state.countLikes > 0 && (
                <Typography sx={{
                    fontSize: '0.68rem',
                    color: state.isLiked ? '#f50' : 'rgba(255,255,255,0.3)',
                    fontWeight: 600,
                    lineHeight: 1,
                    minWidth: 10,
                    transition: 'color 0.15s',
                    userSelect: 'none',


                }}>
                    {state.countLikes}
                </Typography>
            )}
        </Box>
    );
}

// ─── Main ──────────────────────────────────────────────────────────────────────

const CommentSection = (props: IProps) => {
    const { comments, trackId, trackProp, onCommentPosted, onInputBlur, onInputFocus } = props;
    const momentAtFocusRef = useRef<number>(0);

    const [currentPage, setCurrentPage] = useState(1);
    const [allComments, setAllComments] = useState<IComment[]>(comments);
    const [hasMore, setHasMore] = useState(comments.length >= 10);

    // Sync khi comments prop thay đổi (e.g. parent re-fetch với isLiked mới)
    useEffect(() => {
        setAllComments(comments);
        setHasMore(comments.length >= 10);
        setCurrentPage(1);
    }, [trackId]);
    const observerRef = useRef<HTMLDivElement | null>(null);
    const userId = trackProp.uploader.id;

    const commentParams = {
        current: currentPage,
        pageSize: 10,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };

    const { data: resComments, isFetching } = useFetchCommentsAxios(commentParams, {
        enabled: hasMore,
    });
    const [newComment, setNewComment] = useState("");
    const { data: session } = useSession();
    const { currentTrack, audioRef, savedTimes, followedUploaders, toggleFollowUploader } = useTrackContext() as ITrackContext;
    const createCommentMutation = useCreateComment(commentParams);
    const mutationFollow = useFollowMutation();

    const uploaderIdStr = String(userId);
    const followState = (followedUploaders ?? {})[uploaderIdStr];
    const isFollowed = followState !== undefined
        ? followState.isFollowed
        : (trackProp.uploader?.isFollowed ?? false);

    const isSelf = session && Number(session.user?.id) === Number(userId);

    const handleFollowClick = () => {
        if (!session) return;
        mutationFollow.mutate(uploaderIdStr, {
            onSuccess: (res) => {
                const { isFollowed, countFollowers } = res.data;
                toggleFollowUploader?.(uploaderIdStr, isFollowed, countFollowers);
            },
        });
    };

    useEffect(() => {
        if (!resComments) return;
        const { result: newComments, meta } = resComments;
        if (meta) {
            setHasMore(newComments.length > 0 && meta.page < meta.pages);
        }
        if (newComments.length > 0) {
            setAllComments(prev => {
                // Update existing comments (isLiked/countLikes có thể thay đổi)
                // và append những comment mới chưa có trong list
                const existingIds = new Set(prev.map(c => c.id));
                const newMap = new Map(newComments.map(c => [c.id, c]));
                const updated = prev.map(c => newMap.has(c.id) ? newMap.get(c.id)! : c);
                const appended = newComments.filter(c => !existingIds.has(c.id));
                return [...updated, ...appended];
            });
        }
    }, [resComments]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetching) {
                    setCurrentPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );
        if (observerRef.current) observer.observe(observerRef.current);
        return () => observer.disconnect();
    }, [hasMore, isFetching]);

    const handlePostComment = () => {
        const currentMoment = momentAtFocusRef.current;
        if (!newComment.trim()) return;

        const optimisticComment: IComment = {
            id: Date.now(),
            content: newComment,
            moment: currentMoment,
            createdAt: new Date().toISOString(),
            countLikes: 0,
            isLiked: false,
            user: {
                id: session?.user?.id,
                name: session?.user?.name || "You",
                email: session?.user?.email || "",
                avatar: session?.user?.avatar || null,
            },
            track: { id: Number(trackId) }
        } as any;

        setAllComments(prev => [optimisticComment, ...prev]);

        createCommentMutation.mutate(
            { track_id: Number(trackId), content: newComment, moment: currentMoment },
            {
                onSuccess: () => { onCommentPosted?.(); },
                onError: () => {
                    setAllComments(prev => prev.filter(c => c.id !== optimisticComment.id));
                }
            }
        );
        setNewComment("");
        onInputBlur?.();
    };

    const handleJumpToMoment = (moment: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = moment;
            audioRef.current.play().catch(() => {});
            const fileName = new URLSearchParams(window.location.search).get('audio');
            if (fileName) savedTimes.current[fileName] = moment;
        }
    };

    const formatMoment = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Box sx={{ mt: 3, mb: 5, px: { xs: 1, md: 2 }, maxWidth: 1200, mx: 'auto', marginBottom: 30 }}>

            {/* ── INPUT ──────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {session && (
                    <>
                        <UploaderHoverCard uploader={session.user}>
                            <Link href={generateProfileUrl(session.user?.name, session.user.id)} style={{ textDecoration: 'none' }}>
                                <Avatar src={session.user?.avatar} sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}>
                                    {session.user?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                            </Link>
                        </UploaderHoverCard>

                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Write a comment"
                            size="small"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onFocus={() => {
                                const moment = audioRef.current ? Math.round(audioRef.current.currentTime) : 0;
                                momentAtFocusRef.current = moment;
                                onInputFocus?.(moment);
                            }}
                            onBlur={() => {
                                setTimeout(() => { if (!newComment.trim()) onInputBlur?.(); }, 200);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handlePostComment(); }
                            }}
                            sx={{
                                background: '#303030',
                                '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                                '& .MuiInputBase-input': { color: '#fff', fontSize: { xs: 13, md: 14 } },
                            }}
                        />

                        <IconButton onClick={handlePostComment} sx={{ background: '#303030', p: { xs: 1, md: 1.5 } }}>
                            <SendSharp sx={{ color: '#f50' }} />
                        </IconButton>
                    </>
                )}
            </Box>

            <Divider sx={{ my: 3, borderColor: '#333' }} />

            {/* ── MAIN ────────────────────────────────────────────────────── */}
            <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 }, flexDirection: { xs: 'column', md: 'row' } }}>

                {/* UPLOADER sidebar */}
                <Box sx={{
                    width: { xs: '100%', md: 120 },
                    flexShrink: 0,
                    textAlign: { xs: 'left', md: 'center' },
                    display: 'flex',
                    flexDirection: { xs: 'row', md: 'column' },
                    alignItems: 'center',
                    gap: { xs: 2, md: 1 },
                }}>
                    <UploaderHoverCard uploader={trackProp.uploader}>
                        <Link href={generateProfileUrl(trackProp.uploader.name, userId)} style={{ textDecoration: 'none' }}>
                            <Avatar src={trackProp.uploader.avatar} sx={{ width: { xs: 50, md: 100 }, height: { xs: 50, md: 100 } }}>
                                {trackProp.uploader.name.charAt(0).toUpperCase()}
                            </Avatar>
                        </Link>
                    </UploaderHoverCard>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'center' }, gap: 0.5 }}>
                        <UploaderHoverCard uploader={trackProp.uploader}>
                            <Link href={generateProfileUrl(trackProp.uploader.name, userId)} style={{ textDecoration: 'none' }}>
                                <Typography sx={{
                                    color: '#fff', fontSize: { xs: 14, md: 15 }, fontWeight: 500,
                                    '&:hover': { color: '#f50' }, transition: 'color 0.2s',
                                }}>
                                    {trackProp.uploader.name}
                                </Typography>
                            </Link>
                        </UploaderHoverCard>

                        <Typography sx={{ fontSize: 12, color: '#888' }}>
                            {(followedUploaders?.[uploaderIdStr]?.countFollowers
                                ?? trackProp.uploader?.countFollowers ?? 0
                            ).toLocaleString()} followers
                        </Typography>

                        {session && !isSelf && (
                            <Button
                                size="small"
                                variant={isFollowed ? "outlined" : "contained"}
                                startIcon={isFollowed ? <PersonRemove sx={{ fontSize: 14 }} /> : <PersonAddIcon sx={{ fontSize: 14 }} />}
                                onClick={handleFollowClick}
                                disabled={mutationFollow.isPending}
                                sx={{
                                    height: 30, fontSize: 12, fontWeight: 700,
                                    px: 1.4, py: 0.2, minWidth: 0,
                                    borderRadius: '4px', textTransform: 'none', boxShadow: 'none',
                                    transition: 'all 0.15s ease',
                                    ...(isFollowed
                                            ? { bgcolor: '#2f2f2f', color: '#fff', border: '1px solid #3a3a3a', '&:hover': { bgcolor: '#3a3a3a' } }
                                            : { bgcolor: '#f2f2f2', color: '#111', border: '1px solid #d0d0d0', '&:hover': { bgcolor: '#e8e8e8' } }
                                    ),
                                    '& .MuiButton-startIcon': { marginRight: '4px', '& svg': { fontSize: 14 } },
                                    '&.Mui-disabled': { opacity: 0.5 },
                                }}
                            >
                                {isFollowed ? 'Following' : 'Follow'}
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* COMMENTS list */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                        mb: 2, display: 'flex', alignItems: 'center', gap: 1,
                        borderBottom: '1px solid #333', pb: 1,
                        fontSize: { xs: 13, md: 14 }, color: '#fff',
                    }}>
                        <ChatBubbleOutlineIcon fontSize="small" />
                        {allComments.length} comments
                    </Typography>

                    {allComments.map((comment) => (
                        <Box
                            key={comment.id}
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                mb: 2,
                                borderRadius: 1.5,
                                px: 0.5,
                                py: 0.5,
                                transition: 'background 0.15s',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.025)' },
                                '&:hover .comment-like-btn': { opacity: 1 },
                            }}
                        >
                            <UploaderHoverCard uploader={comment.user}>
                                <Avatar src={comment.user?.avatar || undefined} sx={{ width: 32, height: 32, flexShrink: 0 }}>
                                    {comment.user?.name?.charAt(0).toUpperCase()}
                                </Avatar>
                            </UploaderHoverCard>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {/* Name + timestamp + like btn row */}
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: 1,
                                }}>
                                    {/* Left: name + moment + date */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            alignItems: 'center',
                                            gap: 0.5,
                                        }}>
                                            <Link
                                                href={generateProfileUrl(comment.user.name, String(comment.user.id))}
                                                style={{ textDecoration: 'none', color: 'white' }}
                                            >
                                                <Typography component="span" sx={{
                                                    fontWeight: 700, fontSize: 13, color: '#fff',
                                                    '&:hover': { color: '#f50' }, transition: 'color 0.15s',
                                                }}>
                                                    {comment.user.id === Number(session?.user?.id) ? 'You' : comment.user.name}
                                                </Typography>
                                            </Link>

                                            <Typography component="span" sx={{ fontSize: 12, color: '#555' }}>at</Typography>

                                            <Tooltip title={`Jump to ${formatMoment(comment.moment)}`} placement="top" arrow>
                                                <Typography
                                                    component="span"
                                                    onClick={() => handleJumpToMoment(comment.moment)}
                                                    sx={{
                                                        fontSize: 12, color: '#bdbdbd',
                                                        cursor: 'pointer', px: 0.75, py: 0.15,
                                                        borderRadius: '4px',
                                                        transition: 'all 0.15s',
                                                        '&:hover': { color: '#fff', bgcolor: 'rgba(255,255,255,0.08)' },
                                                        '&:active': { transform: 'scale(0.95)' },
                                                    }}
                                                >
                                                    {formatMoment(comment.moment)}
                                                </Typography>
                                            </Tooltip>

                                            <Typography component="span" sx={{ fontSize: 11, color: '#555' }}>
                                                · {dayjs(comment.createdAt).fromNow()}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Right: like button */}
                                    <Box
                                        className="comment-like-btn"
                                        sx={{
                                            opacity: 1,
                                            transition: 'opacity 0.15s',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <CommentLikeButton
                                            commentId={comment.id}
                                            initialIsLiked={comment.isLiked ?? false}
                                            initialCount={comment.countLikes ?? 0}
                                            disabled={!session}
                                        />
                                    </Box>
                                </Box>

                                {/* Comment content */}
                                <Typography sx={{
                                    mt: 0.4, color: '#ddd', fontSize: 14,
                                    wordBreak: 'break-word', lineHeight: 1.5,
                                }}>
                                    {comment.content}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    {/* Infinite scroll trigger */}
                    <div ref={observerRef} />

                    {isFetching && (
                        <Box sx={{ textAlign: 'center', py: 2, color: '#666', fontSize: 13 }}>
                            Loading more...
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CommentSection;