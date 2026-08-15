import React, {useState, useEffect, useRef} from 'react';
import {useTranslation} from 'react-i18next';
import {notifyError, notifySuccess} from '../common/Notify';
import StickerService from '../../services/sticker.service';
import {ReportIcon} from '../ui/Icons';
import Button from '../ui/Button';
import Modal from './Modal';
import './StickerPackModal.css';

export default function StickerPackModal({pack, onClose, onRefresh})
{
    const {t} = useTranslation();
    const [selectedSticker, setSelectedSticker] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isInstalled, setIsInstalled] = useState(pack.is_installed);
    const [isProcessing, setIsProcessing] = useState(false);

    const [favoriteIds, setFavoriteIds] = useState(() =>
    {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        return saved ? JSON.parse(saved).map(f => f.id) : [];
    });

    const detailRef = useRef(null);
    const menuRef = useRef(null);

    useEffect(() =>
    {
        const handleKeyDown = (e) =>
        {
            if (e.key === 'Escape')
            {
                if (selectedSticker) setSelectedSticker(null);
                else onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedSticker, onClose]);

    const handleOverlayClick = (e) =>
    {
        if (selectedSticker && detailRef.current && !detailRef.current.contains(e.target))
        {
            setSelectedSticker(null);
        }
        if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target))
        {
            setIsMenuOpen(false);
        }
    };

    const handleToggleInstall = async () =>
    {
        setIsProcessing(true);
        try
        {
            if (isInstalled)
            {
                await StickerService.uninstallPack(pack.short_name);
                setIsInstalled(false);
                notifySuccess(t('stickers.pack_uninstalled'));
            } else
            {
                await StickerService.installPack(pack.short_name);
                setIsInstalled(true);
                notifySuccess(t('stickers.pack_installed'));
            }
            if (onRefresh) onRefresh();
        } catch (error)
        {
            notifyError(error.message || t('common.error'));
        } finally
        {
            setIsProcessing(false);
        }
    };

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

    const footerButtons = (
        <>
            <Button variant="secondary" onClick={onClose}>
                {t('action.close')}
            </Button>
            {!pack.is_owner && (
                <Button
                    className={isInstalled ? 'tetrone-btn-cancel' : ''}
                    onClick={handleToggleInstall}
                    disabled={isProcessing}
                >
                    {isProcessing
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
            isOpen={true}
            onClose={onClose}
            title={t('stickers.view_pack')}
            footer={footerButtons}
        >
            <div className="tetrone-pack-modal-wrapper" onClick={handleOverlayClick}>

                <div className="tetrone-pack-info-block">
                    <img src={pack.cover_url} className="tetrone-pack-cover-img" alt=""/>
                    <div className="tetrone-pack-text-info">

                        <div className="tetrone-pack-header-row">
                            <span className="tetrone-pack-title-label">{pack.title}</span>

                            {!pack.is_owner && (
                                <div className="tetrone-pack-actions" ref={menuRef}>
                                    <button className="tetrone-action-link" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                        {t('common.actions')} ▼
                                    </button>

                                    {isMenuOpen && (
                                        <div className="tetrone-classic-dropdown">
                                            <button onClick={() =>
                                            {
                                                setIsMenuOpen(false);
                                                notifySuccess(t('api.success.PACK_REPORTED'));
                                            }}>
                                                <ReportIcon width={12} height={12} style={{marginRight: '5px', verticalAlign: 'middle'}}/>
                                                {t('reports.title')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <span className="tetrone-pack-meta-label">{t('stickers.by_author')} {pack.author}</span>
                        <span className="tetrone-pack-meta-label">{pack.stickers_count} {t('stickers.stickers_count')}</span>
                    </div>
                </div>

                {pack.stickers?.length > 0 ? (
                    <div className="tetrone-sticker-grid-scroll">
                        {pack.stickers.map(sticker => (
                            <div
                                key={sticker.id}
                                className="tetrone-grid-item tetrone-pointer"
                                onClick={() => setSelectedSticker(sticker)}
                            >
                                <img src={sticker.url} alt={sticker.shortcode}/>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="tetrone-empty-state">
                        <p>{t('stickers.no_stickers_yet')}</p>
                    </div>
                )}

                {selectedSticker && (
                    <div className="tetrone-sticker-detail-popover" ref={detailRef}>
                        <div className="tetrone-modal-header">
                            <h3>{t('stickers.info_title')}</h3>
                            <button className="tetrone-modal-close" onClick={() => setSelectedSticker(null)} title={t('action.close')}>✖</button>
                        </div>
                        <div className="tetrone-detail-content">
                            <img src={selectedSticker.url} className="tetrone-detail-big-img" alt=""/>
                            <div className="tetrone-detail-row">
                                <span className="tetrone-detail-label">{t('stickers.code_to_type')}:</span>
                                <span className="tetrone-detail-value">:{selectedSticker.shortcode}:</span>
                            </div>
                            {selectedSticker.keywords && (
                                <div className="tetrone-detail-row">
                                    <span className="tetrone-detail-label">{t('stickers.tags')}:</span>
                                    <span className="tetrone-detail-value">{selectedSticker.keywords}</span>
                                </div>
                            )}
                        </div>
                        <Button
                            variant={"primary"}
                            onClick={() => toggleFavorite(selectedSticker)}
                        >
                            ⭐ {favoriteIds.includes(selectedSticker.id)
                            ? t('action.deselect')
                            : t('stickers.save_to_favorites')}
                        </Button>
                    </div>
                )}

            </div>
        </Modal>
    );
}