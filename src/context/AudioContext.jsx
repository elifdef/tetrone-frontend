import { createContext, useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";

export const AudioContext = createContext();

const STORAGE_KEY = 'tetrone_audio_state';

const readStorage = () => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
        return {};
    }
};

const getCleanMediaUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            const parsed = new URL(url);
            if (parsed.hostname === 'backend' || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
                return `${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return url;
        }
        return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
};

export const AudioProvider = ({ children }) => {
    const audioRef = useRef(null);
    if (!audioRef.current) {
        audioRef.current = new Audio();
    }

    const hlsRef = useRef(null);
    const channelRef = useRef(null);
    const activeTrackRef = useRef(null);

    const initialStored = readStorage();

    const [currentTrack, setCurrentTrack] = useState(() => initialStored.track || null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);

    const [playbackRate, setPlaybackRate] = useState(() => initialStored.speed || 1);
    const [isLooping, setIsLooping] = useState(() => Boolean(initialStored.loop));
    const [volume, setVolume] = useState(() => initialStored.volume ?? 1);

    const settingsRef = useRef({ playbackRate, isLooping, volume });
    settingsRef.current = { playbackRate, isLooping, volume };
    activeTrackRef.current = currentTrack;

    const persistState = useCallback((track, time) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            track: track || null,
            time: track && Number.isFinite(time) ? time : 0,
            speed: settingsRef.current.playbackRate,
            loop: settingsRef.current.isLooping,
            volume: settingsRef.current.volume,
        }));
    }, []);

    const safePlay = useCallback((audio) => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err) => {
                if (err?.name !== 'AbortError') {
                    setIsPlaying(false);
                }
            });
        }
    }, []);

    const destroyHls = useCallback(() => {
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }
    }, []);

    const loadTrackSource = useCallback((track, startTime = 0, autoPlay = true) => {
        const audio = audioRef.current;
        destroyHls();
        audio.pause();
        audio.removeAttribute('src');
        audio.removeAttribute('data-hls-duration');

        setIsReady(false);
        setHasError(false);

        const rawUrl = track?.file_url || track?.url || '';
        const mediaUrl = getCleanMediaUrl(rawUrl);
        if (!mediaUrl) {
            setHasError(true);
            setIsPlaying(false);
            return;
        }

        const isHls = mediaUrl.includes('.m3u8') && Hls.isSupported();
        if (isHls) {
            audio.removeAttribute('crossorigin');
        } else {
            audio.crossOrigin = 'anonymous';
        }

        audio.loop = settingsRef.current.isLooping;
        audio.volume = settingsRef.current.volume;
        audio.playbackRate = settingsRef.current.playbackRate;

        const handleReady = () => {
            if (startTime > 0) {
                if (Math.abs(audio.currentTime - startTime) > 0.5) {
                    audio.currentTime = startTime;
                }
            } else if (audio.buffered.length > 0) {
                const bufferStart = audio.buffered.start(0);
                if (audio.currentTime < bufferStart) {
                    audio.currentTime = bufferStart;
                }
            }

            setIsReady(true);
            if (autoPlay) {
                safePlay(audio);
            }
        };

        if (isHls) {
            const hls = new Hls({
                enableWorker: true,
                startPosition: startTime > 0 ? startTime : -1,
            });
            hlsRef.current = hls;
            hls.loadSource(mediaUrl);
            hls.attachMedia(audio);

            hls.once(Hls.Events.FRAG_BUFFERED, handleReady);

            hls.on(Hls.Events.LEVEL_LOADED, (_event, data) => {
                if (data.details?.totalduration) {
                    audio.setAttribute('data-hls-duration', data.details.totalduration);
                    audio.dispatchEvent(new Event('durationchange'));
                }
            });

            hls.on(Hls.Events.ERROR, (_event, data) => {
                if (data.fatal) {
                    setHasError(true);
                    setIsReady(false);
                    setIsPlaying(false);
                }
            });
        } else {
            audio.src = mediaUrl;
            audio.addEventListener('canplay', handleReady, { once: true });
        }
    }, [destroyHls, safePlay]);

    useEffect(() => {
        const audio = audioRef.current;

        channelRef.current = new BroadcastChannel('tetrone_audio_sync');
        channelRef.current.onmessage = (event) => {
            if (event.data === 'PAUSE_AUDIO') {
                audio.pause();
            }
        };

        let lastSavedSec = -1;
        const onTimeUpdate = () => {
            const sec = Math.floor(audio.currentTime);
            if (sec > 0 && sec !== lastSavedSec) {
                lastSavedSec = sec;
                persistState(activeTrackRef.current, audio.currentTime);
            }
        };

        const onPlay = () => {
            setIsPlaying(true);
            channelRef.current?.postMessage('PAUSE_AUDIO');
        };

        const onPause = () => {
            setIsPlaying(false);
            persistState(activeTrackRef.current, audio.currentTime);
        };

        const onEnded = () => {
            setIsPlaying(false);
            persistState(activeTrackRef.current, 0);
        };

        const onError = () => {
            setHasError(true);
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('error', onError);

        const stored = readStorage();
        if (stored.track) {
            loadTrackSource(stored.track, stored.time || 0, false);
        }

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('error', onError);
            channelRef.current?.close();
            destroyHls();
            audio.pause();
        };
    }, [destroyHls, loadTrackSource, persistState]);

    const playTrack = useCallback((track, sourceInfo = null) => {
        const audio = audioRef.current;
        const resolvedSource = sourceInfo || track.sourceInfo || (track.post_id ? { type: 'post', id: track.post_id, url: `/post/${track.post_id}` } : null);
        const fullTrackData = { ...track, sourceInfo: resolvedSource };

        if (activeTrackRef.current && activeTrackRef.current.id === track.id) {
            if (audio.paused) {
                safePlay(audio);
            } else {
                audio.pause();
            }
            return;
        }

        activeTrackRef.current = fullTrackData;
        setCurrentTrack(fullTrackData);
        persistState(fullTrackData, 0);
        loadTrackSource(fullTrackData, 0, true);
    }, [loadTrackSource, persistState, safePlay]);

    const playPauseClick = useCallback(() => {
        const audio = audioRef.current;
        if (!activeTrackRef.current || !isReady) return;
        if (audio.paused) {
            safePlay(audio);
        } else {
            audio.pause();
        }
    }, [isReady, safePlay]);

    const toggleSpeed = useCallback(() => {
        const nextSpeed = settingsRef.current.playbackRate === 1 ? 1.5 : settingsRef.current.playbackRate === 1.5 ? 2 : 1;
        setPlaybackRate(nextSpeed);
        settingsRef.current.playbackRate = nextSpeed;
        audioRef.current.playbackRate = nextSpeed;
        persistState(activeTrackRef.current, audioRef.current.currentTime);
    }, [persistState]);

    const toggleLoop = useCallback(() => {
        const nextLoop = !settingsRef.current.isLooping;
        setIsLooping(nextLoop);
        settingsRef.current.isLooping = nextLoop;
        audioRef.current.loop = nextLoop;
        persistState(activeTrackRef.current, audioRef.current.currentTime);
    }, [persistState]);

    const handleVolumeChange = useCallback((e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        settingsRef.current.volume = newVolume;
        audioRef.current.volume = newVolume;
        persistState(activeTrackRef.current, audioRef.current.currentTime);
    }, [persistState]);

    const handleClose = useCallback(() => {
        const audio = audioRef.current;
        destroyHls();
        audio.pause();
        audio.removeAttribute('src');
        audio.removeAttribute('data-hls-duration');
        activeTrackRef.current = null;
        setCurrentTrack(null);
        setIsPlaying(false);
        setIsReady(false);
        setHasError(false);
        localStorage.removeItem(STORAGE_KEY);
    }, [destroyHls]);

    return (
        <AudioContext.Provider value={{
            audioRef,
            currentTrack,
            isPlaying,
            isReady,
            hasError,
            playbackRate,
            isLooping,
            volume,
            playTrack,
            playPauseClick,
            toggleSpeed,
            toggleLoop,
            handleVolumeChange,
            handleClose,
            closePlayer: handleClose,
            channelRef
        }}>
            {children}
        </AudioContext.Provider>
    );
};