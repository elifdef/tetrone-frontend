import fetchClient from '../api/client';

const AppealService = {
    checkStatus: async () =>
    {
        return fetchClient('/appeals/status');
    },

    submitAppeal: async (message) =>
    {
        return fetchClient('/appeals', { method: 'POST', body: { message } });
    }
}

export default AppealService;