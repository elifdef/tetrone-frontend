import fetchClient from '../api/client';

const SettingsService = {
    getFeedPreferences: async (): Promise<Record<string, unknown>> => {
        const response = await fetchClient<{ preferences?: Record<string, unknown> }>('/settings/feed');
        return response.preferences || {};
    },

    updateFeedPreferences: async (payload: Record<string, unknown>): Promise<Record<string, unknown>> => {
        const response = await fetchClient<{ preferences?: Record<string, unknown> }>('/settings/feed', {
            method: 'PUT',
            body: payload,
        });
        return response.preferences || {};
    },
};

export default SettingsService;