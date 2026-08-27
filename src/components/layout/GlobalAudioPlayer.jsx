import { useContext, useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { AudioContext } from "../../context/AudioContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { PlayIcon, PauseIcon, LoopIcon, VolumeIcon, CloseIcon, WaitIcon } from "../ui/Icons";

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// МІКРО-КОМПОНЕНТ 1: Оновлює текст часу СУВОРО 1 раз на секунду
const PlayerTime = ({ audioRef }) => {
    const [time, setTime] = useState({ current: 0, duration: 0 });

    const lastSecRef = useRef(-1);
    const lastDurRef = useRef(-1);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            const hlsDur = audio.getAttribute('data-hls-duration');
            const duration = audio.duration && audio.duration !== Infinity
                ? audio.duration
                : (hlsDur ? parseFloat(hlsDur) : 0);

            const currentSec = Math.floor(audio.currentTime);

            if (currentSec !== lastSecRef.current || duration !== lastDurRef.current) {
                lastSecRef.current = currentSec;
                lastDurRef.current = duration;
                setTime({ current: audio.currentTime, duration });
            }
        };

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('durationchange', updateTime);
        audio.addEventListener('loadedmetadata', updateTime);

        updateTime();

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('durationchange', updateTime);
            audio.removeEventListener('loadedmetadata', updateTime);
        };
    }, [audioRef]);

    return (
        <span className="tetrone-player-time">
            [{formatTime(time.current)} / {formatTime(time.duration)}]
        </span>
    );
};

// МІКРО-КОМПОНЕНТ 2: Прогресбар (крутиться тільки під час відтворення)
const PlayerProgressBar = ({ audioRef }) => {
    const [time, setTime] = useState({ current: 0, duration: 0 });
    const isSeekingRef = useRef(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        let animationFrame;

        const updateState = () => {
            if (isSeekingRef.current) return;

            const hlsDur = audio.getAttribute('data-hls-duration');
            const duration = audio.duration && audio.duration !== Infinity
                ? audio.duration
                : (hlsDur ? parseFloat(hlsDur) : 0);

            setTime({ current: audio.currentTime, duration });
        };

        const loop = () => {
            updateState();
            animationFrame = requestAnimationFrame(loop);
        };

        const onPlay = () => {
            cancelAnimationFrame(animationFrame);
            animationFrame = requestAnimationFrame(loop);
        };

        const onPause = () => {
            cancelAnimationFrame(animationFrame);
            updateState();
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('durationchange', onPause);

        if (!audio.paused) {
            onPlay();
        } else {
            onPause();
        }

        return () => {
            cancelAnimationFrame(animationFrame);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('durationchange', onPause);
        };
    }, [audioRef]);

    const handleSeekChange = (e) => {
        isSeekingRef.current = true;
        setTime(prev => ({ ...prev, current: Number(e.target.value) }));
    };

    const handleSeekMouseUp = (e) => {
        isSeekingRef.current = false;
        if (audioRef.current) {
            audioRef.current.currentTime = Number(e.target.value);
        }
    };

    const progressPercent = time.duration > 0 ? (time.current / time.duration) * 100 : 0;

    return (
        <div className="tetrone-player-progress-container">
            <input
                type="range"
                className="tetrone-player-progress-bar"
                min="0"
                max={time.duration || 100}
                value={time.current || 0}
                onChange={handleSeekChange}
                onMouseUp={handleSeekMouseUp}
                onTouchEnd={handleSeekMouseUp}
                style={{ '--progress-width': `${progressPercent}%` }}
            />
        </div>
    );
};

// МІКРО-КОМПОНЕНТ 3: Ізольована гучність
const PlayerVolume = ({ audioRef }) => {
    const [showPanel, setShowPanel] = useState(false);

    const [volume, setVolume] = useState(() => {
        try { return JSON.parse(localStorage.getItem('tetrone_audio_state'))?.volume ?? 1; }
        catch { return 1; }
    });

    const handleVolumeChange = (e) => {
        const newVol = Number(e.target.value);
        setVolume(newVol);

        if (audioRef.current) {
            audioRef.current.volume = newVol;
        }

        try {
            const settings = JSON.parse(localStorage.getItem('tetrone_audio_state')) || {};
            settings.volume = newVol;
            localStorage.setItem('tetrone_audio_state', JSON.stringify(settings));
        } catch {}
    };

    return (
        <div
            className="tetrone-player-volume-container"
            onMouseEnter={() => setShowPanel(true)}
            onMouseLeave={() => setShowPanel(false)}
        >
            <button className="tetrone-player-btn">
                <VolumeIcon />
            </button>

            {showPanel && (
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
    );
};

// ГОЛОВНИЙ КОМПОНЕНТ
export default function GlobalAudioPlayer() {
    const { t } = useTranslation();
    const { currentTrack, isPlaying } = useContext(AudioContext);

    // Беремо з хука тільки те, що реально впливає на головний каркас
    const {
        audioRef, isReady, hasError,
        playbackRate, isLooping,
        playPauseClick, toggleSpeed, toggleLoop,
        handleClose
    } = useAudioPlayer();

    if (!currentTrack) return null;

    const trackName = currentTrack.original_name || currentTrack.file_name;

    return (
        <div className="tetrone-global-player">
            <div className="tetrone-player-header">
                <div className="tetrone-player-cover">
                    {currentTrack.cover_url ? (
                        <img src={currentTrack.cover_url} alt="" />
                    ) : (
                        <div className="tetrone-music-placeholder">🎵</div>
                    )}
                </div>

                <div className="tetrone-player-info">
                    <strong className="tetrone-player-title" title={trackName}>
                        {trackName}
                    </strong>
                    {/* ІЗОЛЬОВАНИЙ ТАЙМЕР */}
                    <PlayerTime audioRef={audioRef} />
                </div>
                <button className="tetrone-player-close" onClick={handleClose}>
                    <CloseIcon />
                </button>
            </div>

            {hasError ? (
                <div className="tetrone-player-error">{t('audio.error_loading')}</div>
            ) : (
                /* ІЗОЛЬОВАНИЙ ПОВЗУНОК ПРОГРЕСУ */
                <PlayerProgressBar audioRef={audioRef} />
            )}

            <div className="tetrone-player-controls">
                <div className="tetrone-controls-left">
                </div>

                <div className="tetrone-controls-center">
                    <button className="tetrone-player-btn tetrone-player-speed" onClick={toggleSpeed} title={t('audio.speed')}>
                        {playbackRate}x
                    </button>

                    <button className="tetrone-player-btn-main" onClick={playPauseClick} disabled={!isReady || hasError}>
                        {!isReady && !hasError ? <WaitIcon /> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
                    </button>

                    <button className={`tetrone-player-btn ${isLooping ? 'active' : ''}`} onClick={toggleLoop} title={t('audio.loop')}>
                        <LoopIcon />
                    </button>
                </div>

                {/* ІЗОЛЬОВАНА ГУЧНІСТЬ */}
                <div className="tetrone-controls-right">
                    <PlayerVolume audioRef={audioRef} />
                </div>
            </div>
        </div>
    );
}