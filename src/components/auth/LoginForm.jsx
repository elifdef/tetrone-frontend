import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthForms } from "./hooks/useAuthForms";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
    const { t } = useTranslation();
    const { loginUser, loading, error, setError } = useAuthForms();

    const loginSchema = z.object({
        login: z.string({ required_error: t('validation.required') }).min(1, t('validation.required')),
        password: z.string({ required_error: t('validation.required') }).min(1, t('validation.required'))
    });

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            login: "",
            password: ""
        }
    });

    useEffect(() => {
        const subscription = watch(() => {
            if (error) setError(null);
        });
        return () => subscription.unsubscribe();
    }, [watch, error, setError]);

    const onSubmit = (data) => {
        if (error) setError(null);
        loginUser(data.login, data.password);
    };

    const zodError = Object.values(errors)[0]?.message;
    const displayError = error || zodError;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="tetrone-auth-form">
            <Input
                id="login-id"
                label={t('auth.email_or_username')}
                autoComplete="username"
                {...register("login")}
            />

            <Input
                type="password"
                id="login-password"
                label={t('auth.password')}
                autoComplete="current-password"
                {...register("password")}
            />

            {displayError && (
                <div className="tetrone-auth-msg error">
                    {String(displayError)}
                </div>
            )}

            <div className="tetrone-login-actions">
                <Button disabled={loading} className="tetrone-login-btn">
                    {loading ? t('common.loading') : t('action.login')}
                </Button>

                <Link to="/forgot-password" className="tetrone-link tetrone-forgot-link">
                    {t('auth.forgot_password_link')}
                </Link>
            </div>

            <div className="tetrone-auth-footer">
                {t('auth.not_have_account')} <Link to="/register" className="tetrone-link">{t('action.register')}</Link>
            </div>
        </form>
    );
}