import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import UserService from '@/services/user.service';
import { AuthContext } from '@/context/AuthContext';
import { notifyError, notifySuccess } from '@/components/common/Notify';

export interface EmailFormValues {
    email: string;
    password: string;
}

export interface PasswordFormValues {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export const useSecuritySettings = () => {
    const { t } = useTranslation();
    const { user, setUser } = useContext(AuthContext);

    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

    const handleUpdateEmail = (data: EmailFormValues, resetPasswordInput?: () => void) => {
        setLoadingEmail(true);

        UserService.updateEmail(data.email, data.password)
            .onSuccess((res) => {
                setUser((prev) =>
                    prev ? { ...prev, email: data.email, email_verified_at: null } : prev
                );
                resetPasswordInput?.();

                notifySuccess(
                    res.code ? t(`api.success.${res.code}`) : t('api.success.EMAIL_UPDATED')
                );
                setLoadingEmail(false);
            })
            .onError((err) => {
                if (err.status === 422 && err.errors?.email?.[0]) {
                    notifyError(err.errors.email[0]);
                } else {
                    notifyError(t(`api.error.${err.code || 'ERR_INVALID_PASSWORD'}`));
                }
                setLoadingEmail(false);
            });
    };

    const handleUpdatePassword = (data: PasswordFormValues, resetForm?: () => void) => {
        setLoadingPass(true);

        UserService.updatePassword(data.currentPassword, data.newPassword, data.confirmPassword)
            .onSuccess((res) => {
                resetForm?.();

                notifySuccess(
                    res.code ? t(`api.success.${res.code}`) : t('api.success.PASSWORD_UPDATED')
                );
                setLoadingPass(false);
            })
            .onError((err) => {
                const errors = err.errors || {};

                if (errors.current_password?.[0]) {
                    notifyError(errors.current_password[0]);
                } else if (errors.password?.[0]) {
                    notifyError(errors.password[0]);
                } else {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                }
                setLoadingPass(false);
            });
    };

    const fetchUserData = () => {
        // Оновлюється локально в UsernameManager або через AuthContext
    };

    return {
        user,
        fetchUserData,
        loadingEmail,
        handleUpdateEmail,
        loadingPass,
        handleUpdatePassword,
        t,
    };
};