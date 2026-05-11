'use client'

import { useState, useEffect, useRef } from 'react';
import { sendRequest } from "@/utils/api";
import ProfileTrack from "@/components/track/profile.track";
import TrackSkeleton from "@/components/track/TrackSkeleton";
import { Container, Typography, Box, CircularProgress } from "@mui/material";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const LikePage = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [allTracks, setAllTracks] = useState<ITrack[]>([]);
    const [total, setTotal] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const observerRef = useRef<HTMLDivElement | null>(null);
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/auth/signin");
        }
    }, [status, router]);

    useEffect(() => {
        if (status !== "authenticated") return;

        let isMounted = true;

        const fetchTracks = async () => {
            setIsLoading(true);
            try {
                const res = await sendRequest<IBackendRes<IModelPaginate<ITrack>>>({
                    url: `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/histories/main`,
                    method: "GET",
                    queryParams: {
                        page: currentPage,
                        size: 5,
                        // sort: "createdAt,desc"
                    },
                    headers: {
                        Authorization: `Bearer ${session?.access_token}`,
                    },
                    nextOption: { cache: 'no-store' }
                });

                if (isMounted && res?.data) {
                    const newTracks = res.data.result ?? [];
                    const meta = res.data.meta;

                    setAllTracks(prev => {
                        const existingIds = new Set(prev.map(t => t.id));
                        const filtered = newTracks.filter(t => !existingIds.has(t.id));
                        return [...prev, ...filtered];
                    });

                    if (meta) {
                        setTotal(meta.total);
                        const hasNoTracks = newTracks.length === 0 && meta.pages <= 1;
                        setHasMore(!hasNoTracks && meta.page < meta.pages);
                    }
                }
            } catch (error) {
                console.error('Error fetching tracks:', error);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    setIsInitialLoading(false);
                }
            }
        };

        fetchTracks();

        return () => { isMounted = false };
    }, [currentPage, status, session?.access_token]);

    useEffect(() => {
        if (isLoading || !hasMore) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setCurrentPage(prev => prev + 1);
                }
            },
            { threshold: 0.5 }
        );

        const target = observerRef.current;
        if (target) observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
            observer.disconnect();
        };
    }, [isLoading, hasMore]);

    if (status === "loading") return <Box sx={{ p: 5, color: 'white' }}>Loading session...</Box>;
    if (!session) return null;

    return (
        <Container sx={{marginTop:5}}>
            <div style={{backgroundColor:'#121212'}}>
                <Typography sx={{ color: '#eee', mb: 3, fontSize: '1.2rem', fontWeight: 500 }}>
                    Hear the tracks you’ve played: ({total})
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {isInitialLoading ? (
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

                    {/* Sentinel Element */}
                    {hasMore && (
                        <Box ref={observerRef} sx={{ height: 40, display: 'flex', justifyContent: 'center', mt: 2 }}>
                            {isLoading && <CircularProgress size={24} sx={{ color: '#f50' }} />}
                        </Box>
                    )}

                    {allTracks.length === 0 && !isLoading && (
                        <Typography sx={{ color: '#666', textAlign: 'center', mt: 10 }}>
                            You don't play any track
                        </Typography>
                    )}

                    {!hasMore && allTracks.length > 0 && (
                        <Typography variant="caption" sx={{ textAlign: 'center', color: '#444', py: 4 }}>
                            All track
                        </Typography>
                    )}
                </Box>
            </div>

        </Container>
    );
}

export default LikePage;