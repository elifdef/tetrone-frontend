import fetchClient from "../api/client";

const userService = {
    updateProfile: (username, data) => {
        if (data instanceof FormData) {
            data.append('_method', 'PATCH');
        }

        return fetchClient(`/users/${ username }`, {
            method: data instanceof FormData ? 'POST' : 'PATCH',
            body: data
        });
    },

    updateEmail: (email, password) => {
        return fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password }
        });
    },

    updatePassword: (current_password, password, password_confirmation) => {
        return fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation }
        });
    },

    getUsers: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();

        return fetchClient(`/users?${ queryString }`);
    },

    searchUsers: (query) => {
        return userService.getUsers({ 'filter[search]': query });
    },
};

export default userService;