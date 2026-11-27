import { useState, useEffect } from 'react';
import type { TFunction } from 'i18next';
import Button from '@/components/ui/Button';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import AliasService from '@/services/alias.service';

export interface AddAliasFormProps {
    t: TFunction;
    onCancel: () => void;
    onSuccess: (newAlias: string) => void;
}

export default function AddAliasForm({ t, onCancel, onSuccess }: AddAliasFormProps) {
    const [inputValue, setInputValue] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
    const [backendError, setBackendError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleInputChange = (rawValue: string) => {
        const sanitized = rawValue.replace(/[^a-zA-Z0-9_]/g, '');
        setInputValue(sanitized);
        setIsAvailable(null);
        setBackendError('');
        setIsChecking(sanitized.length >= 3);
    };

    useEffect(() => {
        if (!inputValue || inputValue.length < 3) {
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            const res = await AliasService.checkUsernameAvailability(inputValue);
            if (cancelled) return;
            setIsChecking(false);

            if (res?.ok) {
                setIsAvailable(Boolean(res.available));
                if (!res.available) {
                    setBackendError(t('settings.username_taken'));
                }
            } else {
                setIsAvailable(false);
                setBackendError(t(`code.${res?.code || 'ERR_UNKNOWN'}`));
            }
        }, 500);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [inputValue, t]);

    const handleSubmit = async () => {
        if (!inputValue || isAvailable === false) return;
        setLoading(true);
        setBackendError('');

        const res = await AliasService.addAlias(inputValue);
        setLoading(false);

        if (res?.ok) {
            notifySuccess(t('settings.alias_added_success'));
            onSuccess(inputValue);
        } else {
            const errMsg = t(`code.${res?.code || 'ERR_UNKNOWN'}`);
            setBackendError(errMsg);
            notifyError(errMsg);
        }
    };

    const inputBorderColor =
        isAvailable === false
            ? 'border-theme-error'
            : isAvailable === true
              ? 'border-theme-success'
              : 'border-input-border';

    return (
        <>
            <div className="p-[15px] bg-bg-box">
                <p className="text-[12px] leading-[1.5] m-0 mb-[15px]">
                    {t('settings.add_alias_msg')}
                </p>

                <div className="relative w-full">
                    <input
                        type="text"
                        className={`w-full p-[6px] pr-[30px] border bg-input-bg text-text-main text-[11px] outline-none transition-colors ${inputBorderColor}`}
                        placeholder={t('settings.alias_placeholder')}
                        value={inputValue}
                        onChange={(e) => handleInputChange(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />
                    <div className="absolute right-[8px] top-1/2 -translate-y-1/2 flex items-center justify-center">
                        {isChecking && (
                            <span className="w-[12px] h-[12px] border-[2px] border-t-transparent border-theme-link rounded-full animate-spin" />
                        )}
                        {!isChecking && isAvailable === true && (
                            <span className="text-theme-success font-bold text-[12px]">✓</span>
                        )}
                        {!isChecking && isAvailable === false && (
                            <span className="text-theme-error font-bold text-[12px]">✖</span>
                        )}
                    </div>
                </div>
                {backendError && (
                    <div className="text-[10px] text-theme-error mt-[8px]">{backendError}</div>
                )}
            </div>

            <div className="bg-bg-page border-t border-border py-[10px] px-[15px] flex justify-end items-center gap-[10px]">
                <Button variant="secondary" onClick={onCancel} disabled={loading}>
                    {t('action.cancel')}
                </Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading || !inputValue || isAvailable === false || isChecking}
                >
                    {loading ? t('common.loading') : t('action.submit')}
                </Button>
            </div>
        </>
    );
}