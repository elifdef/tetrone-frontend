import fetchClient from "../api/client";

class NotificationSettingsService {
    updateSettings(data) {
        return fetchClient('/settings/notifications', {
            method: 'PUT',
            body: data
        });
    }

    getOverrides() {
        return fetchClient('/settings/notifications/overrides');
    }

    updateOverride(username, data, targetType = 'user') {
        return fetchClient('/settings/notifications/overrides', {
            method: 'PUT',
            body: {
                target_type: targetType,
                username,
                ...data
            }
        });
    }

    deleteOverride(username, targetType = 'user') {
        return fetchClient(`/settings/notifications/overrides/${targetType}/${username}`, {
            method: 'DELETE'
        });
    }
}

export default new NotificationSettingsService();