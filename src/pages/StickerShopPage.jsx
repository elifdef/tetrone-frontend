import React, { useState } from 'react';
import { useSearchParams } from 'react-router';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import StickerService from '../services/sticker.service';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTranslation } from 'react-i18next';
import StickerPackModal from '../components/modals/StickerPackModal';
import StickerSearchBar from '../components/stickers/StickerSearchBar.jsx';
import CatalogTab from '../components/stickers/CatalogTab';
import MyPacksTab from '../components/stickers/MyPacksTab';

const StickerShopPage = () =>
{
    const { t } = useTranslation();
    usePageTitle(t('stickers.shop_title'));

    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'catalog';
    const [selectedPack, setSelectedPack] = useState(null);

    const {
        data: catalogData,
        isLoading: isLoadingCatalog,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['sticker-catalog', searchParams.toString()],
        queryFn: async ({ pageParam = 1 }) =>
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
        // Робимо запит тільки якщо ми на вкладці каталогу
        enabled: currentTab === 'catalog',
    });

    const catalogPacks = catalogData?.pages.flatMap(page => page.packs || []) || [];
    const currentSearchQuery = searchParams.get('filter[search]') || '';

    const {
        data: myPacksData,
        isLoading: isLoadingMy,
        refetch: refetchMyPacks
    } = useQuery({
        queryKey: ['my-sticker-packs'],
        queryFn: async () => await StickerService.getMyPacks(),
        enabled: currentTab === 'my',
    });

    const myPacks = myPacksData?.packs || [];

    // Зміна вкладки без втрати інших фільтрів (якщо вони є)
    const handleTabChange = (tab) =>
    {
        searchParams.set('tab', tab);
        setSearchParams(searchParams);
    };

    const handleSearch = (newQuery) =>
    {
        if (newQuery)
        {
            searchParams.set('filter[search]', newQuery);
        }
        else
        {
            // Якщо поле порожнє, видаляємо фільтр з URL
            searchParams.delete('filter[search]');
        }
        // Скидаємо сторінку на першу при новому пошуку
        searchParams.delete('page');
        setSearchParams(searchParams);
    };

    return (
        <>
            <div className="tetrone-card-wrapper">
                <h2 className="tetrone-section-title">{ t('stickers.shop_title') }</h2>

                <div className="tetrone-tabs">
                    { ['catalog', 'my'].map(tab => (
                        <button
                            key={ tab }
                            className={ `tetrone-tab ${ currentTab === tab ? 'active' : '' }` }
                            onClick={ () => handleTabChange(tab) }
                        >
                            { t(`stickers.tab_${ tab }`) }
                        </button>
                    )) }
                </div>

                { currentTab === 'catalog' && (
                    <>
                        <StickerSearchBar
                            initialValue={ currentSearchQuery }
                            onSearch={ handleSearch }
                        />
                        <CatalogTab
                            packs={ catalogPacks }
                            isLoading={ isLoadingCatalog }
                            hasMore={ !!hasNextPage }
                            onLoadMore={ fetchNextPage }
                            onSelectPack={ setSelectedPack }
                        />
                    </>
                ) }

                { currentTab === 'my' && (
                    <MyPacksTab
                        packs={ myPacks }
                        isLoading={ isLoadingMy }
                        onSelectPack={ setSelectedPack }
                        onRefresh={ refetchMyPacks }
                    />
                ) }
            </div>

            { selectedPack && (
                <StickerPackModal
                    pack={ selectedPack }
                    onClose={ () => setSelectedPack(null) }
                    onRefresh={ refetchMyPacks }
                />
            ) }
        </>
    );
};

export default StickerShopPage;