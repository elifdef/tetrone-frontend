import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import AuthService from '@/services/auth.service';
import { APP_ENV } from '@/config';

export type RegisterFormValues = {
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
};

export function useRegisterForm() {
    const { t } = useTranslation();
    const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' | '' }>({
        text: '',
        type: '',
    });
    const [passwordScore, setPasswordScore] = useState(0);

    const registerSchema = z
        .object({
            username: z
                .string()
                .min(3, t('validation.min_3_chars'))
                .max(32, t('validation.max_32_chars')),
            email: z.string().email(t('validation.invalid_email')),
            password: z.string().min(8, t('validation.min_8_chars')),
            password_confirmation: z.string(),
        })
        .refine((data) => data.password === data.password_confirmation, {
            message: t('auth.password_not_match'),
            path: ['password_confirmation'],
        });

    const {
        register,
        handleSubmit,
        control,
        setError,
        formState: { errors, isValid, isSubmitting },
    } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        mode: 'onChange',
        defaultValues: {
            username: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
    });

    const currentPassword = useWatch({ control, name: 'password' }) || '';

    const onSubmit = async (data: RegisterFormValues) => {
        if (passwordScore < 5) {
            setMsg({ text: t('auth.password_too_weak'), type: 'error' });
            return;
        }

        setMsg({ text: '', type: '' });

        try {
            const res = await AuthService.signUp(data);

            if (res.status === 201) {
                setMsg({ text: 'success', type: 'success' });
            } else {
                const errorCode = res.code || 'ERR_NETWORK';
                const errorMessage = t(`code.${errorCode}`);

                if (errorCode === 'ERR_USERNAME_RESERVED' || errorCode === 'ERR_USERNAME_TAKEN') {
                    setError('username', { type: 'server', message: errorMessage });
                } else if (errorCode === 'ERR_EMAIL_TAKEN') {
                    setError('email', { type: 'server', message: errorMessage });
                } else {
                    setMsg({ text: errorMessage, type: 'error' });
                }
            }
        } catch (error) {
            if (APP_ENV === 'dev') {
                console.error('error registration', error);
            }
            setMsg({ text: t('code.ERR_NETWORK'), type: 'error' });
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
        currentPassword,
    };
}