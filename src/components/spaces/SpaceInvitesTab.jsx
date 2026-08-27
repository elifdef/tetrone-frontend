import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { notifyError, notifySuccess } from '../common/Notify';
// Припускаємо, що ти додав ці методи в space.service.js:
// getInvites(username), createInvite(username, data), revokeInvite(username, token), revokeOthers(username, token)

const SpaceInvitesTab = () => {
    const { t } = useTranslation();
    const { space, isAdmin } = useContext(SpaceContext);

    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // Форма створення
    const [maxUses, setMaxUses] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [targetUsername, setTargetUsername] = useState('');

    const fetchInvites = useCallback(async () => {
        setLoading(true);
        try {
            const res = await SpaceService.getInvites(space.username);
            if (res.invites) {
                setInvites(res.invites);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [space.username]);

    useEffect(() => {
        if (isAdmin) fetchInvites();
    }, [isAdmin, fetchInvites]);

    const handleCreate = async (e) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            const payload = {};
            if (maxUses) payload.max_uses = parseInt(maxUses, 10);
            if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();
            if (targetUsername) payload.target_username = targetUsername;

            const res = await SpaceService.createInvite(space.username, payload);
            if (res.invite) {
                setInvites([res.invite, ...invites]);
                setMaxUses('');
                setExpiresAt('');
                setTargetUsername('');
                notifySuccess(t('spaces.invite_created'));
            }
        } catch (error) {
            notifyError(error.response?.data?.message || t('error.server'));
        } finally {
            setIsCreating(false);
        }
    };

    const handleRevoke = async (token) => {
        if (!window.confirm(t('common.confirm_action'))) return;
        try {
            await SpaceService.revokeInvite(space.username, token);
            setInvites(invites.filter(inv => inv.token !== token));
            notifySuccess(t('spaces.invite_revoked'));
        } catch (error) {
            console.error(error);
        }
    };

    const handleCopy = (token) => {
        const link = `${window.location.origin}/join/${token}`;
        navigator.clipboard.writeText(link);
        notifySuccess(t('common.copied'));
    };

    if (!isAdmin) return null;

    return (
        <div className="flex flex-col gap-[15px]">
            {/* Форма створення інвайту */}
            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[8px_12px] text-[12px] font-bold border-b border-border">
                    {t('spaces.invites_create_title')}
                </div>
                <form className="p-[15px] flex flex-col gap-[15px]" onSubmit={handleCreate}>
                    <div className="grid grid-cols-3 gap-[10px] max-md:grid-cols-1">
                        <div>
                            <label className="block font-bold text-[11px] mb-[6px] text-text-muted">
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
                            <label className="block font-bold text-[11px] mb-[6px] text-text-muted">
                                {t('spaces.invite_expires_at')}
                            </label>
                            <Input
                                type="datetime-local"
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block font-bold text-[11px] mb-[6px] text-text-muted">
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

            {/* Список активних інвайтів */}
            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[8px_12px] text-[12px] font-bold border-b border-border">
                    {t('spaces.invites_active_list')}
                </div>
                <div className="p-[10px] flex flex-col gap-[10px]">
                    {loading ? (
                        <div className="text-center text-text-muted py-[20px]">{t('common.loading')}</div>
                    ) : invites.length === 0 ? (
                        <div className="text-center text-text-muted py-[20px]">{t('spaces.list_empty')}</div>
                    ) : (
                        invites.map(invite => (
                            <div key={invite.token} className="border border-border p-[10px] bg-bg-page flex justify-between items-center max-md:flex-col max-md:items-start max-md:gap-[10px]">
                                <div className="flex flex-col gap-[4px] text-[11px]">
                                    <div className="font-bold text-theme-link text-[12px]">
                                        {window.location.origin}/join/{invite.token}
                                    </div>
                                    <div className="text-text-muted">
                                        {t('spaces.invite_created_by')}: <span className="font-bold text-text-main">{invite.creator?.username || t('common.unknown')}</span>
                                    </div>
                                    <div className="text-text-muted">
                                        {t('spaces.invite_uses')}: {invite.uses_count} / {invite.max_uses || '∞'}
                                    </div>
                                    {invite.expires_at && (
                                        <div className="text-text-muted">
                                            {t('spaces.invite_expires')}: {new Date(invite.expires_at).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-[10px] shrink-0">
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