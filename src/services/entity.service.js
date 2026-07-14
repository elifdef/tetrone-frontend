import fetchClient from '../api/client';

const EntityService = {
    resolveHandle: (handle) => {
        return fetchClient(`/${handle}`);
    }
};

export default EntityService;