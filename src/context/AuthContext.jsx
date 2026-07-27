import { createContext, useState, useEffect } from "react";
import { getSystemLanguage } from "../i18n";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { notifyError } from "../components/common/Notify";
import AuthService from "../services/auth.service.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) =>
{
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [initError, setInitError] = useState(false);
    const [checkSession, setCheckSession] = useState(true);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const logoutLocally = () =>
    {
        setUser(null);
        setCheckSession(false);
    };

    useEffect(() =>
    {
        if (!checkSession)
        {
            setLoading(false);
            return;
        }

        if (!user)
        {
            setLoading(true);
        }
        setInitError(false);

        const controller = new AbortController();

        const checkAuth = async () =>
        {
            const res = await AuthService.me(controller.signal);

            if (controller.signal.aborted)
            {
                return;
            }

            if (res.status === 200)
            {
                setUser(res.user);
            }
            else
            {
                setUser(null);
                if (res.status !== 401 && res.status !== 0)
                {
                    setInitError(true);
                }
            }
            setLoading(false);
        };
        checkAuth();

        return () => controller.abort();
    }, [checkSession]);

    // Слухач "протухлої" сесії (спрацює, якщо юзер був онлайн і токен вмер)
    useEffect(() =>
    {
        const handleSessionExpired = () =>
        {
            logoutLocally();
            notifyError(t('api.error.ERR_UNAUTHORIZED'));
            navigate('/login');
        };

        window.addEventListener('session-expired', handleSessionExpired);
        return () => window.removeEventListener('session-expired', handleSessionExpired);
    }, [navigate, t]);

    useEffect(() =>
    {
        if (!user)
        {
            return;
        }

        const channel = new BroadcastChannel('auth_channel');
        channel.onmessage = (event) =>
        {
            if (event.data.type === 'EMAIL_VERIFIED')
            {
                setUser(prev => ({ ...prev, email_verified_at: event.data.date }));
            }
        };
        return () => channel.close();
    }, [user]);

    const login = (newUser) =>
    {
        if (!localStorage.getItem('lang'))
        {
            localStorage.setItem('lang', getSystemLanguage());
        }
        localStorage.setItem('dark_theme', 'true');
        setUser(newUser);
        setInitError(false);
        setCheckSession(false);
    };

    const logout = async () =>
    {
        await AuthService.logout();
        logoutLocally();
    };

    return (
        <AuthContext.Provider value={ { user, setUser, login, logout, loading, initError, isAuthenticated: !!user } }>
            { children }
        </AuthContext.Provider>
    );
};