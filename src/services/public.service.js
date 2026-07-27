import fetchClient from '../api/client';

const PublicService =
    {
        getLanding: () => fetchClient('/stats/landing'),
    }
export default PublicService;