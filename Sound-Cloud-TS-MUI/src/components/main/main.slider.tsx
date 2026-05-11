'use client'
import React, { useState } from "react";
import Slider from "react-slick";
import { Settings } from "react-slick"
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Divider, Typography, useTheme, useMediaQuery, Chip, IconButton } from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import Link from "next/link";
import './home.css'
import Image from "next/image";
import {generateProfileUrl, generateTrackUrl} from "@/utils/generate.slug";
import { useHistory } from "@/hooks/use.history";
import { useLikes } from "@/hooks/use.likes";
import { useCategories } from "@/hooks/use-category";
import { useTrackContext, mapToShareTrack } from "@/lib/track.wrapper";
import { useRouter } from "next/navigation";
import { useTracks } from "@/hooks/use-track";

interface IProps {
    data: ITrack[],
    title: string,
}

// ─── Track Card ───────────────────────────────────────────────────────────────
// Tách ra component riêng để đọc currentTrack từ context
// → mỗi card tự biết bài mình có đang phát không

const TrackCard = ({
                       track,
                       trackList,
                   }: {
    track: ITrack
    trackList: ITrack[]
}) => {
    const { currentTrack, setCurrentTrack, setPlaylistTracks, setCurrentTrackIndex, setPlayMode, setQueueType, addToPlayedTracks } =
        useTrackContext() as ITrackContext

    const isThisPlaying =
        String(currentTrack?.id) === String(track.id) && currentTrack?.isPlaying

    const handleClick = () => {
        if (String(currentTrack?.id) === String(track.id)) {
            // Bài này đang được chọn → toggle play/pause
            setCurrentTrack({ ...currentTrack, isPlaying: !currentTrack.isPlaying })
            return
        }
        // Bài khác → chuyển bài
        setPlayMode?.('dynamic')
        setQueueType?.('trending')
        setPlaylistTracks(trackList)
        const index = trackList.findIndex(t => String(t.id) === String(track.id))
        setCurrentTrackIndex(index !== -1 ? index : 0)
        setCurrentTrack(mapToShareTrack(track, true))
        addToPlayedTracks?.(String(track.id))
    }

    return (
        <div className="track">
            {/* Thumbnail + hover overlay */}
            <Box
                onClick={handleClick}
                sx={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    overflow: 'hidden',   // clip ảnh + overlay cùng border-radius

                    // Glow khi đang phát
                    // boxShadow: isThisPlaying
                    //     ? '0 0 0 2px #f50, 0 4px 20px rgba(255,85,0,0.4)'
                    //     : 'none',
                    transition: 'box-shadow 0.25s ease',

                    // Nhóm hover: khi hover vào Box này thì overlay con hiện
                    // '&:hover .track-overlay': { opacity: 1 },
                    '&:hover .track-overlay': {
                        opacity: 1,
                        background: 'rgba(0,0,0,0.45) !important',  // đồng đều khi hover
                    },
                    '&:hover img': { transform: 'scale(1.04)' },
                }}
            >
                <Image
                    width={150}
                    height={150}
                    alt={track.title}
                    className="img"
                    src={track.imgUrl}
                    style={{
                        width: '100%',
                        height: 'auto',
                        aspectRatio: '1/1',
                        objectFit: 'cover',
                        display: 'block',
                        // transition scale qua inline style vì Next Image render img thật
                        transition: 'transform 0.3s ease',
                    }}
                />

                {/* Overlay — solid khi đang phát, gradient nhẹ khi hover */}
                <Box
                    className="track-overlay"
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        // Khi đang phát: overlay tối đều toàn bộ → icon nổi bật
                        // Khi hover (chưa phát): gradient nhẹ từ dưới
                        background: isThisPlaying
                            ? 'rgba(0,0,0,0.45)'
                            : 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.05) 100%)',
                        opacity: isThisPlaying ? 1 : 0,
                        transition: 'opacity 0.22s ease, background 0.22s ease',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Box
                        sx={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            bgcolor: '#f50',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 16px rgba(255,85,0,0.6)',
                            transition: 'transform 0.18s ease, background-color 0.2s',
                            '&:hover': { transform: 'scale(1.1)' },
                        }}
                    >
                        {isThisPlaying
                            ? <PauseIcon sx={{ fontSize: 22, color: '#fff' }} />
                            : <PlayArrowIcon sx={{ fontSize: 22, color: '#fff' }} />
                        }
                    </Box>
                </Box>

                {/* Indicator bar dưới ảnh khi đang phát */}
                {isThisPlaying && (
                    <Box sx={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        // bgcolor: '#f50',
                        borderRadius: '0 0 8px 8px',
                    }} />
                )}
            </Box>

            <Link href={generateTrackUrl(track)} style={{ textDecoration: 'none', color: 'white' }}>
                <Typography
                    variant="body2"
                    className="track-title"
                    sx={{
                        fontWeight: 600,
                        mt: 1,
                        color: isThisPlaying ? '#f50' : '#fff',
                        transition: 'color 0.2s',
                    }}
                >
                    {track.title}
                </Typography>
            </Link>
            <Link href={generateProfileUrl(track.uploader.name, track.uploader.id)} style={{ textDecoration: 'none', color: 'white' }}>
                <Typography variant="caption" sx={{ color: '#a7a7a7' }}>
                    {track.uploader?.name || track.description}
                </Typography>
            </Link>

        </div>
    )
}

// ─── Main Slider ──────────────────────────────────────────────────────────────

const MainSlider = (props: IProps) => {
    const { data, title } = props;
    const router = useRouter();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [activeCategory, setActiveCategory] = useState<string>("All");

    const { data: categoriesRes } = useCategories({ current: 1, pageSize: 20 });
    const categories = categoriesRes?.data?.result || [];

    // ✅ category undefined = "All" → keepPreviousData giữ data cũ khi phân trang
    // category = string cụ thể → queryKey mới → fetch ngay, không giữ data cũ
    const categoryParam = activeCategory !== "All" ? activeCategory : undefined
    const { data: filteredTracksRes, isLoading: isLoadingFiltered } = useTracks({
        current: 1,
        pageSize: 20,
        category: categoryParam,
    });
    // const tracks = res?.data?.data?.[0]?.result ?? [];
    // console.log(">>> Filter ",filteredTracksRes);
    //@ts-ignore
    const filteredTracks = filteredTracksRes?.data?.data?.[0]?.result
        ?? filteredTracksRes?.data?.result
        ?? [];
    const { data: historyData } = useHistory();
    const { data: likesData } = useLikes();
    const historyTracks = historyData?.pages.flatMap((page: any) => page.data) || [];
    const likedTracks   = likesData?.pages.flatMap((page: any) => page.data) || [];

    const NextArrow = (props: any) => (
        <Box
            onClick={props.onClick}
            sx={{
                position: 'absolute', right: 10, top: 75,
                transform: 'translateY(-50%)', zIndex: 2,
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease',
                '&:hover': { background: 'rgba(255,255,255,0.25)', transform: 'translateY(-50%) scale(1.1)' }
            }}
        >
            <ChevronRightIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
    )

    const PreArrow = (props: any) => (
        <Box
            onClick={props.onClick}
            sx={{
                position: 'absolute', left: 10, top: 75,
                transform: 'translateY(-50%)', zIndex: 2,
                width: 40, height: 40, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(6px)',
                transition: 'all 0.2s ease',
                '&:hover': { background: 'rgba(255,255,255,0.25)', transform: 'translateY(-50%) scale(1.1)' }
            }}
        >
            <ChevronLeftIcon sx={{ color: 'white', fontSize: 20 }} />
        </Box>
    )

    const settings: Settings = {
        infinite: true,
        speed: 500,
        slidesToShow: isMobile ? 2.5 : 4,
        slidesToScroll: 1,
        vertical: false,
        arrows: !isMobile,
        swipeToSlide: true,
        nextArrow: <NextArrow />,
        prevArrow: <PreArrow />
    }

    // Section component để tránh lặp code
    const TrackSection = ({ sectionTitle, tracks }: { sectionTitle: string; tracks: ITrack[] }) => (
        <>
            <Typography variant="h5" mb={2} fontWeight={700}>{sectionTitle}</Typography>
            <Slider {...settings}>
                {tracks.map((track) => (
                    <TrackCard key={track.id} track={track} trackList={tracks} />
                ))}
            </Slider>
        </>
    )

    return (
        <Box sx={{ backgroundColor: '#121212', color: 'white', px: { xs: 2, sm: 3, md: 5 }, py: 2 }}>
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '70% 30%' },
                gap: 2,
                width: '100%',
            }}>
                {/* ── LEFT ─────────────────────────────────────────────── */}
                <Box sx={{ width: '100%', minWidth: 0, overflow: 'hidden' }}>
                    {/* Category chips */}
                    <Box sx={{
                        display: 'flex', gap: 1, mb: 3, overflowX: 'auto', pb: 1,
                        '&::-webkit-scrollbar': { display: 'none' }
                    }}>
                        <Chip
                            label="All"
                            onClick={() => setActiveCategory('All')}
                            sx={{
                                bgcolor: activeCategory === 'All' ? '#ff5500' : '#333',
                                color: activeCategory === 'All' ? '#000' : 'white',
                                fontWeight: activeCategory === 'All' ? 'bold' : 'normal',
                                '&:hover': { bgcolor: activeCategory === 'All' ? '#ff5500' : '#444' }
                            }}
                        />
                        {categories.map((cat: any) => (
                            <Chip
                                key={cat.id}
                                label={cat.name}
                                onClick={() => setActiveCategory(cat.name)}
                                sx={{
                                    bgcolor: activeCategory === cat.name ? '#ff5500' : '#333',
                                    color: activeCategory === cat.name ? '#000' : 'white',
                                    fontWeight: activeCategory === cat.name ? 'bold' : 'normal',
                                    '&:hover': { bgcolor: activeCategory === cat.name ? '#ff5500' : '#444' }
                                }}
                            />
                        ))}
                    </Box>

                    {activeCategory === 'All' ? (
                        <>
                            <TrackSection sectionTitle="Multiple tracks" tracks={data} />
                            <Divider sx={{ my: 3, backgroundColor: '#333' }} />
                            <TrackSection sectionTitle="Trending" tracks={data} />
                            <Divider sx={{ my: 3, backgroundColor: '#333' }} />
                            <TrackSection sectionTitle="POP" tracks={data} />
                        </>
                    ) : (
                        <>
                            <Typography variant="h5" mb={2} fontWeight={700}>{activeCategory} Tracks</Typography>
                            {isLoadingFiltered ? (
                                <Typography variant="body2" color="gray">Loading...</Typography>
                            ) : filteredTracks.length > 0 ? (
                                <Slider {...settings}>
                                    {filteredTracks.map((track: any) => (
                                        <TrackCard key={track.id} track={track} trackList={filteredTracks} />
                                    ))}
                                </Slider>
                            ) : (
                                <Typography variant="body2" color="gray">No tracks found for this category.</Typography>
                            )}
                        </>
                    )}

                    {/* Mobile list */}
                    <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 4 }}>
                        <Typography variant="caption" sx={{ color: '#a7a7a7' }}>
                            Jump into a session based on your tastes
                        </Typography>
                        <Typography variant="h5" mb={2} fontWeight={700}>Start listening</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {(activeCategory !== 'All' ? filteredTracks : data).slice(0, 5).map((track: any) => (
                                <MobileTrackRow key={track.id} track={track} trackList={activeCategory !== 'All' ? filteredTracks : data} />
                            ))}
                        </Box>
                    </Box>
                </Box>

                {/* ── RIGHT SIDEBAR ─────────────────────────────────────── */}
                <Box sx={{
                    width: '100%', minWidth: 0,
                    display: { xs: 'none', sm: 'block' },
                    marginTop: isMobile ? 0 : 8,
                    position: { md: 'sticky' },
                    top: { md: 80 },
                    height: 'fit-content',
                    pr: 1,
                }}>
                    <Box mb={3}>
                        <Typography variant="h6" mb={2}>Likes</Typography>
                        {likedTracks?.slice(0, 5).map((track: any) => (
                            <SidebarTrackRow key={track.id} track={track} subtitle={track.uploader?.name} />
                        ))}
                    </Box>

                    <Divider sx={{ my: 2, backgroundColor: '#333' }} />

                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">History</Typography>
                            <Link href="/history" style={{ textDecoration: 'none' }}>
                                <Typography sx={{
                                    color: '#a7a7a7', fontSize: '13px', fontWeight: 600,
                                    transition: 'color 0.2s ease',
                                    '&:hover': { color: '#ff5500' }
                                }}>
                                    View all
                                </Typography>
                            </Link>
                        </Box>
                        {historyTracks?.slice(0, 5).map((track: any) => (
                            <SidebarTrackRow key={track.id} track={track} subtitle={track.uploader} />
                        ))}
                    </Box>
                </Box>
            </Box>
        </Box>
    )
}

// ─── Mobile row (cũng đồng bộ play/pause) ────────────────────────────────────

const MobileTrackRow = ({ track, trackList }: { track: any; trackList: any[] }) => {
    const { currentTrack, setCurrentTrack, setPlaylistTracks, setCurrentTrackIndex, setPlayMode, setQueueType, addToPlayedTracks } =
        useTrackContext() as ITrackContext

    const isThisPlaying = String(currentTrack?.id) === String(track.id) && currentTrack?.isPlaying

    const handleClick = () => {
        if (String(currentTrack?.id) === String(track.id)) {
            setCurrentTrack({ ...currentTrack, isPlaying: !currentTrack.isPlaying })
            return
        }
        setPlayMode?.('dynamic')
        setQueueType?.('trending')
        setPlaylistTracks(trackList)
        const index = trackList.findIndex((t: any) => String(t.id) === String(track.id))
        setCurrentTrackIndex(index !== -1 ? index : 0)
        setCurrentTrack(mapToShareTrack(track, true))
        addToPlayedTracks?.(String(track.id))
    }

    return (
        <Box
            sx={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'space-between',
                px: 1, py: 0.5, borderRadius: 1,
                transition: 'background 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
            }}
        >
            <Box
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, overflow: 'hidden', cursor: 'pointer' }}
                onClick={handleClick}
            >
                <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Image
                        width={50} height={50} alt={track.title} src={track.imgUrl}
                        style={{ borderRadius: 4, objectFit: 'cover', display: 'block' }}
                    />
                    {isThisPlaying && (
                        <Box sx={{
                            position: 'absolute', inset: 0, borderRadius: 1,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <PauseIcon sx={{ fontSize: 18, color: '#f50' }} />
                        </Box>
                    )}
                </Box>
                <Box sx={{ overflow: 'hidden' }}>
                    <Link href={generateTrackUrl(track)} style={{ textDecoration: 'none', color: 'white' }}>
                        <Typography variant="body2" sx={{
                            fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            color: isThisPlaying ? '#f50' : 'white', transition: 'color 0.2s'
                        }}>
                            {track.title}

                        </Typography>
                    </Link>
                    <Link href={generateProfileUrl(track.uploader.name, track.uploader.id)} style={{ textDecoration: 'none', color: 'white' }}>
                      <Typography variant="caption" sx={{ color: '#a7a7a7', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {track.uploader?.name || "no name"}
                      </Typography>
                  </Link>

                </Box>
            </Box>
            <IconButton size="small" sx={{ color: '#a7a7a7' }}>
                <MoreHorizIcon />
            </IconButton>
        </Box>
    )
}

// ─── Sidebar row ──────────────────────────────────────────────────────────────

const SidebarTrackRow = ({ track, subtitle }: { track: any; subtitle: string }) => {
    const { currentTrack } = useTrackContext() as ITrackContext
    const isThisPlaying = String(currentTrack?.id) === String(track.id) && currentTrack?.isPlaying

    return (
        <Box sx={{
            display: 'flex', gap: 1, mb: 2, cursor: 'pointer',
            borderRadius: 1, p: 0.5,
            transition: 'background 0.2s',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' },
        }}>
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Image
                    src={track.imgUrl} alt={track.title}
                    width={50} height={50}
                    style={{ objectFit: 'cover', borderRadius: 4, display: 'block' }}
                />
                {isThisPlaying && (
                    <Box sx={{
                        position: 'absolute', inset: 0, borderRadius: '4px',
                        bgcolor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <PauseIcon sx={{ fontSize: 16, color: '#f50' }} />
                    </Box>
                )}
            </Box>
            <Box>
                <Link href={generateTrackUrl(track)} style={{ textDecoration: 'none', color: 'white' }}>
                    <Typography
                        className="track-title" variant="body2"
                        sx={{ color: isThisPlaying ? '#f50' : 'white', transition: 'color 0.2s',  fontWeight: 600,
                            maxWidth: 250, whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis' }}
                    >
                        {track.title}
                    </Typography>
                </Link>
                <Typography variant="caption" color="gray">{subtitle}</Typography>
            </Box>
        </Box>
    )
}

export default MainSlider