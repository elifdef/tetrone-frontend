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

    if (isLoading) return <div className="text-[11px] text-text-muted italic p-[20px] text-center">{t('common.loading')}</div>;

    const currentSession = sessions.find(s => s.is_current);
    const otherSessions = sessions.filter(s => !s.is_current);

    const renderSessionCard = (session, isCurrent = false) => {
        const { OsIcon } = parseUserAgent(session.device.raw_user_agent);

        const isApiToken = session.device.client_type?.includes('Script') ||
            session.device.client_type?.includes('Application') ||
            session.device.client_type?.includes('cURL') ||
            session.device.client_type?.includes('Postman');

        return (
            <div key={session.id} className={`flex items-center gap-[15px] p-[8px_12px] bg-bg-page border border-border mt-[8px] max-md:flex-col max-md:items-start ${isCurrent ? 'bg-[rgba(91,155,213,0.05)] border-theme-link' : ''}`}>
                <div className="flex-shrink-0 w-[32px] h-[32px] flex items-center justify-center text-text-muted max-md:hidden">
                    <OsIcon className="w-[64px] h-[64px] fill-current" title={session.device.os} />
                </div>

                <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
                    <div className="text-[11px] font-bold text-theme-link flex items-center gap-[8px]">
                        {session.name || session.device.client_type}
                        {isCurrent && <span className="border border-theme-success text-theme-success text-[9px] px-[3px] py-[1px]">{t('settings.current_session_badge')}</span>}
                        {isApiToken && <span className="border border-[#e5a43b] text-[#e5a43b] text-[9px] px-[3px] py-[1px]">{t('settings.api_token_badge')}</span>}
                    </div>

                    <div className="text-[10px] text-text-muted flex items-center gap-[6px] flex-wrap">
                        <span className="font-mono bg-transparent text-text-main">{session.ip_address}</span>
                        <span>•</span>
                        <span>{session.location}</span>
                        <span>•</span>
                        {isCurrent ? (
                            <span className="font-bold text-theme-success">{t('common.online')}</span>
                        ) : (
                            <span>{formatDate(session.last_used_at)}</span>
                        )}
                    </div>

                    <div className="text-[10px] text-text-muted whitespace-nowrap overflow-hidden text-ellipsis" title={session.device.raw_user_agent}>
                        {session.device.browser !== 'Unknown' ? `${session.device.browser} • ` : ''}
                        {session.device.os !== 'Unknown' ? session.device.os : session.device.client_type}
                    </div>
                </div>

                {!isCurrent && (
                    <div className="max-md:w-full">
                        <Button
                            variant="danger"
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={isActionLoading}
                            title={t('action.close')}
                        >
                            {t('action.close')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-[15px]">
            <div className="mb-[5px]">
                <h3 className="m-0 mb-[5px] text-[12px] font-bold text-theme-link border-b border-border pb-[5px]">{t('settings.sessions')}</h3>
                <p className="m-0 text-[11px] text-text-muted">{t('settings.sessions_desc')}</p>
            </div>

            {/* Блок створення API Токена */}
            <div className="bg-bg-box border border-border">
                <div className="bg-bg-page border-b border-border p-[6px_10px]">
                    <strong className="text-[11px] text-text-main font-bold">{t('settings.create_api_token')}</strong>
                </div>
                <div className="p-[10px_15px]">
                    <p className="m-0 mb-[8px] text-[11px] text-text-muted">{t('settings.api_token_desc')}</p>

                    <form onSubmit={handleCreateApiToken} className="flex gap-[10px] items-center mb-[10px]">
                        <input
                            type="text"
                            className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] flex-1 outline-none focus:border-theme-link"
                            placeholder={t('settings.api_token_placeholder')}
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            maxLength={64}
                            disabled={isActionLoading}
                        />
                        <Button type="submit" disabled={isActionLoading || !newTokenName.trim()}>
                            {t('action.create')}
                        </Button>
                    </form>

                    {createdToken && (
                        <div className="mt-[15px] border border-theme-success bg-[rgba(59,140,74,0.05)]">
                            <div className="bg-theme-success text-white p-[6px_10px] text-[11px] font-bold">
                                {t('settings.your_new_token')}
                            </div>
                            <div className="p-[10px_15px]">
                                <input
                                    type="text"
                                    className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] w-full outline-none cursor-text font-mono"
                                    value={createdToken}
                                    readOnly
                                    onClick={(e) => e.target.select()}
                                />
                                <p className="m-0 mt-[8px] text-[10px] text-theme-error font-bold">{t('settings.copy_token_warning')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Поточна сесія */}
            <div className="bg-bg-box border border-border">
                <div className="bg-bg-page border-b border-border p-[6px_10px]">
                    <strong className="text-[11px] text-text-main font-bold">{t('settings.current_device')}</strong>
                </div>
                <div className="p-[10px_15px]">
                    {currentSession && renderSessionCard(currentSession, true)}
                </div>
            </div>

            {/* Інші сесії */}
            {otherSessions.length > 0 && (
                <div className="bg-bg-box border border-border mb-0">
                    <div className="bg-bg-page border-b border-border p-[6px_10px] flex justify-between items-center">
                        <strong className="text-[11px] text-text-main font-bold">{t('settings.other_devices')}</strong>
                        <Button
                            variant="danger"
                            onClick={handleRevokeAllOther}
                            disabled={isActionLoading}
                        >
                            {t('settings.terminate_all')}
                        </Button>
                    </div>

                    <div className="p-[10px_15px]">
                        <div className="flex flex-col gap-[8px]">
                            {otherSessions.map(session => renderSessionCard(session))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}