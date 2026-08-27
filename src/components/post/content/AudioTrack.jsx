import { useContext, memo } from "react";
import { AudioContext } from "../../../context/AudioContext";
import { formatFileSize } from "../../../utils/upload";
import ProcessingSkeleton from "./ProcessingSkeleton"; // Якщо є, залишаємо

const MiniPlayIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const MiniPauseIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

const AudioTrack = ({ doc, postId }) => {
    const { currentTrack, isPlaying, playTrack } = useContext(AudioContext);

    const isActiveTrack = currentTrack && currentTrack.id === doc.id;
    const isProcessing = doc.status === 'processing';

    if (isProcessing) {
        return <ProcessingSkeleton type="audio" />;
    }

    const handlePlayClick = () => {
        playTrack({ ...doc, postId });
    };

    return (
        <div
            className={`flex items-center py-[4px] px-[2px] cursor-pointer group transition-colors ${isActiveTrack ? 'bg-[rgba(91,155,213,0.1)] border-l-[2px] border-theme-link pl-[0px]' : 'hover:bg-[rgba(128,128,128,0.05)] border-l-[2px] border-transparent pl-[0px]'}`}
            onClick={handlePlayClick}
        >
            {/* Обгортка іконки або обкладинки */}
            <div className="w-[30px] h-[30px] mr-[8px] flex shrink-0 items-center justify-center relative bg-[rgba(128,128,128,0.1)]">
                {doc.cover_url ? (
                    <>
                        <img src={doc.cover_url} alt="cover" className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 flex items-center justify-center text-white ${isActiveTrack && isPlaying ? 'bg-[rgba(0,0,0,0.5)] opacity-100' : 'bg-[rgba(0,0,0,0.5)] opacity-0 group-hover:opacity-100'} transition-opacity`}>
                            {isActiveTrack && isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
                        </div>
                    </>
                ) : (
                    <div className={`text-text-muted ${isActiveTrack ? 'text-theme-link' : 'group-hover:text-text-main'}`}>
                        {isActiveTrack && isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
                    </div>
                )}
            </div>

            {/* Текстова частина */}
            <div className="flex flex-col min-w-0">
                <span className={`text-[11px] font-bold truncate ${isActiveTrack ? 'text-theme-link' : 'text-text-main group-hover:text-theme-link group-hover:underline'}`} title={doc.original_name || doc.file_name}>
                    {doc.original_name || doc.file_name}
                </span>
                <span className="text-[9px] text-text-muted mt-[1px]">
                    {formatFileSize(doc.file_size)}
                </span>
            </div>
        </div>
    );
};

export default memo(AudioTrack, (prev, next) => prev.doc.id === next.doc.id);