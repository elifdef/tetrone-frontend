import { useState, useEffect, useRef, useCallback, type ChangeEvent, type DragEvent } from 'react';
import { useTranslation } from 'react-i18next';

export type ImageDropzoneSelectEvent =
    | ChangeEvent<HTMLInputElement>
    | { target: { files: File[] } };

export interface ImageDropzoneProps {
    onFileSelect: (event: ImageDropzoneSelectEvent) => void;
    fileName?: string | null;
}

const ImageDropzone = ({ onFileSelect, fileName }: ImageDropzoneProps) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const processFile = useCallback(
        (file: File | undefined) => {
            if (file && file.type.startsWith('image/')) {
                onFileSelect({ target: { files: [file] } });
            }
        },
        [onFileSelect]
    );

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tagName = target?.tagName?.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea') return;

            if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
                processFile(e.clipboardData.files[0]);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [processFile]);

    return (
        <div
            className={`w-full p-[20px] border-2 border-dashed rounded-none text-center cursor-pointer transition-colors flex flex-col items-center justify-center text-[11px] outline-none ${
                isDragging
                    ? 'border-theme-link bg-header-bg'
                    : 'border-border hover:border-theme-link bg-bg-box hover:bg-bg-page'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => onFileSelect(e)}
            />

            <div className="text-text-main">
                <div>
                    <strong className="text-theme-link hover:underline">{t('action.drag_and_drop')}</strong>{' '}
                    {t('action.or_paste')}
                </div>
            </div>

            {fileName && (
                <div className="mt-[8px] text-[11px] text-text-muted">
                    {t('common.selected_file')}: <strong className="text-text-main">{fileName}</strong>
                </div>
            )}
        </div>
    );
};

export default ImageDropzone;