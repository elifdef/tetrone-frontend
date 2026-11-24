import fetchClient from '../api/client';

const EntityService = {
    resolveHandle: (handle: string, params: Record<string, string> = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchClient(`/${encodeURIComponent(handle)}${query ? `?${query}` : ''}`);
    },
};

export default EntityService;