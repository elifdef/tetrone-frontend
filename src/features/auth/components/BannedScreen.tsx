import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '@/context/AuthContext';
import AppealService from '@/services/appeal.service';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import Button from '@/components/ui/Button';

export const BannedScreen = () => {
    const { user, logout } = useContext(AuthContext);
    const { t } = useTranslation();

    const [isAppealing, setIsAppealing] = useState(false);
    const [appealText, setAppealText] = useState('');
    const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) return;

        let isActive = true;

        AppealService.checkStatus()
            .onSuccess((res) => {
                if (!isActive) return;
                if (res.code === 'SUCCESS') {
                    setHasPendingAppeal(Boolean(res.has_pending_appeal));
                }
            })
            .onFinally(() => {
                if (isActive) {
                    setIsLoadingStatus(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [user]);

    const handleAppealSubmit = () => {
        const trimmed = appealText.trim();
        if (!trimmed || isSubmitting) return;

        setIsSubmitting(true);

        AppealService.submitAppeal(trimmed)
            .onSuccess((res) => {
                if (res.code === 'APPEAL_SUBMITTED') {
                    notifySuccess(t('banned.appeal_success'));
                    setHasPendingAppeal(true);
                    setIsAppealing(false);
                    setAppealText('');
                } else {
                    notifyError(t('banned.appeal_error'));
                }
            })
            .onError(() => {
                notifyError(t('banned.appeal_error'));
            })
            .onFinally(() => {
                setIsSubmitting(false);
            });
    };

    if (!user) {
        return null;
    }

    const displayName = user.first_name?.trim() || user.username;

    return (
        <div className="min-h-screen bg-bg-page text-text-main font-tahoma text-[11px] flex items-center justify-center p-[15px]">
            <div className="w-full max-w-[440px] bg-bg-box border border-border shadow-[0_2px_8px_rgba(0,0,0,0.06)] overflow-hidden">
                <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-error py-[8px] px-[15px]">
                    <h1 className="text-[12px] font-bold text-theme-error m-0">
                        {t('banned.title')}
                    </h1>
                </div>

                <div className="p-[16px] flex flex-col gap-[12px]">
                    <p className="m-0 text-[11px] text-text-main leading-[1.45]">
                        {t('banned.message', {
                            name: displayName,
                            username: user.username,
                        })}
                    </p>

                    <div className="bg-bg-page border border-border p-[10px] flex flex-col gap-[4px]">
                        <span className="text-[10px] font-bold text-text-muted uppercase">
                            {t('banned.reason_label')}:
                        </span>
                        <div className="text-[11px] text-text-main leading-[1.4] break-words">
                            {user.ban_reason || t('banned.reason_not_specified')}
                        </div>
                    </div>

                    {isLoadingStatus ? (
                        <div className="py-[8px] text-center text-text-muted">
                            {t('common.loading')}
                        </div>
                    ) : (
                        <div className="pt-[4px] border-t border-border">
                            {hasPendingAppeal ? (
                                <div className="bg-bg-page border border-border p-[10px] text-center text-text-muted">
                                    {t('banned.appeal_pending')}
                                </div>
                            ) : isAppealing ? (
                                <div className="flex flex-col gap-[8px]">
                                    <label
                                        htmlFor="banned-appeal-textarea"
                                        className="text-[11px] font-bold text-text-main"
                                    >
                                        {t('banned.appeal_form_title')}:
                                    </label>
                                    <textarea
                                        id="banned-appeal-textarea"
                                        rows={4}
                                        className="w-full p-[6px] border border-input-border bg-input-bg text-text-main font-tahoma text-[11px] outline-none focus:border-theme-link resize-y box-border"
                                        value={appealText}
                                        onChange={(e) => setAppealText(e.target.value)}
                                        placeholder={t('banned.appeal_placeholder')}
                                        disabled={isSubmitting}
                                    />
                                    <div className="flex items-center gap-[8px]">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={handleAppealSubmit}
                                            disabled={isSubmitting || !appealText.trim()}
                                        >
                                            {isSubmitting ? t('action.saving') : t('action.submit')}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="reject"
                                            onClick={() => setIsAppealing(false)}
                                            disabled={isSubmitting}
                                        >
                                            {t('action.cancel')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-[8px] flex-wrap">
                                    <Button
                                        type="button"
                                        variant="primary"
                                        onClick={() => setIsAppealing(true)}
                                    >
                                        {t('banned.appeal_btn')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => void logout()}
                                    >
                                        {t('action.logout')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BannedScreen;