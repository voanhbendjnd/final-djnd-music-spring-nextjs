'use client'
import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, Avatar, Typography, Divider, IconButton } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useSession } from "next-auth/react";
import { useTrackContext } from "@/lib/track.wrapper";
import { SendSharp } from "@mui/icons-material";
import { useCreateComment, useFetchCommentsAxios } from "@/hooks/use.comment";
import { toast } from "react-toastify";
import Link from "next/link";
import {generateProfileUrl} from "@/utils/generate.slug";

dayjs.extend(relativeTime);

interface IProps {
    comments: IComment[];
    trackId: string | null;
    uploader: ITrack;
}

const CommentSection = (props: IProps) => {
    const { comments, trackId, uploader } = props;

    // Infinite scroll state
    const [currentPage, setCurrentPage] = useState(1);
    const [allComments, setAllComments] = useState<IComment[]>(comments);
    // SSR page.tsx fetch page=1 với size=20. Client pageSize=10.
    // Nếu SSR trả về < 10 comment → chắc chắn không còn page tiếp
    const [hasMore, setHasMore] = useState(comments.length >= 10);
    const observerRef = useRef<HTMLDivElement | null>(null);
    const userId = uploader.uploader.id;
    const commentParams = {
        current: currentPage,
        pageSize: 10, // Reduced from 100 to enable proper pagination
        trackId: Number(trackId),
        sort: "updatedAt,desc"
    };
    const { data: resComments, isLoading, isFetching } = useFetchCommentsAxios(commentParams, {
        enabled: hasMore, // Không gọi API khi đã hết comment
    });
    const [newComment, setNewComment] = useState("");
    const { data: session } = useSession();
    const { currentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const createCommentMutation = useCreateComment(commentParams);

    // Update allComments when new data is fetched
    useEffect(() => {
        if (resComments) {
            const { result: newComments, meta } = resComments;

            if (meta) {
                // 1. Nếu không có dữ liệu HOẶC đã đến trang cuối cùng thì dừng
                if (newComments.length === 0 || meta.page >= meta.pages) {
                    setHasMore(false);
                } else {
                    setHasMore(true);
                }
            }

            // 2. Chỉ append comment nếu có dữ liệu mới
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
        const currentMoment = audioRef.current ? Math.round(audioRef.current.currentTime) : 0;
        if (!newComment.trim()) return;

        // Build optimistic comment for local state
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

        // Prepend to local state immediately
        setAllComments(prev => [optimisticComment, ...prev]);

        createCommentMutation.mutate(
            {
                track_id: Number(trackId),
                content: newComment,
                moment: currentMoment,
            },
            {
                onSuccess: () => {
                    // Hook already invalidates all comment queries via onSettled
                },
                onError: () => {
                    // Rollback local state on error
                    setAllComments(prev => prev.filter(c => c.id !== optimisticComment.id));
                }
            }
        );
        setNewComment("");
        toast.dark("Post comment success");
    }

    const handleJumpToMoment = (moment: number) => {
        if (audioRef.current) {
            // 1. Thay đổi thời gian của thẻ audio thực
            audioRef.current.currentTime = moment;

            // 2. Nếu nhạc đang dừng, bạn có thể chọn tự động phát luôn
            audioRef.current.play().catch(e => console.log("Audio play failed:", e));

            // 3. (Tùy chọn) Lưu lại thời gian vào savedTimes để đồng bộ
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
                marginBottom:30
            }}
        >

            {/* INPUT */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    width: '100%',
                }}
            >
                {session && (
                    <>
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

                        <TextField
                            fullWidth
                            variant="outlined"
                            placeholder="Write a comment"
                            size="small"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            sx={{
                                background: '#303030',
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '6px',
                                },
                                '& .MuiInputBase-input': {
                                    color: '#fff',
                                    fontSize: { xs: 13, md: 14 },
                                },
                            }}
                        />

                        <IconButton
                            onClick={handlePostComment}
                            sx={{
                                background: '#303030',
                                p: { xs: 1, md: 1.5 },
                            }}
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
                <Link
                    href={generateProfileUrl(uploader.uploader.name, userId)}
                    style={{ textDecoration: 'none' }}
                >
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
                        <Avatar
                            src={uploader.uploader.avatar}
                            sx={{
                                width: { xs: 50, md: 100 },
                                height: { xs: 50, md: 100 },
                            }}
                        >
                            {uploader.uploader.name.charAt(0).toUpperCase()}
                        </Avatar>

                        <Typography
                            sx={{
                                color: '#fff',
                                fontSize: { xs: 14, md: 15 },
                                fontWeight: 500,
                            }}
                        >
                            {uploader.uploader.name}
                        </Typography>
                    </Box>
                </Link>

                {/* COMMENTS */}
                <Box
                    sx={{
                        flex: 1,
                        minWidth: 0,
                    }}
                >
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
                        <Box
                            key={comment.id}
                            sx={{
                                display: 'flex',
                                gap: 1.5,
                                mb: 2,
                            }}
                        >
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
                                    <Typography
                                        sx={{
                                            color: '#fff',
                                            fontSize: 13,
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        <Link
                                            href={generateProfileUrl(
                                                comment.user.name,
                                                String(comment.user.id)
                                            )}
                                            style={{ textDecoration: 'none', color:'white' }}
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
                                            style={{
                                                cursor: 'pointer',
                                                color: '#ccc',
                                            }}
                                        >
                                        {formatMoment(comment.moment)}
                                    </span>
                                    </Typography>

                                    <Typography
                                        sx={{
                                            fontSize: 12,
                                            color: '#aaa',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {dayjs(comment.createdAt).fromNow()}
                                    </Typography>
                                </Box>

                                <Typography
                                    sx={{
                                        mt: 0.5,
                                        color: '#ddd',
                                        fontSize: 14,
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    {comment.content}
                                </Typography>
                            </Box>
                        </Box>
                    ))}

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