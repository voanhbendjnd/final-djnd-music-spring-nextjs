'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchResults } from '@/hooks/use-search';
import ProfileTrack from '@/components/track/profile.track';
import { Box, Typography, CircularProgress, Container, TextField, useMediaQuery, useTheme, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, Chip } from '@mui/material';
import SearchBar from '@/components/search/search-bar';
import { useSearchSuggestions } from '@/hooks/use-search';
import Image from 'next/image';
import { useTrackContext } from '@/lib/track.wrapper';

const SearchPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const query = searchParams.get('q') || '';
    const [page, setPage] = useState(1);
    const [allTracks, setAllTracks] = useState<any[]>([]);
    const [searchType, setSearchType] = useState<'local' | 'youtube' | 'empty'>('empty');
    const loadMoreRef = useRef<HTMLDivElement>(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const { setCurrentTrack, setPlaylistTracks } = useTrackContext() as ITrackContext;

    // Local search state for mobile
    const [searchKeyword, setSearchKeyword] = useState(query);
    const [debouncedKeyword, setDebouncedKeyword] = useState(query);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);

    // Load recent searches from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('recentSearches');
        if (stored) {
            setRecentSearches(JSON.parse(stored));
        }
    }, []);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(searchKeyword);
        }, 300);

        return () => clearTimeout(timer);
    }, [searchKeyword]);

    // Update URL when debounced keyword changes
    useEffect(() => {
        if (debouncedKeyword && debouncedKeyword !== query) {
            router.push(`/search?q=${encodeURIComponent(debouncedKeyword)}`, { scroll: false });
        } else if (!debouncedKeyword && query) {
            router.push('/search', { scroll: false });
        }
    }, [debouncedKeyword, query, router]);

    // Save search to recent searches
    const saveRecentSearch = (keyword: string) => {
        if (!keyword.trim()) return;

        setRecentSearches(prev => {
            const filtered = prev.filter(s => s !== keyword);
            const updated = [keyword, ...filtered].slice(0, 10);
            localStorage.setItem('recentSearches', JSON.stringify(updated));
            return updated;
        });
    };

    // Fetch search results with pagination
    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: ['search-results', query],
        queryFn: async ({ pageParam = '' }) => {
            let url = `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/search?q=${encodeURIComponent(query)}&size=10`;
            if (typeof pageParam === 'string' && pageParam !== '') {
                url += `&pageToken=${pageParam}`;
            } else if (typeof pageParam === 'number') {
                url += `&page=${pageParam}`;
            }
            const response = await fetch(url);
            const data = await response.json();
            return data;
        },
        initialPageParam: 1 as any,
        getNextPageParam: (lastPage: any) => {
            if (lastPage?.type === 'youtube') {
                return lastPage?.data?.[0]?.meta?.nextPageToken || undefined;
            }
            if (lastPage?.type === 'empty') return undefined; 
            const meta = lastPage.data?.[0]?.meta;
            if (meta && meta.page < meta.pages) {
                return meta.page + 1;
            }
            return undefined;
        },
        enabled: !!query,
    });

    // Fetch suggestions for mobile
    const { data: suggestionsResponse, isLoading: suggestionsLoading } = useSearchSuggestions({
        query: debouncedKeyword,
        enabled: isMobile && debouncedKeyword.length >= 2
    });
    const suggestionsType = (suggestionsResponse as ISearchFallbackResponse<IModelPaginate<ITrack>>)?.type ?? 'empty';
    const suggestionsList = suggestionsType === 'youtube' 
        ? ((suggestionsResponse as ISearchFallbackResponse<IModelPaginate<ITrack>>)?.data?.[0]?.result ?? [])
        : ((suggestionsResponse as ISearchFallbackResponse<IModelPaginate<ITrack>>)?.data ?? []);

    // Update all tracks when data changes
    useEffect(() => {
        if (data?.pages && data.pages.length > 0) {
            const type = data.pages[0]?.type || 'empty';
            setSearchType(type);
            const tracks = data.pages.flatMap((page: any) => {
                if (page.type === 'local') {
                    return page.data?.[0]?.result || [];
                } else if (page.type === 'youtube') {
                    return page.data?.[0]?.result || [];
                }
                return [];
            });
            setAllTracks(tracks);
        }
    }, [data]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        if (loadMoreRef.current) {
            observer.observe(loadMoreRef.current);
        }

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Handle suggestion click
    const handleSuggestionClick = (suggestion: any) => {
        saveRecentSearch(suggestion.title);
        if (suggestionsType === 'youtube') {
            setCurrentTrack({
                id: suggestion.videoId,
                title: suggestion.title,
                description: "",
                category: "",
                imgUrl: suggestion.thumbnail,
                trackUrl: suggestion.videoId,
                countLike: 0,
                countPlay: 0,
                uploader: { id: "", name: suggestion.channel, avatar: suggestion.thumbnail, countFollowers: 0, isFollowed: false },
                createdAt: "",
                updatedAt: "",
                peaks: "",
                isPlaying: true,
                isLiked: false,
                isYoutube: true,
                waveform_url:"",
            });
            const { setPlayMode, setQueueType, addToPlayedTracks } = useTrackContext() as ITrackContext;
            setPlayMode('dynamic');
            setQueueType('search');
            addToPlayedTracks(suggestion.videoId);
            setPlaylistTracks([suggestion]);
            return;
        }
        router.push(`/track/${suggestion.id}?audio=${suggestion.trackUrl}&id=${suggestion.id}`);
    };

    // Handle recent search click
    const handleRecentSearchClick = (keyword: string) => {
        setSearchKeyword(keyword);
        saveRecentSearch(keyword);
    };

    // Clear recent searches
    const handleClearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    // Trending searches (hardcoded for now, could be from API)
    const trendingSearches = ['taylor swift', 'drake', 'lofi', 'edm', 'hip hop'];

    return (
        <div style={{ backgroundColor: '#121212', minHeight: '100vh', paddingBottom: isMobile ? 60 : 0 }}>
            {/* Mobile Search Bar - Sticky */}
            {isMobile && (
                <Box sx={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    bgcolor: '#121212',
                    p: 2,
                    borderBottom: '1px solid #333'
                }}>
                    <TextField
                        fullWidth
                        placeholder="Search for tracks..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        autoFocus
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                bgcolor: '#2a2a2a',
                                color: '#fff',
                                '& fieldset': { borderColor: '#444' },
                                '&:hover fieldset': { borderColor: '#666' },
                                '&.Mui-focused fieldset': { borderColor: '#f50' },
                            },
                            '& .MuiInputBase-input': {
                                color: '#fff',
                            }
                        }}
                    />
                </Box>
            )}

            <Container maxWidth="lg" sx={{ py: 4, backgroundColor: '#121212' }}>
                {/* Desktop Header */}
                {!isMobile && (
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h4" sx={{ mb: 2, color: '#fff' }}>
                            Search Results for "{query}"
                        </Typography>
                    </Box>
                )}

                {/* Mobile: No Query - Show Recent & Trending */}
                {isMobile && !debouncedKeyword && (
                    <Box sx={{ mt: 2 }}>
                        {/* Recent Searches */}
                        {recentSearches.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6" sx={{ color: '#fff' }}>
                                        Recent Searches
                                    </Typography>
                                    <Typography
                                        sx={{ color: '#f50', cursor: 'pointer', fontSize: '0.875rem' }}
                                        onClick={handleClearRecent}
                                    >
                                        Clear
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {recentSearches.map((search, index) => (
                                        <Chip
                                            key={index}
                                            label={search}
                                            onClick={() => handleRecentSearchClick(search)}
                                            sx={{
                                                bgcolor: '#333',
                                                color: '#ccc',
                                                '&:hover': { bgcolor: '#444' },
                                                cursor: 'pointer'
                                            }}
                                        />
                                    ))}
                                </Box>
                            </Box>
                        )}

                        {/* Trending Searches */}
                        <Box>
                            <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                                Trending
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {trendingSearches.map((search, index) => (
                                    <Chip
                                        key={index}
                                        label={search}
                                        onClick={() => handleRecentSearchClick(search)}
                                        sx={{
                                            bgcolor: '#333',
                                            color: '#ccc',
                                            '&:hover': { bgcolor: '#444' },
                                            cursor: 'pointer'
                                        }}
                                    />
                                ))}
                            </Box>
                        </Box>
                    </Box>
                )}

                {/* Mobile: Suggestions (>= 2 characters) */}
                {isMobile && debouncedKeyword.length >= 2 && suggestionsList.length > 0 && suggestionsType !== 'empty' && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h6" sx={{ color: '#fff', mb: 2 }}>
                            Suggestions
                        </Typography>
                        <List sx={{ bgcolor: '#1a1a1a', borderRadius: 2 }}>
                            {suggestionsList.map((suggestion: any) => {
                                const isYoutube = suggestionsType === 'youtube';
                                const id = isYoutube ? suggestion.videoId : suggestion.id;
                                const title = suggestion.title;
                                const imgUrl = isYoutube ? suggestion.thumbnail : suggestion.imgUrl;
                                const subtitle = isYoutube ? suggestion.channel : suggestion.name;

                                return (
                                    <ListItem
                                        key={id}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        sx={{
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#2a2a2a' },
                                            borderBottom: '1px solid #333'
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={imgUrl}
                                                sx={{ width: 48, height: 48, bgcolor: '#333' }}
                                            >
                                                {!imgUrl && title.charAt(0)}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {title}
                                                </Typography>
                                            }
                                            secondary={
                                                <Box sx={{ color: '#999', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    {subtitle}
                                                    {isYoutube && (
                                                        <Box component="span" sx={{ fontSize: '0.7rem', bgcolor: '#f00', color: '#fff', px: 0.5, borderRadius: 1 }}>
                                                            YouTube
                                                        </Box>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    </Box>
                )}

                {/* Search Results */}
                {query && (
                    <>
                        {isLoading && allTracks.length === 0 ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                                <CircularProgress sx={{ color: '#f50' }} />
                            </Box>
                        ) : allTracks.length === 0 ? (
                            <Box sx={{ py: 8, textAlign: 'center' }}>
                                <Typography variant="h6" sx={{ color: '#666' }}>
                                    No results found for "{query}"
                                </Typography>
                                <Typography variant="body2" sx={{ color: '#999', mt: 1 }}>
                                    Try searching for something else
                                </Typography>
                            </Box>
                        ) : (
                            <Box>
                                {allTracks.map((track) => {
                                    if (searchType === 'youtube') {
                                        return (
                                            <Box
                                                key={track.videoId}
                                                onClick={() => {
                                                    setCurrentTrack({
                                                        id: track.videoId,
                                                        title: track.title,
                                                        description: "",
                                                        category: "",
                                                        imgUrl: track.thumbnail,
                                                        trackUrl: track.videoId,
                                                        countLike: 0,
                                                        countPlay: 0,
                                                        uploader: { id: "", name: track.channel, avatar: track.thumbnail, countFollowers:0, isFollowed:false },
                                                        createdAt: "",
                                                        updatedAt: "",
                                                        peaks: "",
                                                        isPlaying: true,
                                                        isLiked: false,
                                                        isYoutube: true,
                                                        waveform_url:""
                                                    });
                                                    const { setPlayMode, setQueueType, addToPlayedTracks } = useTrackContext() as ITrackContext;
                                                    setPlayMode('dynamic');
                                                    setQueueType('search');
                                                    addToPlayedTracks(track.videoId);
                                                    setPlaylistTracks(allTracks);
                                                }}
                                                sx={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    p: 2,
                                                    mb: 2,
                                                    bgcolor: '#1a1a1a',
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    '&:hover': { bgcolor: '#2a2a2a' }
                                                }}
                                            >
                                                <Box sx={{ position: 'relative', width: 120, height: 68, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                                                    <Image src={track.thumbnail || '/default-thumbnail.png'} alt={track.title} fill style={{ objectFit: 'cover' }} />
                                                </Box>
                                                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                    <Typography variant="body1" sx={{ color: '#fff', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {track.title}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: '#999', mt: 0.5 }}>
                                                        {track.channel}
                                                    </Typography>
                                                </Box>
                                                <Box component="span" sx={{ fontSize: '0.75rem', bgcolor: '#f00', color: '#fff', px: 1, py: 0.5, borderRadius: 1, display: { xs: 'none', sm: 'block' } }}>
                                                    YouTube
                                                </Box>
                                            </Box>
                                        );
                                    }

                                    return (
                                        <Box key={track.id} sx={{ mb: 4 }}>
                                            {isMobile ? (
                                                // Mobile: Simplified track card (no waveform)
                                                <Box
                                                    onClick={() => {
                                                        const keyword = "upload/";
                                                        const index = track.trackUrl.indexOf(keyword);
                                                        const trackUrlCut = track.trackUrl.substring(index + keyword.length);
                                                        router.push(`/track/${track.id}?audio=${trackUrlCut}&id=${track.id}`);
                                                    }}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                        p: 2,
                                                        bgcolor: '#1a1a1a',
                                                        borderRadius: 2,
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: '#2a2a2a' }
                                                    }}
                                                >
                                                    <Avatar
                                                        src={track.imgUrl}
                                                        sx={{ width: 56, height: 56, bgcolor: '#333' }}
                                                    >
                                                        {!track.imgUrl && track.title.charAt(0)}
                                                    </Avatar>
                                                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                        <Typography
                                                            variant="body1"
                                                            sx={{
                                                                color: '#fff',
                                                                fontWeight: 500,
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap'
                                                            }}
                                                        >
                                                            {track.title}
                                                        </Typography>
                                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                                color: '#999',
                                                                overflow: 'hidden',
                                                                textOverflow: 'ellipsis',
                                                                whiteSpace: 'nowrap',
                                                                mt: 0.5
                                                            }}
                                                        >
                                                            {track.uploader.name}
                                                        </Typography>
                                                    </Box>
                                                    <Typography
                                                        variant="caption"
                                                        sx={{ color: '#666', fontSize: '0.75rem' }}
                                                    >
                                                        {track.countPlay} plays
                                                    </Typography>
                                                </Box>
                                            ) : (
                                                // Desktop: Full ProfileTrack with waveform
                                                <ProfileTrack track={track} tracks={allTracks} />
                                            )}
                                        </Box>
                                    );
                                })}

                                {/* Load more trigger */}
                                <div ref={loadMoreRef} style={{ height: 20 }} />

                                {isFetchingNextPage && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                        <CircularProgress size={24} sx={{ color: '#f50' }} />
                                    </Box>
                                )}

                                {!hasNextPage && allTracks.length > 0 && (
                                    <Box sx={{ py: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" sx={{ color: '#666' }}>
                                            No more results
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                )}

                {/* Desktop: Show SearchBar when no query */}
                {!isMobile && !query && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                        <SearchBar />
                    </Box>
                )}
            </Container>
        </div>
    );
};

export default SearchPage;
