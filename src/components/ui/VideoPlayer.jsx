import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Hls from 'hls.js';

import {
    I18nProvider,
    usePlayer,
    selectBuffer,
    selectPlayback,
    selectPlaybackRate,
    selectStreamType,
    selectTime
} from '@videojs/react';

import { VideoPlayer as VjsPlayer, VideoSkin, Video } from '@videojs/react/video';
import '@videojs/react/video/skin.css';
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
    preferredQualityHeight: -1, // -1 = auto, інакше висота в px (1080, 720, 480...)
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
            preferredQualityHeight: typeof parsed.preferredQualityHeight === 'number' ? parsed.preferredQualityHeight : -1,
        };
    } catch {
        return { ...DEFAULT_VIDEO_PREFS };
    }
}

function updateVideoPrefs(patch) {
    if (typeof window === 'undefined') return { ...DEFAULT_VIDEO_PREFS };
    const current = readVideoPrefs();
    const next = { ...current, ...patch };
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
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function convertSrtToVtt(srtText) {
    const cleaned = srtText
        .replace(/\r+/g, '')
        .replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
    return `WEBVTT\n\n${cleaned}`;
}

function WipTelemetryHud({ videoRef, hlsLevels, currentLevel }) {
    const player = usePlayer();
    if (!player) return null;

    return (
        <WipTelemetryHudInner
            player={player}
            videoRef={videoRef}
            hlsLevels={hlsLevels}
            currentLevel={currentLevel}
        />
    );
}

function WipTelemetryHudInner({ videoRef, hlsLevels, currentLevel }) {
    const { t } = useTranslation();
    const timeState = usePlayer(selectTime);
    const bufferState = usePlayer(selectBuffer);
    const playbackState = usePlayer(selectPlayback);
    const rateState = usePlayer(selectPlaybackRate);
    const streamState = usePlayer(selectStreamType);
    const [, setTick] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((v) => v + 1), 600);
        return () => clearInterval(timer);
    }, []);

    const video = videoRef.current;
    const width = video?.videoWidth || 0;
    const height = video?.videoHeight || 0;
    const currentTime = timeState?.currentTime ?? video?.currentTime ?? 0;
    const duration = timeState?.duration ?? video?.duration ?? 0;
    const rate = rateState?.playbackRate ?? video?.playbackRate ?? 1;

    let bufferAhead = 0;
    if (bufferState?.buffered?.length) {
        const end = bufferState.buffered[bufferState.buffered.length - 1]?.[1] ?? 0;
        bufferAhead = Math.max(0, end - currentTime);
    } else if (video?.buffered?.length) {
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

    const activeLevelObj = currentLevel >= 0 ? hlsLevels[currentLevel] : null;
    const bitrateKbps = activeLevelObj?.bitrate
        ? `${Math.round(activeLevelObj.bitrate / 1000)} kbps`
        : null;

    return (
        <div className="absolute top-[8px] left-[8px] z-20 max-w-[300px] p-[8px] bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-white/90 pointer-events-none select-none space-y-[3px]">
            <div className="flex items-center justify-between gap-[8px] border-b border-white/15 pb-[3px] mb-[3px]">
                <span className="font-bold text-theme-link uppercase">Video.js 10 Telemetry</span>
                <span>{playbackState?.paused ? 'PAUSED' : 'PLAYING'}</span>
            </div>
            <div>
                <span className="text-white/55">{t('video.wipStreamType')}: </span>
                <span>{hlsLevels.length > 0 ? 'HLS.js' : 'HTML5'} ({streamState?.streamType || 'vod'})</span>
            </div>
            <div>
                <span className="text-white/55">{t('video.wipResolution')}: </span>
                <span>{width && height ? `${width}×${height}` : '—'} @ {rate}x</span>
            </div>
            {bitrateKbps && (
                <div>
                    <span className="text-white/55">{t('video.wipBitrate')}: </span>
                    <span>{bitrateKbps}</span>
                </div>
            )}
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

function WipControlsPanel({ videoRef, hlsRef, hlsLevels, currentLevel, onSelectLevel, prefs, applyBoost }) {
    const player = usePlayer();
    if (!player) return null;

    return (
        <WipControlsPanelInner
            player={player}
            videoRef={videoRef}
            hlsRef={hlsRef}
            hlsLevels={hlsLevels}
            currentLevel={currentLevel}
            onSelectLevel={onSelectLevel}
            prefs={prefs}
            applyBoost={applyBoost}
        />
    );
}

function WipControlsPanelInner({ player, videoRef, hlsLevels, currentLevel, onSelectLevel, prefs, applyBoost }) {
    const { t } = useTranslation();
    const rateState = usePlayer(selectPlaybackRate);
    const [showStats, setShowStats] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [pointA, setPointA] = useState(null);
    const [pointB, setPointB] = useState(null);
    const [savedBadge, setSavedBadge] = useState(false);
    const [customTrackUrl, setCustomTrackUrl] = useState(null);

    const fileInputRef = useRef(null);
    const activeRate = rateState?.playbackRate ?? prefs.playbackRate ?? 1;

    useEffect(() => {
        const video = videoRef.current;
        if (!video || pointA === null || pointB === null || pointB <= pointA) return undefined;

        const onTimeUpdate = () => {
            if (video.currentTime >= pointB || video.currentTime < pointA) {
                video.currentTime = pointA;
            }
        };
        video.addEventListener('timeupdate', onTimeUpdate);
        return () => video.removeEventListener('timeupdate', onTimeUpdate);
    }, [videoRef, pointA, pointB]);

    useEffect(() => {
        return () => {
            if (customTrackUrl) URL.revokeObjectURL(customTrackUrl);
        };
    }, [customTrackUrl]);

    const handleSelectSpeed = (nextRate) => {
        updateVideoPrefs({ playbackRate: nextRate });
        if (typeof player?.setPlaybackRate === 'function') {
            player.setPlaybackRate(nextRate);
        } else if (videoRef.current) {
            videoRef.current.playbackRate = nextRate;
        }
        setShowSpeedMenu(false);
    };

    const handleStepFrame = (direction) => {
        const video = videoRef.current;
        if (!video) return;
        if (!video.paused) video.pause();
        const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
        video.currentTime = Math.min(duration, Math.max(0, video.currentTime + direction * FRAME_STEP));
    };

    const handleToggleLoop = () => {
        const nextLoop = !prefs.loop;
        updateVideoPrefs({ loop: nextLoop });
        if (videoRef.current) {
            videoRef.current.loop = nextLoop;
        }
    };

    const handleTogglePip = async () => {
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
            const dataUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = dataUrl;
            a.download = `tetrone-frame-${Math.floor(video.currentTime)}s.png`;
            a.click();
            setSavedBadge(true);
            setTimeout(() => setSavedBadge(false), 1500);
        } catch {
            // Cross-origin відео без CORS заголовків
        }
    };

    const handleCycleBoost = () => {
        const nextIdx = (BOOST_OPTIONS.indexOf(prefs.boost) + 1) % BOOST_OPTIONS.length;
        const nextBoost = BOOST_OPTIONS[nextIdx];
        updateVideoPrefs({ boost: nextBoost });
        applyBoost(nextBoost);
    };

    const handleSetPointA = () => {
        const video = videoRef.current;
        if (!video) return;
        setPointA(video.currentTime);
        if (pointB !== null && pointB <= video.currentTime) {
            setPointB(null);
        }
    };

    const handleSetPointB = () => {
        const video = videoRef.current;
        if (!video) return;
        const start = pointA ?? 0;
        if (pointA === null) setPointA(0);
        if (video.currentTime > start) {
            setPointB(video.currentTime);
            video.currentTime = start;
        }
    };

    const handleClearAb = () => {
        setPointA(null);
        setPointB(null);
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

        Array.from(video.querySelectorAll('track[data-wip-track="1"]')).forEach((el) => el.remove());
        const trackEl = document.createElement('track');
        trackEl.kind = 'subtitles';
        trackEl.label = file.name;
        trackEl.srclang = 'uk';
        trackEl.src = blobUrl;
        trackEl.default = true;
        trackEl.setAttribute('data-wip-track', '1');
        video.appendChild(trackEl);

        setTimeout(() => {
            if (video.textTracks?.length) {
                for (let i = 0; i < video.textTracks.length; i += 1) {
                    video.textTracks[i].mode = i === video.textTracks.length - 1 ? 'showing' : 'disabled';
                }
            }
        }, 50);

        e.target.value = '';
    };

    const handleDisableCustomSubs = () => {
        const video = videoRef.current;
        if (!video) return;
        Array.from(video.querySelectorAll('track[data-wip-track="1"]')).forEach((el) => el.remove());
        if (video.textTracks?.length) {
            for (let i = 0; i < video.textTracks.length; i += 1) {
                video.textTracks[i].mode = 'disabled';
            }
        }
        if (customTrackUrl) {
            URL.revokeObjectURL(customTrackUrl);
            setCustomTrackUrl(null);
        }
    };

    const activeLevelLabel = currentLevel >= 0 && hlsLevels[currentLevel]
        ? `${hlsLevels[currentLevel].height || '?'}p`
        : t('video.auto');

    return (
        <>
            {showStats && (
                <WipTelemetryHud
                    videoRef={videoRef}
                    hlsLevels={hlsLevels}
                    currentLevel={currentLevel}
                />
            )}

            <div
                title={t('video.wipMode')}
                className="relative flex flex-col gap-[5px] px-[8px] py-[6px] bg-black/85 backdrop-blur-md border-t border-white/15 text-[10px] text-white/90 select-none"
            >
                <div className="flex flex-wrap items-center justify-between gap-[4px]">
                    <div className="flex flex-wrap items-center gap-[4px]">
                        <span className="px-[5px] py-[1px] bg-theme-link text-white font-bold uppercase text-[10px]">
                            {t('video.wipBadge')}
                        </span>

                        <button
                            type="button"
                            onClick={() => setShowStats((v) => !v)}
                            className={`app-vjs-wip-btn ${showStats ? 'is-active' : ''}`}
                        >
                            {t('video.wipStats')}
                        </button>

                        <button
                            type="button"
                            onClick={() => handleStepFrame(-1)}
                            title={t('video.wipPrevFrame')}
                            className="app-vjs-wip-btn"
                        >
                            -1ф
                        </button>

                        <button
                            type="button"
                            onClick={() => handleStepFrame(1)}
                            title={t('video.wipNextFrame')}
                            className="app-vjs-wip-btn"
                        >
                            +1ф
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setShowSpeedMenu((v) => !v);
                                setShowQualityMenu(false);
                            }}
                            title={t('video.speed')}
                            className={`app-vjs-wip-btn ${showSpeedMenu || activeRate !== 1 ? 'is-active' : ''}`}
                        >
                            {activeRate === 1 ? '1x' : `${activeRate}x`}
                        </button>

                        {hlsLevels.length > 0 && (
                            <button
                                type="button"
                                onClick={() => {
                                    setShowQualityMenu((v) => !v);
                                    setShowSpeedMenu(false);
                                }}
                                title={t('video.quality')}
                                className={`app-vjs-wip-btn ${showQualityMenu || currentLevel >= 0 ? 'is-active' : ''}`}
                            >
                                {t('video.quality')}: {activeLevelLabel}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-[4px]">
                        <button
                            type="button"
                            onClick={handleSetPointA}
                            title={t('video.wipPointA')}
                            className={`app-vjs-wip-btn ${pointA !== null ? 'is-active' : ''}`}
                        >
                            A{pointA !== null ? ` ${formatSeconds(pointA)}` : ''}
                        </button>

                        <button
                            type="button"
                            onClick={handleSetPointB}
                            title={t('video.wipPointB')}
                            className={`app-vjs-wip-btn ${pointB !== null ? 'is-active' : ''}`}
                        >
                            B{pointB !== null ? ` ${formatSeconds(pointB)}` : ''}
                        </button>

                        {(pointA !== null || pointB !== null) && (
                            <button
                                type="button"
                                onClick={handleClearAb}
                                title={t('video.wipClearAb')}
                                className="app-vjs-wip-btn"
                            >
                                ×
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleToggleLoop}
                            className={`app-vjs-wip-btn ${prefs.loop ? 'is-active' : ''}`}
                        >
                            {t('video.loop')}
                        </button>

                        <button
                            type="button"
                            onClick={handleCycleBoost}
                            title={t('video.wipBoost')}
                            className={`app-vjs-wip-btn ${prefs.boost > 1 ? 'is-active' : ''}`}
                        >
                            {Math.round(prefs.boost * 100)}%
                        </button>

                        <button
                            type="button"
                            onClick={handleScreenshot}
                            className={`app-vjs-wip-btn ${savedBadge ? 'is-active' : ''}`}
                        >
                            {savedBadge ? t('video.wipScreenshotSaved') : t('video.wipScreenshot')}
                        </button>

                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className={`app-vjs-wip-btn ${customTrackUrl ? 'is-active' : ''}`}
                        >
                            {t('video.wipLoadSubs')}
                        </button>

                        {customTrackUrl && (
                            <button
                                type="button"
                                onClick={handleDisableCustomSubs}
                                title={t('video.wipSubsOff')}
                                className="app-vjs-wip-btn"
                            >
                                CC ×
                            </button>
                        )}

                        {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                            <button
                                type="button"
                                onClick={handleTogglePip}
                                className="app-vjs-wip-btn"
                            >
                                PiP
                            </button>
                        )}
                    </div>
                </div>

                {showSpeedMenu && (
                    <div className="flex flex-wrap items-center gap-[4px] pt-[4px] border-t border-white/10">
                        <span className="text-white/55 mr-[4px]">{t('video.speed')}:</span>
                        {SPEED_OPTIONS.map((sp) => (
                            <button
                                key={sp}
                                type="button"
                                onClick={() => handleSelectSpeed(sp)}
                                className={`app-vjs-wip-btn ${activeRate === sp ? 'is-active' : ''}`}
                            >
                                {sp === 1 ? t('video.normal') : `${sp}x`}
                            </button>
                        ))}
                    </div>
                )}

                {showQualityMenu && hlsLevels.length > 0 && (
                    <div className="flex flex-wrap items-center gap-[4px] pt-[4px] border-t border-white/10">
                        <span className="text-white/55 mr-[4px]">{t('video.quality')}:</span>
                        <button
                            type="button"
                            onClick={() => {
                                onSelectLevel(-1);
                                setShowQualityMenu(false);
                            }}
                            className={`app-vjs-wip-btn ${currentLevel === -1 ? 'is-active' : ''}`}
                        >
                            {t('video.auto')}
                        </button>
                        {hlsLevels.map((lvl, idx) => (
                            <button
                                key={`${lvl.height}-${lvl.bitrate}-${idx}`}
                                type="button"
                                onClick={() => {
                                    onSelectLevel(idx);
                                    setShowQualityMenu(false);
                                }}
                                className={`app-vjs-wip-btn ${currentLevel === idx ? 'is-active' : ''}`}
                            >
                                {lvl.height ? `${lvl.height}p` : `L${idx}`}
                                {lvl.bitrate ? ` (${Math.round(lvl.bitrate / 1000)}k)` : ''}
                            </button>
                        ))}
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".vtt,.srt,text/vtt"
                    onChange={handleSubtitleFile}
                    className="hidden"
                />
            </div>
        </>
    );
}

const VideoPlayer = React.memo(function VideoPlayer({
    src,
    type = 'video/mp4',
    provider = 'html5',
    poster = '',
    className = ''
}) {
    const { t, i18n } = useTranslation();
    const isWip = useTetroneWip();
    const prefs = useGlobalVideoPrefs();
    const wrapperRef = useRef(null);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
    const audioCtxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const isApplyingPrefsRef = useRef(false);

    const [hlsLevels, setHlsLevels] = useState([]);
    const [currentLevel, setCurrentLevel] = useState(-1);
    const [forceStandardYoutube, setForceStandardYoutube] = useState(false);
    const [copiedId, setCopiedId] = useState(false);

    const vjsTranslations = useMemo(() => ({
        buttons: {
            play: t('video.play'),
            pause: t('video.pause'),
            replay: t('video.restart'),
            mute: t('video.mute'),
            unmute: t('video.unmute')
        },
        fullscreen: {
            enter: t('video.enterFullscreen'),
            exit: t('video.exitFullscreen')
        },
        captions: {
            enable: t('video.enableCaptions'),
            disable: t('video.disableCaptions')
        },
        pip: {
            enter: t('video.pip'),
            exit: t('video.exitPip')
        },
        slider: {
            seek: t('video.seek')
        },
        time: {
            current: t('video.currentTime'),
            duration: t('video.duration')
        },
        volume: {
            label: t('video.volume')
        },
        menu: {
            settings: t('video.settings'),
            quality: t('video.quality'),
            speed: t('video.speed'),
            captions: t('video.captions'),
            auto: t('video.auto')
        }
    }), [t]);

    const applyBoostToVideo = (targetBoost) => {
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
            // Ігноруємо обмеження браузера до першої взаємодії
        }
    };

    // Застосовуємо глобальні налаштування (гучність, mute, швидкість, повтор, буст) до елемента <video>
    useEffect(() => {
        if (provider === 'youtube') return undefined;
        const video = videoRef.current;
        if (!video) return undefined;

        isApplyingPrefsRef.current = true;
        if (Math.abs(video.volume - prefs.volume) > 0.005) {
            video.volume = prefs.volume;
        }
        if (video.muted !== prefs.muted) {
            video.muted = prefs.muted;
        }
        if (Math.abs(video.playbackRate - prefs.playbackRate) > 0.005) {
            video.playbackRate = prefs.playbackRate;
        }
        if (video.loop !== prefs.loop) {
            video.loop = prefs.loop;
        }
        applyBoostToVideo(prefs.boost);

        const releaseTimer = setTimeout(() => {
            isApplyingPrefsRef.current = false;
        }, 0);

        return () => clearTimeout(releaseTimer);
    }, [provider, prefs.volume, prefs.muted, prefs.playbackRate, prefs.loop, prefs.boost, src]);

    // Слухаємо зміни гучності / швидкості з будь-якого елемента керування плеєра та зберігаємо в localStorage
    useEffect(() => {
        if (provider === 'youtube') return undefined;
        const video = videoRef.current;
        if (!video) return undefined;

        const handleVolumeChange = () => {
            if (isApplyingPrefsRef.current) return;
            updateVideoPrefs({
                volume: Number(video.volume.toFixed(3)),
                muted: Boolean(video.muted),
            });
        };

        const handleRateChange = () => {
            if (isApplyingPrefsRef.current) return;
            const rate = video.playbackRate;
            if (SPEED_OPTIONS.includes(rate)) {
                updateVideoPrefs({ playbackRate: rate });
            }
        };

        const handleLoadedMetadata = () => {
            const latest = readVideoPrefs();
            isApplyingPrefsRef.current = true;
            video.volume = latest.volume;
            video.muted = latest.muted;
            video.playbackRate = latest.playbackRate;
            video.loop = latest.loop;
            setTimeout(() => {
                isApplyingPrefsRef.current = false;
            }, 0);
        };

        const handlePlay = () => {
            const latest = readVideoPrefs();
            if (latest.boost > 1) {
                applyBoostToVideo(latest.boost);
            }
        };

        video.addEventListener('volumechange', handleVolumeChange);
        video.addEventListener('ratechange', handleRateChange);
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('play', handlePlay);

        return () => {
            video.removeEventListener('volumechange', handleVolumeChange);
            video.removeEventListener('ratechange', handleRateChange);
            video.removeEventListener('loadedmetadata', handleLoadedMetadata);
            video.removeEventListener('play', handlePlay);
        };
    }, [provider, src]);

    useEffect(() => {
        setForceStandardYoutube(false);
        setCopiedId(false);
    }, [src, provider]);

    useEffect(() => {
        if (provider === 'youtube') return undefined;
        const video = videoRef.current;
        if (!video || !src) return undefined;

        let hls = null;
        hlsRef.current = null;
        setHlsLevels([]);
        setCurrentLevel(-1);

        const isHls = String(src).includes('.m3u8') || type === 'application/x-mpegURL';

        if (isHls && Hls.isSupported()) {
            hls = new Hls({
                maxBufferLength: 180,
                maxMaxBufferLength: 600,
                maxBufferSize: 150 * 1000 * 1000,
                fragLoadingMaxRetry: 10,
                fragLoadingRetryDelay: 1000,
                manifestLoadingMaxRetry: 6,
            });
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
                const levels = data?.levels || [];
                setHlsLevels(levels);

                const preferredHeight = readVideoPrefs().preferredQualityHeight;
                if (preferredHeight > 0 && levels.length > 0) {
                    let bestIdx = -1;
                    let minDiff = Infinity;
                    levels.forEach((lvl, idx) => {
                        if (lvl.height) {
                            const diff = Math.abs(lvl.height - preferredHeight);
                            if (diff < minDiff) {
                                minDiff = diff;
                                bestIdx = idx;
                            }
                        }
                    });
                    if (bestIdx >= 0) {
                        hls.currentLevel = bestIdx;
                        setCurrentLevel(bestIdx);
                    }
                }
            });
            hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                if (hls.autoLevelEnabled) {
                    setCurrentLevel(-1);
                } else {
                    setCurrentLevel(data.level);
                }
            });
        } else {
            video.src = src;
        }

        return () => {
            if (hls) {
                hls.destroy();
                hlsRef.current = null;
            }
        };
    }, [src, type, provider]);

    // Синхронізуємо зміну якості між кількома HLS-плеєрами
    useEffect(() => {
        const hls = hlsRef.current;
        if (!hls || hlsLevels.length === 0) return;

        if (prefs.preferredQualityHeight <= 0) {
            if (currentLevel !== -1) {
                hls.currentLevel = -1;
                setCurrentLevel(-1);
            }
            return;
        }

        const idx = hlsLevels.findIndex((lvl) => lvl.height === prefs.preferredQualityHeight);
        if (idx >= 0 && idx !== currentLevel) {
            hls.currentLevel = idx;
            setCurrentLevel(idx);
        }
    }, [prefs.preferredQualityHeight, hlsLevels, currentLevel]);

    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper || provider === 'youtube') return undefined;

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
    }, [provider]);

    const handleSelectHlsLevel = (levelIndex) => {
        setCurrentLevel(levelIndex);
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex;
        }
        const selectedHeight = levelIndex >= 0 && hlsLevels[levelIndex]?.height
            ? hlsLevels[levelIndex].height
            : -1;
        updateVideoPrefs({ preferredQualityHeight: selectedHeight });
    };

    if (provider === 'youtube') {
        if (isWip && !forceStandardYoutube) {
            return (
                <div className={`app-video-player relative w-full aspect-video flex flex-col items-center justify-center bg-black text-white border border-border select-none p-[14px] text-center ${className}`}>
                    <span className="px-[8px] py-[2px] text-[11px] font-bold uppercase tracking-wider bg-theme-link text-white mb-[8px]">
                        {t('video.wipBadge')} • YouTube ({src})
                    </span>
                    <span className="text-[12px] text-white/85 mb-[12px]">
                        {t('video.wipYoutubeNotice')}
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-[8px]">
                        <button
                            type="button"
                            onClick={() => setForceStandardYoutube(true)}
                            className="px-[10px] py-[4px] text-[11px] bg-theme-link hover:opacity-90 border border-theme-link text-white cursor-pointer"
                        >
                            {t('video.openStandardEmbed')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                navigator.clipboard?.writeText(String(src));
                                setCopiedId(true);
                                setTimeout(() => setCopiedId(false), 1500);
                            }}
                            className="px-[10px] py-[4px] text-[11px] bg-white/10 hover:bg-white/20 border border-white/25 text-white cursor-pointer"
                        >
                            {copiedId ? t('video.wipCopied') : t('video.wipCopyId')}
                        </button>
                    </div>
                </div>
            );
        }

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
        <div ref={wrapperRef} className={`app-video-player relative w-full overflow-hidden ${className}`}>
            <I18nProvider locale={i18n.language || 'uk'} translations={vjsTranslations}>
                <VjsPlayer>
                    <VideoSkin className="app-vjs-skin">
                        <Video
                            ref={videoRef}
                            poster={poster || undefined}
                            playsInline
                            preload="metadata"
                        />
                    </VideoSkin>

                    {isWip && (
                        <WipControlsPanel
                            videoRef={videoRef}
                            hlsRef={hlsRef}
                            hlsLevels={hlsLevels}
                            currentLevel={currentLevel}
                            onSelectLevel={handleSelectHlsLevel}
                            prefs={prefs}
                            applyBoost={applyBoostToVideo}
                        />
                    )}
                </VjsPlayer>
            </I18nProvider>
        </div>
    );
});

export default VideoPlayer;