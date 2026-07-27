import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import AuthService from '../../../services/auth.service';
import { APP_ENV } from "../../../config.js";

export function useRegisterForm()
{
    const { t } = useTranslation();
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [passwordScore, setPasswordScore] = useState(0);

    const registerSchema = z.object({
        username: z.string().min(3, t('validation.min_3_chars')).max(32, t('validation.max_32_chars')),
        email: z.string().email(t('validation.invalid_email')),
        password: z.string().min(8, t('validation.min_8_chars')),
        password_confirmation: z.string()
    }).refine((data) => data.password === data.password_confirmation, {
        message: t('auth.password_not_match'),
        path: ['password_confirmation'],
    });

    const form = useForm({
        resolver: zodResolver(registerSchema),
        mode: 'onChange' // Валідуємо при кожному введенні для активації кнопки
    });

    const { register, handleSubmit, watch, setError, formState: { errors, isValid, isSubmitting } } = form;
    const currentPassword = watch('password', '');

    const onSubmit = async (data) =>
    {
        if (passwordScore < 5)
        {
            setMsg({ text: t('auth.password_too_weak'), type: 'error' });
            return;
        }

        setMsg({ text: '', type: '' });

        try
        {
            const res = await AuthService.signUp(data);

            if (res.status === 201)
            {
                setMsg({ text: 'success', type: 'success' });
            }
            else
            {
                const errorCode = res.code || 'ERR_NETWORK';

                const errorMessage = t(`api.error.${ errorCode }`);

                // Розподіляємо помилки по конкретних полях
                if (errorCode === 'ERR_USERNAME_RESERVED' || errorCode === 'ERR_USERNAME_TAKEN')
                {
                    setError('username', { type: 'server', message: errorMessage });
                }
                else if (errorCode === 'ERR_EMAIL_TAKEN')
                {
                    setError('email', { type: 'server', message: errorMessage });
                }
                else
                {
                    // Всі інші помилки (напр. ERR_REGISTRATION_SUSPENDED) показуємо загальним повідомленням
                    setMsg({ text: errorMessage, type: 'error' });
                }
            }
        } catch (error)
        {
            if (APP_ENV === 'dev')
            {
                console.log("error registration", error);
            }
            // Помилка мережі (fetch не вдався)
            setMsg({ text: t('api.error.ERR_NETWORK'), type: 'error' });
        }
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isValid,
        isSubmitting,
        msg,
        passwordScore,
        setPasswordScore,
        currentPassword
    };
}