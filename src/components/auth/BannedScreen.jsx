import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../../context/AuthContext';
import AppealService from '../../services/appeal.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Button from "../ui/Button.jsx";

export const BannedScreen = () =>
{
    const { user, logout } = useContext(AuthContext);
    const { t } = useTranslation();

    const [isAppealing, setIsAppealing] = useState(false);
    const [appealText, setAppealText] = useState('');
    const [hasPendingAppeal, setHasPendingAppeal] = useState(false);
    const [isLoadingStatus, setIsLoadingStatus] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() =>
    {
        if (!user)
        {
            return;
        }

        const checkStatus = async () =>
        {
            try
            {
                const res = await AppealService.checkStatus();
                if (res && res.code === 'SUCCESS')
                {
                    setHasPendingAppeal(res.has_pending_appeal || false);
                }
            } catch (error)
            {
                console.log(error)
            } finally
            {
                setIsLoadingStatus(false);
            }
        };

        checkStatus();
    }, [user]);

    const handleAppealSubmit = async () =>
    {
        if (!appealText.trim())
        {
            return;
        }
        setIsSubmitting(true);

        try
        {
            const res = await AppealService.submitAppeal(appealText);

            if (res && res.code === 'APPEAL_SUBMITTED')
            {
                notifySuccess(t('banned.appeal_success'));
                setHasPendingAppeal(true);
                setIsAppealing(false);
            }
            else
            {
                notifyError(t('banned.appeal_error'));
            }
        } catch (error)
        {
            notifyError(t('banned.appeal_error'));
        } finally
        {
            setIsSubmitting(false);
        }
    };

    if (!user)
    {
        return null;
    }

    return (
        <div className="tetrone-banned-page">
            <div className="tetrone-banned-box">
                <div className="tetrone-banned-header">
                    { t('banned.title') }
                </div>

                <div className="tetrone-banned-content">
                    <div className="tetrone-banned-message">
                        { t('banned.message', {
                            name: user.first_name,
                            username: user.username
                        }) }
                    </div>

                    <div className="tetrone-banned-reason-wrap">
                        <div className="tetrone-banned-reason-label">
                            { t('banned.reason_label') }:
                        </div>
                        <div className="tetrone-banned-reason-text">
                            { user.ban_reason || t('banned.reason_not_specified') }
                        </div>
                    </div>

                    { isLoadingStatus ? (
                        <div className="tetrone-empty-state-compact">{ t('common.loading') }</div>
                    ) : (
                        <div className="tetrone-banned-actions">
                            { hasPendingAppeal ? (
                                <div className="tetrone-banned-info-box">
                                    { t('banned.appeal_pending') }
                                </div>
                            ) : (
                                <>
                                    { isAppealing ? (
                                        <div className="tetrone-banned-form">
                                            <div className="tetrone-banned-form-title">
                                                { t('banned.appeal_form_title') }:
                                            </div>
                                            <textarea
                                                className="tetrone-form-textarea tetrone-banned-textarea"
                                                value={ appealText }
                                                onChange={ (e) => setAppealText(e.target.value) }
                                                placeholder={ t('banned.appeal_placeholder') }
                                                disabled={ isSubmitting }
                                            />
                                            <div className="tetrone-banned-buttons">
                                                <Button
                                                    variant={ "primary" }
                                                    onClick={ handleAppealSubmit }
                                                    disabled={ isSubmitting || !appealText.trim() }
                                                >
                                                    { isSubmitting ? t('action.saving') : t('action.submit') }
                                                </Button>
                                                <Button
                                                    variant={ "reject" }
                                                    onClick={ () => setIsAppealing(false) }
                                                    disabled={ isSubmitting }
                                                >
                                                    { t('action.cancel') }
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="tetrone-banned-buttons">
                                            <Button
                                                variant={ "primary" }
                                                onClick={ () => setIsAppealing(true) }
                                            >
                                                { t('banned.appeal_btn') }
                                            </Button>
                                            <Button
                                                variant={ "secondary" }
                                                onClick={ logout }
                                            >
                                                { t('action.logout') }
                                            </Button>
                                        </div>
                                    ) }
                                </>
                            ) }
                        </div>
                    ) }
                </div>
            </div>
        </div>
    );
};