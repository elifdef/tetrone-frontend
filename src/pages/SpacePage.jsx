import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { SpaceProvider, SpaceContext } from '../context/SpaceContext';
import { usePageTitle } from '../hooks/usePageTitle';

import SpaceRightSidebar from '../components/spaces/SpaceRightSidebar';
import SpaceHeaderInfo from '../components/spaces/SpaceHeaderInfo';
import SpaceMembersMini from '../components/spaces/SpaceMembersMini';
import SpaceWall from '../components/spaces/SpaceWall';

import SpaceSettingsTab from '../components/spaces/SpaceSettingsTab';
import SpaceStatsTab from '../components/spaces/SpaceStatsTab';
import SpaceMembersTab from '../components/spaces/SpaceMembersTab';
import SpaceInvitesTab from "../components/spaces/SpaceInvitesTab";
import SpaceRulesTab from "../components/spaces/SpaceRulesTab";

const SpacePageLayout = () => {
    const { t } = useTranslation();
    const { space, isAdmin } = useContext(SpaceContext);
    const [searchParams] = useSearchParams();

    // 1. Динамічний Title сайту
    usePageTitle(space ? space.name : t('common.loading'));

    if (!space) return null;

    const currentTab = searchParams.get('tab') || 'wall';

    const renderContent = () => {
        switch (currentTab) {
            case 'settings': return isAdmin ? <SpaceSettingsTab /> : <div className="p-[15px] bg-bg-box border border-border text-center text-text-muted">{t('error.forbidden')}</div>;
            case 'stats': return isAdmin ? <SpaceStatsTab /> : <div className="p-[15px] bg-bg-box border border-border text-center text-text-muted">{t('error.forbidden')}</div>;
            case 'invites': return isAdmin ? <SpaceInvitesTab /> : <div className="p-[15px] bg-bg-box border border-border text-center text-text-muted">{t('error.forbidden')}</div>;
            case 'rules': return <SpaceRulesTab />;
            case 'members': return <SpaceMembersTab />;
            case 'wall':
            default:
                return (
                    <div className="flex flex-col gap-[10px]">
                        <SpaceHeaderInfo />
                        <SpaceMembersMini />
                        <div className="bg-bg-box border border-border">
                            <div className="bg-theme-header-bg text-theme-link p-[6px_8px] text-[11px] font-bold border-b border-border">
                                {t('spaces.blocks_wall')}
                            </div>
                            <div className="p-[10px] bg-bg-page">
                                <SpaceWall space={space} />
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="w-full max-w-[960px] mx-auto p-[15px] flex items-start gap-[15px] max-md:flex-col font-tahoma text-[11px] text-text-main">
            <main className="flex-1 flex flex-col gap-[10px] min-w-0 w-full">
                {renderContent()}
            </main>
            <aside className="w-[200px] shrink-0 flex flex-col gap-[10px] max-md:w-full">
                <SpaceRightSidebar currentTab={currentTab} />
            </aside>
        </div>
    );
};

const SpacePage = ({ initialSpaceData }) => {
    return (
        <SpaceProvider initialSpace={initialSpaceData}>
            <SpacePageLayout />
        </SpaceProvider>
    );
};

export default SpacePage;