import { useState, useContext, type FormEvent } from 'react';
import type { TFunction } from 'i18next';
import { AuthContext } from '@/context/AuthContext';
import AuthService, { type AuthMethodType } from '@/services/auth.service';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PatternGrid, { MIN_PATTERN_LENGTH } from '@/features/auth/components/PatternGrid';

export interface PatternSecuritySectionProps {
    t: TFunction;
}

export default function PatternSecuritySection({ t }: PatternSecuritySectionProps) {
    const { user, setUser } = useContext(AuthContext);

    const hasPattern = Boolean(user?.has_pattern_auth);
    const [mode, setMode] = useState<'idle' | 'setup' | 'disable'>('idle');
    const [pattern, setPattern] = useState<number[]>([]);
    const [preferredMethod, setPreferredMethod] = useState<AuthMethodType>(
        user?.preferred_auth_method || 'pattern'
    );
    const [currentPassword, setCurrentPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const resetLocal = () => {
        setMode('idle');
        setPattern([]);
        setCurrentPassword('');
    };

    const handleSavePattern = async (e: FormEvent) => {
        e.preventDefault();
        if (pattern.length < MIN_PATTERN_LENGTH || !currentPassword || loading) return;

        setLoading(true);
        const res = await AuthService.updatePattern({
            current_password: currentPassword,
            pattern,
            preferred_auth_method: preferredMethod,
        });
        setLoading(false);

        if (res.ok) {
            setUser((prev) =>
                prev
                    ? {
                          ...prev,
                          has_pattern_auth: res.has_pattern_auth,
                          preferred_auth_method: res.preferred_auth_method,
                      }
                    : prev
            );
            notifySuccess(t('code.PATTERN_UPDATED'));
            resetLocal();
        } else {
            notifyError(t(`code.${res.code || 'ERR_INVALID_PASSWORD'}`));
        }
    };

    const handleDisablePattern = async (e: FormEvent) => {
        e.preventDefault();
        if (!currentPassword || loading) return;

        setLoading(true);
        const res = await AuthService.updatePattern({
            current_password: currentPassword,
            disable_pattern: true,
        });
        setLoading(false);

        if (res.ok) {
            setUser((prev) =>
                prev
                    ? {
                          ...prev,
                          has_pattern_auth: false,
                          preferred_auth_method: 'password',
                      }
                    : prev
            );
            notifySuccess(t('code.PATTERN_DISABLED'));
            resetLocal();
        } else {
            notifyError(t(`code.${res.code || 'ERR_INVALID_PASSWORD'}`));
        }
    };

    return (
        <div className="p-[12px_15px] border-b border-border last:border-b-0">
            <h2 className="m-0 mb-[10px] text-[11px] font-bold text-theme-link border-b border-border pb-[4px]">
                {t('settings.pattern_auth_title')}
            </h2>

            <div className="bg-bg-page border border-border p-[8px_12px] mb-[12px] flex items-center justify-between gap-[10px] flex-wrap">
                <div className="flex flex-col gap-[3px]">
                    <span className="font-bold text-text-main">
                        {hasPattern
                            ? t('settings.pattern_status_enabled')
                            : t('settings.pattern_status_disabled')}
                    </span>
                    <span className="text-[10px] text-text-muted">
                        {t('settings.pattern_security_hint', { min: MIN_PATTERN_LENGTH })}
                    </span>
                </div>

                {mode === 'idle' && (
                    <div className="flex items-center gap-[8px]">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setMode('setup')}
                        >
                            {hasPattern
                                ? t('settings.pattern_change_btn')
                                : t('settings.pattern_enable_btn')}
                        </Button>
                        {hasPattern && (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={() => setMode('disable')}
                            >
                                {t('settings.pattern_disable_btn')}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {mode === 'setup' && (
                <form onSubmit={handleSavePattern} className="flex flex-col gap-[12px]">
                    <PatternGrid
                        selectedIndices={pattern}
                        onChange={setPattern}
                        disabled={loading}
                    />

                    <label className="flex items-center gap-[6px] cursor-pointer text-[11px] text-text-main">
                        <input
                            type="checkbox"
                            checked={preferredMethod === 'pattern'}
                            onChange={(e) =>
                                setPreferredMethod(e.target.checked ? 'pattern' : 'password')
                            }
                            className="m-0 w-[13px] h-[13px] accent-theme-link cursor-pointer"
                        />
                        <span>{t('auth.set_pattern_as_default')}</span>
                    </label>

                    <Input
                        type="password"
                        label={t('settings.account_password')}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="********"
                    />

                    <div className="flex justify-end gap-[8px]">
                        <Button type="button" variant="secondary" onClick={resetLocal} disabled={loading}>
                            {t('action.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                loading ||
                                pattern.length < MIN_PATTERN_LENGTH ||
                                !currentPassword
                            }
                        >
                            {loading ? t('action.saving') : t('action.save')}
                        </Button>
                    </div>
                </form>
            )}

            {mode === 'disable' && (
                <form onSubmit={handleDisablePattern} className="flex flex-col gap-[12px]">
                    <Input
                        type="password"
                        label={t('settings.account_password')}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="********"
                    />
                    <div className="flex justify-end gap-[8px]">
                        <Button type="button" variant="secondary" onClick={resetLocal} disabled={loading}>
                            {t('action.cancel')}
                        </Button>
                        <Button type="submit" variant="danger" disabled={loading || !currentPassword}>
                            {loading ? t('common.processing') : t('settings.pattern_disable_btn')}
                        </Button>
                    </div>
                </form>
            )}
        </div>
    );
}