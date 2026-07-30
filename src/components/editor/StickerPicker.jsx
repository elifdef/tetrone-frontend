import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import StickerService from '../../services/sticker.service';

export default function StickerPicker({ onSelect }) {
    const { t } = useTranslation();
    const [packs, setPacks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [favorites] = useState(() => {
        const saved = localStorage.getItem('tetrone_favorite_emojis');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        const fetchPacks = async () => {
            try {
                const response = await StickerService.getMyPacks();
                setPacks(response.packs);
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPacks();
    }, []);

    const handleStickerClick = (sticker, packInfo) => {
        onSelect({
            ...sticker,
            url: sticker.url || sticker.src,
            pack_short_name: packInfo?.short_name || packInfo?.id
        });
    };

    // Фільтрація, якщо є пошук
    const isSearching = searchQuery.trim().length > 0;
    const query = searchQuery.toLowerCase();

    return (
        <div className="tetrone-sticker-picker" onClick={(e) => e.stopPropagation()}>
            <div className="tetrone-sticker-picker-search-top">
                <input
                    type="text"
                    className="tetrone-form-input"
                    placeholder={t('stickers.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="tetrone-sticker-picker-content tetrone-sticker-scroll-area">
                {isLoading ? (
                    <div className="tetrone-sticker-picker-empty">{t('common.loading')}</div>
                ) : (
                    <>
                        {/* БЛОК: Улюблені (ховаємо, якщо йде пошук) */}
                        {!isSearching && (
                            <div className="tetrone-sticker-pack-section">
                                <div className="tetrone-sticker-pack-title">⭐ {t('stickers.your_favorites')}</div>
                                {favorites.length > 0 ? (
                                    <div className="tetrone-sticker-picker-grid">
                                        {favorites.map(sticker => (
                                            <button key={`fav-${sticker.id}`} type="button" className="tetrone-sticker-btn" onClick={() => handleStickerClick(sticker, null)} title={`:${sticker.shortcode}:`}>
                                                <img src={sticker.url || sticker.src} alt={sticker.shortcode} />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="tetrone-sticker-empty-text">{t('stickers.no_favorites')}</div>
                                )}
                            </div>
                        )}

                        {/* БЛОК: Усі Паки */}
                        {packs.map(pack => {
                            // Фільтруємо стікери всередині паку, якщо є пошук
                            const filteredStickers = isSearching
                                ? pack.stickers.filter(s => s.shortcode.toLowerCase().includes(query) || (s.keywords && s.keywords.toLowerCase().includes(query)))
                                : pack.stickers;

                            if (filteredStickers.length === 0) return null;

                            return (
                                <div key={pack.id} className="tetrone-sticker-pack-section">
                                    <div className="tetrone-sticker-pack-title">
                                        <img src={pack.cover_url} alt="" className="tetrone-pack-title-icon" />
                                        {pack.title}
                                    </div>
                                    <div className="tetrone-sticker-picker-grid">
                                        {filteredStickers.map(sticker => (
                                            <button key={sticker.id} type="button" className="tetrone-sticker-btn" onClick={() => handleStickerClick(sticker, pack)} title={`:${sticker.shortcode}:`}>
                                                <img src={sticker.url || sticker.src} alt={sticker.shortcode} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>
        </div>
    );
}