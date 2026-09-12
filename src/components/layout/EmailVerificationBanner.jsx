import React from 'react';
import {useEmailVerification} from '../../hooks/useEmailVerification';
import Button from '../ui/Button';

const EmailVerificationBanner = () =>
{
    const {user, loading, verifyStatus, statusMessage, handleResend, t} = useEmailVerification();

    if (!user || verifyStatus === 'hidden') return null;
    if (user.email_verified_at && verifyStatus !== 'success') return null;

    const baseClasses = "flex items-center justify-center text-center gap-[15px] p-[8px_12px] mb-[15px] border rounded-none text-[11px] font-tahoma w-full shadow-[inset_1px_1px_0_rgba(255,255,255,0.7)] dark:shadow-[inset_1px_1px_0_rgba(255,255,255,0.1)]";

    if (verifyStatus === 'verifying')
    {
        return (
            <div className={`${baseClasses} bg-staff-bg border-staff-border text-staff-text animate-pulse`}>
                <span className="font-bold">{statusMessage || t('banner.email.verifying')}</span>
            </div>
        );
    }

    if (verifyStatus === 'success')
    {
        return (
            <div className={`${baseClasses} bg-bg-box border-theme-success text-theme-success`}>
                <span className="font-bold">{statusMessage || t('banner.email.success')}</span>
            </div>
        );
    }

    if (verifyStatus === 'error')
    {
        return (
            <div className={`${baseClasses} bg-bg-box border-theme-error text-theme-error`}>
                <span className="font-bold">{statusMessage}</span>
            </div>
        );
    }

    return (
        <div className={`${baseClasses} bg-staff-bg border-staff-border text-staff-text`}>
            <span className="font-bold">
                {t('banner.email.text')}
            </span>
            <Button
                variant="warning"
                onClick={handleResend}
                disabled={loading}
            >
                {loading ? t('common.loading') : t('banner.email.send')}
            </Button>
        </div>
    );
};

export default EmailVerificationBanner;