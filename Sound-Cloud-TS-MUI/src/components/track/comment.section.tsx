'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Avatar, Typography, Divider, IconButton, Button } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
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

dayjs.extend(relativeTime);

interface IProps {
    comments: IComment[];
    trackId: string | null;
    trackProp: ITrack;
    onInputFocus?: (momentAtFocus: number) => void;
    onInputBlur?: () => void;
    onCommentPosted?: () => void;
}

const CommentSection = (props: IProps) => {
    const { comments, trackId, trackProp, onCommentPosted, onInputBlur, onInputFocus } = props;
    const momentAtFocusRef = useRef<number>(0);

    const [currentPage, setCurrentPage] = useState(1);
    const [allComments, setAllComments] = useState<IComment[]>(comments);
    const [hasMore, setHasMore] = useState(comments.length >= 10);
    const observerRef = useRef<HTMLDivElement | null>(null);
    const userId = trackProp.uploader.id;

    const commentParams = {
        current: currentPage,
        pageSize: 10,
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };
    const { data: resComments, isLoading, isFetching } = useFetchCommentsAxios(commentParams, {
        enabled: hasMore,
    });
    const [newComment, setNewComment] = useState("");
    const { data: session } = useSession();
    const { currentTrack, audioRef, savedTimes, followedUploaders, toggleFollowUploader } = useTrackContext() as ITrackContext;
    const createCommentMutation = useCreateComment(commentParams);
    const mutationFollow = useFollowMutation();

    // Follow state: ưu tiên map trong context, fallback về data từ trackProp
    const uploaderIdStr = String(userId);
    const followState = (followedUploaders ?? {})[uploaderIdStr];
    const isFollowed = followState !== undefined
        ? followState.isFollowed
        : (trackProp.uploader?.isFollowed ?? false);

    // Ẩn nút follow nếu là chính mình
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

    // Update allComments when new data is fetched
    useEffect(() => {
        if (resComments) {
            const { result: newComments, meta } = resComments;

            if (meta) {
                if (newComments.length === 0 || meta.page >= meta.pages) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }

            if (newComments.length > 0) {
                setAllComments(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const filtered = newComments.filter(c => !existingIds.has(c.id));
                    return [...prev, ...filtered];
                });
            }
        }
    }, [resComments]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isFetching) {
                    setCurrentPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

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
            {
                track_id: Number(trackId),
                content: newComment,
                moment: currentMoment,
            },
            {
                onSuccess: () => {
                    onCommentPosted?.();
                },
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
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));
            const fileName = new URLSearchParams(window.location.search).get('audio');
            if (fileName) {
                savedTimes.current[fileName] = moment;
            }
        }
    };

    const formatMoment = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <Box
            sx={{
                mt: 3,
                mb: 5,
                px: { xs: 1, md: 2 },
                maxWidth: 1200,
                mx: 'auto',
                marginBottom: 30
            }}
        >
            {/* INPUT */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                {session && (
                    <>
                    <UploaderHoverCard uploader={session.user}>
                        <Link
                            href={generateProfileUrl(session.user?.name, session.user.id)}
                            style={{ textDecoration: 'none' }}
                        >
                            <Avatar
                                src={session.user?.avatar}
                                sx={{ width: { xs: 32, md: 40 }, height: { xs: 32, md: 40 } }}
                            >
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
                                const moment = audioRef.current
                                    ? Math.round(audioRef.current.currentTime)
                                    : 0;
                                momentAtFocusRef.current = moment;
                                onInputFocus?.(moment);
                            }}
                            onBlur={() => {
                                setTimeout(() => {
                                    if (!newComment.trim()) {
                                        onInputBlur?.();
                                    }
                                }, 200);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostComment();
                                }
                            }}
                            sx={{
                                background: '#303030',
                                '& .MuiOutlinedInput-root': { borderRadius: '6px' },
                                '& .MuiInputBase-input': {
                                    color: '#fff',
                                    fontSize: { xs: 13, md: 14 },
                                },
                            }}
                        />

                        <IconButton
                            onClick={handlePostComment}
                            sx={{ background: '#303030', p: { xs: 1, md: 1.5 } }}
                        >
                            <SendSharp sx={{ color: session ? '#f50' : '#7e7e7e' }} />
                        </IconButton>
                    </>
                )}
            </Box>

            <Divider sx={{ my: 3, borderColor: '#333' }} />

            {/* MAIN */}
            <Box
                sx={{
                    display: 'flex',
                    gap: { xs: 2, md: 4 },
                    flexDirection: { xs: 'column', md: 'row' },
                }}
            >
                {/* UPLOADER */}
                <Box
                    sx={{
                        width: { xs: '100%', md: 120 },
                        flexShrink: 0,
                        textAlign: { xs: 'left', md: 'center' },
                        display: 'flex',
                        flexDirection: { xs: 'row', md: 'column' },
                        alignItems: 'center',
                        gap: { xs: 2, md: 1 },
                    }}
                >
                    <UploaderHoverCard uploader={trackProp.uploader}>
                        <Link
                            href={generateProfileUrl(trackProp.uploader.name, userId)}
                            style={{ textDecoration: 'none' }}
                        >
                            <Avatar
                                src={trackProp.uploader.avatar}
                                sx={{
                                    width: { xs: 50, md: 100 },
                                    height: { xs: 50, md: 100 },
                                }}
                            >
                                {trackProp.uploader.name.charAt(0).toUpperCase()}
                            </Avatar>
                        </Link>
                    </UploaderHoverCard>


                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', md: 'center' }, gap: 0.5 }}>
                        <UploaderHoverCard uploader={trackProp.uploader}>
                            <Link
                                href={generateProfileUrl(trackProp.uploader.name, userId)}
                                style={{ textDecoration: 'none' }}
                            >
                                <Typography
                                    sx={{
                                        color: '#fff',
                                        fontSize: { xs: 14, md: 15 },
                                        fontWeight: 500,
                                        '&:hover': { color: '#f50' },
                                        transition: 'color 0.2s',
                                    }}
                                >
                                    {trackProp.uploader.name}
                                </Typography>
                            </Link>
                        </UploaderHoverCard>
                        <Typography sx={{ fontSize: 12, color: '#888' }}>
                            {(followedUploaders?.[uploaderIdStr]?.countFollowers
                                ?? trackProp.uploader?.countFollowers
                                ?? 0
                            ).toLocaleString()} followers
                        </Typography>


                        {/* Follow button — ẩn nếu là chính mình */}
                        {session && !isSelf && (
                            <Button
                                size="small"
                                variant={isFollowed ? "outlined" : "contained"}
                                startIcon={isFollowed ? <PersonRemove sx={{ fontSize: 14 }} /> : <PersonAddIcon sx={{ fontSize: 14 }} />}
                                onClick={handleFollowClick}
                                disabled={mutationFollow.isPending}
                                sx={{
                                    height: 30,

                                    fontSize: 12,
                                    fontWeight: 700,

                                    px: 1.4,
                                    py: 0.2,

                                    minWidth: 0,

                                    borderRadius: '4px',

                                    textTransform: 'none',

                                    boxShadow: 'none',

                                    transition: 'all 0.15s ease',

                                    ...(isFollowed
                                        ? {
                                            // Following
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
                                            // Follow
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

                                        '& svg': {
                                            fontSize: 14,
                                        },
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
                </Box>

                {/* COMMENTS */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        sx={{
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            borderBottom: '1px solid #333',
                            pb: 1,
                            fontSize: { xs: 13, md: 14 },
                            color: '#fff',
                        }}
                    >
                        <ChatBubbleOutlineIcon fontSize="small" />
                        {allComments.length} comments
                    </Typography>

                    {allComments.map((comment) => (
                        <Box key={comment.id} sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                            <Avatar
                                src={comment.user?.avatar || undefined}
                                sx={{ width: 32, height: 32 }}
                            >
                                {comment.user?.name?.charAt(0).toUpperCase()}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: { xs: 'column', md: 'row' },
                                        justifyContent: 'space-between',
                                        alignItems: { md: 'center' },
                                        gap: { xs: 0.5, md: 0 },
                                    }}
                                >
                                    <UploaderHoverCard uploader={comment.user}>
                                        <Typography sx={{ color: '#fff', fontSize: 13, wordBreak: 'break-word' }}>
                                            <Link
                                                href={generateProfileUrl(comment.user.name, String(comment.user.id))}
                                                style={{ textDecoration: 'none', color: 'white' }}
                                            >
                                            <span style={{ fontWeight: 'bold' }}>
                                                {comment.user.email === session?.user.email
                                                    ? 'You'
                                                    : comment.user.name}
                                            </span>
                                            </Link>
                                            {' at '}
                                            <span
                                                onClick={() => handleJumpToMoment(comment.moment)}
                                                style={{ cursor: 'pointer', color: '#ccc' }}
                                            >
                                            {formatMoment(comment.moment)}
                                        </span>
                                        </Typography>
                                    </UploaderHoverCard>


                                    <Typography sx={{ fontSize: 12, color: '#aaa', whiteSpace: 'nowrap' }}>
                                        {dayjs(comment.createdAt).fromNow()}
                                    </Typography>
                                </Box>

                                <Typography sx={{ mt: 0.5, color: '#ddd', fontSize: 14, wordBreak: 'break-word' }}>
                                    {comment.content}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

                    {/* Infinite scroll trigger */}
                    <div ref={observerRef} />

                    {isFetching && (
                        <Box sx={{ textAlign: 'center', py: 2, color: '#999' }}>
                            Loading...
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default CommentSection;