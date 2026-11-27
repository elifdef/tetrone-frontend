import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AuthContext } from './auth-context';
import { getSystemLanguage } from '@/i18n';
import { APP_ENV } from '@/config';
import { notifyError } from '@/components/common/Notify';
import AuthService from '@/services/auth.service';
import type { UserData } from '@/types/user';

interface AuthProviderProps {
    children: ReactNode;
}

interface AuthBroadcastMessage {
    type?: string;
    date?: string;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(false);
    const [checkSession, setCheckSession] = useState(true);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const logoutLocally = useCallback(() => {
        setUser(null);
        setCheckSession(false);
        setLoading(false);
    }, []);

    useEffect(() => {
        if (!checkSession) {
            return;
        }

        const controller = new AbortController();

        void AuthService.me(controller.signal).then((res) => {
            if (controller.signal.aborted) {
                return;
            }

            if (res.status === 200 && res.user) {
                setUser(res.user);
                setInitError(false);
            } else {
                setUser(null);
                if (res.status !== 401 && res.status !== 0) {
                    setInitError(true);
                }
            }
            setLoading(false);
        });

        return () => controller.abort();
    }, [checkSession]);

    useEffect(() => {
        const handleSessionExpired = () => {
            logoutLocally();
            notifyError(t('code.ERR_UNAUTHORIZED'));
            navigate('/login');
        };

        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, [logoutLocally, navigate, t]);

    useEffect(() => {
        if (!user) {
            return;
        }

        const channel = new BroadcastChannel('auth_channel');
        channel.onmessage = (event: MessageEvent<AuthBroadcastMessage>) => {
            if (event.data?.type === 'EMAIL_VERIFIED' && event.data.date) {
                const verifiedDate = event.data.date;
                setUser((prev) => (prev ? { ...prev, email_verified_at: verifiedDate } : prev));
            }
        };

        return () => channel.close();
    }, [user]);

    const login = useCallback((newUser: UserData) => {
        if (!localStorage.getItem('lang')) {
            localStorage.setItem('lang', getSystemLanguage());
        }
        setUser(newUser);
        setInitError(false);
        setCheckSession(false);
        setLoading(false);
    }, []);

    const logout = useCallback(async () => {
        try {
            await AuthService.logout();
        } catch (err) {
            if (APP_ENV === 'dev') {
                console.error('Error logout', err);
            }
        } finally {
            logoutLocally();
        }
    }, [logoutLocally]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                login,
                logout,
                loading,
                initError,
                isAuthenticated: Boolean(user),
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};
