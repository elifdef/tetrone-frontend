import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '@/hooks/usePageTitle';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Tabs from '@/components/ui/Tabs';
import SpaceService, { type SpaceQueryParams } from '@/services/space.service';
import CreateSpaceModal from '@/features/space/components/CreateSpaceModal';
import SpaceListItem from '@/features/space/components/SpaceListItem';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import type { SpaceData } from '@/types/space';

type SpacesTabId = 'my' | 'managed' | 'global';

interface SpacesResultsListProps {
    activeTab: SpacesTabId;
    searchQuery: string;
    onOpenCreateModal: () => void;
}

const SpacesResultsList = ({
    activeTab,
    searchQuery,
    onOpenCreateModal,
}: SpacesResultsListProps) => {
    const { t } = useTranslation();

    const [spaces, setSpaces] = useState<SpaceData[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const params: SpaceQueryParams = { tab: activeTab, page: 1 };
        if (searchQuery) {
            params['filter[name]'] = searchQuery;
        }

        SpaceService.getSpacesList(params)
            .onSuccess((res) => {
                if (cancelled) return;
                const items = Array.isArray(res.spaces)
                    ? res.spaces
                    : (res.spaces?.data ?? []);
                const meta = res.meta || (!Array.isArray(res.spaces) ? res.spaces?.meta : undefined);

                setSpaces(items);
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            })
            .onError((err) => {
                if (!cancelled) {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                }
            })
            .onFinally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [activeTab, searchQuery, t]);

    const handleLoadMore = useCallback(() => {
        const nextPage = page + 1;
        setPage(nextPage);
        setIsLoadingMore(true);

        const params: SpaceQueryParams = { tab: activeTab, page: nextPage };
        if (searchQuery) {
            params['filter[name]'] = searchQuery;
        }

        SpaceService.getSpacesList(params)
            .onSuccess((res) => {
                const items = Array.isArray(res.spaces)
                    ? res.spaces
                    : (res.spaces?.data ?? []);
                const meta = res.meta || (!Array.isArray(res.spaces) ? res.spaces?.meta : undefined);

                setSpaces((prev) => [...prev, ...items]);
                setHasMore(meta ? meta.current_page < meta.last_page : false);
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setIsLoadingMore(false);
            });
    }, [activeTab, page, searchQuery, t]);

    const handleLeaveSpace = (spaceUsername: string) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        SpaceService.leaveSpace(spaceUsername)
            .onSuccess((res) => {
                setSpaces((prev) => prev.filter((s) => s.username !== spaceUsername));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    return (
        <div className="flex flex-col gap-[8px]">
            {isLoading ? (
                <div className="p-[25px] text-center text-text-muted bg-bg-box border border-border">
                    {t('common.loading')}
                </div>
            ) : spaces.length > 0 ? (
                <>
                    {spaces.map((space) => (
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
                            onClick={handleLoadMore}
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
                        <Button type="button" variant="primary" onClick={onOpenCreateModal}>
                            {t('spaces.create')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

const SpacesPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = (searchParams.get('tab') as SpacesTabId) || 'my';

    const [inputSearch, setInputSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    usePageTitle(t('common.spaces'));

    const handleTabChange = (tab: string) => {
        setSearchParams({ tab });
        setSearchQuery('');
        setInputSearch('');
    };

    const handleSearchSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSearchQuery(inputSearch.trim());
    };

    const handleResetSearch = () => {
        setInputSearch('');
        setSearchQuery('');
    };

    const pageTabs = [
        { id: 'my', label: t('spaces.list_tabs_my') },
        { id: 'managed', label: t('spaces.list_tabs_managed') },
        { id: 'global', label: t('spaces.list_tabs_global') },
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

            <SpacesResultsList
                key={`${activeTab}:${searchQuery}`}
                activeTab={activeTab}
                searchQuery={searchQuery}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />

            {isCreateModalOpen && (
                <CreateSpaceModal onClose={() => setIsCreateModalOpen(false)} />
            )}
        </div>
    );
};

export default SpacesPage;