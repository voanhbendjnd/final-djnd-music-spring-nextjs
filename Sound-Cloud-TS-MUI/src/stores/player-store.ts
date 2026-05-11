import { create } from 'zustand';
import { audioEngine } from '@/lib/audio-engine';

interface PlayerState {
  currentTrack: IShareTrack | null;
  isPlaying: boolean;
  playlist: ITrack[];
  currentIndex: number;
  volume: number;
  currentTime: number;
  duration: number;
  viewedTracks: Set<string>;
}

interface PlayerActions {
  playTrack: (track: IShareTrack, playlist?: ITrack[], index?: number) => void;
  pause: () => void;
  togglePlay: () => void;
  next: () => void;
  previous: () => void;
  setPlaylist: (playlist: ITrack[], index?: number) => void;
  setVolume: (volume: number) => void;
  seek: (time: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  markTrackAsViewed: (trackId: string) => void;
}

interface PlayerStore extends PlayerState, PlayerActions {}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  playlist: [],
  currentIndex: 0,
  volume: 0.5,
  currentTime: 0,
  duration: 0,
  viewedTracks: new Set(),

  playTrack: (track, playlist = [], index = 0) => {
    set({
      currentTrack: track,
      isPlaying: true,
      playlist: playlist.length > 0 ? playlist : get().playlist,
      currentIndex: playlist.length > 0 ? index : get().currentIndex,
    });
    
    audioEngine.play(track.trackUrl).catch(err => console.error('Play failed:', err));
  },

  pause: () => {
    set({ isPlaying: false });
    audioEngine.pause();
  },

  togglePlay: () => {
    const { isPlaying, currentTrack } = get();
    if (isPlaying) {
      get().pause();
    } else if (currentTrack) {
      audioEngine.play(currentTrack.trackUrl).catch(err => console.error('Play failed:', err));
      set({ isPlaying: true });
    }
  },

  next: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % playlist.length;
    const nextTrack = playlist[nextIndex];
    
    // Convert ITrack to IShareTrack
    const shareTrack: IShareTrack = {
      ...nextTrack,
      isPlaying: true,
    };
    
    get().playTrack(shareTrack, playlist, nextIndex);
  },

  previous: () => {
    const { playlist, currentIndex } = get();
    if (playlist.length === 0) return;
    
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length;
    const prevTrack = playlist[prevIndex];
    
    // Convert ITrack to IShareTrack
    const shareTrack: IShareTrack = {
      ...prevTrack,
      isPlaying: true,
    };
    
    get().playTrack(shareTrack, playlist, prevIndex);
  },

  setPlaylist: (playlist, index = 0) => {
    set({ playlist, currentIndex: index });
  },

  setVolume: (volume) => {
    set({ volume });
    audioEngine.setVolume(volume);
  },

  seek: (time) => {
    audioEngine.seek(time);
  },

  setCurrentTime: (time) => {
    set({ currentTime: time });
  },

  setDuration: (duration) => {
    set({ duration });
  },

  markTrackAsViewed: (trackId) => {
    set((state) => {
      const newViewedTracks = new Set(state.viewedTracks);
      newViewedTracks.add(trackId);
      return { viewedTracks: newViewedTracks };
    });
  },
}));

// Setup audio engine event listeners
if (typeof window !== 'undefined') {
  audioEngine.on('timeupdate', () => {
    usePlayerStore.setState({
      currentTime: audioEngine.getCurrentTime(),
    });
  });

  audioEngine.on('loadedmetadata', () => {
    usePlayerStore.setState({
      duration: audioEngine.getDuration(),
    });
  });

  audioEngine.on('play', () => {
    usePlayerStore.setState({ isPlaying: true });
  });

  audioEngine.on('pause', () => {
    usePlayerStore.setState({ isPlaying: false });
  });

  audioEngine.on('ended', () => {
    usePlayerStore.getState().next();
  });
}
