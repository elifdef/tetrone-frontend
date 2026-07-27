import fetchClient from "../api/client";

class PersonalizationService {
    async updateSettings(formData) {
        return await fetchClient('/settings/personalization', { method: 'POST', body: formData });
    }
}

export default new PersonalizationService();