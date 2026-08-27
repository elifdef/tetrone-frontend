import { useState, useContext, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';
import RichText from '../common/RichText';
import Button from '../ui/Button';
import { notifySuccess, notifyError } from '../common/Notify';
import SmartEditor from "../editor/SmartEditor.jsx";

const SpaceRulesTab = () => {
    const { t } = useTranslation();
    const { space, updateSpace, isAdmin } = useContext(SpaceContext);

    const [isEditing, setIsEditing] = useState(false);
    const [rulesContent, setRulesContent] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (space) setRulesContent(space.rules || null);
    }, [space]);

    if (!space) return null;

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const payload = {
                name: space.name,
                privacy_type: space.privacy_type,
                posting_rule: space.posting_rule || 'all',
                description: space.description || null,
                rules: rulesContent || null
            };

            const res = await SpaceService.updateSpace(space.username, payload);
            if (res.space) {
                updateSpace(res.space);
                setIsEditing(false);
                notifySuccess(t('common.saved'));
            }
        } catch (e) {
            notifyError(e.response?.data?.message || t('error.server'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[8px_12px] text-[12px] font-bold border-b border-border flex justify-between items-center">
                <span>{t('spaces.tab_rules')}</span>
                {isAdmin && !isEditing && (
                    <button className="bg-transparent border-none text-[11px] text-theme-link cursor-pointer hover:underline outline-none p-0" onClick={() => setIsEditing(true)}>
                        {t('action.edit')}
                    </button>
                )}
            </div>
            <div className="p-[15px]">
                {isEditing ? (
                    <div className="flex flex-col gap-[15px]">
                        <div className="w-full">
                            <SmartEditor
                                preset="post"
                                value={rulesContent}
                                onChange={setRulesContent}
                            />
                        </div>
                        <div className="flex gap-[10px] justify-end">
                            <Button variant="secondary" onClick={() => setIsEditing(false)}>{t('action.cancel')}</Button>
                            <Button onClick={handleSave} disabled={isLoading}>{isLoading ? t('common.loading') : t('action.save')}</Button>
                        </div>
                    </div>
                ) : (
                    space.rules ? <div className="text-[12px]"><RichText content={space.rules} /></div> : <div className="text-center text-text-muted text-[11px] py-[20px]">{t('spaces.rules_empty')}</div>
                )}
            </div>
        </div>
    );
};

export default SpaceRulesTab;