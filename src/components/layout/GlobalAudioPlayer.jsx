import { useRef, useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { AudioContext } from "../../context/AudioContext";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";

const PlayIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>);
const PauseIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>);
const LoopIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>);
const CloseIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const MusicIcon = () => (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>);
const VolumeIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>);

const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export default function GlobalAudioPlayer() {
    const { t } = useTranslation();
    const { currentTrack, isPlaying } = useContext(AudioContext);
    const waveformRef = useRef(null);
    const [showVolumePanel, setShowVolumePanel] = useState(false);

    const {
        isReady, hasError, currentTime, duration,
        playbackRate, isLooping, volume,
        playPauseClick, toggleSpeed, toggleLoop, handleVolumeChange, handleClose
    } = useAudioPlayer(waveformRef);

    if (!currentTrack) return null;

    const trackName = currentTrack.original_name || currentTrack.file_name;

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
                    <span className="tetrone-player-label">{t('audio.now_playing')}</span>
                    <strong className="tetrone-player-title" title={trackName}>
                        {trackName}
                    </strong>
                    <span className="tetrone-player-time">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                </div>
                <button className="tetrone-player-close" onClick={handleClose}>
                    <CloseIcon />
                </button>
            </div>

            {hasError ? (
                <div className="tetrone-player-error">{t('audio.error_loading')}</div>
            ) : (
                <div className="tetrone-player-waveform" ref={waveformRef}></div>
            )}

            <div className="tetrone-player-controls">
                <div className="tetrone-controls-left">
                </div>

                <div className="tetrone-controls-center">
                    <button className="tetrone-player-btn tetrone-player-speed" onClick={toggleSpeed} title={t('audio.speed')}>
                        {playbackRate}x
                    </button>

                    <button className="tetrone-player-btn-main" onClick={playPauseClick} disabled={!isReady || hasError}>
                        {!isReady && !hasError ? <span className="tetrone-player-loading">⏳</span> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
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