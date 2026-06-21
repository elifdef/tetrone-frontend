import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { AudioContext } from "../../context/AudioContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { PlayIcon, PauseIcon, LoopIcon, VolumeIcon, CloseIcon, WaitIcon } from "../ui/Icons";
import '../../styles/player.css';

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function GlobalAudioPlayer() {
    const { t } = useTranslation();
    const { currentTrack, isPlaying } = useContext(AudioContext);
    const [showVolumePanel, setShowVolumePanel] = useState(false);

    const {
        isReady, hasError, currentTime, duration,
        playbackRate, isLooping, volume,
        playPauseClick, toggleSpeed, toggleLoop,
        handleVolumeChange, handleSeek, handleClose
    } = useAudioPlayer();

    if (!currentTrack) return null;

    const trackName = currentTrack.original_name || currentTrack.file_name;
    const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

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
                    <strong className="tetrone-player-title" title={trackName}>
                        {trackName}
                    </strong>
                    <span className="tetrone-player-time">
                        [{formatTime(currentTime)} / {formatTime(duration)}]
                    </span>
                </div>
                <button className="tetrone-player-close" onClick={handleClose}>
                    <CloseIcon />
                </button>
            </div>

            {hasError ? (
                <div className="tetrone-player-error">{t('audio.error_loading')}</div>
            ) : (
                <div className="tetrone-player-progress-container">
                    <input
                        type="range"
                        className="tetrone-player-progress-bar"
                        min="0"
                        max={duration || 100}
                        value={currentTime || 0}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        style={{ '--progress-width': `${progressPercent}%` }}
                    />
                </div>
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

                <div className="tetrone-controls-right">
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
        </div>
    );
}