import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useLoginForm } from '../hooks/useLoginForm';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import PatternAuthModal from './PatternAuthModal';

export default function LoginForm() {
    const { t } = useTranslation();
    const {
        identifier,
        password,
        pattern,
        isOtherMethodsOpen,
        patternLocked,
        isPatternModalOpen,
        isSubmitting,
        error,
        handleIdentifierChange,
        handlePasswordChange,
        handlePatternChange,
        handleToggleOtherMethods,
        handleOpenPatternModal,
        handleClosePatternModal,
        handleAuthenticatePassword,
        handleAuthenticatePattern,
    } = useLoginForm();

    return (
        <div className="p-[18px] flex flex-col gap-[14px]">
            <form onSubmit={handleAuthenticatePassword} className="flex flex-col gap-[12px]">
                <Input
                    id="login-id"
                    label={t('auth.email_or_username')}
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => handleIdentifierChange(e.target.value)}
                    disabled={isSubmitting}
                    autoFocus
                />

                <Input
                    type="password"
                    id="login-password"
                    label={t('auth.password')}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    disabled={isSubmitting}
                />

                {error && !isPatternModalOpen && (
                    <div className="bg-[rgba(255,51,71,0.1)] text-theme-error border border-[rgba(255,51,71,0.3)] p-[8px] text-[11px] text-center">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between gap-[10px] flex-wrap pt-[2px]">
                    <div className="flex items-center gap-[8px] flex-wrap">
                        <Button
                            type="submit"
                            disabled={!identifier.trim() || !password || isSubmitting}
                        >
                            {isSubmitting ? t('common.loading') : t('action.login')}
                        </Button>

                        <Button
                            type="button"
                            variant="secondary"
                            onClick={handleToggleOtherMethods}
                            disabled={isSubmitting}
                            aria-expanded={isOtherMethodsOpen}
                        >
                            {t('auth.other_sign_in_method')}
                        </Button>
                    </div>

                    <Link
                        to="/forgot-password"
                        className="text-theme-link no-underline hover:underline text-[11px]"
                    >
                        {t('auth.forgot_password_link')}
                    </Link>
                </div>
            </form>

            {isOtherMethodsOpen && (
                <div className="pt-[12px] border-t border-border flex flex-col gap-[8px]">
                    <span className="text-[11px] font-bold text-text-main">
                        {t('auth.choose_auth_method')}
                    </span>

                    <button
                        type="button"
                        onClick={handleOpenPatternModal}
                        disabled={isSubmitting}
                        className="w-full text-left bg-bg-page hover:bg-bg-hover border border-border hover:border-theme-link p-[10px_12px] flex items-center gap-[12px] cursor-pointer transition-colors group"
                    >
                        <div className="w-[32px] h-[32px] bg-bg-box border border-border group-hover:border-theme-link text-theme-link flex items-center justify-center shrink-0">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
                            </svg>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
                            <div className="flex items-center gap-[6px] flex-wrap">
                                <span className="font-bold text-[11px] text-theme-link group-hover:underline">
                                    {t('auth.tile_pattern_title')}
                                </span>
                                {patternLocked && (
                                    <span className="text-[9px] px-[5px] py-[1px] bg-theme-error/10 text-theme-error border border-theme-error/30 font-bold uppercase">
                                        {t('auth.method_locked_badge')}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] text-text-muted leading-[1.35]">
                                {patternLocked
                                    ? t('auth.pattern_locked_short_hint')
                                    : t('auth.tile_pattern_desc')}
                            </span>
                        </div>

                        <span
                            aria-hidden="true"
                            className="text-text-muted group-hover:text-theme-link font-bold text-[14px]"
                        >
                            ›
                        </span>
                    </button>
                </div>
            )}

            <div className="mt-[2px] pt-[12px] border-t border-border text-center text-text-muted text-[11px]">
                {t('auth.not_have_account')}{' '}
                <Link
                    to="/register"
                    className="text-theme-link no-underline hover:underline font-bold"
                >
                    {t('action.register')}
                </Link>
            </div>

            <PatternAuthModal
                isOpen={isPatternModalOpen}
                mode="login"
                identifier={identifier.trim()}
                value={pattern}
                onChange={handlePatternChange}
                onConfirm={handleAuthenticatePattern}
                onClose={handleClosePatternModal}
                error={error}
                isLocked={patternLocked}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}