import fetchClient from "../api/client";

class UserService
{
    async updateProfile(username, data)
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
    }

    async updateEmail(email, password)
    {
        return await fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password }
        });
    }

    async updatePassword(current_password, password, password_confirmation)
    {
        return await fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation }
        });
    }

    async getUsers(params = {})
    {
        const queryString = new URLSearchParams(params).toString();
        return await fetchClient(`/users?${ queryString }`);
    }

    async searchUsers(query)
    {
        return this.getUsers({ search: query });
    }
}

export default new UserService();