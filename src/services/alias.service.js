import fetchClient from "../api/client";

const AliasService = {
    addAlias(alias)
    {
        return fetchClient('/aliases', { method: 'POST', body: { alias } });
    },
    changePrimaryUsername(alias)
    {
        return fetchClient(`/aliases/${ alias }/primary`, { method: 'POST' });
    },
    checkUsernameAvailability(username)
    {
        return fetchClient(`/check-alias?alias=${ encodeURIComponent(username) }`);
    },
    deleteAlias(alias)
    {
        return fetchClient(`/aliases/${ alias }`, { method: 'DELETE' });
    }
};

export default AliasService;