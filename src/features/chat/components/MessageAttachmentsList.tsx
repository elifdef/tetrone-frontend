import { useState } from 'react';
import ImagePreviewModal from '@ui/ImagePreviewModal';
import VideoPlayer from '@ui/VideoPlayer';
import AudioTrack from '@ui/AudioTrack';
import MediaAttachmentDebugBar from '@ui/MediaAttachmentDebugBar';
import FileTypeIcon from '@ui/FileTypeIcon';
import { isImageFile, isVideoFile, isAudioFile, getVideoMimeType } from '@utils/fileTypes';
import type { ChatAttachmentPreview, ChatData } from '@/types/chat';

export type MessageAttachmentFile = ChatAttachmentPreview & {
    cover_url?: string | null;
    chat_slug?: string;
    chat_id?: string | number;
};

export interface MessageAttachmentsListProps {
    files?: MessageAttachmentFile[];
    activeChat?: (Partial<ChatData> & { id?: string | number }) | null;
}

export default function MessageAttachmentsList({ files = [], activeChat = null }: MessageAttachmentsListProps) {
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    if (!files || files.length === 0) return null;

    return (
        <>
            <div className="mt-[6px] flex flex-wrap gap-[8px]">
                {files.map((file, idx) => {
                    const fileUrl = file.url;
                    if (!fileUrl) return null;

                    const validFile = {
                        ...file,
                        url: fileUrl,
                    };

                    if (isImageFile(validFile)) {
                        return (
                            <div
                                key={idx}
                                onClick={() => setPreviewImageUrl(fileUrl)}
                                className="max-w-[380px] border border-border overflow-hidden bg-bg-page cursor-pointer hover:opacity-95 transition-opacity rounded-none"
                            >
                                <img
                                    src={fileUrl}
                                    alt={file.name || ''}
                                    loading="lazy"
                                    className="max-h-[220px] w-auto object-cover block"
                                />
                            </div>
                        );
                    }

                    if (isVideoFile(validFile)) {
                        return (
                            <div key={idx} className="w-full max-w-[420px] flex flex-col">
                                <div className="w-full border border-border overflow-hidden bg-black rounded-none">
                                    <VideoPlayer
                                        src={fileUrl}
                                        type={getVideoMimeType(validFile)}
                                        className="w-full"
                                    />
                                </div>
                                <MediaAttachmentDebugBar attachment={validFile} />
                            </div>
                        );
                    }

                    if (isAudioFile(validFile)) {
                        const chatIdentifier =
                            activeChat?.slug ||
                            activeChat?.id ||
                            file.chat_slug ||
                            file.chat_id ||
                            fileUrl.match(/\/chat\/([^/]+)/)?.[1] ||
                            null;
                        const chatUrl = chatIdentifier ? `/chat?dm=${chatIdentifier}` : null;
                        const fileSize = file.file_size || file.size || 0;

                        return (
                            <div key={idx} className="w-full max-w-[300px]">
                                <AudioTrack
                                    doc={{
                                        id: file.id || fileUrl,
                                        url: fileUrl,
                                        file_url: fileUrl,
                                        name: file.name,
                                        original_name: file.name,
                                        size: fileSize,
                                        file_size: fileSize,
                                        cover_url: file.cover_url || null,
                                        status: file.status || 'ready',
                                        meta: file.meta || null,
                                    }}
                                    sourceInfo={{
                                        type: 'chat',
                                        id: chatIdentifier,
                                        url: chatUrl,
                                        name: file.name,
                                    }}
                                    onSourceClick={undefined}
                                />
                            </div>
                        );
                    }

                    return (
                        <a
                            key={idx}
                            href={fileUrl}
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