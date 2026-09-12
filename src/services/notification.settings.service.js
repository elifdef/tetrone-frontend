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

    updateOverride(targetUserId, data) {
        return fetchClient(`/settings/notifications/overrides/${targetUserId}`, {
            method: 'PUT',
            body: data
        });
    }

    deleteOverride(targetUserId) {
        return fetchClient(`/settings/notifications/overrides/${targetUserId}`, {
            method: 'DELETE'
        });
    }
}

export default new NotificationSettingsService();