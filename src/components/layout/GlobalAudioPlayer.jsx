import { useEffect, useRef, useContext, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { useTranslation } from "react-i18next";
import { AudioContext } from "../../context/AudioContext";

const STORAGE_KEY = 'tetrone_audio_state';

const PlayIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>);
const PauseIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>);
const LoopIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>);
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const MusicIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>);
const VolumeIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>);

export default function GlobalAudioPlayer() {
    const { t } = useTranslation();
    const { currentTrack, isPlaying, setIsPlaying, closePlayer, channelRef } = useContext(AudioContext);

    const waveformRef = useRef(null);
    const wavesurferRef = useRef(null);
    const audioElRef = useRef(null);

    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [showVolumePanel, setShowVolumePanel] = useState(false);

    const [playbackRate, setPlaybackRate] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY))?.speed || 1; } catch { return 1; }
    });
    const [isLooping, setIsLooping] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY))?.loop || false; } catch { return false; }
    });
    const [volume, setVolume] = useState(() => {
        try { return JSON.parse(localStorage.getItem(STORAGE_KEY))?.volume ?? 1; } catch { return 1; }
    });

    const stateRef = useRef({ currentTrack, playbackRate, isLooping, volume });
    useEffect(() => {
        stateRef.current = { currentTrack, playbackRate, isLooping, volume };
    }, [currentTrack, playbackRate, isLooping, volume]);

    const saveStateToStorage = (time) => {
        const { currentTrack: track, playbackRate: speed, isLooping: loop, volume: vol } = stateRef.current;
        if (!track) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ track, time, speed, loop, volume: vol }));
    };

    useEffect(() => {
        if (!currentTrack || !waveformRef.current) return;

        setIsReady(false);
        setHasError(false);

        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = currentTrack.url.replace(/^https?:\/\/[^\/]+/, '');
        audioElRef.current = audio;

        const ws = WaveSurfer.create({
            container: waveformRef.current,
            media: audio,
            waveColor: 'rgba(91, 155, 213, 0.4)',
            progressColor: '#0064d1',
            cursorColor: '#1a1a1a',
            barWidth: 2,
            barGap: 2,
            height: 40,
            normalize: true,
            interactivity: true,
            dragToSeek: true,    
        });
        wavesurferRef.current = ws;

        ws.on('play', () => {
            setIsPlaying(true);
            if (channelRef?.current) channelRef.current.postMessage('PAUSE_AUDIO');
        });

        ws.on('pause', () => {
            setIsPlaying(false);
            saveStateToStorage(ws.getCurrentTime());
        });

        ws.on('interaction', () => {
            saveStateToStorage(ws.getCurrentTime());
        });

        let lastSave = 0;
        ws.on('timeupdate', (currentTime) => {
            const now = Date.now();
            if (now - lastSave > 1000) {
                saveStateToStorage(currentTime);
                lastSave = now;
            }
        });

        ws.on('ready', () => {
            setIsReady(true);
            setHasError(false);
            ws.setPlaybackRate(stateRef.current.playbackRate);
            ws.setVolume(stateRef.current.volume);
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
                if (saved && saved.track && saved.track.id === currentTrack.id && saved.time) {
                    ws.setTime(saved.time);
                }
            } catch (e) { }
            if (isPlaying) ws.play().catch(() => setIsPlaying(false));
        });

        ws.on('error', () => {
            setHasError(true);
            setIsReady(false);
        });

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.pause();
                saveStateToStorage(wavesurferRef.current.getCurrentTime());
                wavesurferRef.current.destroy();
            }
            if (audioElRef.current) {
                audioElRef.current.pause();
                audioElRef.current.src = "";
            }
            wavesurferRef.current = null;
        };
    }, [currentTrack]);

    useEffect(() => {
        if (!wavesurferRef.current) return;
        const handleFinish = () => {
            if (isLooping) {
                wavesurferRef.current.play();
            } else {
                setIsPlaying(false);
                saveStateToStorage(0);
            }
        };
        wavesurferRef.current.on('finish', handleFinish);
        return () => wavesurferRef.current.un('finish', handleFinish);
    }, [isLooping, setIsPlaying]);

    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            if (isPlaying && !wavesurferRef.current.isPlaying()) {
                wavesurferRef.current.play().catch(() => setIsPlaying(false));
            } else if (!isPlaying && wavesurferRef.current.isPlaying()) {
                wavesurferRef.current.pause();
            }
        }
    }, [isPlaying, isReady]);

    const toggleSpeed = () => {
        if (!wavesurferRef.current) return;
        const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
        setPlaybackRate(nextSpeed);
        wavesurferRef.current.setPlaybackRate(nextSpeed);
        saveStateToStorage(wavesurferRef.current.getCurrentTime());
    };

    const toggleLoop = () => {
        setIsLooping(!isLooping);
        saveStateToStorage(wavesurferRef.current?.getCurrentTime() || 0);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(newVolume);
        }
        saveStateToStorage(wavesurferRef.current?.getCurrentTime() || 0);
    };

    const handleClose = () => {
        if (wavesurferRef.current) wavesurferRef.current.pause();
        closePlayer();
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            track: null,
            time: 0,
            speed: playbackRate,
            loop: isLooping,
            volume: volume
        }));
    };

    const playPauseClick = () => {
        if (!isPlaying && channelRef?.current) {
            channelRef.current.postMessage('PAUSE_AUDIO');
        }
        setIsPlaying(!isPlaying);
    };

    if (!currentTrack) return null;

    const trackName = currentTrack.original_name || currentTrack.file_name;

    return (
        <div className="tetrone-global-player">
            <div className="tetrone-player-header">
                <div className="tetrone-player-cover">
                    {currentTrack.cover_url ? (
                        <img src={currentTrack.cover_url} alt="" />
                    ) : (
                        <MusicIcon />
                    )}
                </div>

                <div className="tetrone-player-info">
                    <span className="tetrone-player-label">{t('audio.now_playing')}</span>
                    <strong className="tetrone-player-title" title={trackName}>
                        {trackName}
                    </strong>
                </div>
                <button className="tetrone-player-close" onClick={handleClose}>
                    <CloseIcon />
                </button>
            </div>

            {hasError ? (
                <div className="tetrone-player-error">{t('audio.error_loading')}</div>
            ) : (
                <div className="tetrone-player-waveform" ref={waveformRef}></div>
            )}

            <div className="tetrone-player-controls">
                <button className={`tetrone-player-btn ${isLooping ? 'active' : ''}`} onClick={toggleLoop} title={t('audio.loop')}>
                    <LoopIcon />
                </button>
                <button className="tetrone-player-btn-main" onClick={playPauseClick} disabled={!isReady || hasError}>
                    {!isReady && !hasError ? <span className="tetrone-player-loading">⏳</span> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
                </button>
                <button className="tetrone-player-btn tetrone-player-speed" onClick={toggleSpeed} title={t('audio.speed')}>
                    {playbackRate}x
                </button>

                <div
                    className="tetrone-player-volume-container"
                    onMouseEnter={() => setShowVolumePanel(true)}
                    onMouseLeave={() => setShowVolumePanel(false)}
                >
                    <button className="tetrone-player-btn">
                        <VolumeIcon />
                    </button>

                    {showVolumePanel && (
                        <div className="tetrone-player-volume-popover">
                            <div className="tetrone-volume-bridge"></div>
                            <input
                                type="range"
                                className="tetrone-player-volume-slider"
                                min="0"
                                max="1"
                                step="0.05"
                                value={volume}
                                onChange={handleVolumeChange}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}