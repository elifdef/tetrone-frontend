import fetchClient from '../api/client';

const AliasService = {
    addAlias(alias: string) {
        return fetchClient('/aliases', { method: 'POST', body: { alias } });
    },
    changePrimaryUsername(alias: string) {
        return fetchClient(`/aliases/${encodeURIComponent(alias)}/primary`, { method: 'POST' });
    },
    swapAlias(alias: string) {
        return fetchClient(`/aliases/${encodeURIComponent(alias)}/primary`, { method: 'POST' });
    },
    checkUsernameAvailability(username: string) {
        return fetchClient(`/check-alias?alias=${encodeURIComponent(username)}`);
    },
    deleteAlias(alias: string) {
        return fetchClient(`/aliases/${encodeURIComponent(alias)}`, { method: 'DELETE' });
    },
};

export default AliasService;