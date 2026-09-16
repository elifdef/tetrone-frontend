import fetchClient from '../api/client';

const PublicService = {
    getLanding: () => fetchClient('/stats/landing'),
    getSystemInfo: () =>  fetchClient('/about'),
    getStaff: () => fetchClient('/staff'),
}

export default PublicService;