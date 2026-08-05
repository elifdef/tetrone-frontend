import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthService from '../../services/auth.service';
import { notifySuccess, notifyError } from '../common/Notify';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useModal } from '../../context/ModalContext';
import { parseUserAgent } from '../../utils/userAgent';
import Button from '../ui/Button';

export default function SessionsSettings() {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { openConfirm } = useModal();
    const [sessions, setSessions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [newTokenName, setNewTokenName] = useState('');
    const [createdToken, setCreatedToken] = useState(null);

    const fetchSessions = async () => {
        setIsLoading(true);
        const res = await AuthService.getSessions();
        if (res) {
            setSessions(res.sessions);
        } else {
            notifyError(t('error.load_failed'));
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (tokenId) => {
        const confirmed = await openConfirm(t('action.are_u_sure'));
        if (!confirmed) return;

        setIsActionLoading(true);
        const res = await AuthService.revokeSession(tokenId);
        if (res) {
            notifySuccess(t(`api.${res.code}`));
            setSessions(prev => prev.filter(s => s.id !== tokenId));
        } else {
            notifyError(t('error.delete_failed'));
        }
        setIsActionLoading(false);
    };

    const handleRevokeAllOther = async () => {
        const confirmed = await openConfirm(t('action.are_u_sure'));
        if (!confirmed) return;

        setIsActionLoading(true);
        const res = await AuthService.revokeAllOtherSessions();
        if (res) {
            notifySuccess(t(`api.${res.code}`));
            setSessions(prev => prev.filter(s => s.is_current));
        } else {
            notifyError(t('error.delete_failed'));
        }
        setIsActionLoading(false);
    };

    const handleCreateApiToken = async (e) => {
        e.preventDefault();
        if (!newTokenName.trim()) return;

        setIsActionLoading(true);
        const res = await AuthService.createApiToken({ token_name: newTokenName });
        if (res && res.token) {
            notifySuccess(t(`api.${res.code}`));
            setCreatedToken(res.token);
            setNewTokenName('');
            fetchSessions();
        } else {
            notifyError(t('error.create_failed'));
        }
        setIsActionLoading(false);
    };

    if (isLoading) return <div className="tetrone-loading">{t('common.loading')}</div>;

    const currentSession = sessions.find(s => s.is_current);
    const otherSessions = sessions.filter(s => !s.is_current);

    const renderSessionCard = (session, isCurrent = false) => {
        const { OsIcon } = parseUserAgent(session.device.raw_user_agent);

        const isApiToken = session.device.client_type?.includes('Script') ||
            session.device.client_type?.includes('Application') ||
            session.device.client_type?.includes('cURL') ||
            session.device.client_type?.includes('Postman');

        return (
            <div key={session.id} className={`tetrone-session-card ${isCurrent ? 'current' : ''}`}>
                <div className="tetrone-session-icon-wrapper">
                    <OsIcon className="tetrone-session-icon-svg" title={session.device.os} />
                </div>

                <div className="tetrone-session-info">
                    <div className="tetrone-session-device">
                        {session.name || session.device.client_type}
                        {isCurrent && <span className="tetrone-session-badge">{t('settings.current_session_badge')}</span>}
                        {isApiToken && <span className="tetrone-session-badge tetrone-badge-api">{t('settings.api_token_badge')}</span>}
                    </div>

                    <div className="tetrone-session-meta">
                        <span className="tetrone-session-ip">{session.ip_address}</span>
                        <span className="tetrone-session-dot">•</span>
                        <span>{session.location}</span>
                        <span className="tetrone-session-dot">•</span>
                        {isCurrent ? (
                            <span className="tetrone-text-success">{t('common.online')}</span>
                        ) : (
                            <span>{formatDate(session.last_used_at)}</span>
                        )}
                    </div>

                    <div className="tetrone-session-ua" title={session.device.raw_user_agent}>
                        {session.device.browser !== 'Unknown' ? `${session.device.browser} • ` : ''}
                        {session.device.os !== 'Unknown' ? session.device.os : session.device.client_type}
                    </div>
                </div>

                {!isCurrent && (
                    <Button
                        variant={"danger"}
                        onClick={() => handleRevokeSession(session.id)}
                        disabled={isActionLoading}
                        title={t('action.close')}
                    >
                        {t('action.close')}
                    </Button>
                )}
            </div>
        );
    };

    return (
        <div className="tetrone-settings-form">
            <div className="tetrone-sessions-header">
                <h3 className="tetrone-sessions-main-title">{t('settings.sessions')}</h3>
                <p className="tetrone-sessions-desc">{t('settings.sessions_desc')}</p>
            </div>

            {/* Блок створення API Токена */}
            <div className="tetrone-settings-box">
                <div className="tetrone-sessions-section-header">
                    <strong className="tetrone-sessions-subtitle-clean">{t('settings.create_api_token')}</strong>
                </div>
                <div className="tetrone-sessions-box-content">
                    <p className="tetrone-settings-desc">{t('settings.api_token_desc')}</p>

                    <form onSubmit={handleCreateApiToken} className="tetrone-form-row tetrone-mt-8">
                        <div className="tetrone-form-group tetrone-token-input-group">
                            <input
                                type="text"
                                className="tetrone-form-input"
                                placeholder={t('settings.api_token_placeholder')}
                                value={newTokenName}
                                onChange={(e) => setNewTokenName(e.target.value)}
                                maxLength={64}
                                disabled={isActionLoading}
                            />
                        </div>
                        <div className="tetrone-form-group">
                            <Button type="submit" className="tetrone-btn" disabled={isActionLoading || !newTokenName.trim()}>
                                {t('action.create')}
                            </Button>
                        </div>
                    </form>

                    {createdToken && (
                        <div className="tetrone-settings-success-box tetrone-mt-15">
                            <div className="tetrone-settings-danger-header tetrone-bg-success">
                                {t('settings.your_new_token')}
                            </div>
                            <div className="tetrone-settings-danger-body tetrone-wrap">
                                <input
                                    type="text"
                                    className="tetrone-form-input tetrone-token-display"
                                    value={createdToken}
                                    readOnly
                                    onClick={(e) => e.target.select()}
                                />
                                <p className="tetrone-form-error tetrone-mt-8">{t('settings.copy_token_warning')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Поточна сесія */}
            <div className="tetrone-settings-box">
                <div className="tetrone-sessions-section-header">
                    <strong className="tetrone-sessions-subtitle-clean">{t('settings.current_device')}</strong>
                </div>
                <div className="tetrone-sessions-box-content">
                    {currentSession && renderSessionCard(currentSession, true)}
                </div>
            </div>

            {/* Інші сесії */}
            {otherSessions.length > 0 && (
                <div className="tetrone-settings-box tetrone-sessions-box-no-margin">
                    <div className="tetrone-sessions-section-header">
                        <strong className="tetrone-sessions-subtitle-clean">{t('settings.other_devices')}</strong>
                        <Button
                            variant={"danger"}
                            onClick={handleRevokeAllOther}
                            disabled={isActionLoading}
                        >
                            {t('settings.terminate_all')}
                        </Button>
                    </div>

                    <div className="tetrone-sessions-list">
                        {otherSessions.map(session => renderSessionCard(session))}
                    </div>
                </div>
            )}
        </div>
    );
}