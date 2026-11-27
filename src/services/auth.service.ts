import fetchClient from '../api/client';
import type { UserData } from '@/types/user';
import type { DeleteAccountPayload, UserSession } from '@/features/settings/types/settings';

export type AuthMethodType = 'password' | 'pattern';

export type SignInPayload = {
    login: string;
    method: AuthMethodType;
    password?: string;
    pattern?: number[];
};

export type UpdatePatternPayload = {
    current_password: string;
    pattern?: number[];
    disable_pattern?: boolean;
    preferred_auth_method?: AuthMethodType;
};

export interface UpdatePatternResponse {
    code: string;
    has_pattern_auth: boolean;
    preferred_auth_method: AuthMethodType;
}

const AuthService = {
    signUp: (formData: FormData | Record<string, unknown>) =>
        fetchClient('/auth/sign-up', { method: 'POST', body: formData }),
    signIn: (payload: SignInPayload) =>
        fetchClient<{ code?: string; user: UserData }>('/auth/sign-in', {
            method: 'POST',
            body: payload,
        }),
    updatePattern: (payload: UpdatePatternPayload) =>
        fetchClient<UpdatePatternResponse>('/user/pattern', {
            method: 'PUT',
            body: payload,
        }),
    me: (signal: AbortSignal | null = null) =>
        fetchClient<{ user: UserData }>('/me', { signal, silentAuth: true }),
    logout: () => fetchClient('/auth/sign-out', { method: 'POST' }),
    verifyEmail: (id: string | number, hash: string, query = '') =>
        fetchClient(`/email/verify/${id}/${hash}${query}`),
    resendVerification: () => fetchClient('/email/verification-notification', { method: 'POST' }),
    getSessions: () =>
        fetchClient<{ code: string; sessions: UserSession[] }>('/settings/sessions'),
    createApiToken: (data: { token_name: string }) =>
        fetchClient<{ code: string; token: string; session?: UserSession }>(
            '/settings/sessions/api-token',
            {
                method: 'POST',
                body: data,
            }
        ),
    revokeSession: (tokenId: string | number) =>
        fetchClient<{ code: string }>(`/settings/sessions/${tokenId}`, { method: 'DELETE' }),
    revokeAllOtherSessions: () =>
        fetchClient<{ code: string }>('/settings/sessions', { method: 'DELETE' }),
    revokeAllSessions: () =>
        fetchClient<{ code: string }>('/settings/sessions/all', { method: 'DELETE' }),
    verifyResetCode: (email: string, code: string) =>
        fetchClient('/email/verify-reset-code', { method: 'POST', body: { email, code } }),
    forgotPassword: (email: string) =>
        fetchClient('/email/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (email: string, code: string, password: string, password_confirmation: string) =>
        fetchClient('/email/reset-password', {
            method: 'POST',
            body: { email, code, password, password_confirmation },
        }),
    deleteAccount: (data: DeleteAccountPayload) =>
        fetchClient<{ code: string; download_url?: string }>('/user/account', {
            method: 'DELETE',
            body: data,
        }),
    verifyPassword: (password: string) =>
        fetchClient('/verify-password', { method: 'POST', body: { password } }),
};

export default AuthService;