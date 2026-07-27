import { Link } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useRegisterForm } from "./hooks/useRegisterForm";
import PasswordStrengthBar from "../ui/PasswordStrengthBar";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function RegisterForm()
{
    const { t } = useTranslation();
    const {
        register,
        handleSubmit,
        errors,
        isValid,
        isSubmitting,
        msg,
        passwordScore,
        setPasswordScore,
        currentPassword
    } = useRegisterForm();

    if (msg.type === "success")
    {
        return (
            <div className="tetrone-auth-success-wrapper">
                <div className="tetrone-auth-msg success tetrone-auth-success-hero">
                    <div className="tetrone-auth-success-icon"/>
                    <div className="tetrone-auth-success-content">
                        <span className="tetrone-auth-success-text">
                            { t('auth.you_have_registered') }<br/>
                            <Link to="/login" className="tetrone-link tetrone-auth-msg-link">
                                { t('action.login') }
                            </Link>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={ handleSubmit } className="tetrone-auth-form">
            <Input
                id="reg-username"
                label={t('auth.username')}
                autoComplete="off"
                {...register("username", {
                    onChange: (e) => {
                        let val = e.target.value.toLowerCase();
                        val = val.replace(/[^a-z0-9_]/g, '');
                        val = val.replace(/^[_0-9]+/, '');
                        e.target.value = val;
                    }
                })}
                error={errors.username}
            />

            <Input
                type="email"
                id="reg-email"
                label={t('auth.email')}
                autoComplete="username"
                {...register("email", {
                    onChange: (e) => e.target.value = e.target.value.replace(/[^a-zA-Z0-9._%+-@]/g, '')

                })}
                error={errors.email}
            />

            <div className="tetrone-form-row">
                <div className="tetrone-form-group">
                    <Input
                        type="password"
                        id="reg-password"
                        label={ t('auth.password') }
                        autoComplete="new-password"
                        { ...register("password") }
                        error={ errors.password }
                    />
                </div>
                <div className="tetrone-form-group">
                    <Input
                        type="password"
                        id="reg-confirm"
                        label={ t('auth.password_confirmation') }
                        autoComplete="new-password"
                        { ...register("password_confirmation") }
                        error={ errors.password_confirmation }
                    />
                </div>
            </div>

            <PasswordStrengthBar password={ currentPassword } onScoreChange={ setPasswordScore }/>

            { msg.type === "error" && (
                <div className="tetrone-auth-msg error">
                    { msg.text }
                </div>
            ) }

            <Button
                className="tetrone-btn tetrone-btn-block"
                type="submit"
                disabled={ !isValid || isSubmitting || (currentPassword && passwordScore < 5) }
            >
                { isSubmitting ? t('common.loading') : t('action.register') }
            </Button>

            <div className="tetrone-auth-footer">
                { t('auth.already_have_account') }{ ' ' }
                <Link to="/login" className="tetrone-link">
                    { t('action.login') }
                </Link>
            </div>
        </form>
    );
}