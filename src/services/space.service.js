import fetchClient from '../api/client';

const SpaceService = {
    createSpace: (payload) => {
        return fetchClient('/spaces', {
            method: 'POST',
            body: payload,
        });
    },

    /**
     * Отримати простір за аліасом або ID
     */
    getSpace: (name) => {
        return fetchClient(`/spaces/${name}`);
    },

    /**
     * Отримати список просторів
     */
    getSpacesList: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return fetchClient(`/spaces?${query}`);
    },

    getSpacePosts: async (nickname, page = 1) => {
        return await fetchClient(`/spaces/${nickname}/posts?page=${page}`);
    },

    joinSpace: async (spaceId) => {
        return await fetchClient.post(`/spaces/${spaceId}/join`);
    },
    leaveSpace: async (spaceId) => {
        return await fetchClient.post(`/spaces/${spaceId}/leave`);
    },
};

export default SpaceService;