import { useTranslation } from 'react-i18next';
import SpaceHeaderInfo from './SpaceHeaderInfo';
import SpaceMembersMini from './SpaceMembersMini';
import SpaceWall from './SpaceWall';

const SpaceWallTab = () => {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col gap-[10px]">
            <SpaceHeaderInfo />
            <SpaceMembersMini />
            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[6px_10px] text-[11px] font-bold border-b border-border">
                    {t('spaces.blocks_wall')}
                </div>
                <div className="p-[10px] bg-bg-page">
                    <SpaceWall />
                </div>
            </div>
        </div>
    );
};

export default SpaceWallTab;