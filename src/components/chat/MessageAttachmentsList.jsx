import React, { useState } from 'react';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import VideoPlayer from '../ui/VideoPlayer';

const FileDocSvg = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
);

const AudioWaveSvg = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

export default function MessageAttachmentsList({ files = [] }) {
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    if (!files || files.length === 0) return null;

    const isImageFile = (file) =>
        file.type === 'image' || file.type?.startsWith('image/') || file.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
    const isVideoFile = (file) =>
        file.type === 'video' || file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm|ogg|mov|mkv|avi)$/i);
    const isAudioFile = (file) =>
        file.type === 'audio' || file.type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|ogg|m4a|aac)$/i);

    const getVideoMimeType = (file) => {
        if (file.type && file.type.includes('/')) return file.type;
        const ext = file.name?.split('.').pop()?.toLowerCase();
        if (ext === 'webm') return 'video/webm';
        if (ext === 'ogg') return 'video/ogg';
        if (ext === 'mov') return 'video/quicktime';
        if (ext === 'mkv') return 'video/x-matroska';
        return 'video/mp4';
    };

    return (
        <>
            <div className="mt-[6px] flex flex-wrap gap-[8px]">
                {files.map((file, idx) => {
                    // Зображення
                    if (isImageFile(file)) {
                        return (
                            <div
                                key={idx}
                                onClick={() => setPreviewImageUrl(file.url)}
                                className="max-w-[380px] border border-border overflow-hidden bg-bg-page cursor-pointer hover:opacity-95 transition-opacity"
                            >
                                <img
                                    src={file.url}
                                    alt={file.name || ''}
                                    loading="lazy"
                                    className="max-h-[220px] w-auto object-cover block"
                                />
                            </div>
                        );
                    }

                    // Повноцінне відео через VideoPlayer
                    if (isVideoFile(file)) {
                        return (
                            <div key={idx} className="w-full max-w-[420px] border border-border overflow-hidden bg-black">
                                <VideoPlayer
                                    src={file.url}
                                    type={getVideoMimeType(file)}
                                    className="w-full"
                                />
                            </div>
                        );
                    }

                    // Заглушка для аудіо
                    if (isAudioFile(file)) {
                        return (
                            <div
                                key={idx}
                                className="flex items-center gap-[8px] w-full max-w-[340px] px-[10px] py-[6px] bg-bg-page border border-border"
                            >
                                <div className="w-[28px] h-[28px] bg-header-bg border border-border flex items-center justify-center text-theme-link shrink-0">
                                    <AudioWaveSvg />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[11px] font-bold text-theme-link truncate">{file.name}</div>
                                    <audio src={file.url} controls className="w-full h-[24px] mt-[4px]" />
                                </div>
                            </div>
                        );
                    }

                    // Заглушка для документів
                    return (
                        <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-[6px] px-[10px] py-[6px] bg-bg-page border border-border text-[11px] text-theme-link hover:underline"
                        >
                            <FileDocSvg />
                            <span className="max-w-[220px] truncate">{file.name}</span>
                        </a>
                    );
                })}
            </div>

            {previewImageUrl && (
                <ImagePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewImageUrl(null)}
                    imageUrl={previewImageUrl}
                />
            )}
        </>
    );
}