import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PrivacyService from '../../services/privacy.service';
import { notifyError, notifySuccess } from '../common/Notify';
import Button from '../ui/Button';
import PrivacyExceptionsModal from '../modals/PrivacyExceptionsModal';
import CustomSelect from '../ui/CustomSelect';
import { PRIVACY } from '../../config';

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

    const loadSettings = () => {
        setIsLoading(true);

        PrivacyService.getSettings()
        .onSuccess((res) => {
            const rawSettings = Array.isArray(res.privacy.settings) && res.privacy.settings.length === 0
                ? {}
                : (res.privacy.settings || {});

            const normalizedSettings = {};
            PRIVACY.CONTEXTS.forEach(context => {
                normalizedSettings[context] = rawSettings[context] !== undefined
                    ? parseInt(rawSettings[context], 10)
                    : (context === 'poll_vote' ? PRIVACY.LEVELS.FRIENDS : PRIVACY.LEVELS.EVERYONE);
            });

            setInitialSettings(normalizedSettings);
            setLocalSettings(normalizedSettings);
            setExceptions(res.privacy.exceptions || []);
            setIsLoading(false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setIsLoading(false);
        });
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

    const handleSaveAll = () => {
        if (!isDirty) return;
        setIsSaving(true);

        const changedKeys = Object.keys(localSettings).filter(
            key => localSettings[key] !== initialSettings[key]
        );

        let completed = 0;
        let hasError = false;

        changedKeys.forEach(context => {
            PrivacyService.updateSetting(context, localSettings[context])
            .onSuccess((res) => {
                completed++;
                if (completed === changedKeys.length && !hasError) {
                    setInitialSettings(localSettings);
                    notifySuccess(t(`api.success.${res.code || 'SETTINGS_SAVED'}`));
                    setIsSaving(false);
                }
            })
            .onError((err) => {
                if (!hasError) {
                    hasError = true;
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                    setIsSaving(false);
                }
            });
        });
    };

    const privacyOptions = [
        { value: PRIVACY.LEVELS.EVERYONE, label: t('privacy.level_everyone') },
        { value: PRIVACY.LEVELS.FRIENDS, label: t('privacy.level_friends') },
        { value: PRIVACY.LEVELS.NOBODY, label: t('privacy.level_nobody') },
        { value: PRIVACY.LEVELS.CUSTOM, label: t('privacy.level_custom') }
    ];

    if (isLoading) return <div className="text-[11px] text-text-muted italic p-[20px] text-center">{t('common.loading')}</div>;

    return (
        <div className="flex flex-col gap-[15px]">
            <div className="mb-[10px]">
                <h3 className="m-0 mb-[5px] text-[12px] font-bold text-theme-link border-b border-border pb-[5px]">{t('settings.privacy_title')}</h3>
                <p className="m-0 text-[11px] text-text-muted">{t('settings.privacy_desc')}</p>
            </div>

            <div className="flex flex-col gap-[12px] text-[11px]">
                {PRIVACY.CONTEXTS.map(context => {
                    const currentValue = localSettings[context];

                    // Фільтруємо винятки для поточного контексту
                    const contextExceptions = exceptions.filter(ex => ex.context === context && ex.is_allowed);
                    const hasExceptions = contextExceptions.length > 0;

                    return (
                        <div key={context} className="flex items-center max-md:flex-col max-md:items-start max-md:gap-[4px]">
                            <div className="w-[180px] shrink-0 text-right pr-[15px] text-text-muted max-md:w-full max-md:text-left max-md:pr-0">
                                {t(`privacy.context_${context}`)}:
                            </div>

                            <div className="flex items-center gap-[10px] flex-1 max-md:w-full">
                                <CustomSelect
                                    options={privacyOptions}
                                    value={currentValue}
                                    onChange={(val) => handleLocalChange(context, val)}
                                    placeholder={t('common.select')}
                                    className="w-[200px] max-md:flex-1 shrink-0"
                                />

                                {currentValue === PRIVACY.LEVELS.CUSTOM && (
                                    <div className="flex items-center gap-[8px]">
                                        <Button
                                            variant="secondary"
                                            onClick={() => setActiveModalContext(context)}
                                        >
                                            {t('privacy.manage_exceptions')}
                                        </Button>

                                        {/* Показуємо хто або скільки додано у винятки */}
                                        {hasExceptions && (
                                            <span className="text-[10px] text-text-muted italic max-md:hidden">
                                                {contextExceptions.length === 1
                                                    ? `@${contextExceptions[0].target_user?.username}`
                                                    : `(${contextExceptions.length})`
                                                }
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}

                <div className="flex mt-[10px] pt-[15px] border-t border-dashed border-border max-md:flex-col max-md:mt-0">
                    <div className="w-[180px] shrink-0 max-md:hidden"></div>
                    <div className="flex-1 flex justify-start pl-[0px]">
                        <Button variant="save" onClick={handleSaveAll} disabled={!isDirty || isSaving}>
                            {isSaving ? t('action.saving') : t('action.save')}
                        </Button>
                    </div>
                </div>
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