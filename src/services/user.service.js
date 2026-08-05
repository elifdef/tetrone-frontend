import fetchClient from "../api/client";

const UserService =
{
    updateProfile: async (username, data) =>
    {
        // Якщо data це FormData (є файли), Laravel вимагає метод POST з полем _method: PATCH
        if (data instanceof FormData)
        {
            data.append('_method', 'PATCH');
        }
        return await fetchClient(`/users/${ username }`, {
            method: data instanceof FormData ? 'POST' : 'PATCH',
            body: data
        });
    },

    updateEmail: async (email, password) =>
    {
        return await fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password }
        });
    },

    updatePassword: async (current_password, password, password_confirmation) =>
    {
        return await fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation }
        });
    },

    getUsers: async (params = {}) =>
    {
        const queryString = new URLSearchParams(params).toString();
        return await fetchClient(`/users?${ queryString }`);
    },

    searchUsers: async (query) =>
    {
        return this.getUsers({ search: query });
    },
}

export default UserService;