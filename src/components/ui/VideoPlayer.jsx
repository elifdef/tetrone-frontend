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

function WipTelemetryHudInner({ player, videoRef, hlsLevels, currentLevel }) {
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

function WipControlsPanel({ videoRef, hlsRef, hlsLevels, currentLevel, onSelectLevel }) {
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
        />
    );
}

function WipControlsPanelInner({ player, videoRef, hlsRef, hlsLevels, currentLevel, onSelectLevel }) {
    const { t } = useTranslation();
    const rateState = usePlayer(selectPlaybackRate);
    const [showStats, setShowStats] = useState(false);
    const [showSpeedMenu, setShowSpeedMenu] = useState(false);
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [isLoop, setIsLoop] = useState(false);
    const [pointA, setPointA] = useState(null);
    const [pointB, setPointB] = useState(null);
    const [boost, setBoost] = useState(1);
    const [savedBadge, setSavedBadge] = useState(false);
    const [customTrackUrl, setCustomTrackUrl] = useState(null);

    const fileInputRef = useRef(null);
    const audioCtxRef = useRef(null);
    const gainNodeRef = useRef(null);
    const activeRate = rateState?.playbackRate ?? videoRef.current?.playbackRate ?? 1;

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
        const video = videoRef.current;
        if (!video) return;
        video.loop = !video.loop;
        setIsLoop(video.loop);
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
        const video = videoRef.current;
        if (!video) return;
        const nextIdx = (BOOST_OPTIONS.indexOf(boost) + 1) % BOOST_OPTIONS.length;
        const nextBoost = BOOST_OPTIONS[nextIdx];

        try {
            if (!audioCtxRef.current && nextBoost > 1) {
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
                audioCtxRef.current.resume();
            }
            if (gainNodeRef.current) {
                gainNodeRef.current.gain.value = nextBoost;
            }
            setBoost(nextBoost);
        } catch {
            setBoost(1);
        }
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
                            className={`app-vjs-wip-btn ${isLoop ? 'is-active' : ''}`}
                        >
                            {t('video.loop')}
                        </button>

                        <button
                            type="button"
                            onClick={handleCycleBoost}
                            title={t('video.wipBoost')}
                            className={`app-vjs-wip-btn ${boost > 1 ? 'is-active' : ''}`}
                        >
                            {Math.round(boost * 100)}%
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
    const wrapperRef = useRef(null);
    const videoRef = useRef(null);
    const hlsRef = useRef(null);
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
                setHlsLevels(data?.levels || []);
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
                        />
                    )}
                </VjsPlayer>
            </I18nProvider>
        </div>
    );
});

export default VideoPlayer;