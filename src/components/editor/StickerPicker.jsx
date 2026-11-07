import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import StickerService from '../../services/sticker.service';

let globalPacksCache = null;
let fetchPacksPromise = null;

export default function StickerPicker({
                                          packs: externalPacks, 
                                          favorites: externalFavorites, 
                                          isLoading: externalLoading, 
                                          searchQuery: externalSearchQuery, 
                                          onSearchChange: externalOnSearchChange, 
                                          onSelect,
                                          compact = false
                                      }) {
    const { t } = useTranslation();
    const [internalPacks, setInternalPacks] = useState(globalPacksCache || []);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSearchQuery, setInternalSearchQuery] = useState('');

    const packs = externalPacks && externalPacks.length > 0 ? externalPacks : internalPacks;
    const favorites = externalFavorites || [];
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

    const handleSearchChange = (val) => {
        if (externalOnSearchChange) {
            externalOnSearchChange(val);
        } else {
            setInternalSearchQuery(val);
        }
    };

    useEffect(() => {
        if (externalPacks && externalPacks.length > 0) return;

        if (globalPacksCache !== null) {
            setInternalPacks(globalPacksCache);
            return;
        }

        setInternalLoading(true);

        if (!fetchPacksPromise) {
            fetchPacksPromise = new Promise((resolve) => {
                StickerService.getMyPacks()
                    .onSuccess((res) => {
                        const fetched = res.packs || res.data || [];
                        globalPacksCache = fetched;
                        resolve(fetched);
                    })
                    .onError(() => {
                        globalPacksCache = [];
                        resolve([]);
                    });
            });
        }

        fetchPacksPromise.then((data) => {
            setInternalPacks(data);
            setInternalLoading(false);
            fetchPacksPromise = null;
        });
    }, [externalPacks]);

    const isSearching = searchQuery.trim().length > 0;
    const query = searchQuery.toLowerCase();

    const containerClasses = compact
        ? "w-[220px] h-[210px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-tahoma text-[11px] rounded"
        : "w-[280px] h-[350px] bg-bg-box border border-border shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-tahoma text-[11px]";

    const btnHeightClass = compact ? "h-[36px] p-[2px]" : "h-[48px] p-[4px]";
    const imgSizeClass = compact ? "max-w-[28px] max-h-[28px]" : "max-w-[36px] max-h-[36px]";

    return (
        <div className={containerClasses} onClick={(e) => e.stopPropagation()}>
            <div className="p-[6px] border-b border-border bg-bg-page">
                <input
                    type="text"
                    className="w-full px-[6px] py-[4px] border border-input-border bg-input-bg text-text-main text-[11px] outline-none focus:border-theme-link transition-colors"
                    placeholder={t('stickers.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-[6px] bg-bg-box custom-scrollbar">
                {isLoading ? (
                    <div className="text-[11px] text-text-muted italic p-[10px] text-center">{t('common.loading')}</div>
                ) : (
                    <>
                        {!isSearching && favorites.length > 0 && (
                            <div className="mb-[10px]">
                                <div className="text-[10px] text-text-muted mb-[4px] font-bold uppercase tracking-wider flex items-center gap-[4px]">
                                    <span className="text-[#ff9900]">★</span> {t('stickers.your_favorites')}
                                </div>
                                <div className="grid grid-cols-5 gap-[2px]">
                                    {favorites.map(sticker => (
                                        <button 
                                            key={`fav-${sticker.id}`} 
                                            type="button" 
                                            className={`bg-transparent border border-transparent cursor-pointer hover:border-theme-link hover:bg-[rgba(91,155,213,0.05)] transition-colors outline-none flex items-center justify-center ${btnHeightClass}`} 
                                            onClick={() => onSelect(sticker, sticker.pack || { short_name: sticker.pack_name })} 
                                            title={`:${sticker.shortcode}:`}
                                        >
                                            <img src={sticker.url || sticker.src} alt={sticker.shortcode} className={`${imgSizeClass} w-auto h-auto object-contain pointer-events-none`} />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {packs.map(pack => {
                            const filteredStickers = isSearching
                                ? pack.stickers?.filter(s => s.shortcode.toLowerCase().includes(query) || (s.keywords && s.keywords.toLowerCase().includes(query)))
                                : pack.stickers;

                            if (!filteredStickers || filteredStickers.length === 0) return null;

                            return (
                                <div key={pack.id} className="mb-[10px]">
                                    <div className="text-[10px] text-text-muted mb-[4px] font-bold uppercase tracking-wider flex items-center gap-[6px] border-b border-border pb-[2px]">
                                        {pack.cover_url && <img src={pack.cover_url} alt="" className="w-[12px] h-[12px] object-contain" />}
                                        {pack.title}
                                    </div>
                                    <div className="grid grid-cols-5 gap-[2px]">
                                        {filteredStickers.map(sticker => (
                                            <button 
                                                key={sticker.id} 
                                                type="button" 
                                                className={`bg-transparent border border-transparent cursor-pointer hover:border-theme-link hover:bg-[rgba(91,155,213,0.05)] transition-colors outline-none flex items-center justify-center ${btnHeightClass}`} 
                                                onClick={() => onSelect(sticker, pack)} 
                                                title={`:${sticker.shortcode}:`}
                                            >
                                                <img src={sticker.url || sticker.src} alt={sticker.shortcode} className={`${imgSizeClass} w-auto h-auto object-contain pointer-events-none`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isSearching && packs.every(p => !p.stickers?.some(s => s.shortcode.toLowerCase().includes(query))) && (
                            <div className="text-[11px] text-text-muted italic p-[10px] text-center">
                                {t('common.no_results')}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}