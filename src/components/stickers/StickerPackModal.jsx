import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from "react-router";
import { useMutation } from '@tanstack/react-query';
import { notifyError, notifySuccess } from '../common/Notify.jsx';
import StickerService from '../../services/sticker.service.js';
import Button from '../ui/Button.jsx';
import Modal from '../modals/Modal.jsx';

export default function StickerPackModal({ isOpen, pack, onClose, onRefresh }) {
    const { t } = useTranslation();
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    const [favoriteIds, setFavoriteIds] = useState(() => {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        return saved ? JSON.parse(saved).map(f => f.id) : [];
    });

    const menuRef = useRef(null);

    useEffect(() => {
        if (pack) {
            setIsInstalled(pack.is_installed);
            setSelectedSticker(null);
        }
    }, [pack, isOpen]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const mutationToggle = useMutation({
        mutationFn: async () => {
            if (isInstalled) {
                return await StickerService.uninstallPack(pack.short_name);
            } else {
                return await StickerService.installPack(pack.short_name);
            }
        },
        onSuccess: () => {
            setIsInstalled(!isInstalled);
            notifySuccess(isInstalled ? t('stickers.pack_uninstalled') : t('stickers.pack_installed'));
            if (onRefresh) onRefresh();
        },
        onError: (error) => {
            notifyError(error.message || t('common.error'));
        }
    });

    const toggleFavorite = (sticker) => {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        let favs = saved ? JSON.parse(saved) : [];

        if (favs.find(f => f.id === sticker.id)) {
            favs = favs.filter(f => f.id !== sticker.id);
            notifySuccess(t('stickers.removed_from_favorites'));
        } else {
            favs.unshift(sticker);
            notifySuccess(t('stickers.saved_to_favorites'));
        }

        localStorage.setItem('tetrone_favorite_emojis', JSON.stringify(favs));
        setFavoriteIds(favs.map(f => f.id));
    };

    if (!pack || !isOpen) return null;

    const footerButtons = (
        <>
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
            <Button variant="secondary" onClick={onClose}>
                {t('action.close')}
            </Button>
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
            <div className="flex flex-col relative">

                {/* Блок інформації про пак */}
                <div className="flex gap-[15px] p-[10px] bg-bg-page border border-border mb-[15px]">
                    <div className="border border-border bg-bg-box p-[2px] w-[90px] h-[90px] flex-shrink-0">
                        <img src={pack.cover_url} className="w-full h-full object-cover" alt="" />
                    </div>
                    
                    <div className="flex-1 flex flex-col pt-[5px]">
                        <div className="flex justify-between items-start">
                            <span className="text-[14px] font-bold text-theme-link">{pack.title}</span>

                            {!pack.is_owner && (
                                <div className="relative" ref={menuRef}>
                                    <button
                                        className="text-text-muted hover:underline bg-transparent border-none p-0 cursor-pointer text-[11px]"
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                    >
                                        {t('common.actions')} ▼
                                    </button>

                                    {isMenuOpen && (
                                        <div className="absolute right-0 top-[100%] mt-[2px] bg-bg-box border border-border w-[150px] shadow-none z-10">
                                            <button
                                                className="w-full text-left px-[10px] py-[6px] hover:bg-theme-brand hover:text-white bg-transparent border-none cursor-pointer flex items-center text-[11px]"
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    notifySuccess(t('NOT_IMPLEMENTED'));
                                                }}
                                            >
                                                {t('reports.title')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="text-[11px] mt-[6px]">
                            <span className="text-text-muted">{t('stickers.by_author')} </span>
                            <span className="text-theme-link hover:underline cursor-pointer">
                                <Link to={`/${pack.author}`}>{pack.author}</Link></span>
                        </div>
                        <div className="text-[11px] text-text-muted mt-[4px]">
                            {pack.stickers_count} {t('stickers.stickers_count')}
                        </div>
                    </div>
                </div>

                {/* Сітка стікерів */}
                <div className="bg-bg-page border border-border p-[10px]">
                    {pack.stickers?.length > 0 ? (
                        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-[4px] max-h-[350px] overflow-y-auto">
                            {pack.stickers.map(sticker => (
                                <div
                                    key={sticker.id}
                                    className="cursor-pointer border border-transparent hover:border-border hover:bg-nav-hover p-[4px] aspect-square flex items-center justify-center transition-none"
                                    onClick={() => setSelectedSticker(sticker)}
                                >
                                    <img src={sticker.url} alt={sticker.shortcode} className="w-full h-full object-contain" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-[20px] text-center text-text-muted italic">
                            <p>{t('stickers.no_stickers_yet')}</p>
                        </div>
                    )}
                </div>

                {/* Модалка інфо про конкретний стікер */}
                {selectedSticker && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-bg-box border border-border w-[250px] z-20 shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                        <div className="bg-modal-header-bg text-modal-header-text px-[10px] py-[6px] flex justify-between items-center border-b border-border">
                            <h3 className="m-0 text-[12px] font-bold text-white">{t('stickers.info_title')}</h3>
                            <button
                                className="bg-transparent border-none text-white text-[12px] cursor-pointer hover:underline outline-none"
                                onClick={() => setSelectedSticker(null)}
                            >
                                ✖
                            </button>
                        </div>
                        <div className="p-[15px] flex flex-col items-center bg-bg-page">
                            <img src={selectedSticker.url} className="w-[100px] h-[100px] object-contain mb-[15px]" alt="" />
                            <div className="w-full text-[11px] mb-[6px] text-center">
                                <span className="font-bold text-theme-link">:{selectedSticker.shortcode}:</span>
                            </div>
                            {selectedSticker.keywords && (
                                <div className="w-full text-[10px] mb-[15px] text-center text-text-muted">
                                    {selectedSticker.keywords}
                                </div>
                            )}
                            <Button variant="secondary" onClick={() => toggleFavorite(selectedSticker)} className="w-full">
                                {favoriteIds.includes(selectedSticker.id) ? t('action.deselect') : t('stickers.save_to_favorites')}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}