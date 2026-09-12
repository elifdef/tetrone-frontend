import fetchClient from "../api/client";

const personalizationService = {
    updateSettings: (formData) => {
        return fetchClient('/settings/personalization', { method: 'POST', body: formData })
    }
}

export default personalizationService;