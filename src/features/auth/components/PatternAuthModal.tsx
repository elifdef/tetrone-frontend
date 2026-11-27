import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import PatternGrid, { MIN_PATTERN_LENGTH } from './PatternGrid';

export interface PatternAuthModalProps {
    isOpen: boolean;
    mode?: 'login' | 'setup';
    identifier?: string;
    value: number[];
    onChange: (nextPattern: number[]) => void;
    onConfirm: (patternToSubmit: number[]) => void | Promise<void>;
    onClose: () => void;
    error?: string | null;
    isLocked?: boolean;
    isSubmitting?: boolean;
}

export default function PatternAuthModal({
    isOpen,
    mode = 'login',
    identifier,
    value,
    onChange,
    onConfirm,
    onClose,
    error = null,
    isLocked = false,
    isSubmitting = false,
}: PatternAuthModalProps) {
    const { t } = useTranslation();
    const [stealthMode, setStealthMode] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isSubmitting) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isSubmitting, onClose]);

    if (!isOpen) return null;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (isLocked || isSubmitting || value.length < MIN_PATTERN_LENGTH) return;
        await onConfirm(value);
    };

    const isReady = value.length >= MIN_PATTERN_LENGTH && !isLocked && !isSubmitting;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pattern-auth-modal-title"
            className="fixed inset-0 z-[999] bg-black/50 flex items-center justify-center p-[15px] font-tahoma text-[11px]"
            onClick={() => {
                if (!isSubmitting) onClose();
            }}
        >
            <div
                className="w-full max-w-[360px] bg-bg-box border border-border shadow-[0_4px_16px_rgba(0,0,0,0.2)] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link py-[8px] px-[12px] flex items-center justify-between gap-[8px]">
                    <h2
                        id="pattern-auth-modal-title"
                        className="text-[12px] font-bold text-theme-link m-0"
                    >
                        {mode === 'setup'
                            ? t('auth.pattern_modal_setup_title')
                            : t('auth.pattern_modal_login_title')}
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        aria-label={t('action.close')}
                        className="bg-transparent border-0 text-text-muted hover:text-text-main font-bold text-[12px] leading-none cursor-pointer px-[4px]"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-[14px] flex flex-col gap-[12px]">
                    {identifier && (
                        <div className="bg-bg-page border border-border px-[10px] py-[6px] flex items-center justify-between gap-[8px]">
                            <span className="text-[10px] text-text-muted">
                                {t('auth.signing_in_as')}
                            </span>
                            <span className="text-[11px] font-bold text-text-main truncate">
                                {identifier}
                            </span>
                        </div>
                    )}

                    <p className="m-0 text-[11px] text-text-muted leading-[1.4]">
                        {mode === 'setup'
                            ? t('auth.pattern_modal_setup_desc')
                            : t('auth.pattern_modal_login_desc')}
                    </p>

                    {isLocked && (
                        <div className="bg-[rgba(255,51,71,0.08)] border border-theme-error p-[8px] text-[10px] text-theme-error leading-[1.4]">
                            {t('auth.pattern_locked_fallback_hint')}
                        </div>
                    )}

                    <PatternGrid
                        selectedIndices={value}
                        onChange={onChange}
                        hasError={Boolean(error) || isLocked}
                        disabled={isSubmitting || isLocked}
                        stealthMode={stealthMode}
                        onStealthModeChange={setStealthMode}
                    />

                    {error && (
                        <div className="bg-[rgba(255,51,71,0.1)] text-theme-error border border-[rgba(255,51,71,0.3)] p-[8px] text-[11px] text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-[8px] pt-[6px] border-t border-border">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            {t('action.cancel')}
                        </Button>
                        <Button type="submit" disabled={!isReady}>
                            {isSubmitting
                                ? t('common.loading')
                                : mode === 'setup'
                                  ? t('action.save')
                                  : t('action.login')}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}