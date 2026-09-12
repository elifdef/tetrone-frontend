import {useState, useContext} from 'react';
import UserService from '../../../services/user.service';
import {AuthContext} from '../../../context/AuthContext';
import {notifyError, notifySuccess} from "../../common/Notify";
import {useTranslation} from 'react-i18next';

export const useSecuritySettings = () =>
{
    const {t} = useTranslation();
    const {user, setUser} = useContext(AuthContext);

    const [loadingEmail, setLoadingEmail] = useState(false);
    const [loadingPass, setLoadingPass] = useState(false);

    const handleUpdateEmail = (data, resetPasswordInput) =>
    {
        setLoadingEmail(true);

        UserService.updateEmail(data.email, data.password)
        .onSuccess((res) =>
        {
            setUser(prev => ({...prev, email: data.email, email_verified_at: null}));
            if (resetPasswordInput) resetPasswordInput();

            notifySuccess(res.code ? t(`api.success.${res.code}`) : t('api.success.EMAIL_UPDATED'));
            setLoadingEmail(false);
        })
        .onError((err) =>
        {
            // Витягуємо точну помилку сервера через новий синтаксис
            if (err.status === 422 && err.data?.errors?.email)
            {
                notifyError(err.data.errors.email[0]);
            } else
            {
                notifyError(t(`api.error.${err.code || 'ERR_INVALID_PASSWORD'}`));
            }
            setLoadingEmail(false);
        });
    };

    const handleUpdatePassword = (data, resetForm) =>
    {
        setLoadingPass(true);

        UserService.updatePassword(data.currentPassword, data.newPassword, data.confirmPassword)
        .onSuccess((res) =>
        {
            if (resetForm) resetForm();

            notifySuccess(res.code ? t(`api.success.${res.code}`) : t('api.success.PASSWORD_UPDATED'));
            setLoadingPass(false);
        })
        .onError((err) =>
        {
            const errors = err.data?.errors || {};

            if (errors.current_password)
            {
                notifyError(errors.current_password[0]);
            } else if (errors.password)
            {
                notifyError(errors.password[0]);
            } else
            {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            }
            setLoadingPass(false);
        });
    };

    // Заглушка, оскільки цей метод викликався з батьківського компонента
    const fetchUserData = () =>
    {
        // Оновлення юзера
    };

    return {
        user, fetchUserData,
        loadingEmail, handleUpdateEmail,
        loadingPass, handleUpdatePassword, t
    };
};