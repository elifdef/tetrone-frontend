import React, {useState} from 'react';
import {useSearchParams} from 'react-router';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import StickerService from '../services/sticker.service';
import {usePageTitle} from '../hooks/usePageTitle';
import {useTranslation} from 'react-i18next';
import StickerPackModal from '../components/stickers/StickerPackModal';
import StickerSearchBar from '../components/stickers/StickerSearchBar.jsx';
import CatalogTab from '../components/stickers/CatalogTab';
import MyPacksTab from '../components/stickers/MyPacksTab';
import Tabs from "../components/ui/Tabs.jsx";

const StickerShopPage = () =>
{
    const {t} = useTranslation();
    usePageTitle(t('stickers.shop_title'));

    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'catalog';
    const [selectedPack, setSelectedPack] = useState(null);

    const {
        data:      catalogData,
        isLoading: isLoadingCatalog,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey:         ['sticker-catalog', searchParams.toString()],
        queryFn:          async ({pageParam = 1}) =>
                          {
                              const params = new URLSearchParams(searchParams);
                              params.set('page', pageParam);
                              return await StickerService.getCatalog(params.toString());
                          },
        getNextPageParam: (lastPage) =>
                          {
                              const meta = lastPage?.meta;
                              return meta && meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
                          },
        initialPageParam: 1,
        enabled:          currentTab === 'catalog',
    });

    const catalogPacks = catalogData?.pages.flatMap(page => page.packs || []) || [];
    const currentSearchQuery = searchParams.get('filter[search]') || '';

    const {
        data:      myPacksData,
        isLoading: isLoadingMy,
        refetch:   refetchMyPacks
    } = useQuery({
        queryKey: ['my-sticker-packs'],
        queryFn:  async () => await StickerService.getMyPacks(),
        enabled:  currentTab === 'my',
    });

    const myPacks = myPacksData?.packs || [];

    const handleTabChange = (tabId) =>
    {
        searchParams.set('tab', tabId);
        searchParams.delete('page');
        setSearchParams(searchParams);
    };

    const handleSearch = (newQuery) =>
    {
        if (newQuery)
        {
            searchParams.set('filter[search]', newQuery);
        } else
        {
            searchParams.delete('filter[search]');
        }
        searchParams.delete('page');
        setSearchParams(searchParams);
    };

    // Формуємо масив для твого компонента Tabs
    const tabList = [
        {id: 'catalog', label: t('stickers.tab_catalog')},
        {id: 'my', label: t('stickers.tab_my')}
    ];

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border text-[11px] text-text-main max-md:p-[10px]">
            {/* Точна копія шапки з NotificationsPage */}
            <div className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border flex justify-between items-center max-md:-mt-[10px] max-md:-mx-[10px]">
                <div className="flex items-center gap-[6px]">
                    <span>{t('stickers.shop_title')}</span>
                </div>
            </div>

            {/* Використовуємо твій компонент (CSS з XP автоматично зробить його правильним) */}
            <Tabs
                tabs={tabList}
                activeTab={currentTab}
                onChange={handleTabChange}
            />

            <div className="bg-bg-box p-[15px] border border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.05)] min-h-[400px]">
                {currentTab === 'catalog' && (
                    <>
                        <StickerSearchBar
                            initialValue={currentSearchQuery}
                            onSearch={handleSearch}
                        />
                        <CatalogTab
                            packs={catalogPacks}
                            isLoading={isLoadingCatalog}
                            hasMore={!!hasNextPage}
                            onLoadMore={fetchNextPage}
                            onSelectPack={setSelectedPack}
                        />
                    </>
                )}

                {currentTab === 'my' && (
                    <MyPacksTab
                        packs={myPacks}
                        isLoading={isLoadingMy}
                        onSelectPack={setSelectedPack}
                        onRefresh={refetchMyPacks}
                    />
                )}
            </div>

            <StickerPackModal
                isOpen={!!selectedPack}
                pack={selectedPack}
                onClose={() => setSelectedPack(null)}
                onRefresh={refetchMyPacks}
            />
        </div>
    );
};

export default StickerShopPage;