import fetchClient from "../api/client";

const userService =
{
    updateProfile: async (username, data) =>
    {
        if (data instanceof FormData)
        {
            data.append('_method', 'PATCH');
        }

        return fetchClient(`/users/${ username }`, {
            method: data instanceof FormData ? 'POST' : 'PATCH',
            body: data
        });
    },

    updateEmail: async (email, password) =>
    {
        return fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password }
        });
    },

    updatePassword: async (current_password, password, password_confirmation) =>
    {
        return fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation }
        });
    },

    getUsers: async (params = {}) =>
    {
        const queryString = new URLSearchParams(params).toString();

        return fetchClient(`/users?${ queryString }`);
    },

    searchUsers: async (query) =>
    {
        return userService.getUsers({ 'filter[search]': query });
    },
}

export default userService;