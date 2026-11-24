import fetchClient from '../api/client';
import type { ApiRequestHandle } from '@/types/api';
import type { UserData, UsersListResponse } from '@/types/user';

const userService = {
    updateProfile: (
        username: string,
        data: Record<string, unknown> | FormData
    ): ApiRequestHandle<Record<string, unknown>> => {
        if (data instanceof FormData) {
            data.append('_method', 'PATCH');
        }

        return fetchClient(`/users/${encodeURIComponent(username)}`, {
            method: data instanceof FormData ? 'POST' : 'PATCH',
            body: data,
        });
    },

    updateEmail: (email: string, password: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient('/user/email', {
            method: 'PUT',
            body: { email, password },
        });
    },

    updatePassword: (
        current_password: string,
        password: string,
        password_confirmation: string
    ): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient('/user/password', {
            method: 'PUT',
            body: { current_password, password, password_confirmation },
        });
    },

    getUsers: (params: Record<string, string> = {}): ApiRequestHandle<UsersListResponse> => {
        const queryString = new URLSearchParams(params).toString();
        return fetchClient<UsersListResponse>(`/users?${queryString}`);
    },

    searchUsers: (query: string): ApiRequestHandle<UsersListResponse> => {
        return userService.getUsers({ 'filter[search]': query });
    },

    getUser: (username: string): ApiRequestHandle<{ code: string; user: UserData }> => {
        return fetchClient<{ code: string; user: UserData }>(`/users/${encodeURIComponent(username)}`);
    },
};

export default userService;