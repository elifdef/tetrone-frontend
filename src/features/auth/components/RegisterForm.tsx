import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useRegisterForm } from '../hooks/useRegisterForm';
import PasswordStrengthBar from '@/components/ui/PasswordStrengthBar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

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
        currentPassword,
    } = useRegisterForm();

    if (msg.type === 'success') {
        return (
            <div className="p-[18px] text-center">
                <div className="bg-[rgba(75,179,75,0.1)] text-theme-success border border-[rgba(75,179,75,0.3)] p-[15px]">
                    <span className="font-bold text-[13px] block mb-[6px]">
                        {t('auth.you_have_registered')}
                    </span>
                    <Link
                        to="/login"
                        className="text-theme-link no-underline hover:underline text-[11px] font-bold"
                    >
                        {t('action.login')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="p-[18px] flex flex-col gap-[12px]">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-[12px] gap-y-[4px] items-start">
                <label
                    htmlFor="reg-username"
                    className="sm:text-right sm:pt-[6px] text-[11px] text-text-main font-normal"
                >
                    {t('auth.username')}:
                </label>
                <div className="flex flex-col gap-[3px]">
                    <Input
                        id="reg-username"
                        autoComplete="off"
                        {...register('username', {
                            onChange: (e) => {
                                let val = e.target.value.toLowerCase();
                                val = val.replace(/[^a-z0-9_]/g, '');
                                val = val.replace(/^[_0-9]+/, '');
                                e.target.value = val;
                            },
                        })}
                        error={errors.username?.message}
                    />
                    <span className="text-[10px] text-text-muted">
                        {t('auth.username_helper')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-[12px] gap-y-[4px] items-start">
                <label
                    htmlFor="reg-email"
                    className="sm:text-right sm:pt-[6px] text-[11px] text-text-main font-normal"
                >
                    {t('auth.email')}:
                </label>
                <div className="flex flex-col gap-[3px]">
                    <Input
                        type="email"
                        id="reg-email"
                        autoComplete="username"
                        {...register('email', {
                            onChange: (e) => {
                                e.target.value = e.target.value.replace(
                                    /[^a-zA-Z0-9._%+-@]/g,
                                    ''
                                );
                            },
                        })}
                        error={errors.email?.message}
                    />
                    <span className="text-[10px] text-text-muted">
                        {t('auth.email_helper')}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-[12px] gap-y-[4px] items-start">
                <label
                    htmlFor="reg-password"
                    className="sm:text-right sm:pt-[6px] text-[11px] text-text-main font-normal"
                >
                    {t('auth.password')}:
                </label>
                <div className="flex flex-col gap-[6px]">
                    <Input
                        type="password"
                        id="reg-password"
                        autoComplete="new-password"
                        {...register('password')}
                        error={errors.password?.message}
                    />
                    <PasswordStrengthBar
                        password={currentPassword}
                        onScoreChange={setPasswordScore}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-x-[12px] gap-y-[4px] items-start">
                <label
                    htmlFor="reg-confirm"
                    className="sm:text-right sm:pt-[6px] text-[11px] text-text-main font-normal"
                >
                    {t('auth.password_confirmation')}:
                </label>
                <div>
                    <Input
                        type="password"
                        id="reg-confirm"
                        autoComplete="new-password"
                        {...register('password_confirmation')}
                        error={errors.password_confirmation?.message}
                    />
                </div>
            </div>

            {msg.type === 'error' && (
                <div className="sm:ml-[152px] bg-[rgba(255,51,71,0.1)] text-theme-error border border-[rgba(255,51,71,0.3)] p-[8px] text-[11px] text-center">
                    {msg.text}
                </div>
            )}

            <div className="sm:pl-[152px] pt-[4px]">
                <Button
                    type="submit"
                    disabled={
                        !isValid ||
                        isSubmitting ||
                        (Boolean(currentPassword) && passwordScore < 5)
                    }
                >
                    {isSubmitting ? t('common.loading') : t('action.register')}
                </Button>
            </div>

            <div className="mt-[4px] pt-[12px] border-t border-border text-center text-text-muted text-[11px]">
                {t('auth.already_have_account')}{' '}
                <Link
                    to="/login"
                    className="text-theme-link no-underline hover:underline font-bold"
                >
                    {t('action.login')}
                </Link>
            </div>
        </form>
    );
}