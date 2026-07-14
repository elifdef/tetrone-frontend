import { useTranslation } from 'react-i18next';
import RichText from '../common/RichText';

const SpaceHeaderInfo = ({ space }) => {
    const { t } = useTranslation();

    return (
        <div className="space-block">
            <div className="space-block-content">
                <h1 className="space-title-classic">{space.name}</h1>
                <div className="space-info-row">
                    <span className="space-info-label">{t('spaces.info_type')}</span>
                    <span className="space-info-value">{t(`spaces.privacy.${space.privacy_type}`)}</span>
                </div>
                {space.description && (
                    <div className="space-description-classic">
                        <RichText content={space.description} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpaceHeaderInfo;