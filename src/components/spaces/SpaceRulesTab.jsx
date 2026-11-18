import { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';
import RichText from '../common/RichText';
import Button from '../ui/Button';
import SmartEditor from '../editor/SmartEditor.jsx';
import { notifySuccess, notifyError } from '../common/Notify';

const SpaceRulesTab = () => {
    const { t } = useTranslation();
    const { space, updateSpace, canManageSettings } = useContext(SpaceContext);

    const [isEditing, setIsEditing] = useState(false);
    const [rulesContent, setRulesContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (space) setRulesContent(space.rules || null);
    }, [space]);

    if (!space) return null;

    const handleCancel = () => {
        setRulesContent(space.rules || null);
        setIsEditing(false);
    };

    const handleSave = () => {
        setIsLoading(true);

        const payload = {
            name: space.name,
            privacy_type: space.privacy_type,
            posting_rule: space.posting_rule || 'all',
            is_members_hidden: Boolean(space.is_members_hidden),
            links: space.links || null,
            description: space.description || null,
            rules: rulesContent || null
        };

        SpaceService.updateSpace(space.username, payload)
            .onSuccess((res) => {
                if (res.space) {
                    updateSpace(res.space);
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

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link flex justify-between items-center">
                <span>{t('spaces.tab_rules')}</span>
                {canManageSettings && !isEditing && (
                    <button
                        type="button"
                        className="bg-transparent border-none text-[11px] font-normal text-theme-link cursor-pointer hover:underline p-0"
                        onClick={() => setIsEditing(true)}
                    >
                        {t('action.edit')}
                    </button>
                )}
            </div>

            <div className="p-[14px]">
                {isEditing ? (
                    <div className="flex flex-col gap-[12px]">
                        <SmartEditor
                                preset="default"
                                value={rulesContent}
                                onChange={setRulesContent}
                            />
                        <div className="flex gap-[8px] justify-end">
                            <Button variant="secondary" onClick={handleCancel}>
                                {t('action.cancel')}
                            </Button>
                            <Button onClick={handleSave} disabled={isLoading}>
                                {isLoading ? t('common.loading') : t('action.save')}
                            </Button>
                        </div>
                    </div>
                ) : space.rules ? (
                    <div className="text-[12px] leading-[1.45]">
                        <RichText content={space.rules} />
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
