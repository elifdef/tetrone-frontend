import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { SpaceContext } from '../../context/SpaceContext';
import RichText from '../common/RichText';

const SpaceHeaderInfo = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);

    if (!space) return null;

    return (
        <div className="bg-bg-box border border-border">
            <div className="p-[10px] text-text-main text-[11px]">
                <h1 className="text-[18px] font-bold text-theme-link m-0 mb-[5px] border-b border-border pb-[5px]">
                    {space.name}
                </h1>
                <div className="flex py-[4px] text-[11px]">
                    <span className="w-[100px] text-text-muted">{t('spaces.info_type')}</span>
                    <span className="flex-1 text-text-main font-bold">{t(`spaces.privacy_${space.privacy_type}`)}</span>
                </div>
                {space.description && (
                    <div className="mt-[10px] pt-[10px] border-t border-dashed border-border">
                        <RichText content={space.description} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpaceHeaderInfo;