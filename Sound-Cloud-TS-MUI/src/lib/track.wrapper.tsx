'use client'

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from "react";
import HistoryTrackingProvider from "@/lib/history.tracking.provider";
import axiosInstance from "@/utils/axios-instance";
import { audioEngine } from "@/lib/audio-engine";

const TrackContext = createContext<ITrackContext | null>(null);

// ─── Safe track mapper ─────────────────────────────────────────────────────────
// FIX #1 — Centralise the raw→IShareTrack mapping so every caller
// goes through the same null-safe path. No more scattered `|| ""` guards.

const mapToShareTrack = (raw: any, isPlaying = true): IShareTrack => ({
    id: String(raw?.id ?? ''),
    title: String(raw?.title ?? ''),
    description: String(raw?.description ?? ''),
    category: String(raw?.category ?? ''),
    imgUrl: String(raw?.imgUrl ?? ''),
    trackUrl: String(raw?.trackUrl ?? ''),
    peaks: String(raw?.peaks ?? ''),
    countLike: Number(raw?.countLikes ?? raw?.countLike ?? 0),
    countPlay: Number(raw?.countPlays ?? raw?.countPlay ?? 0),
    isLiked: Boolean(raw?.isLiked),
    isYoutube: Boolean(raw?.isYoutube),
    waveform_url:String(raw?.waveform_url ?? ''),
    isPlaying,
    uploader: {
        id: String(raw?.uploader?.id ?? ''),
        name: String(raw?.uploader?.name ?? ''),
        avatar: String(raw?.uploader?.avatar ?? ''),
    },
    createdAt: String(raw?.createdAt ?? ''),
    updatedAt: String(raw?.updatedAt ?? ''),
});

// ─── Initial state ─────────────────────────────────────────────────────────────

const INIT_TRACK: IShareTrack = mapToShareTrack({});

// ─── Provider ──────────────────────────────────────────────────────────────────

export const TrackContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [currentTrack, setCurrentTrack] = useState<IShareTrack>(INIT_TRACK);
    const audioRef = useRef<HTMLAudioElement | null>(audioEngine.getAudioElement());
    const savedTimes = useRef<Record<string, number>>({});

    // FIX #2 — viewedTracks: spread into a new Set so React sees a new reference
    const [viewedTracks, setViewedTracks] = useState<Set<string>>(new Set());
    const markTrackAsViewed = useCallback((trackId: string) => {
        // @ts-ignore
        setViewedTracks(prev => new Set([...prev, trackId]));
    }, []);

    // ── Playlist state ───────────────────────────────────────────────────────
    const [currentPlaylist, setCurrentPlaylist] = useState<IPlaylist | null>(null);
    const [playlistTracks, setPlaylistTracks] = useState<any[]>([]);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    // ── New playback states ──────────────────────────────────────────────────
    const [isShuffle, setIsShuffle] = useState(false);
    const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
    const [playMode, setPlayMode] = useState<'queue' | 'dynamic'>('queue');
    const [queueType, setQueueType] = useState<any>(null);
    const [shuffledIndexes, setShuffledIndexes] = useState<number[]>([]);
    const [playedTrackIds, setPlayedTrackIds] = useState<Set<string>>(new Set());

    const addToPlayedTracks = useCallback((trackId: string) => {
        //@ts-ignore
        setPlayedTrackIds(prev => new Set([...prev, trackId]));
    }, []);

    // ── Utilities ────────────────────────────────────────────────────────────
    const generateShuffledIndexes = useCallback((length: number, currentIndex: number) => {
        const indexes = Array.from({ length }, (_, i) => i).filter(i => i !== currentIndex);
        // Fisher-Yates shuffle
        for (let i = indexes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
        }
        return [currentIndex, ...indexes];
    }, []);

    // Effect to regenerate shuffled indexes when shuffle is toggled or tracks change
    useEffect(() => {
        if (isShuffle && playlistTracks.length > 0) {
            setShuffledIndexes(generateShuffledIndexes(playlistTracks.length, currentTrackIndex));
        } else {
            setShuffledIndexes([]);
        }
    }, [isShuffle, playlistTracks.length]);

    // ── Recommendation Logic ─────────────────────────────────────────────────
    const fetchRecommendations = async (track: IShareTrack) => {
        try {
            const excludeIds = Array.from(playedTrackIds).join(',');
            const res = await axiosInstance.get<any, IBackendRes<IModelPaginate<ITrack>>>(
                `/api/v1/tracks/recommendations?category=${track.category}&size=5&excludeIds=${excludeIds}`
            );

            return res?.data?.result ?? [];
        } catch (error) {
            console.error('Failed to fetch recommendations:', error);
            return [];
        }
    };

    // ── Navigation ───────────────────────────────────────────────────────────

    // FIX #3 — Read index through a ref inside the callback so the closure
    // is always fresh without listing currentTrackIndex in deps
    // (listing it causes the callback to be recreated on every track change,
    // which in turn triggers re-mounts in components that receive it as a prop).
    const currentIndexRef = useRef(currentTrackIndex);
    currentIndexRef.current = currentTrackIndex;

    const playNextTrack = useCallback(async () => {
        if (repeatMode === 'one' && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Repeat play failed:', e));
            return;
        }

        const tracks = playlistTracks;
        if (tracks.length === 0) return;

        let nextIndex: number;

        if (isShuffle && shuffledIndexes.length > 0) {
            const currentShufflePos = shuffledIndexes.indexOf(currentIndexRef.current);
            if (currentShufflePos !== -1 && currentShufflePos < shuffledIndexes.length - 1) {
                nextIndex = shuffledIndexes[currentShufflePos + 1];
            } else {
                // End of shuffled list
                if (repeatMode === 'all') {
                    const newShuffled = generateShuffledIndexes(tracks.length, currentIndexRef.current);
                    setShuffledIndexes(newShuffled);
                    nextIndex = newShuffled[1] ?? newShuffled[0];
                } else {
                    nextIndex = -1;
                }
            }
        } else {
            nextIndex = currentIndexRef.current + 1;
            if (nextIndex >= tracks.length) {
                nextIndex = (repeatMode === 'all') ? 0 : -1;
            }
        }

        if (nextIndex !== -1) {
            const next = tracks[nextIndex];
            setCurrentTrack(mapToShareTrack(next, true));
            setCurrentTrackIndex(nextIndex);
            currentIndexRef.current = nextIndex;
            addToPlayedTracks(String(next.id));
        } else if (playMode === 'dynamic') {
            // Fetch recommendations and append
            const lastTrack = tracks[currentIndexRef.current];
            const recommendations = await fetchRecommendations(mapToShareTrack(lastTrack));
            if (recommendations.length > 0) {
                const updatedTracks = [...tracks, ...recommendations];
                setPlaylistTracks(updatedTracks);

                const nextIdx = tracks.length; // First new track
                const next = updatedTracks[nextIdx];
                setCurrentTrack(mapToShareTrack(next, true));
                setCurrentTrackIndex(nextIdx);
                currentIndexRef.current = nextIdx;
                addToPlayedTracks(String(next.id));
            }
        }
    }, [playlistTracks, isShuffle, shuffledIndexes, repeatMode, playMode, playedTrackIds]);

    const playPreviousTrack = useCallback(() => {
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Restart play failed:', e));
            return;
        }

        const tracks = playlistTracks;
        if (tracks.length === 0) return;

        let prevIndex: number;

        if (isShuffle && shuffledIndexes.length > 0) {
            const currentShufflePos = shuffledIndexes.indexOf(currentIndexRef.current);
            if (currentShufflePos > 0) {
                prevIndex = shuffledIndexes[currentShufflePos - 1];
            } else {
                prevIndex = (repeatMode === 'all') ? shuffledIndexes[shuffledIndexes.length - 1] : currentIndexRef.current;
            }
        } else {
            prevIndex = currentIndexRef.current - 1;
            if (prevIndex < 0) {
                prevIndex = (repeatMode === 'all') ? tracks.length - 1 : 0;
            }
        }

        const prev = tracks[prevIndex];
        if (prev) {
            setCurrentTrack(mapToShareTrack(prev, true));
            setCurrentTrackIndex(prevIndex);
            currentIndexRef.current = prevIndex;
        }
    }, [playlistTracks, isShuffle, shuffledIndexes, repeatMode]);

    return (
        <TrackContext.Provider value={{
            currentTrack,
            setCurrentTrack,
            audioRef,
            savedTimes,
            viewedTracks,
            markTrackAsViewed,
            currentPlaylist,
            setCurrentPlaylist,
            playlistTracks,
            setPlaylistTracks,
            currentTrackIndex,
            setCurrentTrackIndex,
            playNextTrack,
            playPreviousTrack,

            isShuffle,
            setIsShuffle,
            repeatMode,
            setRepeatMode,
            playMode,
            setPlayMode,
            queueType,
            setQueueType,
            shuffledIndexes,
            playedTrackIds,
            addToPlayedTracks,
        }}>
            <HistoryTrackingProvider>
                {children}
            </HistoryTrackingProvider>
        </TrackContext.Provider>
    );
};

export const useTrackContext = () => useContext(TrackContext);

// ─── Re-export mapper so callers (search-bar, playlist-card…) ─────────────────
// can build a safe IShareTrack without copy-pasting the guard logic.
export { mapToShareTrack };