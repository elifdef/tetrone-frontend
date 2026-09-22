import { useTranslation } from 'react-i18next';

export default function StickerPicker({
                                          packs = [], 
                                          favorites = [], 
                                          isLoading = false, 
                                          searchQuery = '', 
                                          onSearchChange, 
                                          onSelect
                                      }) {
    const { t } = useTranslation();
    const isSearching = searchQuery.trim().length > 0;
    const query = searchQuery.toLowerCase();

    return (
        <div className="w-[280px] h-[350px] bg-bg-box border border-border shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-tahoma text-[11px]" onClick={(e) => e.stopPropagation()}>
            
            <div className="p-[8px] border-b border-border bg-bg-page">
                <input
                    type="text"
                    className="w-full px-[8px] py-[6px] border border-input-border bg-input-bg text-text-main text-[11px] outline-none focus:border-theme-link transition-colors"
                    placeholder={t('stickers.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-[8px] bg-bg-box custom-scrollbar">
                {isLoading ? (
                    <div className="text-[11px] text-text-muted italic p-[10px] text-center">{t('common.loading')}</div>
                ) : (
                    <>
                        {!isSearching && favorites.length > 0 && (
                            <div className="mb-[15px]">
                                <div className="text-[10px] text-text-muted mb-[6px] font-bold uppercase tracking-wider flex items-center gap-[4px]">
                                    <span className="text-[#ff9900]">★</span> {t('stickers.your_favorites')}
                                </div>
                                <div className="grid grid-cols-5 gap-[2px]">
                                    {favorites.map(sticker => (
                                        <button 
                                            key={`fav-${sticker.id}`} 
                                            type="button" 
                                            className="bg-transparent border border-transparent cursor-pointer p-[4px] hover:border-theme-link hover:bg-[rgba(91,155,213,0.05)] transition-colors outline-none flex items-center justify-center h-[48px]" 
                                            onClick={() => onSelect(sticker, null)} 
                                            title={`:${sticker.shortcode}:`}
                                        >
                                            <img src={sticker.url || sticker.src} alt={sticker.shortcode} className="max-w-full max-h-full object-contain pointer-events-none" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {packs.map(pack => {
                            const filteredStickers = isSearching
                                ? pack.stickers.filter(s => s.shortcode.toLowerCase().includes(query) || (s.keywords && s.keywords.toLowerCase().includes(query)))
                                : pack.stickers;

                            if (!filteredStickers || filteredStickers.length === 0) return null;

                            return (
                                <div key={pack.id} className="mb-[15px]">
                                    <div className="text-[10px] text-text-muted mb-[6px] font-bold uppercase tracking-wider flex items-center gap-[6px] border-b border-border pb-[4px]">
                                        <img src={pack.cover_url} alt="" className="w-[12px] h-[12px] object-contain" />
                                        {pack.title}
                                    </div>
                                    <div className="grid grid-cols-5 gap-[2px]">
                                        {filteredStickers.map(sticker => (
                                            <button 
                                                key={sticker.id} 
                                                type="button" 
                                                className="bg-transparent border border-transparent cursor-pointer p-[4px] hover:border-theme-link hover:bg-[rgba(91,155,213,0.05)] transition-colors outline-none flex items-center justify-center h-[48px]" 
                                                onClick={() => onSelect(sticker, pack)} 
                                                title={`:${sticker.shortcode}:`}
                                            >
                                                <img src={sticker.url || sticker.src} alt={sticker.shortcode} className="max-w-full max-h-full object-contain pointer-events-none" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        
                        {isSearching && packs.every(p => !p.stickers.some(s => s.shortcode.toLowerCase().includes(query))) && (
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