import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SpaceContext, isSpaceStaffRole } from '@/context/space-context';
import SpaceService, { type SpaceQueryParams } from '@/services/space.service';
import Button from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import Input from '@/components/ui/Input';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import type { SpaceData, SpaceMemberItem, SpaceRole } from '@/types/space';

type MemberTabKey = 'approved' | 'staff' | 'pending';

interface MemberCountsState {
    approved: number;
    staff: number;
    pending: number;
}

const SpaceMembersTab = () => {
    const { t } = useTranslation();
    const { space, updateSpace, canManageMembers, isOwner } = useContext(SpaceContext);

    const [activeTab, setActiveTab] = useState<MemberTabKey>('approved');
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState<SpaceMemberItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<MemberCountsState>({
        approved: space?.members_count ?? 0,
        staff: 0,
        pending: space?.pending_requests_count ?? 0,
    });

    const spaceUsername = space?.username;
    const approvedCount = space?.members_count ?? counts.approved;
    const pendingCount = space?.pending_requests_count ?? counts.pending;

    const fetchMembers = useCallback(() => {
        if (!spaceUsername) return;

        setLoading(true);
        const queryStatus = activeTab === 'pending' ? 'pending' : 'approved';
        const params: SpaceQueryParams = { status: queryStatus };
        if (activeTab === 'staff') params.role = 'staff';
        if (searchQuery.trim()) params['filter[name]'] = searchQuery.trim();

        SpaceService.getSpaceMembers(spaceUsername, params)
            .onSuccess((res) => {
                const items = Array.isArray(res.members)
                    ? res.members
                    : (res.members?.data ?? []);
                setMembers(items);

                if (res.counts) {
                    setCounts({
                        approved: res.counts.approved ?? 0,
                        staff: res.counts.staff ?? 0,
                        pending: res.counts.pending ?? 0,
                    });
                    const spaceUpdates: Partial<SpaceData> = {};
                    if (typeof res.counts.approved === 'number') {
                        spaceUpdates.members_count = res.counts.approved;
                    }
                    if (typeof res.counts.pending === 'number') {
                        spaceUpdates.pending_requests_count = res.counts.pending;
                    }
                    if (Object.keys(spaceUpdates).length > 0) {
                        updateSpace(spaceUpdates);
                    }
                } else {
                    const total = !Array.isArray(res.members) ? res.members?.total : undefined;
                    if (typeof total === 'number') {
                        setCounts((prev) => ({ ...prev, [activeTab]: total }));
                        if (activeTab === 'approved') {
                            updateSpace({ members_count: total });
                        } else if (activeTab === 'pending') {
                            updateSpace({ pending_requests_count: total });
                        }
                    }
                }
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            })
            .onFinally(() => {
                setLoading(false);
            });
    }, [spaceUsername, activeTab, searchQuery, updateSpace, t]);

    useEffect(() => {
        const delay = setTimeout(fetchMembers, 350);
        return () => clearTimeout(delay);
    }, [fetchMembers]);

    if (!space) return null;

    if (space.is_members_hidden && !canManageMembers) {
        return (
            <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px]">
                {t('spaces.members_hidden_msg')}
            </div>
        );
    }

    const handleRoleChange = (
        member: SpaceMemberItem,
        newRole: SpaceRole,
        rawCustomTitle?: string | null
    ) => {
        const normalizedTitle = rawCustomTitle?.trim() || null;
        const currentTitle = member.custom_title || null;

        if (newRole === member.role && normalizedTitle === currentTitle) return;

        const wasStaff = isSpaceStaffRole(member.role);
        const willBeStaff = isSpaceStaffRole(newRole);

        SpaceService.updateMemberRole(space.username, member.user.username, {
            role: newRole,
            custom_title: normalizedTitle,
        })
            .onSuccess((res) => {
                setMembers((prev) => {
                    const updated = prev.map((m) =>
                        m.user.username === member.user.username
                            ? { ...m, role: newRole, custom_title: normalizedTitle }
                            : m
                    );
                    return activeTab === 'staff' && !willBeStaff
                        ? updated.filter((m) => m.user.username !== member.user.username)
                        : updated;
                });

                if (wasStaff !== willBeStaff) {
                    setCounts((prev) => ({
                        ...prev,
                        staff: Math.max(0, prev.staff + (willBeStaff ? 1 : -1)),
                    }));
                }

                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const handleKick = (member: SpaceMemberItem) => {
        if (!window.confirm(t('common.confirm_action'))) return;

        const targetUsername = member.user.username;
        const isTargetStaff = isSpaceStaffRole(member.role);

        SpaceService.kickMember(space.username, targetUsername)
            .onSuccess((res) => {
                setMembers((prev) => prev.filter((m) => m.user.username !== targetUsername));
                if (activeTab === 'pending') {
                    const nextPending = Math.max(0, pendingCount - 1);
                    setCounts((prev) => ({ ...prev, pending: nextPending }));
                    updateSpace({ pending_requests_count: nextPending });
                } else {
                    const nextApproved = Math.max(0, approvedCount - 1);
                    setCounts((prev) => ({
                        ...prev,
                        approved: nextApproved,
                        staff: isTargetStaff ? Math.max(0, prev.staff - 1) : prev.staff,
                    }));
                    updateSpace({ members_count: nextApproved });
                }
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const handleApprove = (targetUsername: string) => {
        SpaceService.approveMember(space.username, targetUsername)
            .onSuccess((res) => {
                setMembers((prev) => prev.filter((m) => m.user.username !== targetUsername));
                const nextApproved = approvedCount + 1;
                const nextPending = Math.max(0, pendingCount - 1);
                setCounts((prev) => ({
                    ...prev,
                    approved: nextApproved,
                    pending: nextPending,
                }));
                updateSpace({
                    members_count: nextApproved,
                    pending_requests_count: nextPending,
                });
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const handleReject = (targetUsername: string) => {
        SpaceService.rejectMember(space.username, targetUsername)
            .onSuccess((res) => {
                setMembers((prev) => prev.filter((m) => m.user.username !== targetUsername));
                const nextPending = Math.max(0, pendingCount - 1);
                setCounts((prev) => ({ ...prev, pending: nextPending }));
                updateSpace({ pending_requests_count: nextPending });
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            });
    };

    const roleOptions = [
        { value: 'member', label: t('spaces.role_member') },
        { value: 'moderator', label: t('spaces.role_moderator') },
        { value: 'admin', label: t('spaces.role_admin') },
    ];

    const getTabClass = (tab: MemberTabKey): string =>
        `flex-1 py-[8px] px-[6px] text-[11px] font-bold border-r last:border-r-0 border-border transition-colors cursor-pointer flex items-center justify-center gap-[5px] ${
            activeTab === tab
                ? 'bg-bg-box text-theme-link'
                : 'text-text-muted hover:bg-bg-box'
        }`;

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[5px_10px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                {t('spaces.blocks_members')}
            </div>

            <div className="flex border-b border-border bg-bg-page">
                <button type="button" className={getTabClass('approved')} onClick={() => setActiveTab('approved')}>
                    <span>{t('spaces.members_all')}</span>
                    <span className="text-[10px] font-normal text-text-muted">({approvedCount})</span>
                </button>
                <button type="button" className={getTabClass('staff')} onClick={() => setActiveTab('staff')}>
                    <span>{t('spaces.blocks_staff')}</span>
                    <span className="text-[10px] font-normal text-text-muted">({counts.staff})</span>
                </button>
                {canManageMembers && space.privacy_type !== 'public' && (
                    <button type="button" className={getTabClass('pending')} onClick={() => setActiveTab('pending')}>
                        <span>{t('spaces.members_requests')}</span>
                        {pendingCount > 0 && (
                            <span className="px-[5px] py-[0px] bg-theme-link text-white text-[10px] font-bold leading-[15px]">
                                +{pendingCount}
                            </span>
                        )}
                    </button>
                )}
            </div>

            <div className="p-[10px] border-b border-border">
                <Input
                    type="text"
                    placeholder={t('spaces.list_search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="p-[10px] flex flex-col gap-[8px]">
                {loading ? (
                    <div className="text-center text-text-muted py-[20px]">{t('common.loading')}</div>
                ) : members.length === 0 ? (
                    <div className="text-center text-text-muted py-[20px]">{t('spaces.list_empty')}</div>
                ) : (
                    members.map((member) => (
                        <div
                            key={member.user.username}
                            className="flex items-center gap-[10px] p-[10px] border border-border bg-bg-page max-md:flex-wrap"
                        >
                            <Link to={`/${member.user.username}`} className="shrink-0">
                                <img
                                    src={member.user.avatar ?? undefined}
                                    alt={member.user.username}
                                    className="w-[48px] h-[48px] max-md:w-[40px] max-md:h-[40px] object-cover border border-border"
                                />
                            </Link>

                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/${member.user.username}`}
                                    className="font-bold text-theme-link hover:underline text-[12px] block truncate"
                                >
                                    {member.user.first_name || member.user.username}
                                </Link>
                                <div className="text-[10px] text-text-muted mt-[2px] truncate">
                                    {member.custom_title || t(`spaces.role_${member.role}`)}
                                </div>
                            </div>

                            {canManageMembers && member.role !== 'owner' && (
                                <div className="flex flex-col gap-[5px] shrink-0 w-[210px] max-md:w-full">
                                    {activeTab === 'pending' ? (
                                        <div className="flex gap-[5px]">
                                            <Button
                                                variant="primary"
                                                className="flex-1 text-[10px]"
                                                onClick={() => handleApprove(member.user.username)}
                                            >
                                                {t('action.approve')}
                                            </Button>
                                            <Button
                                                variant="danger"
                                                className="text-[10px]"
                                                onClick={() => handleReject(member.user.username)}
                                            >
                                                {t('action.reject')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-[5px]">
                                                <div className="flex-1">
                                                    <CustomSelect
                                                        options={isOwner ? roleOptions : roleOptions.filter((r) => r.value !== 'admin')}
                                                        value={member.role}
                                                        onChange={(val) => handleRoleChange(member, val as SpaceRole, member.custom_title)}
                                                    />
                                                </div>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleKick(member)}
                                                >
                                                    {t('spaces.kick')}
                                                </Button>
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder={t('spaces.custom_title_placeholder')}
                                                defaultValue={member.custom_title || ''}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') e.currentTarget.blur();
                                                }}
                                                onBlur={(e) => handleRoleChange(member, member.role, e.target.value)}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SpaceMembersTab;