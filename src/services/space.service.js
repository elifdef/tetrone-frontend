import fetchClient from '../api/client';

const SpaceService = {
    createSpace: (payload) => fetchClient('/spaces', { method: 'POST', body: payload }),

    updateSpace: async (username, payload) => {
        const isFormData = payload instanceof FormData;
        return fetchClient(`/spaces/${username}`, {
            method: isFormData ? 'POST' : 'PUT',
            body: isFormData ? payload : JSON.stringify(payload),
            headers: isFormData ? {} : { 'Content-Type': 'application/json' }
        });
    },

    getSpace: (username) => fetchClient(`/spaces/${username}`),
    getSpacesList: (params = {}) => fetchClient(`/spaces?${new URLSearchParams(params).toString()}`),
    getSpacePosts: async (username, page = 1) => fetchClient(`/spaces/${username}/posts?page=${page}`),
    joinSpace: async (username, token = null) => fetchClient(`/spaces/${username}/join`, { method: 'POST', body: JSON.stringify({ invite_token: token }) }),
    leaveSpace: async (username) => fetchClient(`/spaces/${username}/leave`, { method: 'POST' }),
    deleteSpace: async (username) => fetchClient(`/spaces/${username}`, { method: 'DELETE' }),

    getSpaceMembers: async (username, params = {}) => fetchClient(`/spaces/${username}/members?${new URLSearchParams(params).toString()}`),
    approveMember: async (spaceUsername, targetUsername) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}/approve`, { method: 'POST' }),
    rejectMember: async (spaceUsername, targetUsername) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}/reject`, { method: 'POST' }),
    updateMemberRole: async (spaceUsername, targetUsername, payload) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}/role`, { method: 'PUT', body: JSON.stringify(payload) }),
    kickMember: async (spaceUsername, targetUsername) => fetchClient(`/spaces/${spaceUsername}/members/${targetUsername}`, { method: 'DELETE' }),

    getInvites: async (username) => fetchClient(`/spaces/${username}/invites`),
    createInvite: async (username, payload) => fetchClient(`/spaces/${username}/invites`, { method: 'POST', body: JSON.stringify(payload) }),
    revokeInvite: async (username, token) => fetchClient(`/spaces/${username}/invites/${token}`, { method: 'DELETE' }),
    revokeOthers: async (username, token) => fetchClient(`/spaces/${username}/invites/${token}/others`, { method: 'DELETE' }),
    getSpaceStats: async (username) => fetchClient(`/spaces/${username}/stats`)
};

export default SpaceService;