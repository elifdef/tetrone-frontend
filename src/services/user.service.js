import fetchClient from "../api/client";

class UserService {
    async getProfile(username) {
        return await fetchClient(`/users/${username}`);
    }

    async updateProfile(username, data) {
        return await fetchClient(`/users/${username}`, {
            method: 'POST',
            body: data
        });
    }

    async updateEmail(email, password) {
        return await fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password }
        });
    }

    async updatePassword(current_password, password, password_confirmation) {
        return await fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation }
        });
    }

    async getUsers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return await fetchClient(`/users?${queryString}`);
    }

    async searchUsers(query) {
        return this.getUsers({ search: query });
    }

    async addAlias(alias) {
        return await fetchClient('/user/aliases', {
            method: 'POST',
            body: { alias }
        });
    }

    async changePrimaryUsername(username) {
        return await fetchClient('/user/username', {
            method: 'PUT',
            body: { username }
        });
    }

    async swapAlias(alias) {
        return await fetchClient('/user/aliases/swap', {
            method: 'POST',
            body: { alias }
        });
    }

    async checkUsernameAvailability(username) {
        return await fetchClient(`/user/check-username?username=${encodeURIComponent(username)}`);
    }

    async deleteAlias(alias) {
        return await fetchClient(`/user/aliases/${alias}`, {
            method: 'DELETE'
        });
    }
}

export default new UserService();