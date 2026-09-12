import {useState, useEffect, useContext} from 'react';
import {useTranslation} from 'react-i18next';
import notificationService from '../../services/notification.settings.service';
import {notifySuccess, notifyError} from '../common/Notify';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import {audioManager} from '../../utils/audioManager';
import {SOUNDS_CONFIG} from '../../config.js';
import {AuthContext} from "../../context/AuthContext.jsx";

const SETTING_ITEMS = [
    {type: 'messages', labelKey: 'settings.notification_messages'},
    {type: 'likes', labelKey: 'settings.notification_likes'},
    {type: 'comments', labelKey: 'settings.notification_comments'},
    {type: 'reposts', labelKey: 'settings.notification_reposts'},
    {type: 'wall_posts', labelKey: 'settings.notification_wall_posts'},
    {type: 'friend_requests', labelKey: 'settings.notification_friend_requests'},
    {type: 'space_posts', labelKey: 'settings.notification_space_posts'}
];

const NotificationSettings = () =>
{
    const {t} = useTranslation();
    const {user, setUser} = useContext(AuthContext);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() =>
    {
        if (user && user.notification_settings)
        {
            setSettings(user.notification_settings);
        }
        setLoading(false);
    }, [user]);

    const handleToggle = (type) =>
    {
        setSettings(prev => ({
            ...prev,
            [type]: {...prev[type], is_enabled: !prev[type]?.is_enabled}
        }));
    };

    const handleSoundChange = (type, soundId) =>
    {
        setSettings(prev => ({
            ...prev,
            [type]: {...prev[type], sound_id: Number(soundId)}
        }));
    };

    const handlePlaySound = (type) =>
    {
        const soundId = Number(settings[type]?.sound_id);
        if (!soundId || soundId === 0) return;
        audioManager.play(soundId);
    };

    const handleSave = () =>
    {
        setSaving(true);

        const settingsArray = Object.keys(settings).map(type => ({
            type:       type,
            is_enabled: settings[type].is_enabled,
            sound_id:   settings[type].sound_id
        }));

        notificationService.updateSettings({settings: settingsArray})
        .onSuccess((res) =>
        {
            setSettings(res.settings);
            setUser(prev => ({...prev, notification_settings: res.settings}));
            notifySuccess(t('common.saved_successfully'));
        })
        .onError((err) =>
        {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        })
        .onFinally(() =>
        {
            setSaving(false);
        });
    };

    const handleTestPush = () =>
    {
        if (!("Notification" in window))
        {
            notifyError(t('settings.push_unsupported'));
            return;
        }
        Notification.requestPermission().then(permission =>
        {
            if (permission === "granted")
            {
                new Notification(t('settings.push_test_title'), {
                    body: t('settings.push_test_body'),
                    icon: "/favicon.ico"
                });
            } else
            {
                notifyError(t('settings.push_denied'));
            }
        });
    };

    if (loading)
    {
        return <div className="text-[11px] text-text-muted italic p-[20px] text-center">{t('common.loading')}</div>;
    }

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
                {SETTING_ITEMS.map(({type, labelKey}) =>
                {
                    const isEnabled = Boolean(settings[type]?.is_enabled);
                    const soundId = Number(settings[type]?.sound_id || 0);

                    return (
                        <div key={type} className="flex justify-between items-center py-[6px] border-b border-dashed border-border last:border-b-0 max-md:flex-col max-md:items-start max-md:gap-[10px]">

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
                                            // Якщо категорії немає (наприклад, для "Без звуку")
                                            if (!group.categoryLabel) {
                                                return group.items.map(sound => (
                                                    <option key={sound.id} value={sound.id}>
                                                        {t(sound.label)}
                                                    </option>
                                                ));
                                            }

                                            // Якщо категорія є — загортаємо в <optgroup>
                                            return (
                                                <optgroup key={`cat-${index}`} label={t(group.categoryLabel)}>
                                                    {group.items.map(sound => (
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
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? t('action.saving') : t('action.save')}
                </Button>
            </div>
        </div>
    );
};

export default NotificationSettings;