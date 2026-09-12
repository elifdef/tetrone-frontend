import React, {useState, useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {useMutation} from '@tanstack/react-query';
import {notifyError, notifySuccess} from '../common/Notify.jsx';
import StickerService from '../../services/sticker.service.js';
import {ReportIcon} from '../ui/Icons.jsx';
import Button from '../ui/Button.jsx';
import Modal from '../modals/Modal.jsx';

export default function StickerPackModal({isOpen, pack, onClose, onRefresh})
{
    const {t} = useTranslation();
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    const [favoriteIds, setFavoriteIds] = useState(() =>
    {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        return saved ? JSON.parse(saved).map(f => f.id) : [];
    });

    const menuRef = useRef(null);

    useEffect(() =>
    {
        if (pack)
        {
            setIsInstalled(pack.is_installed);
            setSelectedSticker(null);
        }
    }, [pack, isOpen]);

    useEffect(() =>
    {
        const handleClickOutside = (e) =>
        {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target))
            {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const mutationToggle = useMutation({
        mutationFn: async () =>
                    {
                        if (isInstalled)
                        {
                            return await StickerService.uninstallPack(pack.short_name);
                        } else
                        {
                            return await StickerService.installPack(pack.short_name);
                        }
                    },
        onSuccess:  () =>
                    {
                        setIsInstalled(!isInstalled);
                        notifySuccess(isInstalled ? t('stickers.pack_uninstalled') : t('stickers.pack_installed'));
                        if (onRefresh) onRefresh();
                    },
        onError:    (error) =>
                    {
                        notifyError(error.message || t('common.error'));
                    }
    });

    const toggleFavorite = (sticker) =>
    {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        let favs = saved ? JSON.parse(saved) : [];

        if (favs.find(f => f.id === sticker.id))
        {
            favs = favs.filter(f => f.id !== sticker.id);
            notifySuccess(t('stickers.removed_from_favorites'));
        } else
        {
            favs.unshift(sticker);
            notifySuccess(t('stickers.saved_to_favorites'));
        }

        localStorage.setItem('tetrone_favorite_emojis', JSON.stringify(favs));
        setFavoriteIds(favs.map(f => f.id));
    };

    if (!pack || !isOpen) return null;

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={onClose}>
                {t('action.close')}
            </Button>
            {!pack.is_owner && (
                <Button
                    variant={isInstalled ? 'secondary' : 'primary'}
                    onClick={() => mutationToggle.mutate()}
                    disabled={mutationToggle.isPending}
                >
                    {mutationToggle.isPending
                        ? t('common.loading')
                        : isInstalled
                            ? t('action.uninstall')
                            : t('action.install')
                    }
                </Button>
            )}
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('stickers.view_pack')}
            footer={footerButtons}
            sizeClass="modal-lg"
        >
            <div className="flex flex-col gap-[15px] relative">

                {/* Pack Info Block */}
                <div className="flex gap-[15px] p-[10px] border border-border bg-bg-page shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] rounded-[3px]">
                    <img src={pack.cover_url} className="w-[80px] h-[80px] object-cover border border-border bg-bg-box p-[2px]" alt=""/>
                    <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] font-bold text-theme-link">{pack.title}</span>

                            {!pack.is_owner && (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        className="text-theme-link hover:underline bg-transparent border-none p-0 cursor-pointer text-[11px]"
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    >
                                        {t('common.actions')} ▼
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-[100%] mt-[2px] bg-bg-box border border-border shadow-md z-10 w-[150px]">
                                            <button
                                                className="w-full text-left px-[10px] py-[6px] hover:bg-theme-brand hover:text-white bg-transparent border-none cursor-pointer flex items-center text-[11px]"
                                                onClick={() =>
                                                {
                                                    setIsMenuOpen(false);
                                                    notifySuccess(t('api.success.PACK_REPORTED'));
                                                }}
                                            >
                                                <ReportIcon width={12} height={12} style={{marginRight: '5px'}}/>
                                                {t('reports.title')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <span className="text-[11px] text-text-muted mt-[4px]">{t('stickers.by_author')} {pack.author}</span>
                        <span className="text-[11px] text-text-muted">{pack.stickers_count} {t('stickers.stickers_count')}</span>
                    </div>
                </div>

                {/* Stickers Grid */}
                {pack.stickers?.length > 0 ? (
                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-[8px] max-h-[350px] overflow-y-auto p-[2px]">
                        {pack.stickers.map(sticker => (
                            <div
                                key={sticker.id}
                                className="cursor-pointer border border-transparent hover:border-border hover:bg-nav-hover p-[4px] rounded-[3px] aspect-square flex items-center justify-center transition-none"
                                onClick={() => setSelectedSticker(sticker)}
                            >
                                <img src={sticker.url} alt={sticker.shortcode} className="w-full h-full object-contain"/>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-[20px] text-center text-text-muted italic bg-bg-page border border-border">
                        <p>{t('stickers.no_stickers_yet')}</p>
                    </div>
                )}

                {/* Внутрішнє віконце інфо стікера */}
                {selectedSticker && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-bg-box border-[3px] border-border rounded-t-[8px] shadow-[0_4px_15px_rgba(0,0,0,0.5)] w-[250px] z-20 flex flex-col">
                        <div className="bg-modal-header-bg text-modal-header-text px-[8px] py-[3px] flex justify-between items-center h-[30px]">
                            <h3 className="m-0 text-[12px] font-bold text-white drop-shadow-md">{t('stickers.info_title')}</h3>
                            <button
                                className="flex items-center justify-center w-[21px] h-[21px] border border-white rounded-[3px] text-white font-bold bg-transparent"
                                onClick={() => setSelectedSticker(null)}
                            >
                                ✖
                            </button>
                        </div>
                        <div className="p-[15px] flex flex-col items-center">
                            <img src={selectedSticker.url} className="w-[120px] h-[120px] object-contain mb-[15px]" alt=""/>
                            <div className="w-full text-[11px] mb-[6px] border-b border-border pb-[4px]">
                                <span className="font-bold text-text-muted mr-[4px]">{t('stickers.code_to_type')}:</span>
                                <span className="text-theme-link">:{selectedSticker.shortcode}:</span>
                            </div>
                            {selectedSticker.keywords && (
                                <div className="w-full text-[11px] mb-[15px]">
                                    <span className="font-bold text-text-muted mr-[4px]">{t('stickers.tags')}:</span>
                                    <span>{selectedSticker.keywords}</span>
                                </div>
                            )}
                            <Button variant="primary" onClick={() => toggleFavorite(selectedSticker)} className="w-full">
                                ⭐ {favoriteIds.includes(selectedSticker.id) ? t('action.deselect') : t('stickers.save_to_favorites')}
                            </Button>
                        </div>
                    </div>
                )}

            </div>
        </Modal>
    );
}