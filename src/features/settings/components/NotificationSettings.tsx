import { useState, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import notificationService from '@/services/notification.settings.service';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import Button from '@/components/ui/Button';
import Checkbox from '@/components/ui/Checkbox';
import { audioManager } from '@/utils/audioManager';
import { SOUNDS_CONFIG } from '@/config';
import { AuthContext } from '@/context/AuthContext';
import type { UserData } from '@/types/user';
import type {
    NotificationPreferencesMap,
    NotificationSettingType,
    NotificationSettingUpdateItem,
} from '../types/settings';

const SETTING_ITEMS: Array<{ type: NotificationSettingType; labelKey: string }> = [
    { type: 'messages', labelKey: 'settings.notification_messages' },
    { type: 'likes', labelKey: 'settings.notification_likes' },
    { type: 'comments', labelKey: 'settings.notification_comments' },
    { type: 'reposts', labelKey: 'settings.notification_reposts' },
    { type: 'wall_posts', labelKey: 'settings.notification_wall_posts' },
    { type: 'friend_requests', labelKey: 'settings.notification_friend_requests' },
    { type: 'space_posts', labelKey: 'settings.notification_space_posts' },
];

const buildNormalizedNotificationSettings = (
    userSettings?: UserData['notification_settings']
): NotificationPreferencesMap => {
    const normalized = {} as NotificationPreferencesMap;
    SETTING_ITEMS.forEach(({ type }, index) => {
        const rawItem = userSettings?.[type];
        normalized[type] = {
            is_enabled: rawItem?.is_enabled ?? true,
            sound_id: Number(rawItem?.sound_id ?? index + 1),
        };
    });
    return normalized;
};

const NotificationSettings = () => {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);

    const [prevUserNotificationSettings, setPrevUserNotificationSettings] = useState(
        user?.notification_settings
    );
    const [initialSettings, setInitialSettings] = useState<Partial<NotificationPreferencesMap>>(
        () => (user ? buildNormalizedNotificationSettings(user.notification_settings) : {})
    );
    const [settings, setSettings] = useState<Partial<NotificationPreferencesMap>>(() =>
        user ? buildNormalizedNotificationSettings(user.notification_settings) : {}
    );
    const [saving, setSaving] = useState(false);

    if (user?.notification_settings !== prevUserNotificationSettings) {
        setPrevUserNotificationSettings(user?.notification_settings);
        const normalized = buildNormalizedNotificationSettings(user?.notification_settings);
        setInitialSettings(normalized);
        setSettings(normalized);
    }

    const changedItems = useMemo<NotificationSettingUpdateItem[]>(() => {
        return SETTING_ITEMS.filter(({ type }) => {
            const initial = initialSettings[type];
            const current = settings[type];
            if (!initial || !current) return false;
            return (
                Boolean(initial.is_enabled) !== Boolean(current.is_enabled) ||
                Number(initial.sound_id) !== Number(current.sound_id)
            );
        }).map(({ type }) => ({
            type,
            is_enabled: Boolean(settings[type]?.is_enabled),
            sound_id: Number(settings[type]?.sound_id ?? 1),
        }));
    }, [initialSettings, settings]);

    const isDirty = changedItems.length > 0;

    const handleToggle = (type: NotificationSettingType) => {
        setSettings((prev) => ({
            ...prev,
            [type]: {
                sound_id: prev[type]?.sound_id ?? 1,
                is_enabled: !prev[type]?.is_enabled,
            },
        }));
    };

    const handleSoundChange = (type: NotificationSettingType, soundId: string) => {
        setSettings((prev) => ({
            ...prev,
            [type]: {
                is_enabled: prev[type]?.is_enabled ?? true,
                sound_id: Number(soundId),
            },
        }));
    };

    const handlePlaySound = (type: NotificationSettingType) => {
        const soundId = Number(settings[type]?.sound_id);
        if (!soundId || soundId === 0) return;
        audioManager.play(soundId);
    };

    const handleSave = () => {
        if (!isDirty || saving) return;
        setSaving(true);

        notificationService
            .updateSettings({ settings: changedItems })
            .onSuccess((res) => {
                setInitialSettings(res.settings);
                setSettings(res.settings);
                setUser((prev) => (prev ? { ...prev, notification_settings: res.settings } : prev));
                notifySuccess(t('common.saved_successfully'));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setSaving(false);
            });
    };

    const handleTestPush = () => {
        if (!('Notification' in window)) {
            notifyError(t('settings.push_unsupported'));
            return;
        }
        Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
                new Notification(t('settings.push_test_title'), {
                    body: t('settings.push_test_body'),
                    icon: '/favicon.ico',
                });
            } else {
                notifyError(t('settings.push_denied'));
            }
        });
    };

    return (
        <div className="p-[12px_15px] border-b border-border last:border-b-0">
            <div className="bg-theme-link/5 border border-theme-link p-[10px] mb-[15px] rounded-[2px]">
                <div className="flex justify-between items-center gap-[15px] max-md:flex-col max-md:items-start">
                    <div>
                        <strong className="text-[11px] font-bold text-theme-link block mb-[4px]">
                            {t('settings.browser_push')}
                        </strong>
                        <p className="m-0 text-[10px] text-text-muted leading-[1.4]">
                            {t('settings.push_description')}
                        </p>
                    </div>
                    <div className="flex-shrink-0 max-md:w-full">
                        <Button
                            variant="secondary"
                            onClick={handleTestPush}
                            className="max-md:w-full"
                        >
                            {t('settings.test_push_btn')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col">
                {SETTING_ITEMS.map(({ type, labelKey }) => {
                    const isEnabled = Boolean(settings[type]?.is_enabled);
                    const soundId = Number(settings[type]?.sound_id || 0);

                    return (
                        <div
                            key={type}
                            className="flex justify-between items-center py-[6px] border-b border-dashed border-border last:border-b-0 max-md:flex-col max-md:items-start max-md:gap-[10px]"
                        >
                            <Checkbox
                                id={`notify-${type}`}
                                checked={isEnabled}
                                onChange={() => handleToggle(type)}
                                label={t(labelKey)}
                            />

                            {isEnabled && (
                                <div className="flex items-center gap-[8px] max-md:w-full">
                                    <select
                                        value={soundId}
                                        onChange={(e) => handleSoundChange(type, e.target.value)}
                                        className="w-[150px] max-md:flex-1 bg-input-bg border border-input-border text-[11px] font-tahoma p-[3px] rounded-[2px] outline-none focus:border-theme-link"
                                    >
                                        {SOUNDS_CONFIG.map((group, index) => {
                                            if (!group.categoryLabel) {
                                                return group.items.map((sound) => (
                                                    <option key={sound.id} value={sound.id}>
                                                        {t(sound.label)}
                                                    </option>
                                                ));
                                            }

                                            return (
                                                <optgroup
                                                    key={`cat-${index}`}
                                                    label={t(group.categoryLabel)}
                                                >
                                                    {group.items.map((sound) => (
                                                        <option key={sound.id} value={sound.id}>
                                                            {t(sound.label)}
                                                        </option>
                                                    ))}
                                                </optgroup>
                                            );
                                        })}
                                    </select>

                                    {soundId !== 0 && (
                                        <Button
                                            type="button"
                                            onClick={() => handlePlaySound(type)}
                                            title={t('common.play_sound')}
                                        >
                                            ▶
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-[20px] flex justify-end">
                <Button onClick={handleSave} disabled={!isDirty || saving}>
                    {saving ? t('action.saving') : t('action.save')}
                </Button>
            </div>
        </div>
    );
};

export default NotificationSettings;