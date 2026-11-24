import fetchClient from '../api/client';

const PrivacyService = {
    getSettings: () => fetchClient('/settings/privacy'),

    updateSetting: (context: string, level: number) =>
        fetchClient('/settings/privacy', {
            method: 'PATCH',
            body: { context, level },
        }),

    setException: (targetUsername: string, context: string, isAllowed: boolean) =>
        fetchClient('/settings/privacy/exceptions', {
            method: 'POST',
            body: {
                target_username: targetUsername,
                context,
                is_allowed: isAllowed,
            },
        }),

    deleteException: (targetUsername: string, context: string) =>
        fetchClient(
            `/settings/privacy/exceptions/${encodeURIComponent(targetUsername)}/${encodeURIComponent(context)}`,
            {
                method: 'DELETE',
            }
        ),
};

export default PrivacyService;