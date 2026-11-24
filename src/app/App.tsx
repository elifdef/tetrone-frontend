import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers/auth-context';
import AppRoutes from '@/app/routes/AppRoutes';
import ErrorState from '@/components/ui/ErrorState';
import { BannedScreen } from '@/components/auth/BannedScreen';
import { audioManager } from '@/utils/audioManager';
import CookieBanner from '@/components/common/CookieBanner';
import { useScreenTime } from '@/hooks/useScreenTime';

type GlobalServerState = 'offline' | 'error' | 'maintenance' | null;

const GlobalLoading = () => {
    const { t } = useTranslation();
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-bg-page z-[9999]">
            <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border text-[11px] font-tahoma">
                {t('common.loading')}
            </div>
        </div>
    );
};

interface GlobalErrorScreenProps {
    title: string;
    desc: string;
    onRetry: () => void;
    showButton?: boolean;
}

const GlobalErrorScreen = ({
    title,
    desc,
    onRetry,
    showButton = true,
}: GlobalErrorScreenProps) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-bg-page z-[9999] p-[20px]">
            <ErrorState
                title={title}
                description={desc}
                onRetry={onRetry}
                showButton={showButton}
            />
        </div>
    );
};

export default function App() {
    const { user, loading, initError } = useAuth();
    useScreenTime(user);
    const { t } = useTranslation();

    const [globalServerState, setGlobalServerState] = useState<GlobalServerState>(null);

    useEffect(() => {
        const handleOffline = () => setGlobalServerState('offline');
        const handleError = () => setGlobalServerState('error');
        const handleMaintenance = () => setGlobalServerState('maintenance');

        window.addEventListener('server-offline', handleOffline);
        window.addEventListener('server-error', handleError);
        window.addEventListener('server-maintenance', handleMaintenance);

        return () => {
            window.removeEventListener('server-offline', handleOffline);
            window.removeEventListener('server-error', handleError);
            window.removeEventListener('server-maintenance', handleMaintenance);
        };
    }, []);

    useEffect(() => {
        const unlockAudio = () => {
            audioManager.unlock();
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    if (globalServerState === 'offline') {
        return (
            <GlobalErrorScreen
                title={t('api.error.CRITICAL_SERVER_ERROR')}
                desc={t('easter_eggs.server_down_desc')}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (globalServerState === 'error') {
        return (
            <GlobalErrorScreen
                title={t('api.error.CRITICAL_SERVER_ERROR')}
                desc={t('easter_eggs.server_err_desc')}
                onRetry={() => setGlobalServerState(null)}
            />
        );
    }

    if (globalServerState === 'maintenance') {
        const desc = t('easter_eggs.server_maintenance_desc', { returnObjects: true });
        const resolvedDesc = Array.isArray(desc)
            ? String(desc[Math.floor(Math.random() * desc.length)] ?? '')
            : String(desc);

        return (
            <GlobalErrorScreen
                title={t('api.error.SERVER_MAINTENANCE')}
                desc={resolvedDesc}
                onRetry={() => window.location.reload()}
                showButton={false}
            />
        );
    }

    if (loading) return <GlobalLoading />;

    if (initError && !user) {
        return (
            <GlobalErrorScreen
                title={t('api.error.CRITICAL_SERVER_ERROR')}
                desc={t('easter_eggs.server_err_desc')}
                onRetry={() => window.location.reload()}
            />
        );
    }

    if (user && user.is_banned) return <BannedScreen />;

    return (
        <>
            <Toaster
                position="bottom-left"
                toastOptions={{
                    className: '!bg-transparent !shadow-none !p-0 !m-0 !max-w-none !border-none',
                    style: {
                        background: 'transparent',
                        boxShadow: 'none',
                        padding: 0,
                        borderRadius: 0,
                        border: 'none',
                    },
                }}
            />
            <AppRoutes />
            <CookieBanner />
        </>
    );
}
