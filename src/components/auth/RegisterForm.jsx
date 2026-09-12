import { Link } from "react-router";
import { useTranslation } from 'react-i18next';
import { useRegisterForm } from "./hooks/useRegisterForm";
import PasswordStrengthBar from "../ui/PasswordStrengthBar";
import Input from "../ui/Input";
import Button from "../ui/Button";

export default function RegisterForm() {
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

    if (msg.type === "success") {
        return (
            <div className="p-[20px] text-center">
                <div className="bg-[rgba(75,179,75,0.1)] text-theme-success border border-[rgba(75,179,75,0.3)] p-[15px] rounded-[2px] mb-[15px]">
                    <span className="font-bold text-[13px] block mb-[5px]">
                        {t('auth.you_have_registered')}
                    </span>
                    <Link to="/login" className="text-theme-link no-underline hover:underline text-[11px]">
                        {t('action.login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-[15px] flex flex-col gap-[12px]">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <Input
                    type="password"
                    id="reg-password"
                    label={t('auth.password')}
                    autoComplete="new-password"
                    {...register("password")}
                    error={errors.password}
                />
                <Input
                    type="password"
                    id="reg-confirm"
                    label={t('auth.password_confirmation')}
                    autoComplete="new-password"
                    {...register("password_confirmation")}
                    error={errors.password_confirmation}
                />
            </div>

            <PasswordStrengthBar password={currentPassword} onScoreChange={setPasswordScore} />

            {msg.type === "error" && (
                <div className="bg-[rgba(255,51,71,0.1)] text-theme-error border border-[rgba(255,51,71,0.3)] p-[8px] text-[11px] rounded-[2px] text-center">
                    {msg.text}
                </div>
            )}

            <Button
                type="submit"
                disabled={!isValid || isSubmitting || (currentPassword && passwordScore < 5)}
                className="mt-[5px] w-full"
            >
                {isSubmitting ? t('common.loading') : t('action.register')}
            </Button>

            <div className="mt-[10px] pt-[12px] border-t border-border text-center text-text-muted text-[11px]">
                {t('auth.already_have_account')} {' '}
                <Link to="/login" className="text-theme-link no-underline hover:underline font-bold">
                    {t('action.login')}
                </Link>
            </div>
        </form>
    );
}