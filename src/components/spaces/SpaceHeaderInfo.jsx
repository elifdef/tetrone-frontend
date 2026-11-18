import { useTranslation } from 'react-i18next';
import { useContext } from 'react';
import { SpaceContext } from '@/context/SpaceContext';
import RichText from '@/components/common/RichText';

const hasTipTapContent = (doc) => {
    if (!doc || typeof doc !== 'object' || !Array.isArray(doc.content)) return false;
    return doc.content.some(node => (
        (Array.isArray(node.content) && node.content.length > 0)
        || (node.type && node.type !== 'paragraph')
    ));
};

const SpaceHeaderInfo = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);

    if (!space) return null;

    const showDescription = hasTipTapContent(space.description);

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link p-[5px_10px] flex items-baseline justify-between gap-[10px] flex-wrap">
                <h1 className="text-[13px] font-bold text-theme-link m-0">
                    {space.name}
                </h1>
                <span className="text-[10px] text-text-muted">
                    @{space.username}
                </span>
            </div>

            <div className="p-[10px] text-text-main text-[11px] flex flex-col gap-[4px]">
                <div className="flex py-[2px]">
                    <span className="w-[130px] shrink-0 text-text-muted">{t('spaces.info_type')}:</span>
                    <span className="flex-1 text-text-main">{t(`spaces.privacy_${space.privacy_type}`)}</span>
                </div>

                {space.owner && (
                    <div className="flex py-[2px]">
                        <span className="w-[130px] shrink-0 text-text-muted">{t('spaces.role_owner')}:</span>
                        <span className="flex-1 text-text-main">
                            {space.owner.first_name || space.owner.username}
                        </span>
                    </div>
                )}

                <div className="flex py-[2px]">
                    <span className="w-[130px] shrink-0 text-text-muted">{t('spaces.field_posting')}:</span>
                    <span className="flex-1 text-text-main">
                        {t(`spaces.posting_${space.posting_rule || 'all'}`)}
                    </span>
                </div>

                <div className="mt-[6px] pt-[8px] border-t border-dashed border-border leading-[1.45]">
                    {showDescription ? (
                        <RichText text={space.description} />
                    ) : (
                        <span className="text-text-muted">
                            {t(`spaces.privacy_desc_${space.privacy_type}`)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpaceHeaderInfo;