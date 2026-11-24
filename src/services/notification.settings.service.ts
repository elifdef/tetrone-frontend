import fetchClient from '../api/client';

class NotificationSettingsService {
    updateSettings(data: Record<string, unknown>) {
        return fetchClient('/settings/notifications', {
            method: 'PUT',
            body: data,
        });
    }

    getOverrides() {
        return fetchClient('/settings/notifications/overrides');
    }

    updateOverride(username: string, data: Record<string, unknown>, targetType = 'user') {
        return fetchClient('/settings/notifications/overrides', {
            method: 'PUT',
            body: {
                target_type: targetType,
                username,
                ...data,
            },
        });
    }

    deleteOverride(username: string, targetType = 'user') {
        return fetchClient(
            `/settings/notifications/overrides/${encodeURIComponent(targetType)}/${encodeURIComponent(username)}`,
            {
                method: 'DELETE',
            }
        );
    }
}

export default new NotificationSettingsService();