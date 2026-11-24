import fetchClient from '../api/client';
import type { UserData } from '@/types/user';

const AuthService = {
    signUp: (formData: FormData | Record<string, unknown>) =>
        fetchClient('/auth/sign-up', { method: 'POST', body: formData }),
    signIn: (login: string, password: string) =>
        fetchClient<{ user: UserData }>('/auth/sign-in', { method: 'POST', body: { login, password } }),
    me: (signal: AbortSignal | null = null) =>
        fetchClient<{ user: UserData }>('/me', { signal, silentAuth: true }),
    logout: () => fetchClient('/auth/sign-out', { method: 'POST' }),
    verifyEmail: (id: string | number, hash: string, query = '') =>
        fetchClient(`/email/verify/${id}/${hash}${query}`),
    resendVerification: () => fetchClient('/email/verification-notification', { method: 'POST' }),
    getSessions: () => fetchClient('/settings/sessions'),
    createApiToken: (data: Record<string, unknown>) =>
        fetchClient('/settings/sessions/api-token', { method: 'POST', body: data }),
    revokeSession: (tokenId: string | number) =>
        fetchClient(`/settings/sessions/${tokenId}`, { method: 'DELETE' }),
    revokeAllOtherSessions: () => fetchClient('/settings/sessions', { method: 'DELETE' }),
    revokeAllSessions: () => fetchClient('/settings/sessions/all', { method: 'DELETE' }),
    verifyResetCode: (email: string, code: string) =>
        fetchClient('/email/verify-reset-code', { method: 'POST', body: { email, code } }),
    forgotPassword: (email: string) =>
        fetchClient('/email/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (email: string, code: string, password: string, password_confirmation: string) =>
        fetchClient('/email/reset-password', {
            method: 'POST',
            body: { email, code, password, password_confirmation },
        }),
    deleteAccount: (data: Record<string, unknown>) =>
        fetchClient('/user/account', { method: 'DELETE', body: data }),
    verifyPassword: (password: string) =>
        fetchClient('/verify-password', { method: 'POST', body: { password } }),
};

export default AuthService;