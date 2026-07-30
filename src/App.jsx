import { useState, useContext, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { AuthContext } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import { useTranslation } from "react-i18next";
import ErrorState from "./components/ui/ErrorState";
import { BannedScreen } from './components/auth/BannedScreen';
import { audioManager } from './utils/audioManager';
import CookieBanner from "./components/common/CookieBanner";

const GlobalLoading = () =>
{
    const { t } = useTranslation();
    return (
        <div className="tetrone-fullscreen-center">
            <div className="tetrone-empty-state">{ t('common.loading') }</div>
        </div>
    );
};

const GlobalErrorScreen = ({ title, desc, onRetry, showButton= true }) =>
{
    return (
        <div className="tetrone-fullscreen-center">
            <ErrorState
                title={ title }
                description={ desc }
                onRetry={ onRetry }
                showButton={ showButton }
            />
        </div>
    );
};

export default function App()
{
    const { user, loading, initError } = useContext(AuthContext);
    const { t } = useTranslation();

    const [globalServerState, setGlobalServerState] = useState(null);

    useEffect(() =>
    {
        const handleOffline = () => setGlobalServerState('offline');
        const handleError = () => setGlobalServerState('error');
        const handleMaintenance = () => setGlobalServerState('maintenance');

        window.addEventListener('server-offline', handleOffline);
        window.addEventListener('server-error', handleError);
        window.addEventListener('server-maintenance', handleMaintenance);

        return () =>
        {
            window.removeEventListener('server-offline', handleOffline);
            window.removeEventListener('server-error', handleError);
            window.removeEventListener('server-maintenance', handleMaintenance);
        };
    }, []);

    // Теми
    useEffect(() =>
    {
        const isDark = localStorage.getItem('dark_theme');
        if (isDark === 'false')
        {
            document.body.setAttribute('data-theme', 'light');
        }
        else
        {
            document.body.removeAttribute('data-theme');
        }

        if (isDark === null)
        {
            localStorage.setItem('dark_theme', 'true');
        }
    }, []);

    // звук для сповіщень
    useEffect(() =>
    {
        const unlockAudio = () =>
        {
            audioManager.unlock();
            // після першого успішного кліку видаляємо слухач
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        // слухаємо кліки та натискання клавіш
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () =>
        {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    // 1. Помилка мережі (Бекенд лежить)
    if (globalServerState === 'offline')
    {
        return <GlobalErrorScreen
            title={ t("api.error.CRITICAL_SERVER_ERROR") }
            desc={ t("easter_eggs.server_down_desc") }
            onRetry={ () => window.location.reload() }
        />;
    }

    // 2. Фатальна помилка бекенда (500)
    if (globalServerState === 'error')
    {
        return <GlobalErrorScreen
            title={ t("api.error.CRITICAL_SERVER_ERROR") }
            desc={ t("easter_eggs.server_err_desc") }
            onRetry={ () => setGlobalServerState(null) }
        />;
    }

    // 3. Технічні роботи (503)
    if (globalServerState === 'maintenance')
    {
        const desc = t('easter_eggs.server_maintenance_desc' , { returnObjects: true });


        return <GlobalErrorScreen
            title={ t("api.error.SERVER_MAINTENANCE") }
            desc={ desc[Math.floor(Math.random() * desc.length)] }
            onRetry={ () => window.location.reload() }
            showButton={ false }
        />;
    }

    if (loading)
    {
        return <GlobalLoading/>;
    }

    if (user && user.is_banned)
    {
        return <BannedScreen/>;
    }

    return (
        <>
            <Toaster
                position="bottom-left"
                toastOptions={ {
                    style: {
                        background: 'var(--theme-bg-box)',
                        color: 'var(--theme-text-main)',
                        border: '1px solid var(--theme-border)',
                        borderRadius: '0px',
                        fontSize: '12px'
                    },
                } }
            />
            <AppRoutes/>
            <CookieBanner/>
        </>
    );
}