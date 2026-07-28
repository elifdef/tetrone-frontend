import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import SpaceService from '../services/space.service';
import CreateSpaceModal from '../components/modals/CreateSpaceModal';
import SpaceListItem from '../components/spaces/SpaceListItem';


const SpacesPage = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Беремо активний таб з URL (по замовчуванню 'my')
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
            const params = {
                tab: activeTab
            };

            if (searchQuery) {
                params['filter[name]'] = searchQuery;
            }

            const res = await SpaceService.getSpacesList(params);
            if (res) {
                setSpaces(res.spaces);
            }
            setIsLoading(false);
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

    const handleLeaveSpace = async (spaceId) => {
        // await SpaceService.leaveSpace(spaceId);
        // setSpaces(prev => prev.filter(s => s.id !== spaceId));
    };

    return (
        <div className="tetrone-card-wrapper">
            <h1 className="tetrone-section-title">{t('common.spaces')}</h1>
            <div className="tetrone-tabs">
                <button
                    className={activeTab === 'my' ? 'tetrone-tab active' : 'tetrone-tab'}
                    onClick={() => setActiveTab('my')}
                >
                    {t('spaces.list_tabs_my')}
                </button>
                <button
                    className={activeTab === 'managed' ? 'tetrone-tab active' : 'tetrone-tab'}
                    onClick={() => setActiveTab('managed')}
                >
                    {t('spaces.list_tabs_managed')}
                </button>
                <button
                    className={activeTab === 'global' ? 'tetrone-tab active' : 'tetrone-tab'}
                    onClick={() => setActiveTab('global')}
                >
                    {t('spaces.list_tabs_global')}
                </button>
            </div>

            <div className="space-block-content">
                <div className="tetrone-search-wrapper">
                    <Input
                        type="text"
                        placeholder={t('spaces.list_search_placeholder')}
                        value={inputSearch}
                        onChange={(e) => setInputSearch(e.target.value)}
                    />

                    <Button>
                        {t('action.search')}
                    </Button>
                </div>

                <div className="space-list-container">
                    {(activeTab === 'managed') && !searchQuery && (
                        <div className="space-list-item space-create-item" onClick={() => setIsCreateModalOpen(true)}>
                            <div className="space-list-avatar space-create-avatar">+</div>
                            <div className="space-list-info" style={{ justifyContent: 'center' }}>
                                <span className="space-header-link-right" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                                    {t('spaces.create')}
                                </span>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="tetrone-empty-state">{t('common.loading')}</div>
                    ) : spaces.length > 0 ? (
                        spaces.map(space => (
                            <SpaceListItem
                                key={space.id}
                                space={space}
                                onLeave={handleLeaveSpace}
                            />
                        ))
                    ) : (
                        <div className="tetrone-empty-state">
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