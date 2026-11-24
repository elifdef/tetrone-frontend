import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '@/context/space-context';
import SpaceService from '@/services/space.service';
import RichText from '@/components/common/RichText';
import { decodeTipTapContent } from '@/utils/tiptapContent';
import Button from '@/components/ui/Button';
import SmartEditor from '@/components/editor/SmartEditor';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import type { SpaceUpdatePayload } from '@/types/space';
import { isTipTapDoc, isTipTapStickerNode, isTipTapTextNode, type TipTapDoc } from '@/types/tiptap';

const parseTipTapDoc = (value: TipTapDoc | string | null | undefined): TipTapDoc | null => {
    if (!value) return null;
    if (typeof value === 'string') {
        try {
            const parsed: unknown = JSON.parse(value);
            return isTipTapDoc(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }
    return isTipTapDoc(value) ? value : null;
};

const hasTipTapContent = (value: TipTapDoc | string | null | undefined): boolean => {
    const parsed = parseTipTapDoc(value);
    const doc = decodeTipTapContent(parsed);
    if (!isTipTapDoc(doc)) return false;

    return doc.content.some((node) => {
        if (isTipTapStickerNode(node)) return true;
        if ('content' in node && Array.isArray(node.content) && node.content.length > 0) {
            return node.content.some(
                (child) => !isTipTapTextNode(child) || child.text.trim().length > 0
            );
        }
        return false;
    });
};

const SpaceRulesTab = () => {
    const { t } = useTranslation();
    const { space, updateSpace, canManageSettings } = useContext(SpaceContext);

    const [isEditing, setIsEditing] = useState(false);
    const [rulesContent, setRulesContent] = useState<TipTapDoc | null>(() =>
        parseTipTapDoc(space?.rules)
    );
    const [isLoading, setIsLoading] = useState(false);

    if (!space) return null;

    const handleStartEdit = () => {
        setRulesContent(parseTipTapDoc(space.rules));
        setIsEditing(true);
    };

    const handleCancel = () => {
        setRulesContent(parseTipTapDoc(space.rules));
        setIsEditing(false);
    };

    const handleSave = () => {
        setIsLoading(true);

        const nextRules = hasTipTapContent(rulesContent) ? rulesContent : null;

        const payload: SpaceUpdatePayload = {
            name: space.name,
            privacy_type: space.privacy_type ?? 'public',
            posting_rule: space.posting_rule ?? 'all',
            is_members_hidden: Boolean(space.is_members_hidden),
            links: space.links || null,
            description: space.description || null,
            rules: nextRules,
        };

        SpaceService.updateSpace(space.username, payload)
            .onSuccess((res) => {
                if (res.space) {
                    updateSpace(res.space);
                } else {
                    updateSpace({ rules: nextRules });
                }
                setIsEditing(false);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setIsLoading(false);
            });
    };

    const rulesExist = hasTipTapContent(space.rules);

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link flex justify-between items-center">
                <span>{t('spaces.tab_rules')}</span>
                {canManageSettings && !isEditing && (
                    <button
                        type="button"
                        className="bg-transparent border-none text-[11px] font-normal text-theme-link cursor-pointer hover:underline p-0"
                        onClick={handleStartEdit}
                    >
                        {t('action.edit')}
                    </button>
                )}
            </div>

            <div className="p-[14px]">
                {isEditing ? (
                    <div className="flex flex-col gap-[12px]">
                        <div className="border border-input-border bg-input-bg">
                            <SmartEditor
                                preset="default"
                                value={rulesContent}
                                onChange={setRulesContent}
                            />
                        </div>
                        <div className="flex gap-[8px] justify-end">
                            <Button variant="secondary" onClick={handleCancel}>
                                {t('action.cancel')}
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? t('common.loading') : t('action.save')}
                            </Button>
                        </div>
                    </div>
                ) : rulesExist ? (
                    <div className="text-[12px] leading-[1.45]">
                        <RichText text={space.rules} limit={8192} />
                    </div>
                ) : (
                    <div className="text-center text-text-muted text-[11px] py-[20px]">
                        {t('spaces.rules_empty')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpaceRulesTab;