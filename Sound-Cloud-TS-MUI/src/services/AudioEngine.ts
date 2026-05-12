type AudioState = {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    trackId: number | null;
};

class AudioEngine {
    private static instance: AudioEngine;
    private audio: HTMLAudioElement | null = null;
    private state: AudioState = {
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        trackId: null,
    };

    private listeners: ((state: AudioState) => void)[] = [];

    private constructor() {
        if (typeof window !== 'undefined') {
            this.audio = new Audio();
            this.setupListeners();
        }
    }

    public static getInstance(): AudioEngine {
        if (!AudioEngine.instance) {
            AudioEngine.instance = new AudioEngine();
        }
        return AudioEngine.instance;
    }

    private setupListeners() {
        if (!this.audio) return;

        this.audio.onplay = () => this.updateState({ isPlaying: true });
        this.audio.onpause = () => this.updateState({ isPlaying: false });
        this.audio.ontimeupdate = () => this.updateState({ currentTime: this.audio?.currentTime || 0 });
        this.audio.ondurationchange = () => this.updateState({ duration: this.audio?.duration || 0 });
    }

    private updateState(patch: Partial<AudioState>) {
        this.state = { ...this.state, ...patch };
        this.listeners.forEach(l => l(this.state));
    }

    public subscribe(listener: (state: AudioState) => void) {
        this.listeners.push(listener);
        listener(this.state);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    public play(url?: string, trackId?: number) {
        if (!this.audio) return;
        if (url && this.audio.src !== url) {
            this.audio.src = url;
            this.updateState({ trackId: trackId ?? null });
        }
        this.audio.play().catch(console.error);
    }

    public pause() {
        this.audio?.pause();
    }

    public seek(time: number) {
        if (this.audio) {
            this.audio.currentTime = time;
        }
    }

    public setPlaybackRate(rate: number) {
        if (this.audio) {
            this.audio.playbackRate = rate;
        }
    }

    public getAudio() {
        return this.audio;
    }

    public getState() {
        return this.state;
    }
}

export default AudioEngine.getInstance();
