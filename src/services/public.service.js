import fetchClient from '../api/client';

const PublicService = {
    getLanding: () => fetchClient('/stats/landing'),
    getSystemInfo: () =>  fetchClient('/about'),
}

export default PublicService;