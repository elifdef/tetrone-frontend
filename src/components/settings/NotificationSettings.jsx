import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import notificationService from '../../services/notification.settings.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Button from '../ui/Button';
import { audioManager } from '../../utils/audioManager';
import { SOUND_OPTIONS } from '../../config.js';
import { AuthContext } from "../../context/AuthContext.jsx";

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
    const { user, setUser } = useContext(AuthContext);
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
            [type]: { ...prev[type], is_enabled: !prev[type].is_enabled }
        }));
    };

    const handleSoundChange = (type, soundId) =>
    {
        setSettings(prev => ({
            ...prev,
            [type]: { ...prev[type], sound_id: Number(soundId) }
        }));
    };

    const handlePlaySound = (type) =>
    {
        const soundId = Number(settings[type]?.sound_id);

        if (!soundId || soundId === 0)
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

        if (res && res.code === 'SETTINGS_UPDATED')
        {
            setSettings(res.settings);
            setUser(prev => ({ ...prev, notification_settings: res.settings }));
            notifySuccess(t('common.saved_successfully'));
        }
        else
        {
            notifyError(t('error.save_failed'));
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
                    const isEnabled = Boolean(settings[type].is_enabled);
                    const soundId = Number(settings[type].sound_id);

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