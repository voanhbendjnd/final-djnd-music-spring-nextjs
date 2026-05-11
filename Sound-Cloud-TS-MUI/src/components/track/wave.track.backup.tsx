'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useSearchParams } from 'next/navigation';
import { useWaveSurfer } from "@/utils/customHook";
import { useTrackContext } from "@/lib/track.wrapper";
import { WaveSurferOptions } from 'wavesurfer.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import './wave.scss';
import { Tooltip } from "@mui/material";
interface IProps {
    comments: IComment[]; // Giả định bạn đã có interface IComment
}
const WaveTrack = (props: IProps) => {
    const searchParams = useSearchParams()
    const {comments} = props;
    const fileName = searchParams.get('audio');
    const trackId = searchParams.get('id');
    const autoPlay = searchParams.get('autoPlay') === 'true';
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverRef = useRef<HTMLDivElement>(null);

    const [time, setTime] = useState<string>("0:00");
    const [duration, setDuration] = useState<string>("0:00");
    const [backgroundColor, setBackgroundColor] = useState<string>("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
    const [trackData, setTrackData] = useState<ITrack | null>(null);
    const { currentTrack, setCurrentTrack, audioRef, savedTimes } = useTrackContext() as ITrackContext;
    const isMatched = currentTrack.trackUrl === fileName;
    const optionsMemo = useMemo((): Omit<WaveSurferOptions, 'container'> => {
        let gradient, progressGradient;
        if (typeof window !== "undefined") {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            // Define the waveform gradient
            gradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35);
            gradient.addColorStop(0, '#656666') // Top color
            gradient.addColorStop((canvas.height * 0.7) / canvas.height, '#656666') // Top color
            gradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
            gradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
            gradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#B1B1B1') // Bottom color
            gradient.addColorStop(1, '#B1B1B1') // Bottom color

            // Define the progress gradient
            progressGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.35)
            progressGradient.addColorStop(0, '#EE772F') // Top color
            progressGradient.addColorStop((canvas.height * 0.7) / canvas.height, '#EB4926') // Top color
            progressGradient.addColorStop((canvas.height * 0.7 + 1) / canvas.height, '#ffffff') // White line
            progressGradient.addColorStop((canvas.height * 0.7 + 2) / canvas.height, '#ffffff') // White line
            progressGradient.addColorStop((canvas.height * 0.7 + 3) / canvas.height, '#F6B094') // Bottom color
            progressGradient.addColorStop(1, '#F6B094') // Bottom color
        }

        return {
            waveColor: gradient,
            progressColor: progressGradient,
            height: 100,
            barWidth: 3,
            url: `/api?audio=${fileName}`,
        }
    }, []);
    const wavesurfer = useWaveSurfer(containerRef, optionsMemo);
    // Sync play/pause from global state
    useEffect(() => {
        if (!wavesurfer) return;
        wavesurfer.setVolume(0);

        const hover = hoverRef.current!;
        const waveform = containerRef.current!;
        const handlePointerMove = (e: PointerEvent) => (hover.style.width = `${e.offsetX}px`);
        waveform.addEventListener('pointermove', handlePointerMove);

        const subscriptions = [
            wavesurfer.on('decode', (d) => setDuration(formatTime(d))),
            wavesurfer.on('interaction', (newTime) => {
                if (isMatched && audioRef.current) {
                    audioRef.current.currentTime = newTime;
                    savedTimes.current[fileName || ''] = newTime;
                    audioRef.current.play();
                }
            })
        ];

        return () => {
            waveform.removeEventListener('pointermove', handlePointerMove);
            subscriptions.forEach((unsub) => unsub());
        };
    }, [wavesurfer, isMatched, audioRef, fileName, savedTimes]);

    // Pause this wavesurfer when another track is playing
    useEffect(() => {
        if (!wavesurfer) return;

        // If another track is playing and this is not the current track, pause this wavesurfer
        if (currentTrack.trackUrl && currentTrack.isPlaying && !isMatched) {
            wavesurfer.pause();
        }

        // If this track becomes the current one, sync and potentially play
        if (isMatched && currentTrack.isPlaying) {
            const syncWavesurfer = () => {
                if (audioRef.current) {
                    const diff = Math.abs(wavesurfer.getCurrentTime() - audioRef.current.currentTime);
                    if (diff > 0.1) wavesurfer.setTime(audioRef.current.currentTime);
                    setTime(formatTime(audioRef.current.currentTime));
                }
            };

            const audioEl = audioRef.current;
            if (audioEl) {
                audioEl.addEventListener('timeupdate', syncWavesurfer);
                audioEl.addEventListener('seeked', syncWavesurfer);

                // Initial sync
                syncWavesurfer();

                return () => {
                    audioEl.removeEventListener('timeupdate', syncWavesurfer);
                    audioEl.removeEventListener('seeked', syncWavesurfer);
                };
            }
            return () => { };
        }

    }, [currentTrack.trackUrl, currentTrack.isPlaying, isMatched, wavesurfer, audioRef]);

    const onPlayClick = useCallback(() => {
        if (isMatched && currentTrack.trackUrl) {
            // Toggle existing track
            const willPlay = !currentTrack.isPlaying;
            setCurrentTrack({ ...currentTrack, isPlaying: willPlay } as any);
            if (willPlay && audioRef.current) {
                audioRef.current.play();
            } else if (!willPlay && audioRef.current) {
                audioRef.current.pause();
                savedTimes.current[fileName || ''] = audioRef.current.currentTime;
            }
        } else {
            // Save old track's time if exists
            if (currentTrack.trackUrl && audioRef.current) {
                savedTimes.current[currentTrack.trackUrl] = audioRef.current.currentTime;
            }

            // Create new track object with available data
            const newTrack = {
                id: fileName || `track-${Date.now()}`,
                trackUrl: fileName,
                title: currentTrack.title || "Unknown Track",
                uploader: currentTrack.uploader || { name: "Unknown Artist" },
                imgUrl: currentTrack.imgUrl || "",
                description: currentTrack.description || "",
                isPlaying: true
            };

            // Set current track first to ensure footer appears
            setCurrentTrack(newTrack as any);

            // Play immediately using wavesurfer
            if (wavesurfer) {
                const savedTime = savedTimes.current[fileName || ''] || 0;
                wavesurfer.setTime(savedTime);
                wavesurfer.play();
            }

            // Also setup footer audio when ready
            setTimeout(() => {
                if (audioRef.current) {
                    const savedTime = savedTimes.current[fileName || ''] || 0;
                    audioRef.current.currentTime = savedTime;
                    audioRef.current.play().catch(e => console.log('Audio play failed:', e));
                }
            }, 100);
        }
    }, [isMatched, currentTrack, fileName, setCurrentTrack, audioRef, savedTimes, wavesurfer]);

    // Extract color from track image using Canvas API
    useEffect(() => {
        const extractColor = () => {
            if (currentTrack?.imgUrl && typeof window !== "undefined") {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d')!;

                    // Set canvas size to smaller for performance
                    const sampleSize = 100;
                    canvas.width = sampleSize;
                    canvas.height = sampleSize;

                    // Draw image to canvas
                    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

                    // Get image data from center area
                    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
                    const data = imageData.data;

                    let r = 0, g = 0, b = 0;
                    let pixelCount = 0;

                    // Sample pixels from center area
                    for (let i = 0; i < data.length; i += 4) {
                        // Skip very light or very dark pixels
                        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        if (brightness > 30 && brightness < 225) {
                            r += data[i];
                            g += data[i + 1];
                            b += data[i + 2];
                            pixelCount++;
                        }
                    }

                    if (pixelCount > 0) {
                        // Calculate average color
                        r = Math.floor(r / pixelCount);
                        g = Math.floor(g / pixelCount);
                        b = Math.floor(b / pixelCount);

                        // Create gradient with overlay for better readability
                        const dominantColor = `rgb(${r}, ${g}, ${b})`;
                        const gradient = `linear-gradient(135deg, ${dominantColor} 0%, rgba(0, 0, 0, 0.8) 100%)`;
                        setBackgroundColor(gradient);
                    } else {
                        // Fallback to default gradient
                        setBackgroundColor("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
                    }
                };

                img.onerror = () => {
                    console.error('Error loading image for color extraction');
                    // Fallback to default gradient
                    setBackgroundColor("linear-gradient(135deg, rgb(106, 112, 67) 0%, rgb(11, 15, 20) 100%)");
                };

                img.src = `${process.env.NEXT_PUBLIC_BE_URL}/api/v1/files/img-tracks/${currentTrack.imgUrl}`;
            }
        };

        extractColor();
    }, [currentTrack?.imgUrl]);

    // Fetch track data and handle autoPlay
    useEffect(() => {
        const fetchTrackData = async () => {
            if (trackId && fileName) {
                try {
                    // Fetch track data from API
                    const response = await fetch(`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/tracks/${trackId}`);
                    if (response.ok) {
                        const trackData = await response.json();
                        setTrackData(trackData.data);

                        // Set current track with full data
                        const fullTrack = {
                            id: trackData.data.id,
                            trackUrl: fileName,
                            title: trackData.data.title,
                            uploader: trackData.data.uploader,
                            imgUrl: trackData.data.imgUrl,
                            description: trackData.data.description,
                            isPlaying: autoPlay
                        };

                        setCurrentTrack(fullTrack as any);

                        // Auto-play if requested
                        if (autoPlay && wavesurfer) {
                            setTimeout(() => {
                                const savedTime = savedTimes.current[fileName || ''] || 0;
                                wavesurfer.setTime(savedTime);
                                wavesurfer.play();

                                // Also play footer audio
                                setTimeout(() => {
                                    if (audioRef.current) {
                                        audioRef.current.currentTime = savedTime;
                                        audioRef.current.play().catch(e => console.log('Auto-play failed:', e));
                                    }
                                }, 200);
                            }, 500);
                        }
                    }
                } catch (error) {
                    console.error('Error fetching track data:', error);
                }
            }
        };

        fetchTrackData();
    }, [trackId, fileName, autoPlay, setCurrentTrack, wavesurfer, audioRef, savedTimes]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60)
        const secondsRemainder = Math.round(seconds) % 60
        const paddedSeconds = `0${secondsRemainder}`.slice(-2)
        return `${minutes}:${paddedSeconds}`
    }
    const calculateLeft = (moment: number) => {
        // wavesurfer.getDuration() trả về tổng số giây của bài hát
        const totalDuration = wavesurfer?.getDuration() || 1;
        const percent = (moment / totalDuration) * 100;
        return `${percent}%`;
    }

    return (
        <div style={{}}>
            <div
                className="wave-background"
                style={{
                    background: backgroundColor,
                    position: 'relative'
                }}
            >
                {/* Overlay for better text readability */}
                <div
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.3)',
                        zIndex: 1
                    }}
                />
                <div className="left" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="info" style={{ display: "flex" }}>
                        <div>
                            <div className="wave-button"
                                 onClick={() => onPlayClick()}>
                                {currentTrack.isPlaying && isMatched ?
                                    <PauseIcon
                                        sx={{ fontSize: 30, color: "white" }}
                                    />
                                    :
                                    <PlayArrowIcon
                                        sx={{ fontSize: 30, color: "white" }}
                                    />
                                }
                            </div>
                        </div>
                        <div style={{ marginLeft: 20 }}>
                            <div style={{
                                padding: "0 5px",
                                background: "#333",
                                fontSize: 30,
                                width: "fit-content",
                                color: "white"
                            }}>
                                {currentTrack.title}
                            </div>
                            <div style={{
                                padding: "0 5px",
                                marginTop: 10,
                                background: "#333",
                                fontSize: 20,
                                width: "fit-content",
                                color: "white"
                            }}
                            >
                                {currentTrack.uploader.name}
                            </div>
                        </div>
                    </div>
                    <div ref={containerRef} className="wave-form-container">
                        <div className="time" >{time}</div>
                        <div className="duration" >{duration}</div>
                        <div ref={hoverRef} className="hover-wave"></div>
                        <div className="overlay"
                             style={{
                                 position: "absolute",
                                 height: "30px",
                                 width: "100%",
                                 bottom: "0",
                                 // background: "#ccc"
                                 backdropFilter: "brightness(0.5)"
                             }}
                        ></div>
                        <div className="comments" >
                            {
                                comments.map(it => {
                                    return (
                                        <Tooltip title={it.content} arrow>
                                            <img src={`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/files/img-tracks/1771586892954-1503160828434_300.jpg`} alt='avatar' key={it.id}
                                                 onPointerMove={(e) => {
                                                     const hover = hoverRef.current!;
                                                     hover.style.width = calculateLeft(it.moment)
                                                 }}
                                                 style={{
                                                     left: calculateLeft(it.moment),
                                                     borderRadius: '50%', // Thay 100 bằng '50%' cho tròn trịa
                                                     position: 'absolute' // Đảm bảo có absolute để left hoạt động
                                                 }}                                            />
                                        </Tooltip>

                                    )
                                })
                            }
                        </div>

                    </div>
                </div>
                <div className="right"
                     style={{
                         width: "25%",
                         padding: 15,
                         display: "flex",
                         alignItems: "center",
                         position: 'relative',
                         zIndex: 2
                     }}
                >
                    <div className="track-image-container" style={{
                        width: '250px',
                        height: '250px',
                        overflow: 'hidden',
                        borderRadius: '10px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#333'
                    }}>
                        <img
                            src={`${process.env.NEXT_PUBLIC_BE_URL}/api/v1/files/img-tracks/${currentTrack.imgUrl}`}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover', // QUAN TRỌNG: Giữ tỷ lệ, cắt ảnh cho vừa khung chứ không bóp méo
                                objectPosition: 'center', // Luôn lấy phần giữa của ảnh
                                display: 'block'
                            }}
                            alt="Track cover"
                        />
                    </div>
                </div>
            </div>
        </div >
    )
}

export default WaveTrack;