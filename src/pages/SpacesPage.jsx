import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Tabs from '../components/ui/Tabs';
import SpaceService from '../services/space.service';
import CreateSpaceModal from '../components/modals/CreateSpaceModal';
import SpaceListItem from '../components/spaces/SpaceListItem';

const SpacesPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = searchParams.get('tab') || 'my';

    const [inputSearch, setInputSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [spaces, setSpaces] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    usePageTitle(t('common.spaces'));

    useEffect(() => {
        const fetchSpaces = async () => {
            setIsLoading(true);
            const params = { tab: activeTab };

            if (searchQuery) {
                params['filter[name]'] = searchQuery;
            }

            try {
                const res = await SpaceService.getSpacesList(params);
                if (res && res.spaces) {
                    setSpaces(res.spaces.data || res.spaces);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSpaces();
    }, [activeTab, searchQuery]);

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
        setSearchQuery('');
        setInputSearch('');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setSearchQuery(inputSearch);
    };

    const handleLeaveSpace = async (spaceUsername) => {
        try {
            await SpaceService.leaveSpace(spaceUsername);
            setSpaces(prev => prev.filter(s => s.username !== spaceUsername));
        } catch (error) {
            console.error(error);
        }
    };

    const pageTabs = [
        { id: 'my', label: t('spaces.list_tabs_my') },
        { id: 'managed', label: t('spaces.list_tabs_managed') },
        { id: 'global', label: t('spaces.list_tabs_global') }
    ];

    return (
        <div className="w-full max-w-[960px] mx-auto p-[15px] font-tahoma text-[11px] text-text-main flex flex-col gap-[15px]">
            <h1 className="m-0 text-[16px] text-theme-link font-normal">
                {t('common.spaces')}
            </h1>

            <Tabs
                tabs={pageTabs}
                activeTab={activeTab}
                onChange={setActiveTab}
                className="bg-bg-page p-[5px]"
            />

            <div>
                <form className="flex gap-[10px] mb-[15px]" onSubmit={handleSearchSubmit}>
                    <div className="flex-1">
                        <Input
                            type="text"
                            placeholder={t('spaces.list_search_placeholder')}
                            value={inputSearch}
                            onChange={(e) => setInputSearch(e.target.value)}
                        />
                    </div>
                    <Button type="submit">
                        {t('action.search')}
                    </Button>
                </form>

                <div className="flex flex-col gap-[10px]">
                    {(activeTab === 'managed') && !searchQuery && (
                        <div
                            className="flex items-center gap-[15px] bg-bg-box border border-border p-[10px] cursor-pointer hover:bg-bg-page transition-colors"
                            onClick={() => setIsCreateModalOpen(true)}
                        >
                            <div className="w-[80px] h-[80px] border border-border bg-input-bg flex items-center justify-center text-[24px] text-text-muted shrink-0">
                                +
                            </div>
                            <div className="flex-1">
                                <span className="font-bold text-[12px] text-theme-link hover:underline">
                                    {t('spaces.create')}
                                </span>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="p-[20px] text-center text-text-muted bg-bg-box border border-border">
                            {t('common.loading')}
                        </div>
                    ) : spaces.length > 0 ? (
                        spaces.map(space => (
                            <SpaceListItem
                                key={space.username}
                                space={space}
                                onLeave={handleLeaveSpace}
                            />
                        ))
                    ) : (
                        <div className="p-[20px] text-center text-text-muted bg-bg-box border border-border">
                            {t('spaces.list_empty')}
                        </div>
                    )}
                </div>

                {isCreateModalOpen && (
                    <CreateSpaceModal onClose={() => setIsCreateModalOpen(false)} />
                )}
            </div>
        </div>
    );
};

export default SpacesPage;