import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import CreateStickerPackModal from './CreateStickerPackModal.jsx';
import StickerPackModal from './StickerPackModal';

export default function MyPacksTab({ packs, onRefresh }) {
    const { t } = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingPackId, setEditingPackId] = useState(null);
    const [viewingPackId, setViewingPackId] = useState(null);

    const editingPack = packs.find(p => p.id === editingPackId);
    const viewingPack = packs.find(p => p.id === viewingPackId);

    const handlePackClick = (pack) => {
        if (pack.is_owner) {
            setEditingPackId(pack.id);
        } else {
            setViewingPackId(pack.id);
        }
    };

    return (
        <div className="flex flex-col pt-[5px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-[10px]">

                <div
                    className="flex flex-col items-center justify-center cursor-pointer border border-dashed border-theme-link opacity-50 hover:opacity-100 hover:bg-nav-hover p-[10px] h-[120px] transition-none group"
                    onClick={() => setIsCreating(true)}
                >
                    <div className="text-[28px] text-theme-link mb-[4px] leading-none font-bold">+</div>
                    <div className="text-[10px] text-theme-link text-center group-hover:underline">{t('stickers.create_new_pack')}</div>
                </div>

                {packs.map(pack => (
                    <div
                        key={pack.id}
                        className="cursor-pointer flex flex-col items-center p-[5px] bg-transparent border border-transparent hover:bg-nav-hover hover:border-border transition-none group"
                        onClick={() => handlePackClick(pack)}
                        title={pack.title}
                    >
                        <div className="border border-border bg-bg-box p-[2px] mb-[6px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] h-[90px] w-[90px] flex-shrink-0">
                            <img
                                src={pack.cover_url}
                                alt={pack.title}
                                className="w-full h-full object-cover block"
                            />
                        </div>
                        <div className="text-[10px] font-bold text-theme-link text-center w-full truncate group-hover:underline">
                            {pack.title}
                        </div>
                    </div>
                ))}
            </div>

            <CreateStickerPackModal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                onRefresh={onRefresh}
            />

            <CreateStickerPackModal
                isOpen={!!editingPackId}
                existingPack={editingPack}
                onClose={() => setEditingPackId(null)}
                onRefresh={onRefresh}
            />

            <StickerPackModal
                isOpen={!!viewingPackId}
                pack={viewingPack}
                onClose={() => setViewingPackId(null)}
                onRefresh={onRefresh}
            />
        </div>
    );
}