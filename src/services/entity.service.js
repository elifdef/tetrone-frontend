import fetchClient from '../api/client';

const EntityService = {
    resolveHandle: (handle, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchClient(`/${handle}${query ? `?${query}` : ''}`);
    }
};

export default EntityService;