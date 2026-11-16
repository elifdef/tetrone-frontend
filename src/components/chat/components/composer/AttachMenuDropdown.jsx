import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../../../ui/Button';

const PhotoSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

const VideoSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <polygon points="23 7 16 12 23 17 23 7" />
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
);

const AudioSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
    </svg>
);

const DocSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);

const BrushSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.82 0L8 7l9 9 1.59-1.59a2 2 0 0 0 0-2.82L17 10l4.37-4.37a2.12 2.12 0 1 0-3-3Z" />
        <path d="M9 8c-2 3-4 3.5-7 4l8 10c2-1 6-5 6-7" />
    </svg>
);

export default function AttachMenuDropdown({ onFileChange, onOpenGraffiti }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const fileInputRef = useRef(null);

    const triggerFileSelect = (accept = '*') => {
        setIsOpen(false);
        if (fileInputRef.current) {
            fileInputRef.current.accept = accept;
            fileInputRef.current.click();
        }
    };

    return (
        <div className="relative">
            <Button
                variant="secondary"
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
            >
                {t('chat.composer.add')}
            </Button>

            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={onFileChange}
                className="hidden"
            />

            {isOpen && (
                <div className="absolute right-0 bottom-full mb-[4px] w-[165px] bg-bg-box border border-border shadow-md z-20 flex flex-col divide-y divide-border text-[11px]">
                    <button
                        type="button"
                        onClick={() => triggerFileSelect('image/*')}
                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                    >
                        <PhotoSvg />
                        <span>{t('chat.composer.attach.photo')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => triggerFileSelect('video/*')}
                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                    >
                        <VideoSvg />
                        <span>{t('chat.composer.attach.video')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => triggerFileSelect('audio/*')}
                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                    >
                        <AudioSvg />
                        <span>{t('chat.composer.attach.audio')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => triggerFileSelect('*')}
                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                    >
                        <DocSvg />
                        <span>{t('chat.composer.attach.document')}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsOpen(false);
                            onOpenGraffiti();
                        }}
                        className="flex items-center gap-[8px] px-[10px] py-[7px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                    >
                        <BrushSvg />
                        <span>{t('chat.composer.attach.graffiti')}</span>
                    </button>
                </div>
            )}
        </div>
    );
}