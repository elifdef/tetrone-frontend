import { createContext, useState, useEffect } from "react";
import fetchClient from "../api/client";
import { getSystemLanguage } from "../i18n";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notifyError } from "../components/common/Notify";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(false);
    const [checkSession, setCheckSession] = useState(true);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const logoutLocally = () => {
        setUser(null);
        setCheckSession(false);
    };

    useEffect(() => {
        if (!checkSession) {
            setLoading(false);
            return;
        }

        if (!user) setLoading(true);
        setInitError(false);

        const controller = new AbortController();

        // skipAuthRedirect: true, щоб 401 не викидало на логін
        fetchClient('/me', { signal: controller.signal, skipAuthRedirect: true })
            .then(res => {
                if (controller.signal.aborted) return;

                if (res.success) {
                    setUser(res.data);
                } else {
                    // Якщо 401, це просто гість. Ніякого редіректу.
                    setUser(null);
                    // Якщо це 500 або інша серверна помилка
                    if (res.status !== 401) setInitError(true);
                }
            })
            .catch(err => {
                if (controller.signal.aborted) return;
                setUser(null);
                if (err.status !== 401) setInitError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });

        return () => controller.abort();
    }, [checkSession]);

    useEffect(() => {
        const handleSessionExpired = () => {
            logoutLocally();
            notifyError(t('api.error.ERR_UNAUTHORIZED'));
            navigate('/login');
        };

        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, [navigate, t]);

    useEffect(() => {
        if (!user) return;
        const channel = new BroadcastChannel('auth_channel');
        channel.onmessage = (event) => {
            if (event.data.type === 'EMAIL_VERIFIED') {
                setUser(prev => ({ ...prev, email_verified_at: event.data.date }));
            }
        };
        return () => channel.close();
    }, [user]);

    const login = (newUser) => {
        if (!localStorage.getItem('lang')) {
            localStorage.setItem('lang', getSystemLanguage());
        }
        localStorage.setItem('dark_theme', 'true');
        setUser(newUser);
        setInitError(false);
        setCheckSession(false);
    };

    const logout = async () => {
        await fetchClient('/auth/sign-out', { method: 'POST' }).catch(() => { });
        logoutLocally();
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading, initError, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};