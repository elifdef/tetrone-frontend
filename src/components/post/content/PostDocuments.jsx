import { useContext } from "react";
import { AudioContext } from "../../../context/AudioContext";
import { formatFileSize } from "../../../utils/upload";
import { useTranslation } from "react-i18next";

import Mp3Icon from "../../../assets/filetypes/mp3.svg?react";
import Mp4Icon from "../../../assets/filetypes/mp3.svg?react";
import EpsteinIcon from "../../../assets/filetypes/pdf.svg?react";
import RARIcon from "../../../assets/filetypes/rar.svg?react";
import ZIPIcon from "../../../assets/filetypes/zip.svg?react";
import DocIcon from "../../../assets/filetypes/word.svg?react";
import DefaultFileIcon from "../../../assets/filetypes/what.svg?react";

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

const getFileIcon = (fileName) => {
    if (!fileName) return <DefaultFileIcon width={64} height={64} />;
    const ext = fileName.split('.').pop().toLowerCase();

    if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return <Mp3Icon width={64} height={64} />;
    if (['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) return <Mp4Icon width={64} height={64} />;
    if (['pdf'].includes(ext)) return <EpsteinIcon width={64} height={64} />;
    if (['zip', '7z', 'tar', 'gz'].includes(ext)) return <ZIPIcon width={64} height={64} />;
    if (['rar'].includes(ext)) return <RARIcon width={64} height={64} />;
    if (['doc', 'docx'].includes(ext)) return <DocIcon width={64} height={64} />;

    return <DefaultFileIcon width={64} height={64} />;
};

export default function PostDocuments({ documents = [] }) {
    const { t } = useTranslation();
    const { currentTrack, isPlaying, playTrack } = useContext(AudioContext);

    if (documents.length === 0) return null;

    return (
        <div className="tetrone-post-documents">
            {documents.map((doc) => {
                const ext = doc.file_name.split('.').pop().toLowerCase();
                const isAudio = ['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext);
                const isActiveTrack = currentTrack && currentTrack.id === doc.id;

                return isAudio ? (
                    <div
                        key={doc.id}
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
                ) : (
                    <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="tetrone-document-item"
                        download={doc.file_name}
                    >
                        <div className="tetrone-document-icon">
                            {getFileIcon(doc.file_name)}
                        </div>
                        <div className="tetrone-document-info">
                            <span className="tetrone-document-name" title={doc.file_name}>
                                {doc.file_name}
                            </span>
                            <span className="tetrone-document-size">
                                {formatFileSize(doc.file_size)}
                            </span>
                        </div>
                    </a>
                );
            })}
        </div>
    );
}