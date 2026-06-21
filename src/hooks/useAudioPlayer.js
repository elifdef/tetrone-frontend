import { useEffect, useRef, useContext, useState, useCallback } from "react";
import Hls from "hls.js";
import { AudioContext } from "../context/AudioContext";

const STORAGE_KEY = 'tetrone_audio_state';

export const useAudioPlayer = () => {
    const { currentTrack, isPlaying, setIsPlaying, closePlayer, channelRef } = useContext(AudioContext);

    const audioElRef = useRef(new Audio());
    const hlsRef = useRef(null);

    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

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

        const audio = audioElRef.current;
        setIsReady(false);
        setHasError(false);
        setCurrentTime(0);
        setDuration(0);

        audio.pause();
        audio.removeAttribute('src');
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const relativeUrl = currentTrack.url.replace(/^https?:\/\/[^\/]+/, '');
        audio.crossOrigin = "anonymous";
        audio.loop = stateRef.current.isLooping;
        audio.volume = stateRef.current.volume;
        audio.playbackRate = stateRef.current.playbackRate;

        // Ініціалізація HLS
        if (relativeUrl.includes('.m3u8') && Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(relativeUrl);
            hls.attachMedia(audio);

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                setIsReady(true);
                if (isPlaying) audio.play().catch(() => setIsPlaying(false));
            });
            hls.on(Hls.Events.LEVEL_LOADED, (event, data) => {
                setDuration(data.details.totalduration);
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    setHasError(true);
                    setIsReady(false);
                }
            });
        } else {
            audio.src = relativeUrl;
            audio.onloadedmetadata = () => {
                setIsReady(true);
                setDuration(audio.duration);
                if (isPlaying) audio.play().catch(() => setIsPlaying(false));
            };
        }

        // Обробники подій
        const onTimeUpdate = () => setCurrentTime(audio.currentTime);
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

        // Відновлення часу
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved && saved.track && saved.track.id === currentTrack.id && saved.time) {
                audio.currentTime = saved.time;
                setCurrentTime(saved.time);
            }
        } catch (e) { }

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
        const audio = audioElRef.current;
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
        audioElRef.current.playbackRate = nextSpeed;
    };

    const toggleLoop = () => {
        const nextLoop = !isLooping;
        setIsLooping(nextLoop);
        stateRef.current.isLooping = nextLoop;
        audioElRef.current.loop = nextLoop;
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        stateRef.current.volume = newVolume;
        audioElRef.current.volume = newVolume;
    };

    const handleSeek = (time) => {
        setCurrentTime(time);
        audioElRef.current.currentTime = time;
    };

    const handleClose = () => {
        audioElRef.current.pause();
        stateRef.current.currentTrack = null;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            speed: playbackRate,
            loop: isLooping,
            volume: volume
        }));

        closePlayer();
    };

    return {
        isReady, hasError, currentTime, duration,
        playbackRate, isLooping, volume,
        playPauseClick, toggleSpeed, toggleLoop,
        handleVolumeChange, handleSeek, handleClose
    };
};