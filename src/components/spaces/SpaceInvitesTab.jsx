import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { notifyError, notifySuccess } from '../common/Notify';

const SpaceInvitesTab = () => {
    const { t } = useTranslation();
    const { space, canManageInvites } = useContext(SpaceContext);

    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [maxUses, setMaxUses] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [targetUsername, setTargetUsername] = useState('');

    const fetchInvites = useCallback(() => {
        setLoading(true);
        SpaceService.getInvites(space.username)
            .onSuccess((res) => {
                if (res.invites) setInvites(res.invites);
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setLoading(false);
            });
    }, [space.username, t]);

    useEffect(() => {
        if (canManageInvites) fetchInvites();
    }, [canManageInvites, fetchInvites]);

    const handleCreate = (e) => {
        e.preventDefault();
        setIsCreating(true);

        const payload = {};
        if (maxUses) payload.max_uses = parseInt(maxUses, 10);
        if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
        if (targetUsername.trim()) payload.target_username = targetUsername.trim();

        SpaceService.createInvite(space.username, payload)
            .onSuccess((res) => {
                if (res.invite) {
                    setInvites(prev => [res.invite, ...prev]);
                    setMaxUses('');
                    setExpiresAt('');
                    setTargetUsername('');
                }
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setIsCreating(false);
            });
    };

    const handleRevoke = (token) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        SpaceService.revokeInvite(space.username, token)
            .onSuccess((res) => {
                setInvites(prev => prev.filter(inv => inv.token !== token));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const handleCopy = (token) => {
        const link = `${window.location.origin}/join/${token}`;
        navigator.clipboard.writeText(link);
        notifySuccess(t('common.copied'));
    };

    if (!canManageInvites) return null;

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                    {t('spaces.invites_create_title')}
                </div>
                <form className="p-[12px] flex flex-col gap-[12px]" onSubmit={handleCreate}>
                    <div className="grid grid-cols-3 gap-[10px] max-md:grid-cols-1">
                        <div>
                            <label className="block font-bold text-[11px] mb-[4px] text-text-muted">
                                {t('spaces.invite_max_uses')}
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={maxUses}
                                onChange={(e) => setMaxUses(e.target.value)}
                                placeholder={t('spaces.invite_unlimited')}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-[11px] mb-[4px] text-text-muted">
                                {t('spaces.invite_expires_at')}
                            </label>
                            <Input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-[11px] mb-[4px] text-text-muted">
                                {t('spaces.invite_target_user')}
                            </label>
                            <Input
                                type="text"
                                value={targetUsername}
                                onChange={(e) => setTargetUsername(e.target.value)}
                                placeholder={t('spaces.invite_any_user')}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isCreating}>
                            {isCreating ? t('common.loading') : t('action.create')}
                        </Button>
                    </div>
                </form>
            </div>

            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                    {t('spaces.invites_active_list')}
                </div>
                <div className="p-[10px] flex flex-col gap-[8px]">
                    {loading ? (
                        <div className="text-center text-text-muted py-[20px]">{t('common.loading')}</div>
                    ) : invites.length === 0 ? (
                        <div className="text-center text-text-muted py-[20px]">{t('spaces.list_empty')}</div>
                    ) : (
                        invites.map(invite => (
                            <div
                                key={invite.token}
                                className="border border-border p-[10px] bg-bg-page flex justify-between items-center gap-[10px] max-md:flex-col max-md:items-start"
                            >
                                <div className="flex flex-col gap-[4px] text-[11px] min-w-0">
                                    <div className="font-bold text-theme-link text-[12px] truncate">
                                        {window.location.origin}/join/{invite.token}
                                    </div>
                                    <div className="flex flex-wrap gap-x-[12px] gap-y-[2px] text-text-muted">
                                        <span>
                                            {t('spaces.invite_created_by')}:{' '}
                                            <strong className="text-text-main">
                                                {invite.creator?.username || t('common.unknown')}
                                            </strong>
                                        </span>
                                        <span>
                                            {t('spaces.invite_uses')}: {invite.uses_count} / {invite.max_uses || '∞'}
                                        </span>
                                        {invite.target_user && (
                                            <span>
                                                {t('spaces.invite_target_user')}:{' '}
                                                <strong className="text-theme-link">@{invite.target_user.username}</strong>
                                            </span>
                                        )}
                                    </div>
                                    {invite.expires_at && (
                                        <div className="text-text-muted">
                                            {t('spaces.invite_expires')}: {new Date(invite.expires_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-[6px] shrink-0">
                                    <Button variant="secondary" onClick={() => handleCopy(invite.token)}>
                                        {t('action.copy')}
                                    </Button>
                                    <Button variant="danger" onClick={() => handleRevoke(invite.token)}>
                                        {t('action.delete')}
                                    </Button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpaceInvitesTab;
