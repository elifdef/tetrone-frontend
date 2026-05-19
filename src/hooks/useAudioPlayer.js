import { useEffect, useRef, useContext, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { AudioContext } from "../context/AudioContext";

const STORAGE_KEY = 'tetrone_audio_state';

export const useAudioPlayer = (waveformRef) => {
    const { currentTrack, isPlaying, setIsPlaying, closePlayer, channelRef } = useContext(AudioContext);

    const wavesurferRef = useRef(null);
    const audioElRef = useRef(null);

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
        if (!currentTrack || !waveformRef.current) return;

        setIsReady(false);
        setHasError(false);
        setCurrentTime(0);
        setDuration(0);

        if (audioElRef.current) {
            audioElRef.current.pause();
            audioElRef.current.removeAttribute('src');
            audioElRef.current.load();
        }
        if (wavesurferRef.current) {
            wavesurferRef.current.destroy();
        }

        const relativeUrl = currentTrack.url.replace(/^https?:\/\/[^\/]+/, '');
        const audio = new Audio();
        audio.crossOrigin = "anonymous";
        audio.src = relativeUrl;
        audio.loop = stateRef.current.isLooping;
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

        ws.on('ready', () => {
            setIsReady(true);
            setHasError(false);
            setDuration(ws.getDuration());

            ws.setPlaybackRate(stateRef.current.playbackRate);
            ws.setVolume(stateRef.current.volume);

            const mediaEl = ws.getMediaElement();
            if (mediaEl) mediaEl.loop = stateRef.current.isLooping;

            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
                if (saved && saved.track && saved.track.id === currentTrack.id && saved.time) {
                    if (ws.getDuration() > 0 && Math.abs(ws.getDuration() - saved.time) < 0.2) {
                        ws.setTime(0);
                        setCurrentTime(0);
                    } else {
                        ws.setTime(saved.time);
                        setCurrentTime(saved.time);
                    }
                }
            } catch (e) { }

            if (isPlaying) ws.play().catch(() => setIsPlaying(false));
        });

        ws.on('play', () => {
            setIsPlaying(true);
            if (channelRef?.current) channelRef.current.postMessage('PAUSE_AUDIO');
        });

        ws.on('pause', () => {
            setIsPlaying(false);
            saveStateToStorage(ws.getCurrentTime());
        });

        ws.on('finish', () => setIsPlaying(false));
        ws.on('interaction', () => saveStateToStorage(ws.getCurrentTime()));

        ws.on('error', () => {
            setHasError(true);
            setIsReady(false);
        });

        let lastSave = 0;
        ws.on('timeupdate', (time) => {
            setCurrentTime(time);
            const now = Date.now();
            if (now - lastSave > 1000) {
                saveStateToStorage(time);
                lastSave = now;
            }
        });

        return () => {
            if (wavesurferRef.current) {
                wavesurferRef.current.pause();
                saveStateToStorage(wavesurferRef.current.getCurrentTime());
                wavesurferRef.current.destroy();
                wavesurferRef.current = null;
            }
            if (audio) {
                audio.pause();
                audio.removeAttribute('src'); // Браузер забуває про файл
                audio.load();                 // Очищує пам'ять
            }
            audioElRef.current = null;
        };
    }, [currentTrack]);

    useEffect(() => {
        if (wavesurferRef.current && isReady) {
            const ws = wavesurferRef.current;
            if (isPlaying && !ws.isPlaying()) {
                const isAtEnd = ws.getDuration() > 0 && Math.abs(ws.getDuration() - ws.getCurrentTime()) < 0.2;
                if (isAtEnd) {
                    ws.setTime(0);
                }
                ws.play().catch(() => setIsPlaying(false));
            } else if (!isPlaying && ws.isPlaying()) {
                ws.pause();
            }
        }
    }, [isPlaying, isReady, setIsPlaying]);

    const playPauseClick = () => {
        if (wavesurferRef.current) wavesurferRef.current.playPause();
    };

    const toggleSpeed = () => {
        if (!wavesurferRef.current) return;
        const nextSpeed = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
        setPlaybackRate(nextSpeed);
        stateRef.current.playbackRate = nextSpeed;
        wavesurferRef.current.setPlaybackRate(nextSpeed);
        saveStateToStorage(wavesurferRef.current.getCurrentTime());
    };

    const toggleLoop = () => {
        const nextLoop = !isLooping;
        setIsLooping(nextLoop);
        stateRef.current.isLooping = nextLoop;

        const mediaEl = wavesurferRef.current?.getMediaElement();
        if (mediaEl) mediaEl.loop = nextLoop;

        saveStateToStorage(wavesurferRef.current?.getCurrentTime() || 0);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        stateRef.current.volume = newVolume;
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(newVolume);
        }
        saveStateToStorage(wavesurferRef.current?.getCurrentTime() || 0);
    };

    const handleClose = () => {
        if (wavesurferRef.current) wavesurferRef.current.pause();

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
        handleVolumeChange, handleClose
    };
};