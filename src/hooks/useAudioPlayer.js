import { useEffect, useRef, useContext, useState, useCallback } from "react";
import Hls from "hls.js";
import { AudioContext } from "../context/AudioContext";
import { API_URL } from "../config.js";

const STORAGE_KEY = 'tetrone_audio_state';

const getFullMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === 'backend' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
                const baseApi = API_URL ? API_URL.replace(/\/v1\/?$/, '') : '';
                return `${baseApi}${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return url;
        }
        return url;
    }
    const baseApi = API_URL ? API_URL.replace(/\/v1\/?$/, '') : '';
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    return `${baseApi}${cleanPath}`;
};

export const useAudioPlayer = () => {
    const { audioRef, currentTrack, isPlaying, setIsPlaying, closePlayer, channelRef } = useContext(AudioContext);
    const hlsRef = useRef(null);


    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);

    // ВАЖЛИВО: state для currentTime та duration видалено звідси!

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

    const saveStateToStorage = useCallback((time) => {
        const { currentTrack: track, playbackRate: speed, isLooping: loop, volume: vol } = stateRef.current;
        if (!track) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ track, time, speed, loop, volume: vol }));
    }, []);

    useEffect(() => {
        if (!currentTrack) return;

        const audio = audioRef.current;
        setIsReady(false);
        setHasError(false);

        audio.pause();
        audio.removeAttribute('src');
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        // Безпечне отримання URL треку
        const rawUrl = currentTrack.file_url || currentTrack.url || '';
        if (!rawUrl) {
            setHasError(true);
            return;
        }

        const mediaUrl = getFullMediaUrl(rawUrl);
        audio.crossOrigin = "anonymous";
        audio.loop = stateRef.current.isLooping;
        audio.volume = stateRef.current.volume;
        audio.playbackRate = stateRef.current.playbackRate;

        // Отримання збереженого часу
        let savedTime = 0;
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.track && saved.track.id === currentTrack.id && saved.time) {
                savedTime = saved.time;
            }
        } catch (e) { }

        const restoreTimeAndPlay = () => {
            if (savedTime > 0) {
                audio.currentTime = savedTime;
            }
            setIsReady(true);
            if (isPlaying) {
                audio.play().catch(() => setIsPlaying(false));
            }
        };

        // Ініціалізація HLS або звичайного аудіо
        if (mediaUrl.includes('.m3u8') && Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(mediaUrl);
            hls.attachMedia(audio);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                restoreTimeAndPlay();
            });

            hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                if (data.details?.totalduration) {
                    audio.setAttribute('data-hls-duration', data.details.totalduration);
                    audio.dispatchEvent(new Event('durationchange'));
                }
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    setHasError(true);
                    setIsReady(false);
                }
            });
        } else {
            audio.src = mediaUrl;

            const handleLoadedMetadata = () => {
                restoreTimeAndPlay();
            };

            audio.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        }

        // Автоматичне фонове збереження прогресу (кожні 1 сек та при виході)
        let lastSavedSec = -1;
        const onTimeUpdate = () => {
            const currentSec = Math.floor(audio.currentTime);
            if (currentSec !== lastSavedSec && currentSec > 0) {
                lastSavedSec = currentSec;
                saveStateToStorage(audio.currentTime);
            }
        };

        const onPlay = () => {
            setIsPlaying(true);
            if (channelRef?.current) channelRef.current.postMessage('PAUSE_AUDIO');
        };
        const onPause = () => {
            setIsPlaying(false);
            saveStateToStorage(audio.currentTime);
        };
        const onEnded = () => setIsPlaying(false);
        const onError = () => setHasError(true);

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            saveStateToStorage(audio.currentTime);
            audio.pause();
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [currentTrack]);

    useEffect(() => {
        const audio = audioRef.current;
        if (isReady) {
            if (isPlaying && audio.paused) {
                audio.play().catch(() => setIsPlaying(false));
            } else if (!isPlaying && !audio.paused) {
                audio.pause();
            }
        }
    }, [isPlaying, isReady, setIsPlaying]);

    const playPauseClick = () => setIsPlaying(!isPlaying);

    const toggleSpeed = () => {
        const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
        setPlaybackRate(nextSpeed);
        stateRef.current.playbackRate = nextSpeed;
        audioRef.current.playbackRate = nextSpeed;
    };

    const toggleLoop = () => {
        const nextLoop = !isLooping;
        setIsLooping(nextLoop);
        stateRef.current.isLooping = nextLoop;
        audioRef.current.loop = nextLoop;
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        stateRef.current.volume = newVolume;
        audioRef.current.volume = newVolume;
    };

    const handleClose = () => {
        audioRef.current.pause();
        stateRef.current.currentTrack = null;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            speed: playbackRate,
            loop: isLooping,
            volume: volume
        }));
        closePlayer();
    };

    return {
        audioRef, // Повертаємо посилання на аудіо
        isReady, hasError,
        playbackRate, isLooping, volume,
        playPauseClick, toggleSpeed, toggleLoop,
        handleVolumeChange, handleClose
    };
};