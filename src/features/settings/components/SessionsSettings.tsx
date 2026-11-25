import { useState, useEffect, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import AuthService from '@/services/auth.service';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { useModal } from '@/context/ModalContext';
import { parseUserAgent } from '@/utils/userAgent';
import Button from '@/components/ui/Button';
import type { UserSession } from '../types/settings';

const resolveDisplaySessionTitle = (session: UserSession, browser: string, os: string): string => {
    if (session.name && session.name !== 'auth_token') {
        return session.name;
    }
    const cleanBrowser = browser !== 'Unknown Browser' ? browser : null;
    const cleanOs = os !== 'Unknown OS' ? os : null;

    if (cleanBrowser && cleanOs) return `${cleanBrowser} • ${cleanOs}`;
    return cleanBrowser || cleanOs || session.device.client_type || 'Web Session';
};

const isSessionApiToken = (session: UserSession): boolean => {
    if (typeof session.is_api_token === 'boolean') return session.is_api_token;
    return (
        session.device.client_type?.includes('Script') ||
        session.device.client_type?.includes('Application') ||
        session.device.client_type?.includes('cURL') ||
        session.device.client_type?.includes('Postman') ||
        false
    );
};

export default function SessionsSettings() {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { openConfirm } = useModal();

    const [sessions, setSessions] = useState<UserSession[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [newTokenName, setNewTokenName] = useState('');
    const [createdToken, setCreatedToken] = useState<string | null>(null);
    const [copiedToken, setCopiedToken] = useState(false);

    useEffect(() => {
        let isMounted = true;

        const load = async () => {
            const res = await AuthService.getSessions();
            if (!isMounted) return;
            if (res?.ok) {
                setSessions(res.sessions || []);
            } else {
                notifyError(t('error.load_failed'));
            }
            setIsLoading(false);
        };

        void load();

        return () => {
            isMounted = false;
        };
    }, [t]);

    const handleRevokeSession = async (tokenId: number) => {
        const confirmed = await openConfirm(t('action.are_u_sure'));
        if (!confirmed) return;

        setIsActionLoading(true);
        const res = await AuthService.revokeSession(tokenId);
        if (res?.ok) {
            notifySuccess(t(`api.${res.code}`));
            setSessions((prev) => prev.filter((s) => s.id !== tokenId));
        } else {
            notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
        }
        setIsActionLoading(false);
    };

    const handleRevokeAllOther = async () => {
        const confirmed = await openConfirm(t('action.are_u_sure'));
        if (!confirmed) return;

        setIsActionLoading(true);
        const res = await AuthService.revokeAllOtherSessions();
        if (res?.ok) {
            notifySuccess(t(`api.${res.code}`));
            setSessions((prev) => prev.filter((s) => s.is_current));
        } else {
            notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
        }
        setIsActionLoading(false);
    };

    const handleCreateApiToken = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!newTokenName.trim() || isActionLoading) return;

        setIsActionLoading(true);
        const res = await AuthService.createApiToken({ token_name: newTokenName.trim() });
        if (res?.ok && res.token) {
            notifySuccess(t(`api.${res.code}`));
            setCreatedToken(res.token);
            setCopiedToken(false);
            setNewTokenName('');

            if (res.session) {
                setSessions((prev) => [res.session!, ...prev]);
            } else {
                const listRes = await AuthService.getSessions();
                if (listRes?.ok) {
                    setSessions(listRes.sessions || []);
                }
            }
        } else {
            notifyError(t(`api.error.${res?.code || 'ERR_UNKNOWN'}`));
        }
        setIsActionLoading(false);
    };

    const handleCopyToken = async () => {
        if (!createdToken) return;
        try {
            await navigator.clipboard.writeText(createdToken);
            setCopiedToken(true);
            setTimeout(() => setCopiedToken(false), 2500);
        } catch {
            // fallback handled by readonly input select
        }
    };

    if (isLoading) {
        return (
            <div className="text-[11px] text-text-muted italic p-[20px] text-center">
                {t('common.loading')}
            </div>
        );
    }

    const currentSession = sessions.find((s) => s.is_current);
    const otherDeviceSessions = sessions.filter((s) => !s.is_current && !isSessionApiToken(s));
    const apiTokens = sessions.filter((s) => !s.is_current && isSessionApiToken(s));

    const renderDeviceSessionRow = (session: UserSession, isCurrent = false) => {
        const { OsIcon, os, browser } = parseUserAgent(session.device.raw_user_agent);
        const displayTitle = resolveDisplaySessionTitle(session, browser, os);
        const osLabel = session.device.os !== 'Unknown' ? session.device.os : os;
        const browserLabel =
            session.device.browser !== 'Unknown' ? session.device.browser : browser;

        return (
            <div
                key={session.id}
                className={`flex items-center justify-between gap-[12px] p-[10px_12px] border transition-colors max-md:flex-col max-md:items-start ${
                    isCurrent
                        ? 'bg-theme-link/5 border-theme-link border-l-[3px]'
                        : 'bg-bg-page border-border hover:border-theme-link/60'
                }`}
            >
                <div className="flex items-center gap-[12px] min-w-0 flex-1">
                    <div className="w-[34px] h-[34px] shrink-0 bg-bg-box border border-border flex items-center justify-center text-text-muted">
                        <OsIcon className="w-[18px] h-[18px] fill-current" />
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col gap-[4px]">
                        <div className="flex items-center gap-[8px] flex-wrap">
                            <span className="text-[11px] font-bold text-theme-link truncate">
                                {displayTitle}
                            </span>

                            {isCurrent ? (
                                <span className="border border-theme-success bg-theme-success/10 text-theme-success text-[9px] font-bold px-[4px] py-[1px] uppercase">
                                    {t('settings.current_session_badge')}
                                </span>
                            ) : (
                                <span className="text-[10px] text-text-muted">
                                    • {session.last_used_at ? formatDate(session.last_used_at) : formatDate(session.created_at)}
                                </span>
                            )}
                        </div>

                        <div className="text-[10px] text-text-muted flex items-center gap-[6px] flex-wrap">
                            <span className="font-mono bg-bg-box border border-border px-[4px] py-[1px] text-text-main">
                                {session.ip_address}
                            </span>
                            <span>•</span>
                            <span>{session.location}</span>
                            {isCurrent && (
                                <>
                                    <span>•</span>
                                    <span className="font-bold text-theme-success">
                                        {t('common.online')}
                                    </span>
                                </>
                            )}
                        </div>

                        <div
                            className="text-[10px] text-text-muted truncate"
                            title={session.device.raw_user_agent || undefined}
                        >
                            {browserLabel} • {osLabel}
                            {session.device.client_type ? ` (${session.device.client_type})` : ''}
                        </div>
                    </div>
                </div>

                {!isCurrent && (
                    <div className="shrink-0 max-md:w-full">
                        <Button
                            variant="danger"
                            onClick={() => handleRevokeSession(session.id)}
                            disabled={isActionLoading}
                            className="max-md:w-full"
                        >
                            {t('settings.terminate_session')}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-[15px] font-tahoma text-[11px] text-text-main">
            {/* Заголовок + зведена статистика активних сесій */}
            <div className="bg-bg-page border border-border p-[10px_12px] flex justify-between items-center gap-[10px] max-md:flex-col max-md:items-start">
                <div>
                    <h3 className="m-0 mb-[3px] text-[12px] font-bold text-theme-link">
                        {t('settings.sessions')}
                    </h3>
                    <p className="m-0 text-[11px] text-text-muted">{t('settings.sessions_desc')}</p>
                </div>
                <div className="shrink-0 text-[10px] font-bold text-text-main bg-bg-box border border-border px-[8px] py-[4px]">
                    {t('settings.active_sessions_count', {
                        count: (currentSession ? 1 : 0) + otherDeviceSessions.length,
                    })}
                </div>
            </div>

            {/* Поточний пристрій */}
            {currentSession && (
                <div className="bg-bg-box border border-border">
                    <div className="bg-bg-page border-b border-border p-[6px_12px] flex items-center justify-between">
                        <strong className="text-[11px] text-text-main font-bold">
                            {t('settings.current_device')}
                        </strong>
                        <span className="text-[10px] text-text-muted">
                            {t('settings.started_at')}: {formatDate(currentSession.created_at)}
                        </span>
                    </div>
                    <div className="p-[10px_12px]">
                        {renderDeviceSessionRow(currentSession, true)}
                    </div>
                </div>
            )}

            {/* Інші активні пристрої */}
            <div className="bg-bg-box border border-border">
                <div className="bg-bg-page border-b border-border p-[6px_12px] flex justify-between items-center gap-[10px]">
                    <strong className="text-[11px] text-text-main font-bold">
                        {t('settings.other_devices')} ({otherDeviceSessions.length})
                    </strong>
                    {otherDeviceSessions.length > 0 && (
                        <Button
                            variant="danger"
                            onClick={handleRevokeAllOther}
                            disabled={isActionLoading}
                        >
                            {t('settings.terminate_all')}
                        </Button>
                    )}
                </div>

                <div className="p-[10px_12px]">
                    {otherDeviceSessions.length > 0 ? (
                        <div className="flex flex-col gap-[8px]">
                            {otherDeviceSessions.map((session) => renderDeviceSessionRow(session))}
                        </div>
                    ) : (
                        <div className="text-[11px] text-text-muted italic py-[8px] text-center">
                            {t('settings.no_other_sessions')}
                        </div>
                    )}
                </div>
            </div>

            {/* Персональні API-токени */}
            <div className="bg-bg-box border border-border">
                <div className="bg-bg-page border-b border-border p-[6px_12px] flex justify-between items-center">
                    <strong className="text-[11px] text-text-main font-bold">
                        {t('settings.api_tokens_section')} ({apiTokens.length})
                    </strong>
                    <span className="border border-[#e5a43b] text-[#e5a43b] text-[9px] font-bold px-[4px] py-[1px] uppercase">
                        API
                    </span>
                </div>

                <div className="p-[10px_12px] flex flex-col gap-[12px]">
                    <p className="m-0 text-[11px] text-text-muted">{t('settings.api_token_desc')}</p>

                    <form onSubmit={handleCreateApiToken} className="flex gap-[8px] items-center">
                        <input
                            type="text"
                            className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] flex-1 outline-none focus:border-theme-link"
                            placeholder={t('settings.api_token_placeholder')}
                            value={newTokenName}
                            onChange={(e) => setNewTokenName(e.target.value)}
                            maxLength={64}
                            disabled={isActionLoading}
                        />
                        <Button
                            type="submit"
                            disabled={isActionLoading || !newTokenName.trim()}
                        >
                            {t('action.create')}
                        </Button>
                    </form>

                    {createdToken && (
                        <div className="border border-theme-success bg-theme-success/5">
                            <div className="bg-theme-success text-white p-[5px_10px] text-[11px] font-bold flex justify-between items-center">
                                <span>{t('settings.your_new_token')}</span>
                                <button
                                    type="button"
                                    onClick={() => setCreatedToken(null)}
                                    className="bg-transparent border-none text-white cursor-pointer text-[12px] leading-none"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="p-[10px_12px]">
                                <div className="flex gap-[6px] items-center">
                                    <input
                                        type="text"
                                        className="bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] flex-1 outline-none cursor-text font-mono"
                                        value={createdToken}
                                        readOnly
                                        onClick={(e) => e.currentTarget.select()}
                                    />
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={handleCopyToken}
                                    >
                                        {copiedToken ? t('action.copied') : t('action.copy')}
                                    </Button>
                                </div>
                                <p className="m-0 mt-[6px] text-[10px] text-theme-error font-bold">
                                    {t('settings.copy_token_warning')}
                                </p>
                            </div>
                        </div>
                    )}

                    {apiTokens.length > 0 && (
                        <div className="flex flex-col gap-[6px] pt-[6px] border-t border-dashed border-border">
                            {apiTokens.map((token) => (
                                <div
                                    key={token.id}
                                    className="flex items-center justify-between gap-[10px] p-[8px_10px] bg-bg-page border border-border max-md:flex-col max-md:items-start"
                                >
                                    <div className="flex flex-col gap-[3px] min-w-0">
                                        <div className="flex items-center gap-[6px]">
                                            <span className="border border-[#e5a43b] text-[#e5a43b] text-[9px] px-[3px] py-[1px]">
                                                {t('settings.api_token_badge')}
                                            </span>
                                            <span className="font-bold text-[11px] text-text-main truncate">
                                                {token.name}
                                            </span>
                                        </div>
                                        <div className="text-[10px] text-text-muted">
                                            {t('settings.created_at')}: {formatDate(token.created_at)}
                                            {token.last_used_at &&
                                                ` • ${t('settings.last_used')}: ${formatDate(token.last_used_at)}`}
                                        </div>
                                    </div>

                                    <Button
                                        variant="danger"
                                        onClick={() => handleRevokeSession(token.id)}
                                        disabled={isActionLoading}
                                    >
                                        {t('action.revoke')}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}