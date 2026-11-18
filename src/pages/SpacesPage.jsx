import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import SpaceService from '../services/space.service';
import CreateSpaceModal from '../components/modals/CreateSpaceModal';
import SpaceListItem from '../components/spaces/SpaceListItem';
import { notifyError, notifySuccess } from '../components/common/Notify';

const SpacesPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get('tab') || 'my';

    const [inputSearch, setInputSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [spaces, setSpaces] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    usePageTitle(t('common.spaces'));

    const fetchSpaces = useCallback((pageNum = 1) => {
        if (pageNum === 1) setIsLoading(true);
        else setIsLoadingMore(true);

        const params = { tab: activeTab, page: pageNum };
        if (searchQuery) {
            params['filter[name]'] = searchQuery;
        }

        SpaceService.getSpacesList(params)
            .onSuccess((res) => {
                const items = Array.isArray(res.spaces)
                    ? res.spaces
                    : (res.spaces?.data || []);
                const meta = res.meta || res.spaces?.meta;

                setSpaces(prev => (pageNum === 1 ? items : [...prev, ...items]));
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setIsLoading(false);
                setIsLoadingMore(false);
            });
    }, [activeTab, searchQuery, t]);

    useEffect(() => {
        setPage(1);
        fetchSpaces(1);
    }, [fetchSpaces]);

    const handleTabChange = (tab) => {
        setSearchParams({ tab });
        setSearchQuery('');
        setInputSearch('');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(inputSearch.trim());
    };

    const handleResetSearch = () => {
        setInputSearch('');
        setSearchQuery('');
    };

    const handleLeaveSpace = (spaceUsername) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        SpaceService.leaveSpace(spaceUsername)
            .onSuccess((res) => {
                setSpaces(prev => prev.filter(s => s.username !== spaceUsername));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const pageTabs = [
        { id: 'my', label: t('spaces.list_tabs_my') },
        { id: 'managed', label: t('spaces.list_tabs_managed') },
        { id: 'global', label: t('spaces.list_tabs_global') }
    ];

    return (
        <div className="w-full max-w-[960px] mx-auto box-border p-[20px] bg-bg-page border border-border text-[11px] text-text-main max-md:p-[10px]">
            <div className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border flex justify-between items-center max-md:-mt-[10px] max-md:-mx-[10px]">
                <div className="flex items-center gap-[6px]">
                    <span>{t('common.spaces')}</span>
                </div>

                <div className="flex items-center gap-[10px] text-[10px] font-normal">
                    <span
                        className="cursor-pointer hover:underline opacity-80 hover:opacity-100"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        + {t('spaces.create')}
                    </span>
                </div>
            </div>

            <div className="bg-bg-box border border-border mb-[12px]">
                <div className="p-[10px] bg-bg-page border-b border-border">
                    <Tabs
                        tabs={pageTabs}
                        activeTab={activeTab}
                        onChange={handleTabChange}
                    />
                </div>

                <form className="p-[10px] flex gap-[8px]" onSubmit={handleSearchSubmit}>
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder={t('spaces.list_search_placeholder')}
                            value={inputSearch}
                            onChange={(e) => setInputSearch(e.target.value)}
                        />
                    </div>
                    {searchQuery && (
                        <Button type="button" variant="secondary" onClick={handleResetSearch}>
                            {t('action.cancel')}
                        </Button>
                    )}
                    <Button type="submit">
                        {t('action.search')}
                    </Button>
                </form>
            </div>

            <div className="flex flex-col gap-[8px]">
                {isLoading ? (
                    <div className="p-[25px] text-center text-text-muted bg-bg-box border border-border">
                        {t('common.loading')}
                    </div>
                ) : spaces.length > 0 ? (
                    <>
                        {spaces.map(space => (
                            <SpaceListItem
                                key={space.username}
                                space={space}
                                onLeave={handleLeaveSpace}
                            />
                        ))}

                        {hasMore && (
                            <Button
                                type="button"
                                variant="secondary"
                                disabled={isLoadingMore}
                                onClick={() => {
                                    const nextPage = page + 1;
                                    setPage(nextPage);
                                    fetchSpaces(nextPage);
                                }}
                                className="w-full py-[8px]"
                            >
                                {isLoadingMore ? t('common.loading') : t('action.load_more')}
                            </Button>
                        )}
                    </>
                ) : (
                    <div className="p-[30px] text-center text-text-muted bg-bg-box border border-border flex flex-col items-center gap-[10px]">
                        <span>{t('spaces.list_empty')}</span>
                        {activeTab === 'managed' && !searchQuery && (
                            <Button type="button" variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                                {t('spaces.create')}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <CreateSpaceModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
};

export default SpacesPage;