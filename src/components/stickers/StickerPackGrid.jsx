import React from 'react';
import { useTranslation } from 'react-i18next';

export default function StickerPackGrid({ stickers, onAddClick, onStickerClick }) {
    const { t } = useTranslation();

    return (
        <div>
            <div className="text-[11px] font-bold text-theme-link mb-[10px] pb-[4px] border-b border-border flex justify-between items-end">
                <span>{t('stickers.stickers_list')} ({stickers.length})</span>
            </div>

            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-[5px] max-h-[300px] overflow-y-auto pr-[5px]">
                <div
                    className="cursor-pointer border border-dashed border-theme-link opacity-50 hover:opacity-100 hover:bg-nav-hover flex flex-col items-center justify-center aspect-square transition-none"
                    onClick={onAddClick}
                >
                    <div className="text-[20px] text-theme-link leading-none font-bold">+</div>
                </div>

                {stickers.map(sticker => (
                    <div
                        key={sticker.id}
                        className="cursor-pointer border border-transparent hover:border-border hover:bg-nav-hover p-[4px] aspect-square flex items-center justify-center transition-none"
                        onClick={() => onStickerClick(sticker)}
                        title={`:${sticker.shortcode}:`}
                    >
                        <img src={sticker.url} alt={sticker.shortcode} className="w-full h-full object-contain" />
                    </div>
                ))}
            </div>
        </div>
    );
}