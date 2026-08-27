import { useTranslation } from 'react-i18next';

export default function StickerPicker({
                                          packs, favorites, isLoading, searchQuery, onSearchChange, onSelect
                                      }) {
    const { t } = useTranslation();
    const isSearching = searchQuery.trim().length > 0;
    const query = searchQuery.toLowerCase();

    return (
        <div className="w-[280px] h-[350px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.4)] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-[8px] border-b border-border">
                <input
                    type="text"
                    className="w-full px-[10px] py-[8px] border border-input-border bg-input-bg text-text-main text-[13px] rounded focus:border-theme-link focus:outline-none"
                    placeholder={t('stickers.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            <div className="flex-1 overflow-y-auto p-[10px]">
                {isLoading ? (
                    <div className="text-[11px] text-text-muted italic pl-[5px]">{t('common.loading')}</div>
                ) : (
                    <>
                        {!isSearching && (
                            <div className="mb-[15px]">
                                <div className="text-[11px] text-text-muted mb-[8px] font-bold flex items-center gap-[5px]">⭐ {t('stickers.your_favorites')}</div>
                                {favorites.length > 0 ? (
                                    <div className="grid grid-cols-5 gap-[5px]">
                                        {favorites.map(sticker => (
                                            <button key={`fav-${sticker.id}`} type="button" className="bg-transparent border-none cursor-pointer p-[4px] hover:bg-bg-page transition-colors" onClick={() => onSelect(sticker, null)} title={`:${sticker.shortcode}:`}>
                                                <img src={sticker.url || sticker.src} alt={sticker.shortcode} className="w-full h-auto" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-[11px] text-text-muted italic pl-[5px]">{t('stickers.no_favorites')}</div>
                                )}
                            </div>
                        )}

                        {packs.map(pack => {
                            const filteredStickers = isSearching
                                ? pack.stickers.filter(s => s.shortcode.toLowerCase().includes(query) || (s.keywords && s.keywords.toLowerCase().includes(query)))
                                : pack.stickers;

                            if (filteredStickers.length === 0) return null;

                            return (
                                <div key={pack.id} className="mb-[15px]">
                                    <div className="text-[11px] text-text-muted mb-[8px] font-bold flex items-center gap-[5px]">
                                        <img src={pack.cover_url} alt="" className="w-[14px] h-[14px]" />
                                        {pack.title}
                                    </div>
                                    <div className="grid grid-cols-5 gap-[5px]">
                                        {filteredStickers.map(sticker => (
                                            <button key={sticker.id} type="button" className="bg-transparent border-none cursor-pointer p-[4px] hover:bg-bg-page transition-colors" onClick={() => onSelect(sticker, pack)} title={`:${sticker.shortcode}:`}>
                                                <img src={sticker.url || sticker.src} alt={sticker.shortcode} className="w-full h-auto" />
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