'use client'

import { useEffect, useMemo, useCallback } from 'react';
import { Container, Typography, Box } from '@mui/material';
import { useToggleTrackInPlaylist, usePlaylistById } from '@/hooks/use-playlist';
import { useQueryClient } from "@tanstack/react-query";
import { useTrackContext } from '@/lib/track.wrapper';
import { toast } from "react-toastify";

// Sub-components
import PlaylistHeader from './components/PlaylistHeader';
import WaveSection from './components/WaveSection';
import TrackList from './components/TrackList';
import ModalUpdatePlaylist from './ModalUpdatePlaylist';
import { useState } from 'react';

interface IProps {
    playlist: IPlaylist;
    playlistId: number;
}

const PlaylistDetailClient = ({ playlist: initialPlaylist, playlistId }: IProps) => {
    const { data: resPlaylist } = usePlaylistById(playlistId);
    const playlist = resPlaylist?.data as unknown as IPlaylist || initialPlaylist;
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const {
        currentTrack,
        setCurrentTrack,
        setCurrentPlaylist,
        setPlaylistTracks,
        setCurrentTrackIndex,
        audioRef,
        setPlayMode,
        setQueueType,
        addToPlayedTracks
    } = useTrackContext() as ITrackContext;

    // Map backend track to context ITrack
    const mapTrack = useCallback((track: any): ITrack => ({
        id: track.id.toString(),
        title: track.title,
        imgUrl: track.imgUrl || "",
        trackUrl: track.trackUrl,
        countLike: track.countLikes || 0,
        countPlay: track.countPlays || 0,
        isLiked: track.isLiked || false,
        uploader: {
            id: track.uploader?.id?.toString(),
            name: track.uploader?.name,
            avatar: track.uploader?.avatar || "",
        },
        isPlaying: false,
        description: track.description || "",
        category: track.category,
        peaks: track.peaks || undefined,
        createdAt: track.createdAt || "",
        updatedAt: track.updatedAt || ""
    }), []);

    // Strict activeTrack logic: only show waveform if track is in this playlist AND is playing
    const activeTrack = useMemo(() => {
        if (!playlist?.playlistTracks?.length || !currentTrack.id) return null;

        const isTrackInPlaylist = playlist.playlistTracks.some((t: any) => t.id.toString() === currentTrack.id);
        
        if (isTrackInPlaylist && currentTrack.isPlaying) {
            return currentTrack as unknown as ITrack;
        }

        return null;
    }, [playlist, currentTrack]);

    // Set playlist context when data loads
    useEffect(() => {
        if (playlist) {
            setCurrentPlaylist(playlist);
            setPlaylistTracks(playlist.playlistTracks || []);
        }
    }, [playlist, setCurrentPlaylist, setPlaylistTracks]);

    const toggleTrackMutation = useToggleTrackInPlaylist();

    const handleToggleTrack = async (trackId: number) => {
        try {
            await toggleTrackMutation.mutateAsync({
                playlistId,
                trackId,
                isAdded: false // removing
            });
            // queryClient invalidation is handled by the hook
            toast.success('Track removed from playlist');
        } catch (error) {
            toast.error('Failed to update playlist');
        }
    };

    const handlePlayTrack = (track: any, index: number) => {
        const isCurrentTrack = currentTrack.id === track.id.toString();

        if (isCurrentTrack) {
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({
                ...currentTrack,
                isPlaying: willPlay
            });

            if (audioRef.current) {
                if (willPlay) {
                    audioRef.current.play().catch(e => console.log('Play failed:', e));
                } else {
                    audioRef.current.pause();
                }
            }
        } else {
            setPlayMode('queue');
            setQueueType('playlist');
            addToPlayedTracks(track.id.toString());
            
            setCurrentTrack({
                ...mapTrack(track),
                isPlaying: true
            });
            setCurrentTrackIndex(index);
        }
    };

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#121212', py: 4,                 marginBottom:15
        }}>
            <Container maxWidth="lg">
                <PlaylistHeader 
                    playlist={playlist} 
                    onEditClick={() => setIsEditModalOpen(true)}
                />
                
                <WaveSection track={activeTrack} />

                <Typography variant="h5" sx={{ marginTop: 5, color: '#fff', mb: 3, fontWeight: 600 }}>
                    Tracks
                </Typography>
                
                <TrackList
                    tracks={playlist.playlistTracks}
                    currentTrackId={currentTrack.id}
                    isPlaying={currentTrack.isPlaying}
                    onPlay={handlePlayTrack}
                    onDelete={handleToggleTrack}
                />
            </Container>

            <ModalUpdatePlaylist
                open={isEditModalOpen}
                setOpen={setIsEditModalOpen}
                playlist={playlist}
            />
        </Box>
    );
};

export default PlaylistDetailClient;
