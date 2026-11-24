import { useState, useEffect, useRef, useCallback, type ChangeEvent, type ReactNode } from 'react';
import Hls from 'hls.js';
import { AudioContext, type AudioSourceInfo, type AudioTrackData } from './audio-context';

const STORAGE_KEY = 'tetrone_audio_state';

interface StoredAudioState {
    track?: AudioTrackData | null;
    time?: number;
    speed?: number;
    loop?: boolean;
    volume?: number;
}

const readStorage = (): StoredAudioState => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as StoredAudioState) : {};
    } catch {
        return {};
    }
};

const getCleanMediaUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) {
        try {
            const parsed = new URL(url);
            if (
                parsed.hostname === 'backend' ||
                parsed.hostname === 'localhost' ||
                parsed.hostname === '127.0.0.1'
            ) {
                return `${parsed.pathname}${parsed.search}`;
            }
        } catch {
            return url;
        }
        return url;
    }
    return url.startsWith('/') ? url : `/${url}`;
};

interface AudioProviderProps {
    children: ReactNode;
}

export const AudioProvider = ({ children }: AudioProviderProps) => {
    const [audioElement] = useState<HTMLAudioElement>(() => new Audio());
    const audioRef = useRef<HTMLAudioElement | null>(audioElement);
    const hlsRef = useRef<Hls | null>(null);
    const channelRef = useRef<BroadcastChannel | null>(null);

    const [initialStored] = useState<StoredAudioState>(() => readStorage());

    const activeTrackRef = useRef<AudioTrackData | null>(initialStored.track || null);

    const [currentTrack, setCurrentTrack] = useState<AudioTrackData | null>(
        () => initialStored.track || null
    );
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [hasError, setHasError] = useState(false);

    const [playbackRate, setPlaybackRate] = useState<number>(() => initialStored.speed || 1);
    const [isLooping, setIsLooping] = useState<boolean>(() => Boolean(initialStored.loop));
    const [volume, setVolume] = useState<number>(() => initialStored.volume ?? 1);

    const settingsRef = useRef({
        playbackRate: initialStored.speed || 1,
        isLooping: Boolean(initialStored.loop),
        volume: initialStored.volume ?? 1,
    });

    const persistState = useCallback((track: AudioTrackData | null, time: number) => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
                track: track || null,
                time: track && Number.isFinite(time) ? time : 0,
                speed: settingsRef.current.playbackRate,
                loop: settingsRef.current.isLooping,
                volume: settingsRef.current.volume,
            })
        );
    }, []);

    const safePlay = useCallback((audio: HTMLAudioElement) => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch((err: unknown) => {
                const errorName =
                    err && typeof err === 'object' && 'name' in err
                        ? String((err as { name: unknown }).name)
                        : '';
                if (errorName !== 'AbortError') {
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

    const loadTrackSource = useCallback(
        (track: AudioTrackData, startTime = 0, autoPlay = true) => {
            const audio = audioElement;
            destroyHls();
            audio.pause();
            audio.removeAttribute('src');
            audio.removeAttribute('data-hls-duration');

            const rawUrl = track.file_url || track.url || '';
            const mediaUrl = getCleanMediaUrl(rawUrl);
            if (!mediaUrl) {
                queueMicrotask(() => {
                    setHasError(true);
                    setIsPlaying(false);
                });
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
                        audio.setAttribute('data-hls-duration', String(data.details.totalduration));
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
        },
        [audioElement, destroyHls, safePlay]
    );

    useEffect(() => {
        const audio = audioElement;

        channelRef.current = new BroadcastChannel('tetrone_audio_sync');
        channelRef.current.onmessage = (event: MessageEvent<unknown>) => {
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
    }, [audioElement, destroyHls, loadTrackSource, persistState]);

    const playTrack = useCallback(
        (track: AudioTrackData, sourceInfo: AudioSourceInfo | null = null) => {
            const resolvedSource: AudioSourceInfo | null =
                sourceInfo ||
                track.sourceInfo ||
                (track.post_id
                    ? { type: 'post', id: track.post_id, url: `/post/${track.post_id}` }
                    : null);
            const fullTrackData: AudioTrackData = { ...track, sourceInfo: resolvedSource };

            if (activeTrackRef.current && activeTrackRef.current.id === track.id) {
                if (audioElement.paused) {
                    safePlay(audioElement);
                } else {
                    audioElement.pause();
                }
                return;
            }

            activeTrackRef.current = fullTrackData;
            setCurrentTrack(fullTrackData);
            setIsReady(false);
            setHasError(false);
            persistState(fullTrackData, 0);
            loadTrackSource(fullTrackData, 0, true);
        },
        [audioElement, loadTrackSource, persistState, safePlay]
    );

    const playPauseClick = useCallback(() => {
        if (!activeTrackRef.current || !isReady) return;
        if (audioElement.paused) {
            safePlay(audioElement);
        } else {
            audioElement.pause();
        }
    }, [audioElement, isReady, safePlay]);

    const toggleSpeed = useCallback(() => {
        const nextSpeed =
            settingsRef.current.playbackRate === 1
                ? 1.5
                : settingsRef.current.playbackRate === 1.5
                  ? 2
                  : 1;
        setPlaybackRate(nextSpeed);
        settingsRef.current.playbackRate = nextSpeed;
        audioElement.playbackRate = nextSpeed;
        persistState(activeTrackRef.current, audioElement.currentTime);
    }, [audioElement, persistState]);

    const toggleLoop = useCallback(() => {
        const nextLoop = !settingsRef.current.isLooping;
        setIsLooping(nextLoop);
        settingsRef.current.isLooping = nextLoop;
        audioElement.loop = nextLoop;
        persistState(activeTrackRef.current, audioElement.currentTime);
    }, [audioElement, persistState]);

    const handleVolumeChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            const newVolume = parseFloat(e.target.value);
            setVolume(newVolume);
            settingsRef.current.volume = newVolume;
            audioElement.volume = newVolume;
            persistState(activeTrackRef.current, audioElement.currentTime);
        },
        [audioElement, persistState]
    );

    const handleClose = useCallback(() => {
        destroyHls();
        audioElement.pause();
        audioElement.removeAttribute('src');
        audioElement.removeAttribute('data-hls-duration');
        activeTrackRef.current = null;
        setCurrentTrack(null);
        setIsPlaying(false);
        setIsReady(false);
        setHasError(false);
        localStorage.removeItem(STORAGE_KEY);
    }, [audioElement, destroyHls]);

    return (
        <AudioContext.Provider
            value={{
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
                channelRef,
            }}
        >
            {children}
        </AudioContext.Provider>
    );
};
