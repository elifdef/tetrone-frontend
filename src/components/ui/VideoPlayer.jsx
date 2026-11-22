import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Hls from 'hls.js';
import './VideoPlayer.css';

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
const BOOST_OPTIONS = [1, 1.5, 2];
const FRAME_STEP = 1 / 30;
const VIDEO_PREFS_STORAGE_KEY = 'tetrone_video_prefs';
const VIDEO_PREFS_EVENT = 'tetrone:video-prefs-changed';

const DEFAULT_VIDEO_PREFS = {
    volume: 1,
    muted: false,
    playbackRate: 1,
    loop: false,
    boost: 1,
    fillFrame: false,
};

function readVideoPrefs() {
    if (typeof window === 'undefined') return { ...DEFAULT_VIDEO_PREFS };
    try {
        const raw = window.localStorage.getItem(VIDEO_PREFS_STORAGE_KEY);
        if (!raw) return { ...DEFAULT_VIDEO_PREFS };
        const parsed = JSON.parse(raw);
        return {
            volume: typeof parsed.volume === 'number' ? Math.min(1, Math.max(0, parsed.volume)) : 1,
            muted: Boolean(parsed.muted),
            playbackRate: SPEED_OPTIONS.includes(parsed.playbackRate) ? parsed.playbackRate : 1,
            loop: Boolean(parsed.loop),
            boost: BOOST_OPTIONS.includes(parsed.boost) ? parsed.boost : 1,
            fillFrame: Boolean(parsed.fillFrame),
        };
    } catch {
        return { ...DEFAULT_VIDEO_PREFS };
    }
}

function updateVideoPrefs(patch) {
    if (typeof window === 'undefined') return { ...DEFAULT_VIDEO_PREFS };
    const next = { ...readVideoPrefs(), ...patch };
    try {
        window.localStorage.setItem(VIDEO_PREFS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(VIDEO_PREFS_EVENT, { detail: next }));
    } catch {
        // Ігноруємо обмеження квоти storage
    }
    return next;
}

function useGlobalVideoPrefs() {
    const [prefs, setPrefs] = useState(readVideoPrefs);

    useEffect(() => {
        const sync = () => setPrefs(readVideoPrefs());
        window.addEventListener('storage', sync);
        window.addEventListener(VIDEO_PREFS_EVENT, sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener(VIDEO_PREFS_EVENT, sync);
        };
    }, []);

    return prefs;
}

function readWipFlag() {
    if (typeof window === 'undefined') return false;
    const raw = window.localStorage.getItem('tetrone_WIP');
    if (!raw) return false;
    const normalized = raw.trim().toLowerCase();
    return normalized !== '0' && normalized !== 'false' && normalized !== 'off';
}

function useTetroneWip() {
    const [isWip, setIsWip] = useState(readWipFlag);

    useEffect(() => {
        const sync = () => setIsWip(readWipFlag());
        window.addEventListener('storage', sync);
        window.addEventListener('focus', sync);
        return () => {
            window.removeEventListener('storage', sync);
            window.removeEventListener('focus', sync);
        };
    }, []);

    return isWip;
}

function formatSeconds(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const total = Math.floor(sec);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
}

function convertSrtToVtt(srtText) {
    const cleaned = srtText
        .replace(/\r+/g, '')
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return `WEBVTT\n\n${cleaned}`;
}

const IconPlay = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <polygon points="3,2 14,8 3,14" />
    </svg>
);

const IconPause = ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
        <rect x="3" y="2" width="3.5" height="12" />
        <rect x="9.5" y="2" width="3.5" height="12" />
    </svg>
);

const IconReplay = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <polyline points="2,2 2,6 6,6" />
        <path d="M2.5,6 A5.8,5.8 0 1,1 3,11" />
    </svg>
);

const IconVolume = ({ muted, level }) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <polygon points="2,6 5.5,6 9.5,2.5 9.5,13.5 5.5,10 2,10" fill="currentColor" stroke="none" />
        {muted || level === 0 ? (
            <>
                <line x1="11.5" y1="5.5" x2="15" y2="10.5" />
                <line x1="15" y1="5.5" x2="11.5" y2="10.5" />
            </>
        ) : level < 0.5 ? (
            <path d="M11.8,5.5 C12.8,6.8 12.8,9.2 11.8,10.5" />
        ) : (
            <>
                <path d="M11.5,5.5 C12.5,6.8 12.5,9.2 11.5,10.5" />
                <path d="M13.5,3.5 C15.2,5.8 15.2,10.2 13.5,12.5" />
            </>
        )}
    </svg>
);

const IconSettings = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="6" y="6" width="4" height="4" />
        <path d="M8,1.5 V3.5 M8,12.5 V14.5 M1.5,8 H3.5 M12.5,8 H14.5 M3.4,3.4 L4.8,4.8 M11.2,11.2 L12.6,12.6 M12.6,3.4 L11.2,4.8 M4.8,11.2 L3.4,12.6" />
    </svg>
);

const IconCaptions = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="1.5" y="3" width="13" height="10" />
        <path d="M6.8,6.2 H4.5 V9.8 H6.8 M11.5,6.2 H9.2 V9.8 H11.5" />
    </svg>
);

const IconAspect = ({ filled }) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="1.5" y="3" width="13" height="10" />
        {filled ? (
            <rect x="3.5" y="4.8" width="9" height="6.4" fill="currentColor" stroke="none" />
        ) : (
            <rect x="4.5" y="4.5" width="7" height="7" />
        )}
    </svg>
);

const IconPip = () => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="1.5" y="2.5" width="13" height="11" />
        <rect x="7.5" y="7.5" width="5.5" height="4.5" fill="currentColor" stroke="none" />
    </svg>
);

const IconFullscreen = ({ active }) => (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {active ? (
            <>
                <polyline points="6,2.5 6,6 2.5,6" />
                <polyline points="10,2.5 10,6 13.5,6" />
                <polyline points="6,13.5 6,10 2.5,10" />
                <polyline points="10,13.5 10,10 13.5,10" />
            </>
        ) : (
            <>
                <polyline points="2.5,6 2.5,2.5 6,2.5" />
                <polyline points="13.5,6 13.5,2.5 10,2.5" />
                <polyline points="2.5,10 2.5,13.5 6,13.5" />
                <polyline points="13.5,10 13.5,13.5 10,13.5" />
            </>
        )}
    </svg>
);

function WipTelemetryHud({ videoRef, isHlsStream, isPlaying }) {
    const { t } = useTranslation();
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((v) => v + 1), 600);
        return () => clearInterval(timer);
    }, []);

    const video = videoRef.current;
    const width = video?.videoWidth || 0;
    const height = video?.videoHeight || 0;
    const currentTime = video?.currentTime ?? 0;
    const duration = video?.duration ?? 0;
    const rate = video?.playbackRate ?? 1;

    let bufferAhead = 0;
    if (video?.buffered?.length) {
        for (let i = 0; i < video.buffered.length; i += 1) {
            if (currentTime >= video.buffered.start(i) && currentTime <= video.buffered.end(i)) {
                bufferAhead = Math.max(0, video.buffered.end(i) - currentTime);
                break;
            }
        }
    }

    const qualityMetrics = typeof video?.getVideoPlaybackQuality === 'function'
        ? video.getVideoPlaybackQuality()
        : null;

    return (
        <div className="lg-glass-popover absolute top-[10px] left-[10px] z-30 max-w-[270px] p-[8px] text-[10px] font-mono text-white/90 pointer-events-none space-y-[3px]">
            <div className="flex items-center justify-between gap-[8px] border-b border-white/15 pb-[3px] mb-[3px]">
                <span className="font-bold text-theme-link uppercase">HLS Telemetry</span>
                <span>{isPlaying ? 'PLAYING' : 'PAUSED'}</span>
            </div>
            <div>
                <span className="text-white/55">{t('video.wipStreamType')}: </span>
                <span>{isHlsStream ? 'HLS.js' : 'HTML5'}</span>
            </div>
            <div>
                <span className="text-white/55">{t('video.wipResolution')}: </span>
                <span>{width && height ? `${width}×${height}` : '—'} @ {rate}x</span>
            </div>
            <div>
                <span className="text-white/55">{t('video.wipBufferAhead')}: </span>
                <span>{bufferAhead.toFixed(1)}s ({formatSeconds(currentTime)} / {formatSeconds(duration)})</span>
            </div>
            {qualityMetrics && (
                <div>
                    <span className="text-white/55">{t('video.wipDroppedFrames')}: </span>
                    <span>{qualityMetrics.droppedVideoFrames} / {qualityMetrics.totalVideoFrames}</span>
                </div>
            )}
            <div className="pt-[3px] border-t border-white/15 text-[9px] text-white/60 leading-tight">
                {t('video.wipHotkeys')}
            </div>
        </div>
    );
}

function Html5SquareGlassPlayer({ src, type, poster, className }) {
    const { t } = useTranslation();
    const isWip = useTetroneWip();
    const prefs = useGlobalVideoPrefs();

    const wrapperRef = useRef(null);
    const videoRef = useRef(null);
    const timelineRef = useRef(null);
    const subsInputRef = useRef(null);
    const audioCtxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const hideTimerRef = useRef(null);
    const isApplyingPrefsRef = useRef(false);

    const [isPlaying, setIsPlaying] = useState(false);
    const [isEnded, setIsEnded] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [bufferedEnd, setBufferedEnd] = useState(0);
    const [hoverTime, setHoverTime] = useState(null);
    const [hoverPercent, setHoverPercent] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settingsTab, setSettingsTab] = useState('playback'); // 'playback' | 'audio' | 'screen'
    const [wipOpen, setWipOpen] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isHlsStream, setIsHlsStream] = useState(false);

    const [subtitleName, setSubtitleName] = useState('');
    const [customTrackUrl, setCustomTrackUrl] = useState(null);

    // WIP стани
    const [showStats, setShowStats] = useState(false);
    const [pointA, setPointA] = useState(null);
    const [pointB, setPointB] = useState(null);
    const [savedBadge, setSavedBadge] = useState(false);

    const revealControls = useCallback(() => {
        setControlsVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => {
            if (videoRef.current && !videoRef.current.paused) {
                setControlsVisible(false);
                setSettingsOpen(false);
                setWipOpen(false);
            }
        }, 2600);
    }, []);

    useEffect(() => {
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
            if (customTrackUrl) URL.revokeObjectURL(customTrackUrl);
        };
    }, [customTrackUrl]);

    const applyBoostToVideo = useCallback((targetBoost) => {
        const video = videoRef.current;
        if (!video) return;
        try {
            if (!audioCtxRef.current && targetBoost > 1) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                const ctx = new AudioCtx();
                const source = ctx.createMediaElementSource(video);
                const gainNode = ctx.createGain();
                source.connect(gainNode);
                gainNode.connect(ctx.destination);
                audioCtxRef.current = ctx;
                gainNodeRef.current = gainNode;
            }
            if (audioCtxRef.current?.state === 'suspended') {
                audioCtxRef.current.resume().catch(() => {});
            }
            if (gainNodeRef.current) {
                gainNodeRef.current.gain.value = targetBoost;
            }
        } catch {
            // Браузер блокує AudioContext до першої взаємодії
        }
    }, []);

    // Ініціалізація HLS.js або нативного src
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return undefined;

        let hls = null;
        const isHls = String(src).includes('.m3u8') || type === 'application/x-mpegURL';
        setIsHlsStream(isHls && Hls.isSupported());

        if (isHls && Hls.isSupported()) {
            hls = new Hls({
                maxBufferLength: 180,
                maxMaxBufferLength: 600,
                maxBufferSize: 150 * 1000 * 1000,
                fragLoadingMaxRetry: 10,
                fragLoadingRetryDelay: 1000,
                manifestLoadingMaxRetry: 6,
            });
            hls.loadSource(src);
            hls.attachMedia(video);
        } else {
            video.src = src;
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, type]);

    // Застосування глобальних налаштувань до <video>
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;

        isApplyingPrefsRef.current = true;
        if (Math.abs(video.volume - prefs.volume) > 0.005) video.volume = prefs.volume;
        if (video.muted !== prefs.muted) video.muted = prefs.muted;
        if (Math.abs(video.playbackRate - prefs.playbackRate) > 0.005) video.playbackRate = prefs.playbackRate;
        if (video.loop !== prefs.loop) video.loop = prefs.loop;
        applyBoostToVideo(prefs.boost);

        const releaseTimer = setTimeout(() => {
            isApplyingPrefsRef.current = false;
        }, 0);

        return () => clearTimeout(releaseTimer);
    }, [prefs.volume, prefs.muted, prefs.playbackRate, prefs.loop, prefs.boost, applyBoostToVideo]);

    // Підписки на події <video>
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;

        let rafId = null;

        const updateBuffer = () => {
            if (!video.buffered?.length) {
                setBufferedEnd(0);
                return;
            }
            const end = video.buffered.end(video.buffered.length - 1);
            setBufferedEnd(Number.isFinite(end) ? end : 0);
        };

        const tick = () => {
            setCurrentTime(video.currentTime || 0);
            rafId = requestAnimationFrame(tick);
        };

        const onPlay = () => {
            setIsPlaying(true);
            setIsEnded(false);
            setIsBuffering(false);
            const latest = readVideoPrefs();
            if (latest.boost > 1) applyBoostToVideo(latest.boost);
            revealControls();
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(tick);
        };

        const onPause = () => {
            setIsPlaying(false);
            setControlsVisible(true);
            if (rafId) cancelAnimationFrame(rafId);
            setCurrentTime(video.currentTime || 0);
        };

        const onEnded = () => {
            setIsPlaying(false);
            setIsEnded(true);
            setControlsVisible(true);
            if (rafId) cancelAnimationFrame(rafId);
        };

        const onTimeUpdate = () => {
            setCurrentTime(video.currentTime || 0);
            if (pointA !== null && pointB !== null && pointB > pointA) {
                if (video.currentTime >= pointB || video.currentTime < pointA) {
                    video.currentTime = pointA;
                }
            }
        };

        const onDurationChange = () => {
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
        };

        const onLoadedMetadata = () => {
            const latest = readVideoPrefs();
            isApplyingPrefsRef.current = true;
            video.volume = latest.volume;
            video.muted = latest.muted;
            video.playbackRate = latest.playbackRate;
            video.loop = latest.loop;
            setDuration(Number.isFinite(video.duration) ? video.duration : 0);
            updateBuffer();
            setTimeout(() => {
                isApplyingPrefsRef.current = false;
            }, 0);
        };

        const onVolumeChange = () => {
            if (isApplyingPrefsRef.current) return;
            updateVideoPrefs({
                volume: Number(video.volume.toFixed(3)),
                muted: Boolean(video.muted),
            });
        };

        const onRateChange = () => {
            if (isApplyingPrefsRef.current) return;
            if (SPEED_OPTIONS.includes(video.playbackRate)) {
                updateVideoPrefs({ playbackRate: video.playbackRate });
            }
        };

        const onWaiting = () => setIsBuffering(true);
        const onCanPlay = () => setIsBuffering(false);

        video.addEventListener('play', onPlay);
        video.addEventListener('pause', onPause);
        video.addEventListener('ended', onEnded);
        video.addEventListener('timeupdate', onTimeUpdate);
        video.addEventListener('durationchange', onDurationChange);
        video.addEventListener('loadedmetadata', onLoadedMetadata);
        video.addEventListener('progress', updateBuffer);
        video.addEventListener('volumechange', onVolumeChange);
        video.addEventListener('ratechange', onRateChange);
        video.addEventListener('waiting', onWaiting);
        video.addEventListener('canplay', onCanPlay);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            video.removeEventListener('play', onPlay);
            video.removeEventListener('pause', onPause);
            video.removeEventListener('ended', onEnded);
            video.removeEventListener('timeupdate', onTimeUpdate);
            video.removeEventListener('durationchange', onDurationChange);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('progress', updateBuffer);
            video.removeEventListener('volumechange', onVolumeChange);
            video.removeEventListener('ratechange', onRateChange);
            video.removeEventListener('waiting', onWaiting);
            video.removeEventListener('canplay', onCanPlay);
        };
    }, [applyBoostToVideo, pointA, pointB, revealControls]);

    // Слідкуємо за станом повноекранного режиму

useEffect(() => {
    const onFsChange = () => {
        const wrapper = wrapperRef.current;
        const fsEl = document.fullscreenElement || document.webkitFullscreenElement;

        const active = Boolean(
            wrapper && (
                fsEl === wrapper ||
                wrapper.matches(':fullscreen')
            )
        );

        setIsFullscreen(active);
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);

    return () => {
        document.removeEventListener('fullscreenchange', onFsChange);
        document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
}, []);


    // Автопауза при скролі за межі екрана
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting && videoRef.current && !videoRef.current.paused) {
                        videoRef.current.pause();
                    }
                });
            },
            { threshold: 0.2 }
        );

        observer.observe(wrapper);
        return () => observer.disconnect();
    }, []);

    const togglePlay = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused || video.ended) {
            video.play().catch(() => {});
        } else {
            video.pause();
        }
    }, []);

    const toggleMute = useCallback(() => {
        const video = videoRef.current;
        if (!video) return;
        const nextMuted = !video.muted;
        const nextVolume = !nextMuted && video.volume === 0 ? 0.5 : video.volume;
        video.muted = nextMuted;
        video.volume = nextVolume;
        updateVideoPrefs({ muted: nextMuted, volume: nextVolume });
    }, []);

    const handleVolumeSlider = (e) => {
        const val = Number(e.target.value);
        const video = videoRef.current;
        if (video) {
            video.volume = val;
            video.muted = val === 0;
        }
        updateVideoPrefs({ volume: val, muted: val === 0 });
    };

const toggleFullscreen = useCallback(async () => {
    const el = wrapperRef.current;
    if (!el) return;

    const fsEl = document.fullscreenElement || document.webkitFullscreenElement;

    try {
        if (fsEl) {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }

            setIsFullscreen(false);
            return;
        }

        if (el.requestFullscreen) {
            await el.requestFullscreen({ navigationUI: 'hide' });
            setIsFullscreen(true);
            return;
        }

        if (el.webkitRequestFullscreen) {
            const result = el.webkitRequestFullscreen();

            if (result && typeof result.then === 'function') {
                await result;
            }

            setIsFullscreen(true);
            return;
        }

        console.error('[VideoPlayer] Fullscreen API is not supported.');
    } catch (error) {
        console.error('[VideoPlayer] Fullscreen error:', error);
        setIsFullscreen(false);
    }
}, []);

    const togglePip = async () => {
        const video = videoRef.current;
        if (!video || !document.pictureInPictureEnabled) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await video.requestPictureInPicture();
            }
        } catch {
            // Ігноруємо обмеження браузера
        }
    };

    const toggleFillFrame = useCallback(() => {
        updateVideoPrefs({ fillFrame: !prefs.fillFrame });
    }, [prefs.fillFrame]);

    const handleSeekPointer = (clientX) => {
        const bar = timelineRef.current;
        const video = videoRef.current;
        if (!bar || !video || !duration) return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
        const target = ratio * duration;
        video.currentTime = target;
        setCurrentTime(target);
    };

    const handleTimelinePointerDown = (e) => {
        e.preventDefault();
        handleSeekPointer(e.clientX);
        const onMove = (moveEvent) => handleSeekPointer(moveEvent.clientX);
        const onUp = () => {
            window.removeEventListener('pointermove', onMove);
            window.removeEventListener('pointerup', onUp);
        };
        window.addEventListener('pointermove', onMove);
        window.addEventListener('pointerup', onUp);
    };

    const handleTimelineHover = (e) => {
        const bar = timelineRef.current;
        if (!bar || !duration) return;
        const rect = bar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        setHoverPercent(ratio * 100);
        setHoverTime(ratio * duration);
    };

    const handleSelectSpeed = (nextRate) => {
        if (videoRef.current) videoRef.current.playbackRate = nextRate;
        updateVideoPrefs({ playbackRate: nextRate });
    };

    const handleToggleLoop = () => {
        const nextLoop = !prefs.loop;
        if (videoRef.current) videoRef.current.loop = nextLoop;
        updateVideoPrefs({ loop: nextLoop });
    };

    const handleSelectBoost = (nextBoost) => {
        updateVideoPrefs({ boost: nextBoost });
        applyBoostToVideo(nextBoost);
    };

    const handleStepFrame = (direction) => {
        const video = videoRef.current;
        if (!video) return;
        if (!video.paused) video.pause();
        const maxDur = Number.isFinite(video.duration) ? video.duration : Infinity;
        video.currentTime = Math.min(maxDur, Math.max(0, video.currentTime + direction * FRAME_STEP));
    };

    const handleScreenshot = () => {
        const video = videoRef.current;
        if (!video || !video.videoWidth || !video.videoHeight) return;
        try {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `tetrone-frame-${Math.floor(video.currentTime)}s.png`;
            a.click();
            setSavedBadge(true);
            setTimeout(() => setSavedBadge(false), 1500);
        } catch {
            // Cross-origin обмеження
        }
    };

    const handleSubtitleFile = async (e) => {
        const file = e.target.files?.[0];
        const video = videoRef.current;
        if (!file || !video) return;

        const rawText = await file.text();
        const vttText = file.name.toLowerCase().endsWith('.srt')
            ? convertSrtToVtt(rawText)
            : rawText;

        if (customTrackUrl) URL.revokeObjectURL(customTrackUrl);
        const blobUrl = URL.createObjectURL(new Blob([vttText], { type: 'text/vtt' }));
        setCustomTrackUrl(blobUrl);
        setSubtitleName(file.name);

        Array.from(video.querySelectorAll('track[data-lg-track="1"]')).forEach((el) => el.remove());
        const trackEl = document.createElement('track');
        trackEl.kind = 'subtitles';
        trackEl.label = file.name;
        trackEl.srclang = 'uk';
        trackEl.src = blobUrl;
        trackEl.default = true;
        trackEl.setAttribute('data-lg-track', '1');
        video.appendChild(trackEl);

        setTimeout(() => {
            if (video.textTracks?.length) {
                for (let i = 0; i < video.textTracks.length; i += 1) {
                    video.textTracks[i].mode = i === video.textTracks.length - 1 ? 'showing' : 'disabled';
                }
            }
        }, 40);

        e.target.value = '';
    };

    const handleClearSubs = () => {
        const video = videoRef.current;
        if (!video) return;
        Array.from(video.querySelectorAll('track[data-lg-track="1"]')).forEach((el) => el.remove());
        if (video.textTracks?.length) {
            for (let i = 0; i < video.textTracks.length; i += 1) {
                video.textTracks[i].mode = 'disabled';
            }
        }
        if (customTrackUrl) {
            URL.revokeObjectURL(customTrackUrl);
            setCustomTrackUrl(null);
        }
        setSubtitleName('');
    };

    const handleKeyDown = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        const video = videoRef.current;
        if (!video) return;

        switch (e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                revealControls();
                break;
            case 'arrowleft':
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 5);
                revealControls();
                break;
            case 'arrowright':
                e.preventDefault();
                video.currentTime = Math.min(duration || Infinity, video.currentTime + 5);
                revealControls();
                break;
            case 'j':
                e.preventDefault();
                video.currentTime = Math.max(0, video.currentTime - 10);
                revealControls();
                break;
            case 'l':
                e.preventDefault();
                video.currentTime = Math.min(duration || Infinity, video.currentTime + 10);
                revealControls();
                break;
            case 'arrowup': {
                e.preventDefault();
                const nextVol = Math.min(1, Number((video.volume + 0.05).toFixed(2)));
                video.volume = nextVol;
                video.muted = false;
                updateVideoPrefs({ volume: nextVol, muted: false });
                revealControls();
                break;
            }
            case 'arrowdown': {
                e.preventDefault();
                const nextVol = Math.max(0, Number((video.volume - 0.05).toFixed(2)));
                video.volume = nextVol;
                video.muted = nextVol === 0;
                updateVideoPrefs({ volume: nextVol, muted: nextVol === 0 });
                revealControls();
                break;
            }
            case 'm':
                e.preventDefault();
                toggleMute();
                revealControls();
                break;
            case 'f':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'z':
                e.preventDefault();
                toggleFillFrame();
                revealControls();
                break;
            case ',':
                e.preventDefault();
                handleStepFrame(-1);
                revealControls();
                break;
            case '.':
                e.preventDefault();
                handleStepFrame(1);
                revealControls();
                break;
            default:
                break;
        }
    };

    const progressPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
    const bufferPercent = duration > 0 ? Math.min(100, (bufferedEnd / duration) * 100) : 0;
    const hasCustomSubs = Boolean(subtitleName);
    const uiVisible = controlsVisible || !isPlaying || settingsOpen || wipOpen;

    return (
        <div
            ref={wrapperRef}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onMouseMove={revealControls}
            onMouseEnter={revealControls}
            onMouseLeave={() => {
                if (isPlaying && !settingsOpen && !wipOpen) setControlsVisible(false);
            }}
            className={`app-video-player group ${isFullscreen ? 'is-fullscreen' : ''} ${prefs.fillFrame ? 'is-fill' : ''} ${className}`}
        >
            <div
    className="lg-video-stage"
    style={isFullscreen ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        maxWidth: 'none',
        maxHeight: 'none',
        overflow: 'hidden',
        background: '#000',
    } : undefined}
>
                 <video
        ref={videoRef}
        poster={poster || undefined}
        playsInline
        preload="metadata"
        style={isFullscreen ? {
            position: 'absolute',
            inset: 0,
            display: 'block',
            width: '100%',
            height: '100%',
            minWidth: 0,
            minHeight: 0,
            maxWidth: 'none',
            maxHeight: 'none',
            margin: 0,
            padding: 0,
            objectFit: prefs.fillFrame ? 'cover' : 'contain',
            objectPosition: 'center center',
            background: '#000',
        } : undefined}
        onClick={() => {
            if (settingsOpen || wipOpen) {
                setSettingsOpen(false);
                setWipOpen(false);
                return;
            }
            togglePlay();
        }}
        onDoubleClick={toggleFullscreen}
    />

                {/* Індикатор буферизації */}
                {isBuffering && (
                    <div className="lg-glass-popover absolute top-[10px] right-[10px] z-20 px-[8px] py-[3px] text-[10px] font-mono text-white/90 pointer-events-none">
                        HLS BUFFERING...
                    </div>
                )}

                {/* Центральна квадратна кнопка Play / Replay */}
                {(!isPlaying || isEnded) && (
                    <button
                        type="button"
                        aria-label={isEnded ? t('video.restart') : t('video.play')}
                        onClick={togglePlay}
                        className="lg-center-play absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                    >
                        {isEnded ? <IconReplay /> : <IconPlay size={18} />}
                    </button>
                )}

                {/* WIP Telemetry HUD */}
                {isWip && showStats && (
                    <WipTelemetryHud
                        videoRef={videoRef}
                        isHlsStream={isHlsStream}
                        isPlaying={isPlaying}
                    />
                )}

                {/* Спливаюче вікно WIP-інструментів (замість другого рядка знизу) */}
                {isWip && wipOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ bottom: isFullscreen ? '56px' : '48px' }}
                        className="lg-glass-popover absolute right-[8px] z-30 w-[250px] max-w-[calc(100%-16px)] p-[8px] text-[10px] text-white space-y-[6px]"
                    >
                        <div className="flex items-center justify-between border-b border-white/15 pb-[4px]">
                            <span className="font-bold text-theme-link uppercase">{t('video.wipMode')}</span>
                            <button
                                type="button"
                                onClick={() => setShowStats((v) => !v)}
                                className={`lg-chip-btn ${showStats ? 'is-active' : ''}`}
                            >
                                {t('video.wipStats')}
                            </button>
                        </div>

                        <div className="flex items-center justify-between gap-[4px]">
                            <span className="text-white/60">Кадри / A-B:</span>
                            <div className="flex items-center gap-[3px]">
                                <button
                                    type="button"
                                    onClick={() => handleStepFrame(-1)}
                                    title={t('video.wipPrevFrame')}
                                    className="lg-chip-btn"
                                >
                                    -1ф
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStepFrame(1)}
                                    title={t('video.wipNextFrame')}
                                    className="lg-chip-btn"
                                >
                                    +1ф
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const v = videoRef.current;
                                        if (!v) return;
                                        setPointA(v.currentTime);
                                        if (pointB !== null && pointB <= v.currentTime) setPointB(null);
                                    }}
                                    title={t('video.wipPointA')}
                                    className={`lg-chip-btn ${pointA !== null ? 'is-active' : ''}`}
                                >
                                    A{pointA !== null ? ` ${formatSeconds(pointA)}` : ''}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const v = videoRef.current;
                                        if (!v) return;
                                        const start = pointA ?? 0;
                                        if (pointA === null) setPointA(0);
                                        if (v.currentTime > start) {
                                            setPointB(v.currentTime);
                                            v.currentTime = start;
                                        }
                                    }}
                                    title={t('video.wipPointB')}
                                    className={`lg-chip-btn ${pointB !== null ? 'is-active' : ''}`}
                                >
                                    B{pointB !== null ? ` ${formatSeconds(pointB)}` : ''}
                                </button>
                                {(pointA !== null || pointB !== null) && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPointA(null);
                                            setPointB(null);
                                        }}
                                        title={t('video.wipClearAb')}
                                        className="lg-chip-btn"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="pt-[4px] border-t border-white/15 flex justify-end">
                            <button
                                type="button"
                                onClick={handleScreenshot}
                                className={`lg-chip-btn w-full text-center ${savedBadge ? 'is-active' : ''}`}
                            >
                                {savedBadge ? t('video.wipScreenshotSaved') : t('video.wipScreenshot')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Розділене на 3 вкладки меню налаштувань Square Liquid Glass */}
                {settingsOpen && (
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ bottom: isFullscreen ? '56px' : '48px' }}
                        className="lg-glass-popover absolute right-[8px] z-30 w-[250px] max-w-[calc(100%-16px)] p-[8px] text-[10px] text-white space-y-[8px]"
                    >
                        {/* 3 вкладки розділів */}
                        <div className="grid grid-cols-3 gap-[3px] pb-[6px] border-b border-white/15">
                            <button
                                type="button"
                                onClick={() => setSettingsTab('playback')}
                                className={`lg-tab-btn text-center ${settingsTab === 'playback' ? 'is-active' : ''}`}
                            >
                                {t('video.speed')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettingsTab('audio')}
                                className={`lg-tab-btn text-center ${settingsTab === 'audio' ? 'is-active' : ''}`}
                            >
                                {t('video.volume')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSettingsTab('screen')}
                                className={`lg-tab-btn text-center ${settingsTab === 'screen' ? 'is-active' : ''}`}
                            >
                                {t('video.aspect', { defaultValue: 'Екран' })}
                            </button>
                        </div>

                        {settingsTab === 'playback' && (
                            <div className="space-y-[8px]">
                                <div>
                                    <div className="text-white/60 uppercase font-bold mb-[4px]">
                                        {t('video.speed')} ({prefs.playbackRate}x)
                                    </div>
                                    <div className="grid grid-cols-4 gap-[3px]">
                                        {SPEED_OPTIONS.map((sp) => (
                                            <button
                                                key={sp}
                                                type="button"
                                                onClick={() => handleSelectSpeed(sp)}
                                                className={`lg-menu-item text-center ${prefs.playbackRate === sp ? 'is-active' : ''}`}
                                            >
                                                {sp === 1 ? t('video.normal') : `${sp}x`}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-[6px] border-t border-white/15">
                                    <button
                                        type="button"
                                        onClick={handleToggleLoop}
                                        className={`lg-menu-item w-full text-center ${prefs.loop ? 'is-active' : ''}`}
                                    >
                                        {t('video.loop')}: {prefs.loop ? 'ON' : 'OFF'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {settingsTab === 'audio' && (
                            <div className="space-y-[8px]">
                                <div>
                                    <div className="text-white/60 uppercase font-bold mb-[4px]">
                                        {t('video.wipBoost')} ({Math.round(prefs.boost * 100)}%)
                                    </div>
                                    <div className="grid grid-cols-3 gap-[3px]">
                                        {BOOST_OPTIONS.map((b) => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => handleSelectBoost(b)}
                                                className={`lg-menu-item text-center ${prefs.boost === b ? 'is-active' : ''}`}
                                            >
                                                {Math.round(b * 100)}%
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-[6px] border-t border-white/15 space-y-[4px]">
                                    <div className="text-white/60 uppercase font-bold">
                                        {t('video.captions')}
                                    </div>
                                    <div className="flex items-center gap-[4px]">
                                        <button
                                            type="button"
                                            onClick={() => subsInputRef.current?.click()}
                                            className={`lg-menu-item flex-1 truncate text-left ${hasCustomSubs ? 'is-active' : ''}`}
                                            title={subtitleName || t('video.wipLoadSubs')}
                                        >
                                            {hasCustomSubs ? subtitleName : t('video.wipLoadSubs')}
                                        </button>
                                        {hasCustomSubs && (
                                            <button
                                                type="button"
                                                onClick={handleClearSubs}
                                                title={t('video.wipSubsOff')}
                                                className="lg-menu-item shrink-0"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {settingsTab === 'screen' && (
                            <div className="space-y-[8px]">
                                <div>
                                    <div className="text-white/60 uppercase font-bold mb-[4px]">
                                        {t('video.aspect', { defaultValue: 'Масштаб кадру' })}
                                    </div>
                                    <div className="grid grid-cols-2 gap-[3px]">
                                        <button
                                            type="button"
                                            onClick={() => updateVideoPrefs({ fillFrame: false })}
                                            className={`lg-menu-item text-center ${!prefs.fillFrame ? 'is-active' : ''}`}
                                        >
                                            {t('video.fit', { defaultValue: 'Вписати' })}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => updateVideoPrefs({ fillFrame: true })}
                                            className={`lg-menu-item text-center ${prefs.fillFrame ? 'is-active' : ''}`}
                                        >
                                            {t('video.fill', { defaultValue: 'Заповнити' })}
                                        </button>
                                    </div>
                                </div>

                                {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                                    <div className="pt-[6px] border-t border-white/15">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSettingsOpen(false);
                                                togglePip();
                                            }}
                                            className="lg-menu-item w-full text-center"
                                        >
                                            {t('video.pip')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Плаваючий Square Liquid Glass док керування */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`lg-glass-dock flex flex-col transition-opacity duration-150 ${
                        uiVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                >
                    {/* Таймлайн */}
                    <div
                        ref={timelineRef}
                        role="slider"
                        aria-label={t('video.seek')}
                        aria-valuemin={0}
                        aria-valuemax={Math.round(duration)}
                        aria-valuenow={Math.round(currentTime)}
                        onPointerDown={handleTimelinePointerDown}
                        onMouseMove={handleTimelineHover}
                        onMouseLeave={() => setHoverTime(null)}
                        className="relative w-full h-[9px] flex items-center cursor-pointer group/seek"
                    >
                        {hoverTime !== null && (
                            <div
                                style={{ left: `${hoverPercent}%` }}
                                className="lg-glass-popover absolute bottom-[12px] -translate-x-1/2 px-[5px] py-[1px] text-[10px] font-mono text-white pointer-events-none whitespace-nowrap"
                            >
                                {formatSeconds(hoverTime)}
                            </div>
                        )}

                        <div className="relative w-full h-[3px] group-hover/seek:h-[5px] bg-white/20 transition-all">
                            <div
                                style={{ width: `${bufferPercent}%` }}
                                className="absolute inset-y-0 left-0 bg-white/30"
                            />
                            <div
                                style={{ width: `${progressPercent}%`, backgroundColor: 'var(--theme-link)' }}
                                className="absolute inset-y-0 left-0"
                            />
                            <div
                                style={{ left: `${progressPercent}%` }}
                                className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-[8px] h-[10px] bg-white border border-black/80 opacity-0 group-hover/seek:opacity-100"
                            />
                        </div>
                    </div>

                    {/* Рядок кнопок */}
                    <div className="flex items-center justify-between gap-[6px] px-[6px] pb-[4px] pt-[1px] text-[11px] text-white">
                        <div className="flex items-center gap-[4px] min-w-0">
                            <button
                                type="button"
                                onClick={togglePlay}
                                title={isPlaying ? t('video.pause') : t('video.play')}
                                className="lg-icon-btn shrink-0"
                            >
                                {isEnded ? <IconReplay /> : isPlaying ? <IconPause /> : <IconPlay />}
                            </button>

                            <div className="flex items-center gap-[5px] shrink-0">
                                <button
                                    type="button"
                                    onClick={toggleMute}
                                    title={prefs.muted ? t('video.unmute') : t('video.mute')}
                                    className="lg-icon-btn"
                                >
                                    <IconVolume muted={prefs.muted} level={prefs.volume} />
                                </button>
                                <input
                                    type="range"
                                    aria-label={t('video.volume')}
                                    min="0"
                                    max="1"
                                    step="0.02"
                                    value={prefs.muted ? 0 : prefs.volume}
                                    onChange={handleVolumeSlider}
                                    className="lg-volume-slider hidden sm:block"
                                />
                            </div>

                            <span className="font-mono text-[10px] text-white/90 pl-[4px] tabular-nums whitespace-nowrap">
                                {formatSeconds(currentTime)} / {formatSeconds(duration)}
                            </span>
                        </div>

                        <div className="flex items-center gap-[3px] shrink-0">
                            {isWip && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setWipOpen((v) => !v);
                                        setSettingsOpen(false);
                                    }}
                                    title={t('video.wipMode')}
                                    className={`lg-chip-btn font-bold uppercase ${wipOpen || showStats || pointA !== null ? 'is-active' : ''}`}
                                >
                                    {t('video.wipBadge')}
                                </button>
                            )}

                            {prefs.playbackRate !== 1 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSettingsTab('playback');
                                        setSettingsOpen((v) => !v);
                                        setWipOpen(false);
                                    }}
                                    className={`lg-chip-btn ${settingsOpen ? 'is-active' : ''}`}
                                >
                                    {prefs.playbackRate}x
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={toggleFillFrame}
                                title={prefs.fillFrame
                                    ? t('video.fit', { defaultValue: 'Вписати в кадр (Z)' })
                                    : t('video.fill', { defaultValue: 'Заповнити без смуг (Z)' })}
                                className={`lg-icon-btn ${prefs.fillFrame ? 'is-active' : ''}`}
                            >
                                <IconAspect filled={prefs.fillFrame} />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    if (hasCustomSubs) {
                                        handleClearSubs();
                                    } else {
                                        subsInputRef.current?.click();
                                    }
                                }}
                                title={hasCustomSubs ? t('video.wipSubsOff') : t('video.wipLoadSubs')}
                                className={`lg-icon-btn ${hasCustomSubs ? 'is-active' : ''}`}
                            >
                                <IconCaptions />
                            </button>

                            <button
                                type="button"
                                onClick={() => {
                                    setSettingsOpen((v) => !v);
                                    setWipOpen(false);
                                }}
                                title={t('video.settings')}
                                className={`lg-icon-btn ${settingsOpen ? 'is-active' : ''}`}
                            >
                                <IconSettings />
                            </button>

                            {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                                <button
                                    type="button"
                                    onClick={togglePip}
                                    title={t('video.pip')}
                                    className="lg-icon-btn"
                                >
                                    <IconPip />
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                title={isFullscreen ? t('video.exitFullscreen') : t('video.enterFullscreen')}
                                className="lg-icon-btn"
                            >
                                <IconFullscreen active={isFullscreen} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <input
                ref={subsInputRef}
                type="file"
                accept=".vtt,.srt,text/vtt"
                onChange={handleSubtitleFile}
                className="hidden"
            />
        </div>
    );
}

const VideoPlayer = React.memo(function VideoPlayer({
    src,
    type = 'video/mp4',
    provider = 'html5',
    poster = '',
    className = ''
}) {
    const { t } = useTranslation();

    if (provider === 'youtube') {
        return (
            <div className={`app-video-player relative w-full aspect-video overflow-hidden bg-black ${className}`}>
                <iframe
                    src={`https://www.youtube.com/embed/${src}?rel=0&modestbranding=1`}
                    title={t('video.frameTitle')}
                    className="w-full h-full border-0 block"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <Html5SquareGlassPlayer
            key={src}
            src={src}
            type={type}
            poster={poster}
            className={className}
        />
    );
});

export default VideoPlayer;