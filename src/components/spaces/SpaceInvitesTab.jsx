import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '@/context/SpaceContext';
import SpaceService from '@/services/space.service';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import CustomSelect from '@/components/ui/CustomSelect';
import DateInput from '@/components/ui/DateInput';
import { notifyError, notifySuccess } from '@/components/common/Notify';

const FormRow = ({ label, description, children }) => (
    <div className="flex items-start p-[10px_12px] border-b border-border bg-bg-box gap-[15px] max-md:flex-col max-md:gap-[6px]">
        <div className="w-[190px] shrink-0 text-right max-md:w-full max-md:text-left">
            <div className="font-bold text-[11px] text-text-muted">{label}:</div>
            {description && (
                <div className="text-[10px] text-text-muted leading-[1.35] mt-[2px]">
                    {description}
                </div>
            )}
        </div>
        <div className="flex-1 w-full min-w-0">
            {children}
        </div>
    </div>
);

const SpaceInvitesTab = () => {
    const { t } = useTranslation();
    const { space, canManageInvites } = useContext(SpaceContext);

    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const [maxUses, setMaxUses] = useState('');
    const [expiresAt, setExpiresAt] = useState('');
    const [targetUsername, setTargetUsername] = useState('');
    const [assignRole, setAssignRole] = useState('member');
    const [minAccountAgeDays, setMinAccountAgeDays] = useState('');
    const [note, setNote] = useState('');
    const [autoApprove, setAutoApprove] = useState(false);
    const [requireVerifiedEmail, setRequireVerifiedEmail] = useState(false);

    const now = new Date();
    const currentYear = now.getFullYear();
    const todayIso = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

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
        if (expiresAt) {
            const [y, m, d] = expiresAt.split('-').map(Number);
            const endOfDay = new Date(y, m - 1, d, 23, 59, 59);
            payload.expires_at = endOfDay.toISOString().replace(/\.\d{3}Z$/, 'Z');
        }
        if (targetUsername.trim()) payload.target_username = targetUsername.trim();

        const rules = {};
        if (assignRole !== 'member') rules.assign_role = assignRole;
        if (autoApprove) rules.auto_approve = true;
        if (requireVerifiedEmail) rules.require_verified_email = true;
        if (minAccountAgeDays && parseInt(minAccountAgeDays, 10) > 0) {
            rules.min_account_age_days = parseInt(minAccountAgeDays, 10);
        }
        if (note.trim()) rules.note = note.trim();

        if (Object.keys(rules).length > 0) {
            payload.rules = rules;
        }

        SpaceService.createInvite(space.username, payload)
            .onSuccess((res) => {
                if (res.invite) {
                    setInvites(prev => [res.invite, ...prev]);
                    setMaxUses('');
                    setExpiresAt('');
                    setTargetUsername('');
                    setAssignRole('member');
                    setMinAccountAgeDays('');
                    setNote('');
                    setAutoApprove(false);
                    setRequireVerifiedEmail(false);
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

    const handleRevokeOthers = (keepToken) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        SpaceService.revokeOthers(space.username, keepToken)
            .onSuccess((res) => {
                setInvites(prev => prev.filter(inv => inv.token === keepToken));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const getInviteUrl = (token) => `${window.location.origin}/${space.username}?invite=${token}`;

    const handleCopy = (token) => {
        navigator.clipboard.writeText(getInviteUrl(token));
        notifySuccess(t('common.copied'));
    };

    if (!canManageInvites) return null;

    return (
        <div className="flex flex-col gap-[10px]">
            <form onSubmit={handleCreate} className="flex flex-col bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                    {t('spaces.invites_create_title')}
                </div>

                <FormRow label={t('spaces.invite_note')} description={t('spaces.invite_note_hint')}>
                    <Input
                        type="text"
                        maxLength={120}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder={t('spaces.invite_note_placeholder')}
                    />
                </FormRow>

                <FormRow label={t('spaces.invite_limits')} description={t('spaces.invite_limits_hint')}>
                    <div className="grid grid-cols-2 gap-[8px] max-md:grid-cols-1">
                        <div>
                            <label className="block text-[10px] text-text-muted mb-[3px]">
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
                            <label className="block text-[10px] text-text-muted mb-[3px]">
                                {t('spaces.invite_expires_at')}
                            </label>
                            <DateInput
                                value={expiresAt}
                                onChange={(e) => setExpiresAt(e.target.value)}
                                minYear={currentYear}
                                maxYear={currentYear + 10}
                                minDate={todayIso}
                            />
                        </div>
                    </div>
                </FormRow>

                <FormRow label={t('spaces.invite_target_user')} description={t('spaces.invite_target_user_hint')}>
                    <Input
                        type="text"
                        value={targetUsername}
                        onChange={(e) => setTargetUsername(e.target.value)}
                        placeholder={t('spaces.invite_any_user')}
                    />
                </FormRow>

                <FormRow label={t('spaces.invite_assign_role')} description={t('spaces.invite_assign_role_hint')}>
                    <CustomSelect
                        options={[
                            { value: 'member', label: t('spaces.role_member') },
                            { value: 'moderator', label: t('spaces.role_moderator') },
                            { value: 'admin', label: t('spaces.role_admin') }
                        ]}
                        value={assignRole}
                        onChange={setAssignRole}
                    />
                </FormRow>

                <FormRow label={t('spaces.invite_restrictions')} description={t('spaces.invite_restrictions_hint')}>
                    <div className="flex flex-col gap-[8px]">
                        <div className="max-w-[220px]">
                            <label className="block text-[10px] text-text-muted mb-[3px]">
                                {t('spaces.invite_min_account_age')}
                            </label>
                            <Input
                                type="number"
                                min="0"
                                max="3650"
                                value={minAccountAgeDays}
                                onChange={(e) => setMinAccountAgeDays(e.target.value)}
                                placeholder={t('spaces.invite_min_age_placeholder')}
                            />
                        </div>

                        <label className="flex items-center gap-[6px] cursor-pointer text-[11px] text-text-main">
                            <input
                                type="checkbox"
                                checked={autoApprove}
                                onChange={(e) => setAutoApprove(e.target.checked)}
                                className="accent-theme-link cursor-pointer"
                            />
                            <span>{t('spaces.invite_auto_approve')}</span>
                        </label>

                        <label className="flex items-center gap-[6px] cursor-pointer text-[11px] text-text-main">
                            <input
                                type="checkbox"
                                checked={requireVerifiedEmail}
                                onChange={(e) => setRequireVerifiedEmail(e.target.checked)}
                                className="accent-theme-link cursor-pointer"
                            />
                            <span>{t('spaces.invite_require_verified_email')}</span>
                        </label>
                    </div>
                </FormRow>

                <div className="p-[10px_12px] bg-bg-box flex justify-end">
                    <Button type="submit" variant="primary" disabled={isCreating}>
                        {isCreating ? t('common.loading') : t('action.create')}
                    </Button>
                </div>
            </form>

            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link flex justify-between items-center">
                    <span>{t('spaces.invites_active_list')}</span>
                    <span className="text-text-muted font-normal">{invites.length}</span>
                </div>

                <div className="p-[10px] flex flex-col gap-[8px]">
                    {loading ? (
                        <div className="text-center text-text-muted py-[20px]">{t('common.loading')}</div>
                    ) : invites.length === 0 ? (
                        <div className="text-center text-text-muted py-[20px]">{t('spaces.invites_empty')}</div>
                    ) : (
                        invites.map(invite => {
                            const rules = invite.rules || {};
                            const hasRoleBadge = rules.assign_role && rules.assign_role !== 'member';

                            return (
                                <div
                                    key={invite.token}
                                    className="border border-border p-[10px] bg-bg-page flex justify-between items-start gap-[10px] max-md:flex-col"
                                >
                                    <div className="flex flex-col gap-[5px] text-[11px] min-w-0 flex-1">
                                        {rules.note && (
                                            <div className="font-bold text-text-main text-[11px]">
                                                {rules.note}
                                            </div>
                                        )}

                                        <div className="font-bold text-theme-link text-[11px] truncate select-all">
                                            {getInviteUrl(invite.token)}
                                        </div>

                                        <div className="flex flex-wrap gap-[4px]">
                                            {hasRoleBadge && (
                                                <span className="px-[5px] py-[1px] bg-theme-header-bg border border-border text-theme-link text-[10px] font-bold">
                                                    {t(`spaces.role_${rules.assign_role}`)}
                                                </span>
                                            )}
                                            {rules.auto_approve && (
                                                <span className="px-[5px] py-[1px] bg-bg-box border border-border text-text-main text-[10px]">
                                                    {t('spaces.invite_badge_auto_approve')}
                                                </span>
                                            )}
                                            {rules.require_verified_email && (
                                                <span className="px-[5px] py-[1px] bg-bg-box border border-border text-text-main text-[10px]">
                                                    {t('spaces.invite_badge_verified_email')}
                                                </span>
                                            )}
                                            {Number(rules.min_account_age_days) > 0 && (
                                                <span className="px-[5px] py-[1px] bg-bg-box border border-border text-text-main text-[10px]">
                                                    {t('spaces.invite_badge_min_age', { days: rules.min_account_age_days })}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-x-[12px] gap-y-[2px] text-text-muted text-[10px]">
                                            <span>
                                                {t('spaces.invite_created_by')}:{' '}
                                                <strong className="text-text-main">
                                                    {invite.creator?.username || t('common.unknown')}
                                                </strong>
                                            </span>
                                            <span>
                                                {t('spaces.invite_uses')}: {invite.uses_count} / {invite.max_uses || t('spaces.invite_unlimited')}
                                            </span>
                                            {invite.target_user && (
                                                <span>
                                                    {t('spaces.invite_target_user')}:{' '}
                                                    <strong className="text-theme-link">@{invite.target_user.username}</strong>
                                                </span>
                                            )}
                                            {invite.expires_at && (
                                                <span>
                                                    {t('spaces.invite_expires')}: {new Date(invite.expires_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-[5px] shrink-0">
                                        <Button variant="secondary" onClick={() => handleCopy(invite.token)}>
                                            {t('action.copy')}
                                        </Button>
                                        {invites.length > 1 && (
                                            <Button variant="secondary" onClick={() => handleRevokeOthers(invite.token)}>
                                                {t('spaces.invite_revoke_others')}
                                            </Button>
                                        )}
                                        <Button variant="danger" onClick={() => handleRevoke(invite.token)}>
                                            {t('action.delete')}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpaceInvitesTab;