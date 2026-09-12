import { Link } from "react-router";
import { useTranslation } from 'react-i18next';
import { useLoginForm } from "./hooks/useLoginForm";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm() {
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        globalError,
        isValid
    } = useLoginForm();

    const zodError = Object.values(errors)[0]?.message;
    const displayError = globalError || zodError;

    return (
        <form onSubmit={handleSubmit} className="p-[15px] flex flex-col gap-[12px]">
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
                <div className="bg-[rgba(255,51,71,0.1)] text-theme-error border border-[rgba(255,51,71,0.3)] p-[8px] text-[11px] rounded-[2px] text-center">
                    {String(displayError)}
                </div>
            )}

            <div className="flex items-center justify-between mt-[5px]">
                <Button disabled={!isValid || isSubmitting}>
                    {isSubmitting ? t('common.loading') : t('action.login')}
                </Button>

                <Link to="/forgot-password" className="text-theme-link no-underline hover:underline text-[11px]">
                    {t('auth.forgot_password_link')}
                </Link>
            </div>

            <div className="mt-[10px] pt-[12px] border-t border-border text-center text-text-muted text-[11px]">
                {t('auth.not_have_account')} {' '}
                <Link to="/register" className="text-theme-link no-underline hover:underline font-bold">
                    {t('action.register')}
                </Link>
            </div>
        </form>
    );
}