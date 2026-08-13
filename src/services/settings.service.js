import fetchClient from "../api/client.js";

const SettingsService = {
    getFeedPreferences: async () => {
        const response = await fetchClient('/settings/feed');
        return response.preferences || {};
    },

    updateFeedPreferences: async (payload) => {
        const response = await fetchClient('/settings/feed', {
            method: 'PUT',
            body: payload
        });
        return response.preferences || {};
    }
};

export default SettingsService;