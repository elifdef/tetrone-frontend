import { useTranslation } from 'react-i18next';
import RichText from '../common/RichText';
import SpaceWall from './SpaceWall'; // Імпортуємо новий компонент

const SpaceWallTab = ({ space }) => {
    const { t } = useTranslation();

    return (
        <>
            <div className="space-block">
                <div className="space-block-header">
                    <span>{t('spaces.blocks_info')}</span>
                </div>
                <div className="space-block-content">
                    <h1 className="space-title-classic">{space.name}</h1>
                    <div className="space-info-row">
                        <span className="space-info-label">{t('spaces.info_type')}</span>
                        <span className="space-info-value">{t(`spaces.privacy_${space.privacy_type}`)}</span>
                    </div>
                    {space.description && (
                        <div className="space-description-classic">
                            <RichText content={space.description} />
                        </div>
                    )}
                </div>
            </div>

            <div className="space-block">
                <div className="space-block-header">
                    <span>{t('spaces.blocks_wall')}</span>
                </div>
                <SpaceWall space={space} />
            </div>
        </>
    );
};

export default SpaceWallTab;