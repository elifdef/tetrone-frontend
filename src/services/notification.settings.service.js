import fetchClient from "../api/client";

class NotificationSettingsService
{
    async updateSettings(data)
    {
        return await fetchClient('/settings/notifications', {
            method: 'PUT',
            body: data
        });
    }

    async getOverrides()
    {
        return await fetchClient('/settings/notifications/overrides');
    }

    async updateOverride(targetUserId, data)
    {
        return await fetchClient(`/settings/notifications/overrides/${ targetUserId }`, {
            method: 'PUT',
            body: data
        });
    }

    async deleteOverride(targetUserId)
    {
        return await fetchClient(`/settings/notifications/overrides/${ targetUserId }`, {
            method: 'DELETE'
        });
    }
}

export default new NotificationSettingsService();