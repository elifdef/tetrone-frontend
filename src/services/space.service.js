// src/services/space.service.js
import fetchClient from '../api/client';
const toQuery = (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return query ? `?${query}` : '';
};

const SpaceService = {
    createSpace: (payload) => fetchClient('/spaces', { method: 'POST', body: payload }),

    updateSpace: (username, payload) => {
        const isFormData = payload instanceof FormData;
        if (isFormData && !payload.has('_method')) {
            payload.append('_method', 'PUT');
        }

        return fetchClient(`/spaces/${username}`, {
            method: isFormData ? 'POST' : 'PUT',
            body: payload
        });
    },

    getSpace: (username, params = {}) => fetchClient(`/spaces/${username}${toQuery(params)}`),
    getSpacesList: (params = {}) => fetchClient(`/spaces${toQuery(params)}`),
    getSpacePosts: (username, page = 1) => fetchClient(`/spaces/${username}/posts?page=${page}`),
    joinSpace: (username, token = null) => fetchClient(`/spaces/${username}/join`, {
        method: 'POST',
        body: token ? { invite_token: token } : {}
    }),
    leaveSpace: (username) => fetchClient(`/spaces/${username}/leave`, { method: 'POST' }),
    deleteSpace: (username) => fetchClient(`/spaces/${username}`, { method: 'DELETE' }),

    getSpaceMembers: (username, params = {}) => fetchClient(`/spaces/${username}/members${toQuery(params)}`),
    approveMember: (spaceUsername, targetUsername) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}/approve`, { method: 'POST' }),
    rejectMember: (spaceUsername, targetUsername) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}/reject`, { method: 'POST' }),
    updateMemberRole: (spaceUsername, targetUsername, payload) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}/role`, { method: 'PUT', body: payload }),
    kickMember: (spaceUsername, targetUsername) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}`, { method: 'DELETE' }),

    getInvites: (username) => fetchClient(`/spaces/${username}/invites`),
    createInvite: (username, payload) => fetchClient(`/spaces/${username}/invites`, { method: 'POST', body: payload }),
    revokeInvite: (username, token) => fetchClient(`/spaces/${username}/invites/${token}`, { method: 'DELETE' }),
    revokeOthers: (username, token) => fetchClient(`/spaces/${username}/invites/${token}/others`, { method: 'DELETE' }),
    getSpaceStats: (username) => fetchClient(`/spaces/${username}/stats`)
};

export default SpaceService;