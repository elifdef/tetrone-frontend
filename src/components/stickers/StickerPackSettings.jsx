import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';

export default function StickerPackSettings({
                                                title, setTitle,
                                                isPublished, setIsPublished,
                                                coverPreview, onCoverChange
                                            }) {
    const { t } = useTranslation();
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onCoverChange(file);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-[15px]">
            {/* Ліва колонка */}
            <div className="flex-1 flex flex-col gap-[10px]">
                <label className="text-[11px] font-bold text-text-main">
                    {t('stickers.pack_title')}
                </label>
                <input
                    type="text"
                    className="border border-input-border bg-input-bg px-[6px] py-[4px] text-[11px] text-text-main w-full focus:outline-none focus:border-border shadow-inner"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    maxLength={50}
                />

                <label className="flex items-center text-[11px] text-text-main cursor-pointer mt-[10px]">
                    <input
                        type="checkbox"
                        className="mr-[6px]"
                        checked={isPublished}
                        onChange={e => setIsPublished(e.target.checked)}
                    />
                    {t('stickers.publish_in_catalog')}
                </label>
            </div>

            {/* Права колонка (Обкладинка) */}
            <div className="w-[120px] flex flex-col items-center">
                <div className="text-[11px] font-bold text-text-main mb-[5px] text-center w-full">
                    {t('stickers.cover')}
                </div>
                <div
                    className="w-[100px] h-[100px] border border-border bg-bg-page hover:bg-nav-hover cursor-pointer p-[2px] flex items-center justify-center rounded-[3px]"
                    onClick={() => fileInputRef.current.click()}
                >
                    {coverPreview ? (
                        <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-[32px] text-text-muted leading-none">+</div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                />
            </div>
        </div>
    );
}