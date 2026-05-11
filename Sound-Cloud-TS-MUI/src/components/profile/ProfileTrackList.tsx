'use client'

import { useState, useEffect, useRef } from 'react';
import { sendRequest } from "@/utils/api";
import ProfileTrack from "@/components/track/profile.track";
import TrackSkeleton from "@/components/track/TrackSkeleton";
import { Container, Typography, Box } from "@mui/material";

interface ProfileTrackListProps {
    userId: string;
    initialTracks: ITrack[];
    initialTotal: number;
    initialHasMore: boolean;
}

const ProfileTrackList = ({ userId, initialTracks, initialTotal, initialHasMore }: ProfileTrackListProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [allTracks, setAllTracks] = useState<ITrack[]>(initialTracks);
    const [total, setTotal] = useState(initialTotal);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(initialTracks.length === 0);
    const observerRef = useRef<HTMLDivElement | null>(null);

    // Fetch tracks for current page
    useEffect(() => {
        const fetchTracks = async () => {
            setIsLoading(true);
            try {
                const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
                    url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/users/${userId}`,
                    method: "GET",
                    queryParams: {
                        page: currentPage,
                        size: 5,
                        sort: "createdAt,desc"
                    },
                });

                const newTracks = res?.data?.result ?? [];
                const meta = res?.data?.meta;

                // Append new tracks to existing list
                setAllTracks(prev => {
                    // Avoid duplicates
                    const existingIds = new Set(prev.map(t => t.id));
                    const filtered = newTracks.filter(t => !existingIds.has(t.id));
                    return [...prev, ...filtered];
                });

                // Update total and hasMore
                if (meta) {
                    setTotal(meta.total);
                    setHasMore(meta.page < meta.pages);
                }
            } catch (error) {
                console.error('Error fetching tracks:', error);
            } finally {
                setIsLoading(false);
                setIsInitialLoading(false);
            }
        };

        // Only fetch if currentPage > 1 (first page is already loaded from server)
        if (currentPage > 1) {
            fetchTracks();
        }
    }, [currentPage, userId]);

    // Intersection Observer for infinite scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    setCurrentPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading]);

    return (
        <Box sx={{ minHeight: '100vh', background: '#121212', py: 4 }}>
                <Typography sx={{ color: '#999', mb: 3, fontWeight: 'bold' }}>
                    Found {total} tracks
                </Typography>
                <Box>
                    {isInitialLoading && allTracks.length > 0  ? (
                        // Show skeleton during initial loading
                        <>
                            <TrackSkeleton />
                            <TrackSkeleton />
                            <TrackSkeleton />
                        </>
                    ) : (
                        // Show tracks after initial loading completes
                        allTracks.map(track => (
                            <ProfileTrack key={track.id} track={track} tracks={allTracks} />
                        ))
                    )}
                    {allTracks.length === 0 && !isLoading && !isInitialLoading && (
                        <Typography sx={{ color: '#666', mt: 4 }}>Chưa có bài hát nào được tải lên.</Typography>
                    )}

                    {/* Loading indicator */}
                    {isLoading && (
                        <Box sx={{ textAlign: 'center', py: 2, color: '#999' }}>
                            Loading more tracks...
                        </Box>
                    )}

                    {/* Observer target for infinite scroll */}
                    {hasMore && !isLoading && (
                        <div ref={observerRef} style={{ height: '20px' }} />
                    )}

                    {!hasMore && allTracks.length > 0 && (
                        <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', mt: 2 }}>
                            No more tracks
                        </Typography>
                    )}
                </Box>
        </Box>
    )
}

export default ProfileTrackList;
