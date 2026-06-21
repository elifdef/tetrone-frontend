import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AudioContext } from "../../../context/AudioContext";
import { formatFileSize } from "../../../utils/upload";
import ProcessingSkeleton from "./ProcessingSkeleton";

const MiniPlayIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M8 5v14l11-7z" />
    </svg>
);

const MiniPauseIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
);

export default function AudioTrack({ doc }) {
    const { t } = useTranslation();
    const { currentTrack, isPlaying, playTrack } = useContext(AudioContext);

    const isActiveTrack = currentTrack && currentTrack.id === doc.id;
    const isProcessing = doc.status === 'processing';

    if (isProcessing) {
        return <ProcessingSkeleton type="audio" />;
    }

    return (
        <div
            className={`tetrone-document-item tetrone-audio-track ${isActiveTrack ? 'active' : ''} ${doc.cover_url ? 'has-cover' : ''}`}
            onClick={() => playTrack(doc)}
        >
            {doc.cover_url ? (
                <div className="tetrone-audio-cover-wrapper">
                    <img src={doc.cover_url} alt="cover" className="tetrone-audio-cover-img" />
                    <div className="tetrone-audio-play-overlay">
                        {isActiveTrack && isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
                    </div>
                </div>
            ) : (
                <div className="tetrone-document-icon">
                    {isActiveTrack && isPlaying ? <MiniPauseIcon /> : <MiniPlayIcon />}
                </div>
            )}

            <div className="tetrone-document-info">
                <span className="tetrone-document-name" title={doc.original_name || doc.file_name}>
                    {doc.original_name || doc.file_name}
                </span>
                <span className="tetrone-document-size">
                    {formatFileSize(doc.file_size)}
                </span>
            </div>
        </div>
    );
}