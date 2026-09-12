import React, {useState} from 'react';
import {useTranslation} from 'react-i18next';
import CreateStickerPackModal from './CreateStickerPackModal.jsx';
import StickerPackModal from './StickerPackModal';

export default function MyPacksTab({packs, onRefresh})
{
    const {t} = useTranslation();
    const [isCreating, setIsCreating] = useState(false);
    const [editingPackId, setEditingPackId] = useState(null);
    const [viewingPackId, setViewingPackId] = useState(null);

    const editingPack = packs.find(p => p.id === editingPackId);
    const viewingPack = packs.find(p => p.id === viewingPackId);

    const handlePackClick = (pack) =>
    {
        if (pack.is_owner)
        {
            setEditingPackId(pack.id);
        } else
        {
            setViewingPackId(pack.id);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-[10px]">

                <div
                    className="flex flex-col items-center justify-center cursor-pointer border border-dashed border-border bg-bg-page hover:bg-nav-hover p-[10px] min-h-[100px] rounded-[3px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]"
                    onClick={() => setIsCreating(true)}
                >
                    <div className="text-[24px] text-text-muted mb-[4px] leading-none font-bold">+</div>
                    <div className="text-[10px] text-text-muted text-center font-bold">{t('stickers.create_new_pack')}</div>
                </div>

                {packs.map(pack => (
                    <div
                        key={pack.id}
                        className="cursor-pointer border border-border p-[2px] bg-bg-page hover:bg-nav-hover min-h-[100px] rounded-[3px] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)]"
                        onClick={() => handlePackClick(pack)}
                    >
                        <img
                            src={pack.cover_url}
                            alt={pack.title}
                            title={pack.title}
                            className="w-full h-full object-cover"
                        />
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