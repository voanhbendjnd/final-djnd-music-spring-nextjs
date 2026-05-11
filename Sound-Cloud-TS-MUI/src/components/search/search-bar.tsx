'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import { TextField, Box, Paper, IconButton, InputAdornment, CircularProgress } from '@mui/material';
import { useSearchSuggestions } from '@/hooks/use-search';
import Image from 'next/image';
import { useTrackContext } from '@/lib/track.wrapper';

const SearchBar = () => {
    const router = useRouter();
    const [keyword, setKeyword] = useState('');
    const [debouncedKeyword, setDebouncedKeyword] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [highlightIndex, setHighlightIndex] = useState(-1);
    const listRef = useRef<HTMLDivElement>(null);
    const { setCurrentTrack, setPlaylistTracks } = useTrackContext() as ITrackContext;

    useEffect(() => {
        setHighlightIndex(-1);
    }, [debouncedKeyword]);
    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedKeyword(keyword);
        }, 300);

        return () => clearTimeout(timer);
    }, [keyword]);

    const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);

    // Fetch suggestions
    const { data: suggestionsResponse, isLoading } = useSearchSuggestions({
        query: debouncedKeyword,
        enabled: showSuggestions && keyword.length >= 2
    });
    const searchType = (suggestionsResponse as ISearchFallbackResponse<ISearchResult | IYoutubeSearchResult>)?.type ?? 'empty';
    const suggestionsList = searchType === 'youtube'
        ? ((suggestionsResponse as  ISearchFallbackResponse<ISearchResult | IYoutubeSearchResult>)?.data?.[0]?.result ?? [])
        : ((suggestionsResponse as ISearchFallbackResponse<ISearchResult | IYoutubeSearchResult>)?.data ?? []);

    // Handle click outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setKeyword(e.target.value);
        setShowSuggestions(true);
    };

    const handleClear = () => {
        setKeyword('');
        setDebouncedKeyword('');
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions) return;

        // ↓ xuống
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((prev) =>
                prev < suggestionsList.length - 1 ? prev + 1 : 0
            );
        }

        // ↑ lên
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((prev) =>
                prev > 0 ? prev - 1 : suggestionsList.length - 1
            );
        }

        // Enter
        if (e.key === 'Enter') {
            e.preventDefault();
            if (exactMatch) {
                handleSuggestionClick(exactMatch);
                return;
            }
            // Nếu đang chọn item
            if (highlightIndex >= 0) {
                const selected = suggestionsList[highlightIndex];
                handleSuggestionClick(selected);
            } else if (keyword.length >= 2) {
                // fallback: search page
                router.push(`/search?q=${encodeURIComponent(keyword)}`);
                setShowSuggestions(false);
            }
        }

        // ESC để đóng
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };
    // <Link href={`/track/${track.id}?audio=${track.trackUrl}&id=${track.id}`} style={{ textDecoration: 'none' }}>
    useEffect(() => {
        if (!listRef.current) return;

        const items = listRef.current.children;

        if (highlightIndex >= 0 && items[highlightIndex]) {
            (items[highlightIndex] as HTMLElement).scrollIntoView({
                block: 'nearest',
            });
        }
    }, [highlightIndex]);

    const handleSuggestionClick = (suggestion: any) => {
        if (searchType === 'youtube') {
            setCurrentTrack({
                id: suggestion.videoId,
                title: suggestion.title,
                description: "",
                category: "",
                imgUrl: suggestion.thumbnail,
                trackUrl: suggestion.videoId,
                countLike: 0,
                countPlay: 0,
                uploader: {
                    id: "",
                    name: suggestion.channel,
                    avatar: suggestion.thumbnail
                },
                createdAt: "",
                updatedAt: "",
                peaks: "",
                isPlaying: true,
                isLiked: false,
                isYoutube: true
            });
            setPlaylistTracks([suggestion]);
            setShowSuggestions(false);
            setKeyword('');
            return;
        }
        router.push(`/track/${suggestion.id}?audio=${suggestion.trackUrl}&id=${suggestion.id}`);
        setShowSuggestions(false);
        setKeyword('');
    };

    // Check for exact match (only for local tracks)
    const exactMatch = searchType === 'local' ? (suggestionsList as ISearchResult[]).find(s =>
        s.title.toLowerCase() === keyword.toLowerCase()
    ) : undefined;

    return (
        <Box ref={searchRef} sx={{ position: 'relative', width: '100%', maxWidth: 550, height: '45' }}>
            <TextField
                inputRef={inputRef}
                fullWidth
                placeholder="Search for tracks..."
                value={keyword}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                    setShowSuggestions(true);
                    if (suggestionsList.length > 0) {
                        setHighlightIndex(0);
                    }
                }}
                inputProps={{
                    style: {
                        color: '#ccc', // Màu chữ khi bạn gõ vào (xám nhạt cho dịu mắt)
                        fontSize: '0.9rem'
                    }
                }}
                InputProps={{
                    // 1. Xóa startAdornment (để trống hoặc xóa hẳn)
                    startAdornment: null,

                    // 2. Chuyển icon search vào endAdornment
                    endAdornment: (
                        <InputAdornment position="end" sx={{ gap: 0.5 }}>
                            {/* Nút Clear (X) - chỉ hiện khi có chữ */}
                            {keyword && (
                                <IconButton onClick={handleClear} size="small" sx={{ color: '#999', '&:hover': { color: '#fff' } }}>
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            )}

                            {/* Loading indicator */}
                            {isLoading && (
                                <CircularProgress size={20} sx={{ color: '#f50' }} />
                            )}

                            {/* Nút Kính lúp (Search) - Click vào đây sẽ gọi logic tìm kiếm */}
                            <IconButton
                                onClick={() => {
                                    if (keyword.length >= 2) {
                                        router.push(`/search?q=${encodeURIComponent(keyword)}`);
                                        setShowSuggestions(false);
                                    }
                                }}
                                size="small"
                                sx={{
                                    color: '#999',
                                    '&:hover': { color: '#f50' }, // Đổi sang màu cam SoundCloud khi hover
                                    transition: '0.2s',

                                }}
                            >
                                <SearchIcon />
                            </IconButton>
                        </InputAdornment>
                    ),
                    sx: {

                        // --- FIX LỖI TRẮNG NỀN KHI AUTOFILL ---
                        '& input:-webkit-autofill': {
                            WebkitBoxShadow: '0 0 0 100px #333 inset !important', // Đè màu nền tối vào
                            WebkitTextFillColor: '#fff !important', // Đè màu chữ trắng vào
                            transition: 'background-color 5000s ease-in-out 0s',
                        },
                        '& input:-webkit-autofill:hover': {
                            WebkitBoxShadow: '0 0 0 100px #333 inset !important',
                        },
                        '& input:-webkit-autofill:focus': {
                            WebkitBoxShadow: '0 0 0 100px #333 inset !important',
                        },
                        bgcolor: '#222', // Nền thanh search tối hơn một chút
                        borderRadius: '4px', // Bo góc nhẹ theo kiểu SoundCloud

                        // 1. Màu mặc định của border (fieldset)
                        '& fieldset': {
                            borderColor: 'transparent', // Ẩn border mặc định
                            transition: 'all 0.2s ease-in-out',
                        },

                        // 2. Hiệu ứng khi HOVER
                        '&:hover fieldset': {
                            borderColor: '#444 !important', // Hiện border xám nhẹ khi hover
                        },

                        // 3. Hiệu ứng khi FOCUS (Đang nhập liệu)
                        '&.Mui-focused fieldset': {
                            borderColor: '#666 !important', // Border sáng hơn khi click vào
                            borderWidth: '1px !important',
                        },

                        // Nếu muốn đổi màu placeholder (chữ "Search for tracks...")
                        '& input::placeholder': {
                            color: '#666',
                            opacity: 1,
                        },
                    },
                }}
                sx={{
                    '& .MuiOutlinedInput-root': {
                        height: 48,
                        color: '#fff',
                        '&.Mui-focused .MuiSvgIcon-root': {
                            color: '#f50', // Khi đang gõ, kính lúp sẽ sáng lên màu cam
                        }
                    }
                }}
            />

            {/* Exact match preview */}
            {exactMatch && keyword.length >= 2 && (
                <Paper
                    ref={listRef}
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        p: 2,
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        cursor: 'pointer',
                        bgcolor: '#333',
                        '&:hover': {
                            bgcolor: '#444',
                        },

                    }}
                    onClick={() => handleSuggestionClick(exactMatch)}
                >
                    <Box
                        sx={{
                            width: 60,
                            height: 60,
                            position: 'relative',
                            borderRadius: 1,
                            overflow: 'hidden',
                        }}
                    >
                        <Image
                            src={exactMatch.imgUrl}
                            alt={exactMatch.title}
                            fill
                            style={{ objectFit: 'cover' }}
                        />
                    </Box>
                    <Box>
                        <Box sx={{ fontWeight: 600, fontSize: '0.95rem', color: '#fff' }}>
                            {exactMatch.title}
                        </Box>
                        <Box sx={{ color: '#999', fontSize: '0.85rem' }}>
                            {exactMatch.name}
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Suggestions dropdown */}
            {showSuggestions && suggestionsList.length > 0 && keyword.length >= 2 && searchType !== 'empty' && (
                <Paper
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        mt: 1,
                        maxHeight: 400,
                        overflow: 'auto',
                        zIndex: 2000,
                        bgcolor: '#333',
                        '&::-webkit-scrollbar': {
                            display: 'none',
                        },
                        msOverflowStyle: 'none',
                        scrollbarWidth: 'none',
                    }}
                >
                    {suggestionsList.map((suggestion: any, index: number) => {
                        const isYoutube = searchType === 'youtube';
                        const id = isYoutube ? suggestion.videoId : suggestion.id;
                        const title = suggestion.title;
                        const imgUrl = isYoutube ? suggestion.thumbnail : suggestion.imgUrl;
                        const subtitle = isYoutube ? suggestion.channel : suggestion.name;

                        return (
                            <Box
                                key={id}
                                sx={{
                                    p: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 2,
                                    cursor: 'pointer',
                                    bgcolor: index === highlightIndex ? '#444' : 'transparent',
                                    '&:hover': {
                                        bgcolor: '#444',
                                    },
                                }}
                                onMouseEnter={() => setHighlightIndex(index)}
                                onClick={() => handleSuggestionClick(suggestion)}
                            >
                                <Box
                                    sx={{
                                        width: isYoutube ? 90 : 50,
                                        height: 50,
                                        position: 'relative',
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                    }}
                                >
                                    <Image
                                        src={imgUrl || '/default-thumbnail.png'}
                                        alt={title}
                                        fill
                                        style={{ objectFit: 'cover' }}
                                    />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ fontWeight: 500, fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {title}
                                    </Box>
                                    <Box sx={{ color: '#999', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        {subtitle}
                                        {isYoutube && (
                                            <Box component="span" sx={{ fontSize: '0.7rem', bgcolor: '#f00', color: '#fff', px: 0.5, borderRadius: 1 }}>
                                                YouTube
                                            </Box>
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Paper>
            )}

            {/* Empty State */}
            {showSuggestions && searchType === 'empty' && keyword.length >= 2 && !isLoading && (
                <Paper elevation={3} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 1, p: 2, zIndex: 2000, bgcolor: '#333', color: '#999', textAlign: 'center' }}>
                    No results found
                </Paper>
            )}
        </Box>
    );
};

export default SearchBar;
