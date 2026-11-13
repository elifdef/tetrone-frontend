import React, { useState } from 'react';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import VideoPlayer from '../ui/VideoPlayer';
import AudioTrack from '../ui/AudioTrack';
import FileTypeIcon from '../ui/FileTypeIcon';
import { isImageFile, isVideoFile, isAudioFile, getVideoMimeType } from '../../utils/fileTypes';

export default function MessageAttachmentsList({ files = [], activeChat = null }) {
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    if (!files || files.length === 0) return null;

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
                                className="max-w-[380px] border border-border overflow-hidden bg-bg-page cursor-pointer hover:opacity-95 transition-opacity rounded-none"
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
                            <div key={idx} className="w-full max-w-[420px] border border-border overflow-hidden bg-black rounded-none">
                                <VideoPlayer
                                    src={file.url}
                                    type={getVideoMimeType(file)}
                                    className="w-full"
                                />
                            </div>
                        );
                    }

                    // Аудіо через універсальний AudioTrack
                    if (isAudioFile(file)) {
                        const chatIdentifier = activeChat?.slug || activeChat?.id || file.chat_slug || file.chat_id || (file.url ? file.url.match(/\/chat\/([^\/]+)/)?.[1] : null);
                        const chatUrl = chatIdentifier ? `/chat?dm=${chatIdentifier}` : null;
                        const fileSize = file.file_size || file.size || 0;

                        return (
                            <div key={idx} className="w-full max-w-[300px]">
                                <AudioTrack
                                    doc={{
                                        id: file.id || file.url,
                                        url: file.url,
                                        file_url: file.url,
                                        name: file.name,
                                        original_name: file.name,
                                        size: fileSize,
                                        file_size: fileSize,
                                        cover_url: file.cover_url || null,
                                        status: 'ready'
                                    }}
                                    sourceInfo={{
                                        type: 'chat',
                                        id: chatIdentifier,
                                        url: chatUrl,
                                        name: file.name
                                    }}
                                />
                            </div>
                        );
                    }

                    // Документи
                    return (
                        <a
                            key={idx}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            download={file.name}
                            className="flex items-center gap-[8px] px-[10px] py-[6px] bg-bg-page border border-border text-[11px] text-theme-link hover:underline rounded-none"
                        >
                            <FileTypeIcon fileName={file.name} size={20} />
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