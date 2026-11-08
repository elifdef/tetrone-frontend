import { useContext, useState, useEffect, memo, useRef } from "react";
import { useNavigate } from "react-router";
import { AudioContext } from "../../context/AudioContext";
import { useSocket } from "../../context/SocketContext";
import { formatFileSize } from "../../utils/upload";
import ProcessingSkeleton from "../post/content/ProcessingSkeleton";

const MiniPlayIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const MiniPauseIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const TrackProgressBar = ({ audioRef, isActiveTrack }) => {
    const [progress, setProgress] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        if (!isActiveTrack) {
            setProgress(0);
            return;
        }

        const audio = audioRef?.current;
        if (!audio) return;

        const updateProgress = () => {
            const hlsDur = audio.getAttribute('data-hls-duration');
            const duration = audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity
                ? audio.duration
                : (hlsDur ? parseFloat(hlsDur) : 0);

            if (duration > 0 && !isNaN(audio.currentTime)) {
                const currentPercent = (audio.currentTime / duration) * 100;
                setProgress(Math.min(100, Math.max(0, currentPercent)));
            } else {
                setProgress(0);
            }
        };

        const loop = () => {
            updateProgress();
            rafRef.current = requestAnimationFrame(loop);
        };

        const onPlay = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(loop);
        };

        const onPause = () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            updateProgress();
        };

        audio.addEventListener('timeupdate', updateProgress);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        audio.addEventListener('seeked', updateProgress);

        if (!audio.paused) {
            onPlay();
        } else {
            updateProgress();
        }

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            audio.removeEventListener('timeupdate', updateProgress);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
            audio.removeEventListener('seeked', updateProgress);
        };
    }, [audioRef, isActiveTrack]);

    if (!isActiveTrack) return null;

    return (
        <div className="w-full h-[3px] bg-border/40 overflow-hidden my-[2px] rounded-none">
            <div
                className="h-full bg-theme-link rounded-none transition-all duration-75"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
};

const AudioTrack = ({ doc, sourceInfo, onSourceClick }) => {
    const navigate = useNavigate();
    const { audioRef, currentTrack, isPlaying, playTrack } = useContext(AudioContext);
    const socketContext = useSocket();
    const socket = socketContext?.socket;

    const [trackData, setTrackData] = useState(doc);

    useEffect(() => {
        setTrackData(doc);
    }, [doc]);

    useEffect(() => {
        if (!socket || trackData?.status !== 'processing') return;

        const handleReady = (data) => {
            if (data && (data.id === trackData.id || data.post_id === trackData.post_id)) {
                setTrackData(prev => ({
                    ...prev,
                    status: 'ready',
                    file_path: data.file_path,
                    file_url: data.file_url || data.url,
                    file_size: data.file_size || prev.file_size || data.size
                }));
            }
        };

        socket.on('attachment.ready', handleReady);
        return () => { socket.off('attachment.ready', handleReady); };
    }, [socket, trackData?.id, trackData?.post_id, trackData?.status]);

    if (!trackData) return null;

    const trackUrl = trackData.file_url || trackData.url || '';
    const trackName = trackData.original_name || trackData.file_name || trackData.name || 'Audio Track';
    const trackSize = trackData.file_size || trackData.size || 0;
    const status = trackData.status || (trackUrl ? 'ready' : 'processing');

    const isReady = status === 'ready' || trackUrl.includes('.m3u8');
    const isProcessing = status === 'processing' && !isReady;
    const isFailed = status === 'failed';

    if (isProcessing) {
        return <ProcessingSkeleton type="audio" />;
    }

    if (isFailed) {
        return (
            <div className="flex items-center py-[4px] px-[8px] text-theme-error text-[11px] italic bg-theme-error/10 border border-theme-error/20 rounded-none">
                ⚠️ Помилка обробки аудіофайлу
            </div>
        );
    }

    const isActiveTrack = currentTrack && (currentTrack.id === trackData.id || currentTrack.url === trackUrl || currentTrack.file_url === trackUrl);

    const handlePlayClick = (e) => {
        e?.stopPropagation();
        playTrack({
            id: trackData.id || trackUrl,
            file_url: trackUrl,
            url: trackUrl,
            original_name: trackName,
            file_name: trackName,
            file_size: trackSize,
            cover_url: trackData.cover_url || null,
            post_id: trackData.post_id || null
        }, sourceInfo);
    };

    const handleTitleClick = (e) => {
        e?.stopPropagation();
        const source = sourceInfo || (trackData.post_id ? { type: 'post', id: trackData.post_id, url: `/post/${trackData.post_id}` } : null);

        if (onSourceClick) {
            onSourceClick(source);
            return;
        }

        if (source?.url) {
            navigate(source.url);
        } else if (source?.type === 'post' && source?.id) {
            navigate(`/post/${source.id}`);
        } else if (source?.type === 'chat' && source?.id) {
            navigate(`/messages/${source.id}`);
        } else if (trackData.post_id) {
            navigate(`/post/${trackData.post_id}`);
        }
    };

    return (
        <div className={`w-full flex items-center p-[6px] border rounded-none transition-colors ${isActiveTrack ? 'bg-bg-box border-theme-link' : 'bg-bg-page border-border hover:border-theme-link/60'}`}>
            <button
                type="button"
                className={`w-[36px] h-[36px] shrink-0 relative border flex items-center justify-center cursor-pointer outline-none rounded-none p-0 group/cover overflow-hidden mr-[8px] ${isActiveTrack ? 'border-theme-link text-white' : 'border-border bg-bg-box text-theme-link hover:border-theme-link'}`}
                onClick={handlePlayClick}
            >
                {trackData.cover_url ? (
                    <>
                        <img src={trackData.cover_url} alt="cover" className="w-full h-full object-cover block rounded-none" />
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/60 text-white transition-opacity ${isActiveTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover/cover:opacity-100'}`}>
                            {isActiveTrack && isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
                        </div>
                    </>
                ) : (
                    <div className={`flex items-center justify-center w-full h-full ${isActiveTrack ? 'bg-theme-link text-white' : 'bg-bg-box text-text-muted hover:text-theme-link'}`}>
                        {isActiveTrack && isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
                    </div>
                )}
            </button>

            <div className="flex flex-col min-w-0 flex-1 justify-center">
                <span
                    className={`text-[11px] font-bold truncate cursor-pointer hover:underline ${isActiveTrack ? 'text-theme-link' : 'text-text-main hover:text-theme-link'}`}
                    title={trackName}
                    onClick={handleTitleClick}
                >
                    {trackName}
                </span>

                <TrackProgressBar audioRef={audioRef} isActiveTrack={isActiveTrack} />

                <span className="text-[9px] text-text-muted mt-[1px]">
                    {trackSize > 0 ? formatFileSize(trackSize) : ''}
                </span>
            </div>
        </div>
    );
};

export default memo(AudioTrack, (prev, next) => (prev.doc?.id || prev.doc?.url) === (next.doc?.id || next.doc?.url) && prev.doc?.status === next.doc?.status);