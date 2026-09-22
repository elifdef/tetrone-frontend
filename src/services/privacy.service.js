import fetchClient from '../api/client';

const PrivacyService = {
    getSettings: () => {
        return fetchClient('/settings/privacy');
    },

    updateSetting: (context, level) => {
        return fetchClient('/settings/privacy', {
            method: 'PATCH',
            body: { context, level }
        });
    },

    setException: (targetUsername, context, isAllowed) => {
        return fetchClient('/settings/privacy/exceptions', {
            method: 'POST',
            body: {
                target_username: targetUsername,
                context,
                is_allowed: isAllowed
            }
        });
    },

    deleteException: (targetUsername, context) => {
        return fetchClient(`/settings/privacy/exceptions/${targetUsername}/${context}`, {
            method: 'DELETE'
        });
    }
};

export default PrivacyService;