import fetchClient from '../api/client';

const AppealService = {
    checkStatus: async () => fetchClient('/appeals/status'),
    submitAppeal: async (message: string) =>
        fetchClient('/appeals', { method: 'POST', body: { message } }),
};

export default AppealService;