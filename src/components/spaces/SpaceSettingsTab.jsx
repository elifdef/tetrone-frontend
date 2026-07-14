import { useTranslation } from 'react-i18next';

const SpaceSettingsTab = ({ space }) => {
    const { t } = useTranslation();

    return (
        <div className="space-block">
            <div className="space-block-header">
                <span>{t('spaces.blocks_settings')}</span>
            </div>
            <div className="space-block-content">
                <div className="text-muted text-center">
                    {t('spaces.settings_development')}
                </div>
            </div>
        </div>
    );
};

export default SpaceSettingsTab;