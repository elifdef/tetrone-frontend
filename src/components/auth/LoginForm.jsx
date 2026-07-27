import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useLoginForm } from "./hooks/useLoginForm";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function LoginForm()
{
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
        <form onSubmit={ handleSubmit } className="tetrone-auth-form">
            <Input
                id="login-id"
                label={ t('auth.email_or_username') }
                autoComplete="username"
                { ...register("login") }
            />

            <Input
                type="password"
                id="login-password"
                label={ t('auth.password') }
                autoComplete="current-password"
                { ...register("password") }
            />

            { displayError && (
                <div className="tetrone-auth-msg error">
                    { String(displayError) }
                </div>
            ) }

            <div className="tetrone-login-actions">
                <Button disabled={!isValid || isSubmitting} className="tetrone-login-btn">
                    { isSubmitting ? t('common.loading') : t('action.login') }
                </Button>

                <Link to="/forgot-password" className="tetrone-link tetrone-forgot-link">
                    { t('auth.forgot_password_link') }
                </Link>
            </div>

            <div className="tetrone-auth-footer">
                { t('auth.not_have_account') }
                <Link to="/register" className="tetrone-link">
                    { t('action.register') }
                </Link>
            </div>
        </form>
    );
}