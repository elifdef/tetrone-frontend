import fetchClient from '../api/client';

class AuthService {
    async signUp(formData) {
        return await fetchClient('/sign-up', {
            method: 'POST',
            body: formData
        });
    }

    async signIn(login, password) {
        return await fetchClient('/sign-in', {
            method: 'POST',
            body: { login, password }
        });
    }

    async getMe(token = null) {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return await fetchClient('/me', { headers });
    }

    async verifyEmail(id, hash, query) {
        return await fetchClient(`/email/verify/${id}/${hash}?${query}`);
    }

    async resendVerification() {
        return await fetchClient('/email/verification-notification', {
            method: 'POST'
        });
    }

    async getSessions() {
        return await fetchClient('/settings/sessions');
    }

    async revokeSession(tokenId) {
        return await fetchClient(`/settings/sessions/${tokenId}`, { method: 'DELETE' });
    }

    async revokeAllOtherSessions() {
        return await fetchClient('/settings/sessions', { method: 'DELETE' });
    }

    async verifyResetCode(email, code) {
        return await fetchClient('/verify-reset-code', {
            method: 'POST',
            body: { email, code }
        });
    }

    async forgotPassword(email) {
        return await fetchClient('/forgot-password', {
            method: 'POST',
            body: { email }
        });
    }

    async resetPassword(email, code, password, password_confirmation) {
        return await fetchClient('/reset-password', {
            method: 'POST',
            body: { email, code, password, password_confirmation }
        });
    }

    async deleteAccount(data) {
        return await fetchClient('/user/account', {
            method: 'DELETE',
            body: data
        });
    }
}

export default new AuthService();