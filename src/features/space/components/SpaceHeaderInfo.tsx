import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '@/context/space-context';
import RichText from '@/components/common/RichText';
import { decodeTipTapContent } from '@/utils/tiptapContent';
import { isTipTapDoc, type TipTapDoc } from '@/types/tiptap';

const hasTipTapContent = (value: TipTapDoc | string | null | undefined): boolean => {
    const raw = typeof value === 'string' ? (() => {
        try {
            return JSON.parse(value) as unknown;
        } catch {
            return null;
        }
    })() : value;

    const doc = decodeTipTapContent(raw);
    if (!isTipTapDoc(doc)) return false;

    return doc.content.some(
        (node) =>
            ('content' in node && Array.isArray(node.content) && node.content.length > 0) ||
            node.type !== 'paragraph'
    );
};

const cleanLabel = (text: string | undefined | null): string =>
    String(text || '').replace(/[:?]+$/, '');

const SpaceHeaderInfo = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);

    if (!space) return null;

    const privacyType = space.privacy_type ?? 'public';
    const showDescription = hasTipTapContent(space.description);

    return (
        <div className="bg-bg-box border border-border min-w-0 overflow-hidden max-lg:hidden">
            <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link p-[5px_10px] flex items-baseline justify-between gap-[10px] flex-wrap">
                <h1 className="text-[13px] font-bold text-theme-link m-0 break-words min-w-0">
                    {space.name}
                </h1>
                <span className="text-[10px] text-text-muted break-all">
                    @{space.username}
                </span>
            </div>

            <div className="p-[10px] text-text-main text-[11px] flex flex-col gap-[4px]">
                <div className="flex py-[2px] gap-[6px]">
                    <span className="w-[130px] shrink-0 text-text-muted">{cleanLabel(t('spaces.info_type'))}:</span>
                    <span className="flex-1 min-w-0 break-words text-text-main">{t(`spaces.privacy_${privacyType}`)}</span>
                </div>

                {space.owner && (
                    <div className="flex py-[2px] gap-[6px]">
                        <span className="w-[130px] shrink-0 text-text-muted">{cleanLabel(t('spaces.role_owner'))}:</span>
                        <span className="flex-1 min-w-0 break-words text-text-main">
                            {space.owner.first_name || space.owner.username}
                        </span>
                    </div>
                )}

                <div className="flex py-[2px] gap-[6px]">
                    <span className="w-[130px] shrink-0 text-text-muted">{cleanLabel(t('spaces.field_posting'))}:</span>
                    <span className="flex-1 min-w-0 break-words text-text-main">
                        {t(`spaces.posting_${space.posting_rule || 'all'}`)}
                    </span>
                </div>

                <div className="mt-[6px] pt-[8px] border-t border-dashed border-border leading-[1.45] break-words min-w-0">
                    {showDescription ? (
                        <RichText text={space.description} />
                    ) : (
                        <span className="text-text-muted">
                            {t(`spaces.privacy_desc_${privacyType}`)}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpaceHeaderInfo;