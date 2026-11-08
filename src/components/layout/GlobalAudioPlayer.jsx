import { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
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

// МІКРО-КОМПОНЕНТ 1: Час
const PlayerTime = ({ audioRef }) => {
    const [time, setTime] = useState({ current: 0, duration: 0 });

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateTime = () => {
            const hlsDur = audio.getAttribute('data-hls-duration');
            const duration = audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity
                ? audio.duration
                : (hlsDur ? parseFloat(hlsDur) : 0);
            
            setTime({ current: audio.currentTime || 0, duration });
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
        <span className="text-[10px] text-text-muted mt-[2px]">
            [{formatTime(time.current)} / {formatTime(time.duration)}]
        </span>
    );
};

// МІКРО-КОМПОНЕНТ 2: Прогресбар (Виправлено баг із паузою та заокруглення)
const PlayerProgressBar = ({ audioRef }) => {
    const [time, setTime] = useState({ current: 0, duration: 0 });
    const isSeekingRef = useRef(false);
    const rafRef = useRef(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const updateState = () => {
            if (isSeekingRef.current) return;
            const hlsDur = audio.getAttribute('data-hls-duration');
            const duration = audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity
                ? audio.duration
                : (hlsDur ? parseFloat(hlsDur) : 0);

            setTime({ current: audio.currentTime || 0, duration });
        };

        const loop = () => {
            updateState();
            rafRef.current = requestAnimationFrame(loop);
        };

        const onPlay = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(loop);
        };

        const onPause = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            updateState();
        };

        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('durationchange', updateState);
        audio.addEventListener('seeked', updateState);

        if (!audio.paused) {
            onPlay();
        } else {
            updateState();
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('durationchange', updateState);
            audio.removeEventListener('seeked', updateState);
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
        <div className="py-[4px]">
            <input
                type="range"
                className="w-full h-[12px] bg-bg-page border border-border appearance-none outline-none cursor-pointer rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[8px] [&::-webkit-slider-thumb]:h-[14px] [&::-webkit-slider-thumb]:bg-theme-link [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:-mt-[2px] [&::-webkit-slider-thumb]:rounded-none [&::-moz-range-thumb]:w-[8px] [&::-moz-range-thumb]:h-[14px] [&::-moz-range-thumb]:bg-theme-link [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:rounded-none"
                min="0"
                max={time.duration || 100}
                value={time.current || 0}
                onChange={handleSeekChange}
                onMouseUp={handleSeekMouseUp}
                onTouchEnd={handleSeekMouseUp}
                style={{
                    backgroundImage: `linear-gradient(var(--theme-link, #5c82ab), var(--theme-link, #5c82ab))`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: `${progressPercent}% 100%`
                }}
            />
        </div>
    );
};

// МІКРО-КОМПОНЕНТ 3: Гучність (Гострі краї)
const PlayerVolume = ({ volume, onVolumeChange }) => {
    const [showPanel, setShowPanel] = useState(false);

    return (
        <div
            className="relative flex items-center justify-center"
            onMouseEnter={() => setShowPanel(true)}
            onMouseLeave={() => setShowPanel(false)}
        >
            <button className="bg-transparent border-none text-theme-link text-[14px] cursor-pointer opacity-80 hover:opacity-100 hover:text-theme-link flex items-center justify-center p-0 rounded-none">
                <VolumeIcon />
            </button>

            {showPanel && (
                <div className="absolute bottom-[calc(100%+5px)] left-1/2 -translate-x-1/2 bg-bg-box border border-border w-[26px] h-[80px] rounded-none flex items-center justify-center z-50 shadow-none">
                    <div className="absolute -bottom-[10px] left-0 w-full h-[15px] bg-transparent" />
                    <input
                        type="range"
                        className="cursor-pointer w-[60px] h-[12px] outline-none bg-transparent appearance-none rounded-none -rotate-90 m-0 p-0 [&::-webkit-slider-runnable-track]:w-full [&::-webkit-slider-runnable-track]:h-[6px] [&::-webkit-slider-runnable-track]:bg-bg-page [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-border [&::-webkit-slider-runnable-track]:rounded-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[10px] [&::-webkit-slider-thumb]:h-[12px] [&::-webkit-slider-thumb]:bg-theme-link [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-border [&::-webkit-slider-thumb]:-mt-[4px] [&::-webkit-slider-thumb]:rounded-none [&::-moz-range-track]:w-full [&::-moz-range-track]:h-[6px] [&::-moz-range-track]:bg-bg-page [&::-moz-range-track]:border [&::-moz-range-track]:border-border [&::-moz-range-track]:rounded-none [&::-moz-range-thumb]:w-[10px] [&::-moz-range-thumb]:h-[12px] [&::-moz-range-thumb]:bg-theme-link [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-border [&::-moz-range-thumb]:rounded-none"
                        min="0"
                        max="1"
                        step="0.05"
                        value={volume}
                        onChange={onVolumeChange}
                    />
                </div>
            )}
        </div>
    );
};

// ГОЛОВНИЙ КОМПОНЕНТ
export default function GlobalAudioPlayer() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { currentTrack, isPlaying } = useContext(AudioContext);

    const {
        audioRef, isReady, hasError,
        playbackRate, isLooping, volume,
        playPauseClick, toggleSpeed, toggleLoop,
        handleVolumeChange, handleClose
    } = useAudioPlayer();

    if (!currentTrack) return null;

    const source = currentTrack.sourceInfo || (currentTrack.post_id ? { type: 'post', id: currentTrack.post_id, url: `/post/${currentTrack.post_id}` } : null);
    const hasSource = !!source;
    const trackName = currentTrack.original_name || currentTrack.file_name;

    const handleTitleClick = () => {
        if (!source) return;
        if (source.url) {
            navigate(source.url);
        } else if (source.type === 'post' && source.id) {
            navigate(`/post/${source.id}`);
        } else if (source.type === 'chat' && source.id) {
            navigate(`/chat/${source.id}`);
        }
    };

    return (
        <div className="w-full rounded-none box-border bg-bg-page border border-border p-[8px] flex flex-col gap-[8px] text-[11px] text-text-main shadow-none">
            <div className="flex items-start gap-[8px] border-b border-border pb-[6px] relative">
                <div className="w-[40px] h-[40px] bg-bg-box border border-border shrink-0 flex items-center justify-center text-text-muted rounded-none">
                    {currentTrack.cover_url ? (
                        <img src={currentTrack.cover_url} alt="" className="w-full h-full object-cover block rounded-none" />
                    ) : (
                        <div className="text-[14px]">🎵</div>
                    )}
                </div>

                <div className="flex flex-col justify-center overflow-hidden flex-grow pr-[20px]">
                    <strong
                        className={`text-[11px] text-theme-link whitespace-nowrap overflow-hidden text-ellipsis font-bold ${hasSource ? 'cursor-pointer hover:underline' : ''}`}
                        title={trackName}
                        onClick={handleTitleClick}
                    >
                        {trackName}
                    </strong>
                    <PlayerTime audioRef={audioRef} />
                </div>
                
                <button 
                    className="bg-transparent border-none text-text-muted cursor-pointer text-[12px] p-0 absolute top-0 right-0 hover:text-theme-link rounded-none" 
                    onClick={handleClose}
                >
                    <CloseIcon />
                </button>
            </div>

            {hasError ? (
                <div className="text-theme-error text-[11px] text-center py-[8px] border border-theme-error/30 bg-theme-error/10 rounded-none">
                    {t('audio.error_loading')}
                </div>
            ) : (
                <PlayerProgressBar audioRef={audioRef} />
            )}

            <div className="flex justify-between items-center bg-bg-box border border-border px-[6px] py-[4px] rounded-none">
                <div className="w-[60px] flex items-center justify-start" />

                <div className="flex items-center justify-center gap-[12px]">
                    <button 
                        className="bg-transparent border-none text-theme-link text-[10px] font-bold cursor-pointer opacity-80 hover:opacity-100 hover:text-theme-link rounded-none" 
                        onClick={toggleSpeed} 
                        title={t('audio.speed')}
                    >
                        {playbackRate}x
                    </button>

                    <button 
                        className="bg-transparent border-none text-[18px] cursor-pointer flex items-center justify-center text-theme-link p-0 hover:opacity-90 disabled:opacity-50 rounded-none" 
                        onClick={playPauseClick} 
                        disabled={!isReady || hasError}
                    >
                        {!isReady && !hasError ? <WaitIcon /> : (isPlaying ? <PauseIcon /> : <PlayIcon />)}
                    </button>

                    <button 
                        className={`bg-transparent border-none text-[14px] cursor-pointer rounded-none ${isLooping ? 'text-text-main opacity-100 font-bold' : 'text-theme-link opacity-80 hover:opacity-100'}`} 
                        onClick={toggleLoop} 
                        title={t('audio.loop')}
                    >
                        <LoopIcon />
                    </button>
                </div>

                <div className="w-[60px] flex items-center justify-end">
                    <PlayerVolume volume={volume} onVolumeChange={handleVolumeChange} />
                </div>
            </div>
        </div>
    );
}