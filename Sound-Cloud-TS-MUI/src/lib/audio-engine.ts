'use client'
class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio();
      this.audio.preload = 'none';
      this.setupEventListeners();
    }
  }

  private setupEventListeners() {
    if (!this.audio) return;

    this.audio.addEventListener('timeupdate', () => this.emit('timeupdate'));
    this.audio.addEventListener('ended', () => this.emit('ended'));
    this.audio.addEventListener('play', () => this.emit('play'));
    this.audio.addEventListener('pause', () => this.emit('pause'));
    this.audio.addEventListener('error', () => this.emit('error'));
    this.audio.addEventListener('loadedmetadata', () => this.emit('loadedmetadata'));
  }

  play(url: string): Promise<void> {
    if (!this.audio) return Promise.resolve();

    if (this.audio.src !== url) {
      this.audio.src = url;
    }

    return this.audio.play();
  }

  pause(): void {
    this.audio?.pause();
  }

  stop(): void {
    if (!this.audio) return;

    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(volume: number): void {
    if (!this.audio) return;

    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  seek(time: number): void {
    if (!this.audio) return;

    this.audio.currentTime = time;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }

  getVolume(): number {
    return this.audio?.volume || 0;
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function): void {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string): void {
    this.listeners.get(event)?.forEach(callback => callback());
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }
}

export const audioEngine = new AudioEngine();