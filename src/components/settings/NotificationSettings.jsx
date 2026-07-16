import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import notificationService from '../../services/notification.settings.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Button from '../ui/Button';
import { audioManager } from '../../utils/audioManager';
import { SOUND_OPTIONS } from '../../config.js';

const SETTING_ITEMS = [
    { type: 'messages', labelKey: 'settings.notification_messages' },
    { type: 'likes', labelKey: 'settings.notification_likes' },
    { type: 'comments', labelKey: 'settings.notification_comments' },
    { type: 'reposts', labelKey: 'settings.notification_reposts' },
    { type: 'wall_posts', labelKey: 'settings.notification_wall_posts' },
    { type: 'friend_requests', labelKey: 'settings.notification_friend_requests' },
    { type: 'space_posts', labelKey: 'settings.notification_space_posts' }
];

const NotificationSettings = () =>
{
    const { t } = useTranslation();
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() =>
    {
        const fetchSettings = async () =>
        {
            const res = await notificationService.getSettings();
            if (res.success)
            {
                setSettings(res.data || {});
            }
            else
            {
                notifyError(res.message);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    // вкл/викл тип сповіщення
    const handleToggle = (type) =>
    {
        setSettings(prev => ({
            ...prev,
            [type]: { ...prev[type], is_enabled: !prev[type].is_enabled }
        }));
    };

    // Змінити звук для типу
    const handleSoundChange = (type, soundId) =>
    {
        setSettings(prev => ({
            ...prev,
            [type]: { ...prev[type], sound_id: parseInt(soundId) }
        }));
    };

    // Програти звук
    const handlePlaySound = (type) =>
    {
        const soundId = settings[type]?.sound_id ?? 1;

        if (soundId === 0)
        {
            return;
        }

        audioManager.play(soundId);
    };

    const handleSave = async () =>
    {
        setSaving(true);

        const settingsArray = Object.keys(settings).map(type => ({
            type: type,
            is_enabled: settings[type].is_enabled,
            sound_id: settings[type].sound_id
        }));

        const res = await notificationService.updateSettings({ settings: settingsArray });

        if (res.success)
        {
            setSettings(res.data);
            notifySuccess(res.message || t('common.saved_successfully'));
        }
        else
        {
            notifyError(res.message);
        }
        setSaving(false);
    };

    if (loading)
    {
        return <div className="settings-loading">{ t('common.loading') }</div>;
    }

    return (
        <div className="tetrone-settings-section">
            <div className="notification-settings-list">
                { SETTING_ITEMS.map(({ type, labelKey }) =>
                {
                    const isEnabled = settings[type]?.is_enabled ?? true;
                    const soundId = settings[type]?.sound_id ?? 1;

                    return (
                        <div key={ type } className="notification-setting-row">
                            <label className="setting-info">
                                <input
                                    type="checkbox"
                                    className="tetrone-checkbox"
                                    checked={ isEnabled }
                                    onChange={ () => handleToggle(type) }
                                />
                                <span className="setting-label">{ t(labelKey) }</span>
                            </label>

                            { isEnabled && (
                                <div className="setting-controls">
                                    <select
                                        className="tetrone-select sound-select"
                                        value={ soundId }
                                        onChange={ (e) => handleSoundChange(type, e.target.value) }
                                    >
                                        { SOUND_OPTIONS.map(option => (
                                            <option key={ option.value } value={ option.value }>
                                                { t(option.label) }
                                            </option>
                                        )) }
                                    </select>

                                    { soundId !== 0 && (
                                        <Button
                                            type="button"
                                            onClick={ () => handlePlaySound(type) }
                                            title={ t('common.play_sound') }
                                        >
                                            ▶
                                        </Button>
                                    ) }
                                </div>
                            ) }
                        </div>
                    );
                }) }
            </div>

            <div className="settings-actions" style={ { marginTop: '20px' } }>
                <Button onClick={ handleSave } disabled={ saving }>
                    { saving ? t('action.saving') : t('action.save') }
                </Button>
            </div>
        </div>
    );
};

export default NotificationSettings;