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

            // ВИПРАВЛЕНО: Читаємо дані з правильного шляху res.privacy
            if (res && res.privacy) {
                // 1. Захист від порожнього масиву з PHP
                const rawSettings = Array.isArray(res.privacy.settings) && res.privacy.settings.length === 0
                    ? {}
                    : (res.privacy.settings || {});

                // 2. Нормалізація: гарантуємо, що ВСІ ключі існують у стейті
                // Це наш фронтенд-фаллбек, оскільки ми відмовились від нього на бекенді
                const normalizedSettings = {};
                PRIVACY_CONTEXTS.forEach(context => {
                    normalizedSettings[context] = rawSettings[context] !== undefined
                        ? parseInt(rawSettings[context], 10)
                        : 0; // 0 = Everyone (дефолтне значення)
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

    // Оскільки тепер обидва об'єкти (initial і local) мають однаковий набір
    // відсортованих ключів, JSON.stringify працюватиме ідеально і без багів.
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

            // ВИПРАВЛЕНО: Зберігаємо послідовно (Sequential), щоб уникнути Race Condition у базі
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

    if (isLoading) return <div className="tetrone-loading">{t('common.loading')}</div>;

    return (
        <div className="tetrone-settings-form">
            <div className="tetrone-sessions-header">
                <h3 className="tetrone-sessions-main-title">{t('settings.privacy_title')}</h3>
                <p className="tetrone-sessions-desc">{t('settings.privacy_desc')}</p>
            </div>

            <div className="tetrone-settings-box tetrone-sessions-box-no-margin">
                <div className="tetrone-sessions-list">
                    {PRIVACY_CONTEXTS.map(context => {
                        // Тепер localSettings гарантовано містить значення для кожного context
                        const currentValue = localSettings[context];

                        return (
                            <div key={context} className="tetrone-privacy-row">
                                <div className="tetrone-privacy-label-wrapper">
                                    <span className="tetrone-privacy-label">
                                        {t(`privacy.context_${context}`)}
                                    </span>
                                </div>

                                <div className="tetrone-privacy-controls">
                                    <select
                                        className="tetrone-form-select tetrone-privacy-select"
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

            <div className="tetrone-privacy-footer">
                <Button
                    variant="primary"
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