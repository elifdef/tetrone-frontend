import fetchClient from '../api/client';

const personalizationService = {
    updateSettings: (formData: FormData | Record<string, unknown>) =>
        fetchClient('/settings/personalization', { method: 'POST', body: formData }),
};

export default personalizationService;