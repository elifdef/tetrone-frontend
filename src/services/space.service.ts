import fetchClient from '../api/client';

type QueryParams = Record<string, string | number | boolean | undefined | null>;

const toQuery = (params: QueryParams = {}): string => {
    const entries: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== '') {
            entries[key] = String(value);
        }
    }
    const query = new URLSearchParams(entries).toString();
    return query ? `?${query}` : '';
};

const SpaceService = {
    createSpace: (payload: FormData | Record<string, unknown>) =>
        fetchClient('/spaces', { method: 'POST', body: payload }),

    updateSpace: (username: string, payload: FormData | Record<string, unknown>) => {
        const isFormData = payload instanceof FormData;
        if (isFormData && !payload.has('_method')) {
            payload.append('_method', 'PUT');
        }

        return fetchClient(`/spaces/${encodeURIComponent(username)}`, {
            method: isFormData ? 'POST' : 'PUT',
            body: payload,
        });
    },

    getSpace: (username: string, params: QueryParams = {}) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}${toQuery(params)}`),

    getSpacesList: (params: QueryParams = {}) =>
        fetchClient(`/spaces${toQuery(params)}`),

    getSpacePosts: (username: string, page = 1) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/posts?page=${page}`),

    joinSpace: (username: string, token: string | null = null) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/join`, {
            method: 'POST',
            body: token ? { invite_token: token } : {},
        }),

    leaveSpace: (username: string) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/leave`, { method: 'POST' }),

    deleteSpace: (username: string) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}`, { method: 'DELETE' }),

    getSpaceMembers: (username: string, params: QueryParams = {}) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/members${toQuery(params)}`),

    approveMember: (spaceUsername: string, targetUsername: string) =>
        fetchClient(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}/approve`,
            { method: 'POST' }
        ),

    rejectMember: (spaceUsername: string, targetUsername: string) =>
        fetchClient(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}/reject`,
            { method: 'POST' }
        ),

    updateMemberRole: (
        spaceUsername: string,
        targetUsername: string,
        payload: Record<string, unknown>
    ) =>
        fetchClient(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}/role`,
            { method: 'PUT', body: payload }
        ),

    kickMember: (spaceUsername: string, targetUsername: string) =>
        fetchClient(
            `/spaces/${encodeURIComponent(spaceUsername)}/members/${encodeURIComponent(targetUsername)}`,
            { method: 'DELETE' }
        ),

    getInvites: (username: string) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/invites`),

    createInvite: (username: string, payload: Record<string, unknown>) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/invites`, { method: 'POST', body: payload }),

    revokeInvite: (username: string, token: string) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/invites/${encodeURIComponent(token)}`, {
            method: 'DELETE',
        }),

    revokeOthers: (username: string, token: string) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/invites/${encodeURIComponent(token)}/others`, {
            method: 'DELETE',
        }),

    getSpaceStats: (username: string) =>
        fetchClient(`/spaces/${encodeURIComponent(username)}/stats`),
};

export default SpaceService;