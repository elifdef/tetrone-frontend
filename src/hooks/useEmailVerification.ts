import { useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useMatch } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import AuthService from '../services/auth.service';
import { AuthContext } from '../context/AuthContext';
import { notifyError, notifyInfo } from '../components/common/Notify';
import type { ApiErrorResponse, ApiResponse } from '@/types/api';
import type { UserData } from '@/types/user';

interface VerifyVariables {
    id: string;
    hash: string;
    query: string;
}

export type VerifyStatus = 'idle' | 'verifying' | 'success';

export const useEmailVerification = () => {
    const { user, setUser } = useContext(AuthContext);
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const match = useMatch('/email-verify/:id/:hash');

    const verifyMutation = useMutation<ApiResponse, ApiErrorResponse, VerifyVariables>({
        mutationFn: async ({ id, hash, query }) => {
            return await AuthService.verifyEmail(id, hash, query);
        },
        onSuccess: (res) => {
            if (res.code === 'EMAIL_VERIFIED_ALREADY') {
                navigate('/', { replace: true });
                return;
            }

            const verifiedDate = new Date().toISOString();

            const channel = new BroadcastChannel('auth_channel');
            channel.postMessage({ type: 'EMAIL_VERIFIED', date: verifiedDate });
            channel.close();

            setUser((prev: UserData | null) => (prev ? { ...prev, email_verified_at: verifiedDate } : prev));

            const msg = res.code ? t(`code.${res.code}`) : t('banner.email.success');
            navigate('/', { replace: true, state: { verifySuccessMsg: msg } });
        },
        onError: (err) => {
            notifyError(t(`code.${err.code || 'ERR_UNKNOWN'}`));
            setTimeout(() => navigate('/', { replace: true }), 3000);
        },
    });

    const resendMutation = useMutation<ApiResponse, ApiErrorResponse, void>({
        mutationFn: async () => {
            return await AuthService.resendVerification();
        },
        onSuccess: (res) => {
            notifyInfo(res.code ? t(`code.${res.code}`) : t('info.email_send_letter'));
        },
        onError: (err) => {
            notifyError(t(`code.${err.code || 'error.email_send'}`));
        },
    });

    useEffect(() => {
        if (match?.params.id && match?.params.hash && user) {
            if (user.email_verified_at) {
                navigate('/', { replace: true });
                return;
            }

            if (!verifyMutation.isPending && !verifyMutation.isSuccess) {
                verifyMutation.mutate({
                    id: match.params.id,
                    hash: match.params.hash,
                    query: location.search,
                });
            }
        }
    }, [match, location.search, user, verifyMutation, navigate]);

    const stateObj = location.state as { verifySuccessMsg?: string } | null;

    useEffect(() => {
        if (stateObj?.verifySuccessMsg) {
            window.history.replaceState({}, document.title);
        }
    }, [stateObj?.verifySuccessMsg]);

    const handleResend = (): void => {
        resendMutation.mutate();
    };

    let verifyStatus: VerifyStatus = 'idle';
    let statusMessage = '';

    if (stateObj?.verifySuccessMsg) {
        verifyStatus = 'success';
        statusMessage = stateObj.verifySuccessMsg;
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
        t,
    };
};