import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

const ImageDropzone = ({ onFileSelect, fileName }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const processFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            onFileSelect({ target: { files: [file] } });
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    useEffect(() => {
        const handlePaste = (e) => {
            const tagName = e.target.tagName?.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea') return;

            if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                processFile(e.clipboardData.files[0]);
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onFileSelect]);

    return (
        <div
            className={`w-full p-[20px] border border-dashed text-center cursor-pointer transition-colors flex flex-col items-center justify-center text-[11px] outline-none ${isDragging ? 'border-theme-link bg-[rgba(128,128,128,0.05)]' : 'border-border bg-bg-box hover:bg-bg-page'}`}
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
                    <strong className="text-theme-link hover:underline">{t('action.drag_and_drop')}</strong> {t('action.or_paste')} (Ctrl+V)
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