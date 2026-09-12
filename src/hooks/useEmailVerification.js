import { useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useMatch } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import AuthService from '../services/auth.service';
import { AuthContext } from "../context/AuthContext";
import { notifyError, notifyInfo } from "../components/common/Notify";

export const useEmailVerification = () => {
    const { user, setUser } = useContext(AuthContext);
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const match = useMatch('/email-verify/:id/:hash');

    const verifyMutation = useMutation({
        mutationFn: async ({ id, hash, query }) => {
            return await AuthService.verifyEmail(id, hash, query);
        },
        onSuccess: (res) => {
            // ЗАХИСТ ВІД ДУРНЯ (Рівень 2): Якщо бекенд каже, що пошта вже була підтверджена
            if (res.code === 'EMAIL_VERIFIED_ALREADY') {
                navigate('/', { replace: true });
                return;
            }

            const verifiedDate = new Date().toISOString();

            const channel = new BroadcastChannel('auth_channel');
            channel.postMessage({ type: 'EMAIL_VERIFIED', date: verifiedDate });
            channel.close();

            setUser(prev => ({ ...prev, email_verified_at: verifiedDate }));

            const msg = res.code ? t(`api.success.${res.code}`) : t('banner.email.success');

            // ОЧИЩЕННЯ URL: navigate replace повністю затирає шлях /email-verify/...
            navigate('/', { replace: true, state: { verifySuccessMsg: msg } });
        },
        onError: (err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setTimeout(() => navigate('/', { replace: true }), 3000);
        }
    });

    const resendMutation = useMutation({
        mutationFn: async () => {
            return await AuthService.resendVerification();
        },
        onSuccess: (res) => {
            notifyInfo(res.code ? t(`api.success.${res.code}`) : t('info.email_send_letter'));
        },
        onError: (err) => {
            notifyError(t(`api.error.${err.code || 'error.email_send'}`));
        }
    });

    useEffect(() => {
        if (match && user) {
            // ЗАХИСТ ВІД ДУРНЯ (Рівень 1): Якщо в локальному стейті пошта ВЖЕ підтверджена,
            // одразу чистимо URL без жодних запитів до бази.
            if (user.email_verified_at) {
                navigate('/', { replace: true });
                return;
            }

            if (!verifyMutation.isPending && !verifyMutation.isSuccess) {
                verifyMutation.mutate({
                    id: match.params.id,
                    hash: match.params.hash,
                    query: location.search
                });
            }
        }
    }, [match, location.search, user, verifyMutation, navigate]);

    const handleResend = () => {
        resendMutation.mutate();
    };

    let verifyStatus = 'idle';
    let statusMessage = '';

    if (location.state?.verifySuccessMsg) {
        verifyStatus = 'success';
        statusMessage = location.state.verifySuccessMsg;
        window.history.replaceState({}, document.title);
    } else if (verifyMutation.isPending) {
        verifyStatus = 'verifying';
        statusMessage = t('info.verification_email');
    }

    return {
        user,
        loading: resendMutation.isPending,
        verifyStatus,
        statusMessage,
        handleResend,
        t
    };
};