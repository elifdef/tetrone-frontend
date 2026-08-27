import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PrivacyService from '../../services/privacy.service';
import { notifyError, notifySuccess } from '../common/Notify';
import Button from '../ui/Button';
import PrivacyExceptionsModal from '../modals/PrivacyExceptionsModal';

const PRIVACY_CONTEXTS = [
    'profile',
    'avatar',
    'dob',
    'country',
    'message',
    'wall_post',
    'comment'
];

export default function PrivacySettings() {
    const { t } = useTranslation();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [initialSettings, setInitialSettings] = useState({});
    const [localSettings, setLocalSettings] = useState({});
    const [exceptions, setExceptions] = useState([]);

    const [activeModalContext, setActiveModalContext] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const res = await PrivacyService.getSettings();

            if (res && res.privacy) {
                const rawSettings = Array.isArray(res.privacy.settings) && res.privacy.settings.length === 0
                    ? {}
                    : (res.privacy.settings || {});

                const normalizedSettings = {};
                PRIVACY_CONTEXTS.forEach(context => {
                    normalizedSettings[context] = rawSettings[context] !== undefined
                        ? parseInt(rawSettings[context], 10)
                        : 0;
                });

                setInitialSettings(normalizedSettings);
                setLocalSettings(normalizedSettings);
                setExceptions(res.privacy.exceptions || []);
            } else {
                notifyError(t('common.error'));
            }
        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsLoading(false);
        }
    };

    const isDirty = useMemo(() => {
        return JSON.stringify(initialSettings) !== JSON.stringify(localSettings);
    }, [initialSettings, localSettings]);

    const handleLocalChange = (context, newLevel) => {
        setLocalSettings(prev => ({
            ...prev,
            [context]: parseInt(newLevel, 10)
        }));
    };

    const handleSaveAll = async () => {
        if (!isDirty) return;
        setIsSaving(true);

        try {
            const changedKeys = Object.keys(localSettings).filter(
                key => localSettings[key] !== initialSettings[key]
            );

            for (const context of changedKeys) {
                await PrivacyService.updateSetting(context, localSettings[context]);
            }

            setInitialSettings(localSettings);
            notifySuccess(t('settings.privacy_saved'));
        } catch (error) {
            notifyError(t('common.error'));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return <div className="text-[11px] text-text-muted italic p-[20px] text-center">{t('common.loading')}</div>;

    return (
        <div className="flex flex-col gap-[15px]">
            <div className="mb-[5px]">
                <h3 className="m-0 mb-[5px] text-[12px] font-bold text-theme-link border-b border-border pb-[5px]">{t('settings.privacy_title')}</h3>
                <p className="m-0 text-[11px] text-text-muted">{t('settings.privacy_desc')}</p>
            </div>

            <div className="bg-bg-box border border-border mb-0">
                <div className="flex flex-col">
                    {PRIVACY_CONTEXTS.map(context => {
                        const currentValue = localSettings[context];

                        return (
                            <div key={context} className="flex justify-between items-center py-[8px] px-[15px] border-b border-dashed border-border last:border-b-0 max-md:flex-col max-md:items-start max-md:gap-[8px]">
                                <div className="flex flex-col gap-[2px]">
                                    <span className="text-[11px] text-text-main">
                                        {t(`privacy.context_${context}`)}
                                    </span>
                                </div>

                                <div className="flex items-center gap-[10px] max-md:w-full max-md:justify-end">
                                    <select
                                        className="bg-input-bg border border-input-border text-text-main p-[4px] text-[11px] outline-none min-w-[150px] focus:border-theme-link max-md:flex-1"
                                        value={currentValue}
                                        onChange={(e) => handleLocalChange(context, e.target.value)}
                                    >
                                        <option value={0}>{t('privacy.level_everyone')}</option>
                                        <option value={1}>{t('privacy.level_friends')}</option>
                                        <option value={2}>{t('privacy.level_nobody')}</option>
                                        <option value={3}>{t('privacy.level_custom')}</option>
                                    </select>

                                    {currentValue === 3 && (
                                        <Button
                                            variant="secondary"
                                            onClick={() => setActiveModalContext(context)}
                                        >
                                            {t('privacy.manage_exceptions')}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-[10px] flex justify-end">
                <Button
                    variant="save"
                    onClick={handleSaveAll}
                    disabled={!isDirty || isSaving}
                >
                    {isSaving ? t('action.saving') : t('action.save')}
                </Button>
            </div>

            <PrivacyExceptionsModal
                isOpen={!!activeModalContext}
                context={activeModalContext}
                onClose={() => setActiveModalContext(null)}
                initialExceptions={exceptions}
                onSaveSuccess={loadSettings}
            />
        </div>
    );
}