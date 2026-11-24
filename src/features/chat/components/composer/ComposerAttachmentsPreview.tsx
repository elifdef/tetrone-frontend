import { useState } from 'react';
import ImagePreviewModal from '@ui/ImagePreviewModal';
import type { ChatAttachmentPreview } from '@/types/chat';

export interface ComposerAttachmentsPreviewProps {
    files?: ChatAttachmentPreview[];
    onRemoveFile?: (index: number) => void;
}

const VideoSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const DocSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const CloseSmallSvg = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const isImageAttachment = (f: ChatAttachmentPreview) =>
    Boolean(f.type?.startsWith('image/') || f.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i));

const isVideoAttachment = (f: ChatAttachmentPreview) =>
    Boolean(f.type?.startsWith('video/') || f.name?.match(/\.(mp4|webm|ogg)$/i));

export default function ComposerAttachmentsPreview({
    files = [],
    onRemoveFile,
}: ComposerAttachmentsPreviewProps) {
    const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

    if (!files || files.length === 0) return null;

    return (
        <>
            <div className="flex flex-wrap gap-[10px] mb-[8px] p-[8px] bg-bg-box border border-border">
                {files.map((file, idx) => {
                    const fileSrc = file.previewUrl || file.url || undefined;

                    if (isImageAttachment(file)) {
                        return (
                            <div key={idx} className="relative w-[84px] h-[68px] border border-border bg-bg-page group overflow-hidden">
                                <img
                                    src={fileSrc}
                                    alt={file.name || ''}
                                    onClick={() => fileSrc && setPreviewImageUrl(fileSrc)}
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                                <button
                                    type="button"
                                    onClick={() => onRemoveFile?.(idx)}
                                    className="absolute top-[2px] right-[2px] w-[18px] h-[18px] bg-[rgba(0,0,0,0.65)] text-white border-none cursor-pointer flex items-center justify-center hover:bg-theme-error"
                                >
                                    <CloseSmallSvg />
                                </button>
                            </div>
                        );
                    }

                    if (isVideoAttachment(file)) {
                        return (
                            <div key={idx} className="relative w-[110px] h-[68px] border border-border bg-black overflow-hidden">
                                <video src={fileSrc} className="w-full h-full object-cover" muted />
                                <span className="absolute bottom-[3px] left-[4px] text-white bg-[rgba(0,0,0,0.6)] px-[4px] py-[1px] text-[9px] flex items-center gap-[3px]">
                                    <VideoSvg />
                                </span>
                                <button
                                    type="button"
                                    onClick={() => onRemoveFile?.(idx)}
                                    className="absolute top-[2px] right-[2px] w-[18px] h-[18px] bg-[rgba(0,0,0,0.65)] text-white border-none cursor-pointer flex items-center justify-center hover:bg-theme-error"
                                >
                                    <CloseSmallSvg />
                                </button>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className="relative flex items-center gap-[6px] px-[8px] py-[5px] bg-bg-page border border-border text-[11px]">
                            <DocSvg />
                            <span className="max-w-[140px] truncate">{file.name}</span>
                            <button
                                type="button"
                                onClick={() => onRemoveFile?.(idx)}
                                className="text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer flex items-center"
                            >
                                <CloseSmallSvg />
                            </button>
                        </div>
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