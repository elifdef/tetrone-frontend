import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import StickerService from '../../services/sticker.service';

export interface PickerStickerItem {
    id: number | string;
    shortcode: string;
    url?: string;
    src?: string;
    keywords?: string;
    pack_short_name?: string;
    packName?: string;
    pack_name?: string;
    pack?: { short_name?: string };
}

export interface PickerStickerPack {
    id: number | string;
    title: string;
    short_name: string;
    cover_url?: string | null;
    stickers?: PickerStickerItem[];
}

export interface StickerPickerProps {
    packs?: PickerStickerPack[];
    favorites?: PickerStickerItem[];
    isLoading?: boolean;
    searchQuery?: string;
    onSearchChange?: (val: string) => void;
    onSelect: (sticker: PickerStickerItem, pack?: Partial<PickerStickerPack>) => void;
    compact?: boolean;
}

let globalPacksCache: PickerStickerPack[] | null = null;
let fetchPacksPromise: Promise<PickerStickerPack[]> | null = null;

export const clearStickerPacksCache = (): void => {
    globalPacksCache = null;
    fetchPacksPromise = null;
};

export default function StickerPicker({
    packs: externalPacks,
    favorites: externalFavorites,
    isLoading: externalLoading,
    searchQuery: externalSearchQuery,
    onSearchChange: externalOnSearchChange,
    onSelect,
    compact = false,
}: StickerPickerProps) {
    const { t } = useTranslation();
    const [internalPacks, setInternalPacks] = useState<PickerStickerPack[]>(globalPacksCache || []);
    const [internalLoading, setInternalLoading] = useState(false);
    const [internalSearchQuery, setInternalSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('');
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);

    const packs = externalPacks && externalPacks.length > 0 ? externalPacks : internalPacks;

    const [localFavorites, setLocalFavorites] = useState<PickerStickerItem[]>([]);
    useEffect(() => {
        if (externalFavorites && externalFavorites.length > 0) {
            setLocalFavorites(externalFavorites);
        } else {
            try {
                const saved = localStorage.getItem('tetrone_favorite_emojis');
                setLocalFavorites(saved ? (JSON.parse(saved) as PickerStickerItem[]) : []);
            } catch {
                setLocalFavorites([]);
            }
        }
    }, [externalFavorites]);

    const favorites = localFavorites;
    const isLoading = externalLoading !== undefined ? externalLoading : internalLoading;
    const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;

    const handleSearchChange = (val: string) => {
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
            fetchPacksPromise = new Promise<PickerStickerPack[]>((resolve) => {
                StickerService.getMyPacks()
                    .onSuccess((res) => {
                        const fetched = (res.packs || res.data || []) as PickerStickerPack[];
                        globalPacksCache = fetched;
                        resolve(fetched);
                    })
                    .onError(() => {
                        globalPacksCache = [];
                        resolve([]);
                    });
            });
        }

        void fetchPacksPromise.then((data) => {
            setInternalPacks(data);
            setInternalLoading(false);
            fetchPacksPromise = null;
        });
    }, [externalPacks]);

    useEffect(() => {
        if (!activeTab) {
            if (favorites.length > 0) {
                setActiveTab('favorites');
            } else if (packs.length > 0) {
                setActiveTab(`pack-${packs[0].id}`);
            }
        }
    }, [favorites, packs, activeTab]);

    const isSearching = searchQuery.trim().length > 0;
    const query = searchQuery.toLowerCase();

    const handleScroll = () => {
        if (isSearching || !scrollContainerRef.current) return;

        const container = scrollContainerRef.current;
        const containerTop = container.getBoundingClientRect().top;

        const sections: Array<{ id: string; top: number }> = [];

        if (favorites.length > 0) {
            const el = document.getElementById('sticker-pack-favorites');
            if (el) {
                sections.push({ id: 'favorites', top: el.getBoundingClientRect().top - containerTop });
            }
        }

        packs.forEach((pack) => {
            const el = document.getElementById(`sticker-pack-${pack.id}`);
            if (el) {
                sections.push({ id: `pack-${pack.id}`, top: el.getBoundingClientRect().top - containerTop });
            }
        });

        for (let i = sections.length - 1; i >= 0; i--) {
            if (sections[i].top <= 40) {
                if (sections[i].id !== activeTab) {
                    setActiveTab(sections[i].id);
                }
                break;
            }
        }
    };

    const scrollToSection = (tabId: string) => {
        setActiveTab(tabId);
        const targetId = tabId === 'favorites' ? 'sticker-pack-favorites' : `sticker-${tabId}`;
        const el = document.getElementById(targetId);
        if (el && scrollContainerRef.current) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const containerClasses = compact
        ? 'w-[240px] h-[250px] bg-bg-box border border-border shadow-[0_4px_15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-tahoma text-[11px] rounded'
        : 'w-[280px] h-[370px] bg-bg-box border border-border shadow-[0_2px_10px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden font-tahoma text-[11px]';

    const btnHeightClass = compact ? 'h-[36px] p-[2px]' : 'h-[48px] p-[4px]';
    const imgSizeClass = compact ? 'max-w-[28px] max-h-[28px]' : 'max-w-[36px] max-h-[36px]';

    return (
        <div className={containerClasses} onClick={(e) => e.stopPropagation()}>
            <div className="p-[6px] border-b border-border bg-bg-page flex-none">
                <input
                    type="text"
                    className="w-full px-[6px] py-[4px] border border-input-border bg-input-bg text-text-main text-[11px] outline-none focus:border-theme-link transition-colors"
                    placeholder={t('stickers.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-[6px] bg-bg-box custom-scrollbar"
            >
                {isLoading ? (
                    <div className="text-[11px] text-text-muted italic p-[10px] text-center">{t('common.loading')}</div>
                ) : (
                    <>
                        {!isSearching && favorites.length > 0 && (
                            <div id="sticker-pack-favorites" className="mb-[10px]">
                                <div className="text-[10px] text-text-muted mb-[4px] font-bold uppercase tracking-wider flex items-center gap-[4px] border-b border-border pb-[2px]">
                                    <span className="text-[#ff9900]">★</span> {t('stickers.your_favorites')}
                                </div>
                                <div className="grid grid-cols-5 gap-[2px]">
                                    {favorites.map((sticker) => (
                                        <button
                                            key={`fav-${sticker.id}`}
                                            type="button"
                                            className={`bg-transparent border border-transparent cursor-pointer hover:border-theme-link hover:bg-[rgba(91,155,213,0.05)] transition-colors outline-none flex items-center justify-center ${btnHeightClass}`}
                                            onClick={() =>
                                                onSelect(
                                                    sticker,
                                                    sticker.pack || { short_name: sticker.pack_name || sticker.pack_short_name }
                                                )
                                            }
                                            title={`:${sticker.shortcode}:`}
                                        >
                                            <img
                                                src={sticker.url || sticker.src}
                                                alt={sticker.shortcode}
                                                className={`${imgSizeClass} w-auto h-auto object-contain pointer-events-none`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {packs.map((pack) => {
                            const filteredStickers = isSearching
                                ? pack.stickers?.filter(
                                      (s) =>
                                          s.shortcode.toLowerCase().includes(query) ||
                                          (s.keywords && s.keywords.toLowerCase().includes(query))
                                  )
                                : pack.stickers;

                            if (!filteredStickers || filteredStickers.length === 0) return null;

                            return (
                                <div key={pack.id} id={`sticker-pack-${pack.id}`} className="mb-[10px]">
                                    <div className="text-[10px] text-text-muted mb-[4px] font-bold uppercase tracking-wider flex items-center gap-[6px] border-b border-border pb-[2px]">
                                        {pack.cover_url && (
                                            <img src={pack.cover_url} alt="" className="w-[12px] h-[12px] object-contain" />
                                        )}
                                        {pack.title}
                                    </div>
                                    <div className="grid grid-cols-5 gap-[2px]">
                                        {filteredStickers.map((sticker) => (
                                            <button
                                                key={sticker.id}
                                                type="button"
                                                className={`bg-transparent border border-transparent cursor-pointer hover:border-theme-link hover:bg-[rgba(91,155,213,0.05)] transition-colors outline-none flex items-center justify-center ${btnHeightClass}`}
                                                onClick={() => onSelect(sticker, pack)}
                                                title={`:${sticker.shortcode}:`}
                                            >
                                                <img
                                                    src={sticker.url || sticker.src}
                                                    alt={sticker.shortcode}
                                                    className={`${imgSizeClass} w-auto h-auto object-contain pointer-events-none`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}

                        {isSearching &&
                            packs.every((p) => !p.stickers?.some((s) => s.shortcode.toLowerCase().includes(query))) && (
                                <div className="text-[11px] text-text-muted italic p-[10px] text-center">
                                    {t('common.no_results')}
                                </div>
                            )}
                    </>
                )}
            </div>

            {!isLoading && !isSearching && (
                <div className="flex-none flex items-center gap-[2px] p-[3px] border-t border-border bg-bg-page overflow-x-auto custom-scrollbar">
                    {favorites.length > 0 && (
                        <button
                            type="button"
                            className={`flex items-center justify-center w-[28px] h-[28px] rounded border transition-colors outline-none flex-shrink-0 ${
                                activeTab === 'favorites'
                                    ? 'bg-[var(--theme-btn-primary-bg)] border-[var(--theme-btn-primary-border)] text-white'
                                    : 'bg-transparent border-transparent hover:bg-border text-[#ff9900]'
                            }`}
                            onClick={() => scrollToSection('favorites')}
                            title={t('stickers.your_favorites')}
                        >
                            <span className="text-[14px]">★</span>
                        </button>
                    )}

                    {packs.map((pack) => {
                        const iconUrl =
                            pack.cover_url ||
                            (pack.stickers && pack.stickers[0]
                                ? pack.stickers[0].url || pack.stickers[0].src
                                : null);
                        const tabId = `pack-${pack.id}`;
                        const isActive = activeTab === tabId;

                        return (
                            <button
                                key={`tab-${pack.id}`}
                                type="button"
                                className={`flex items-center justify-center w-[28px] h-[28px] rounded border transition-colors outline-none flex-shrink-0 p-[2px] ${
                                    isActive
                                        ? 'bg-[var(--theme-btn-primary-bg)] border-[var(--theme-btn-primary-border)]'
                                        : 'bg-transparent border-transparent hover:bg-border'
                                }`}
                                onClick={() => scrollToSection(tabId)}
                                title={pack.title}
                            >
                                {iconUrl ? (
                                    <img
                                        src={iconUrl}
                                        alt={pack.title}
                                        className="w-[20px] h-[20px] object-contain pointer-events-none"
                                    />
                                ) : (
                                    <span className="text-[10px] font-bold text-text-muted">
                                        {pack.title?.substring(0, 2)}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}