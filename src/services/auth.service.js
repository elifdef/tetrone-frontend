import fetchClient from '../api/client';

const AuthService = {
    signUp: (formData) => fetchClient('/auth/sign-up', { method: 'POST', body: formData }),
    signIn: (login, password) => fetchClient('/auth/sign-in', { method: 'POST', body: { login, password } }),
    me: (signal = null) => fetchClient('/me', { signal, silentAuth: true }),
    logout: () => fetchClient('/auth/sign-out', { method: 'POST' }),
    verifyEmail: (id, hash, query) => fetchClient(`/email/verify/${id}/${hash}${query}`),
    resendVerification: () => fetchClient('/email/verification-notification', { method: 'POST' }),
    getSessions: () => fetchClient('/settings/sessions'),
    createApiToken: (data) => fetchClient('/settings/sessions/api-token', { method: 'POST', body: data }),
    revokeSession: (tokenId) => fetchClient(`/settings/sessions/${tokenId}`, { method: 'DELETE' }),
    revokeAllOtherSessions: () => fetchClient('/settings/sessions', { method: 'DELETE' }),
    revokeAllSessions: () => fetchClient('/settings/sessions/all', { method: 'DELETE' }),
    verifyResetCode: (email, code) => fetchClient('/email/verify-reset-code', { method: 'POST', body: { email, code } }),
    forgotPassword: (email) => fetchClient('/email/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (email, code, password, password_confirmation) => fetchClient('/email/reset-password', { method: 'POST', body: { email, code, password, password_confirmation } }),
    deleteAccount: (data) => fetchClient('/user/account', { method: 'DELETE', body: data }),
    verifyPassword: (password) => fetchClient('/verify-password', { method: 'POST', body: { password } })
};

export default AuthService;