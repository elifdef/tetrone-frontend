import { useState, useContext, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router';
import AuthService from '../../../services/auth.service';
import { AuthContext } from '../../../context/AuthContext';
import { APP_ENV } from "../../../config.js";

export function useLoginForm()
{
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useContext(AuthContext);

    const [globalError, setGlobalError] = useState(null);

    const loginSchema = z.object({
        login: z.string().min(1, t('validation.required')),
        password: z.string().min(1, t('validation.required'))
    });

    const form = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: { login: '', password: '' },
        mode: 'onChange'
    });

    const { register, handleSubmit, watch, formState: { errors, isValid, isSubmitting } } = form;

    useEffect(() =>
    {
        const subscription = watch(() =>
        {
            if (globalError)
            {
                setGlobalError(null);
            }
        });
        return () => subscription.unsubscribe();
    }, [watch, globalError]);

    const onSubmit = async (data) =>
    {
        setGlobalError(null);

        try
        {
            const res = await AuthService.signIn(data.login, data.password);

            if (res.status === 200 && res.user)
            {
                login(res.user);
                const from = location.state?.from?.pathname || '/';
                navigate(from, { replace: true });
            }
            else
            {
                const errorCode = res.code || 'ERR_UNKNOWN';
                setGlobalError(t(`api.error.${ errorCode }`));
            }
        } catch (error)
        {
            if (APP_ENV === 'dev')
            {
                console.log("error login", error);
            }
        }
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
        isValid, // Можеш використати в UI: disabled={!isValid || isSubmitting}
        isSubmitting,
        globalError
    };
}