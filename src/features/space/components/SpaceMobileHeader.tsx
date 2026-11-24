import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import SpaceService from '@/services/space.service';
import NotificationSettingsService from '@/services/notification.settings.service';
import { SpaceContext, isSpaceStaffRole } from '@/context/space-context';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import Avatar from '@/components/ui/Avatar';
import RichText from '@/components/common/RichText';
import { decodeTipTapContent } from '@/utils/tiptapContent';
import { isTipTapDoc, type TipTapDoc } from '@/types/tiptap';

interface SpaceMobileHeaderProps {
    currentTab: string;
}

const hasTipTapContent = (value: TipTapDoc | string | null | undefined): boolean => {
    const raw = typeof value === 'string' ? (() => {
        try {
            return JSON.parse(value) as unknown;
        } catch {
            return null;
        }
    })() : value;

    const doc = decodeTipTapContent(raw);
    if (!isTipTapDoc(doc)) return false;

    return doc.content.some(
        (node) =>
            ('content' in node && Array.isArray(node.content) && node.content.length > 0) ||
            node.type !== 'paragraph'
    );
};

const cleanLabel = (text: string | undefined | null): string =>
    String(text || '').replace(/[:?]+$/, '');

const SpaceMobileHeader = ({ currentTab }: SpaceMobileHeaderProps) => {
    const { t } = useTranslation();
    const { space, updateSpace, isOwner, canManageSettings, canManageInvites, canManageMembers } = useContext(SpaceContext);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuteLoading, setIsMuteLoading] = useState(false);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    if (!space) return null;

    const spaceUrl = `/${space.username}`;
    const privacyType = space.privacy_type ?? 'public';
    const isPending = space.membership_status === 'pending';
    const isPrivate = privacyType === 'private';
    const isClosed = privacyType === 'closed';
    const canViewContent = space.can_view_content !== false;
    const showDescription = hasTipTapContent(space.description);
    const showJoinButton = !isOwner && space.is_member !== null && (!isClosed || space.is_member || isPending);
    const pendingRequestsCount = space.pending_requests_count ?? 0;

    const staffMembers = (space.preview_members || []).filter((m) =>
        isSpaceStaffRole(m.role)
    );

    const handleMembershipToggle = () => {
        if (space.is_member === null || isOwner || isLoading || isPending) return;
        setIsLoading(true);

        if (space.is_member) {
            SpaceService.leaveSpace(space.username)
                .onSuccess((res) => {
                    updateSpace({
                        is_member: false,
                        membership_status: null,
                        member_role: null,
                        members_count: Math.max(0, (space.members_count || 1) - 1),
                    });
                    notifySuccess(t(`api.success.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                })
                .onFinally(() => {
                    setIsLoading(false);
                });
        } else {
            SpaceService.joinSpace(space.username)
                .onSuccess((res) => {
                    if (res.code === 'JOIN_REQUEST_SENT') {
                        updateSpace({ is_member: false, membership_status: 'pending' });
                    } else {
                        updateSpace({
                            is_member: true,
                            membership_status: 'approved',
                            member_role: 'member',
                            can_view_content: true,
                            members_count: (space.members_count || 0) + 1,
                        });
                    }
                    notifySuccess(t(`api.success.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                })
                .onFinally(() => {
                    setIsLoading(false);
                });
        }
    };

    const handleNotificationsToggle = () => {
        if (isMuteLoading || !space.is_member) return;
        setIsMuteLoading(true);

        if (space.is_notifications_muted) {
            NotificationSettingsService.deleteOverride(space.username, 'space')
                .onSuccess((res) => {
                    updateSpace({ is_notifications_muted: false });
                    notifySuccess(t(`api.success.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                })
                .onFinally(() => {
                    setIsMuteLoading(false);
                });
        } else {
            NotificationSettingsService.updateOverride(space.username, { is_muted: true }, 'space')
                .onSuccess((res) => {
                    updateSpace({ is_notifications_muted: true });
                    notifySuccess(t(`api.success.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                })
                .onFinally(() => {
                    setIsMuteLoading(false);
                });
        }
    };

    const getActionLabel = (): string => {
        if (isLoading) return t('common.loading');
        if (space.is_member) return t('spaces.leave');
        if (isPending) return t('spaces.members_requests');
        if (isPrivate) return t('spaces.request_join');
        return t('spaces.join');
    };

    const getTabClass = (tabName: string): string => {
        const isActive = currentTab === tabName;
        return `px-[12px] py-[8px] text-[11px] whitespace-nowrap shrink-0 no-underline border-r last:border-r-0 border-border transition-colors ${
            isActive
                ? 'bg-bg-box text-theme-link font-bold shadow-[inset_0_-2px_0_var(--theme-link)]'
                : 'text-text-muted hover:text-theme-link hover:bg-bg-box'
        }`;
    };

    return (
        <div className="hidden max-lg:flex flex-col bg-bg-box border border-border overflow-hidden">
            <div className="bg-theme-header-bg border-b border-border border-t-[2px] border-t-theme-link p-[6px_10px] flex items-center justify-between gap-[8px]">
                <div className="flex items-center gap-[6px] min-w-0">
                    <h1 className="text-[13px] font-bold text-theme-link m-0 truncate">
                        {space.name}
                    </h1>
                    <span className="text-[9px] px-[5px] py-[1px] bg-bg-box border border-border text-text-muted shrink-0">
                        {t(`spaces.privacy_${privacyType}`)}
                    </span>
                </div>
                <span className="text-[10px] text-text-muted shrink-0">
                    @{space.username}
                </span>
            </div>

            <div className="p-[10px] flex items-start gap-[10px]">
                <Avatar
                    user={space}
                    className="w-[72px] h-[72px] shrink-0 border border-border object-cover block"
                />

                <div className="flex-1 min-w-0 flex flex-col gap-[5px]">
                    <div className={`text-[11px] leading-[1.35] break-words ${!isDetailsOpen ? 'line-clamp-3' : ''}`}>
                        {showDescription ? (
                            <RichText text={space.description} />
                        ) : (
                            <span className="text-text-muted">
                                {t(`spaces.privacy_desc_${privacyType}`)}
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-[8px] gap-y-[2px] text-[10px] text-text-muted">
                        {space.owner && (
                            <span>
                                {cleanLabel(t('spaces.role_owner'))}:{' '}
                                <Link to={`/${space.owner.username}`} className="text-theme-link no-underline hover:underline">
                                    {space.owner.first_name || space.owner.username}
                                </Link>
                            </span>
                        )}
                        {canViewContent && !space.is_members_hidden && (
                            <>
                                <span>•</span>
                                <Link to={`${spaceUrl}?tab=members`} className="text-theme-link no-underline hover:underline">
                                    {t('spaces.tab_members')}: {space.members_count ?? 0}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="px-[10px] pb-[10px] flex items-center gap-[6px] flex-wrap">
                {showJoinButton && (
                    <button
                        type="button"
                        className="py-[5px] px-[10px] bg-theme-header-bg hover:bg-theme-link hover:text-white text-theme-link border border-border text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-60 flex-1 min-w-[110px]"
                        onClick={handleMembershipToggle}
                        disabled={isLoading || isPending}
                    >
                        {getActionLabel()}
                    </button>
                )}

                {space.is_member && (
                    <button
                        type="button"
                        className="py-[5px] px-[10px] bg-bg-page hover:bg-theme-header-bg text-text-muted hover:text-theme-link border border-border text-[11px] transition-colors cursor-pointer disabled:opacity-60 flex-1 min-w-[110px]"
                        onClick={handleNotificationsToggle}
                        disabled={isMuteLoading}
                    >
                        {isMuteLoading
                            ? t('common.loading')
                            : space.is_notifications_muted
                                ? t('spaces.unmute_notifications')
                                : t('spaces.mute_notifications')}
                    </button>
                )}

                <button
                    type="button"
                    onClick={() => setIsDetailsOpen((prev) => !prev)}
                    className="py-[5px] px-[8px] bg-bg-page hover:bg-theme-header-bg text-theme-link border border-border text-[11px] cursor-pointer ml-auto shrink-0"
                >
                    {cleanLabel(t('spaces.info_type'))} {isDetailsOpen ? '▲' : '▼'}
                </button>
            </div>

            {isDetailsOpen && (
                <div className="border-t border-border bg-bg-page p-[10px] flex flex-col gap-[8px] text-[11px]">
                    <div className="flex flex-col gap-[3px]">
                        <div className="flex gap-[6px]">
                            <span className="text-text-muted shrink-0">{cleanLabel(t('spaces.info_type'))}:</span>
                            <span className="text-text-main font-bold">{t(`spaces.privacy_${privacyType}`)}</span>
                        </div>
                        <div className="text-[10px] text-text-muted leading-[1.35]">
                            {t(`spaces.privacy_desc_${privacyType}`)}
                        </div>
                    </div>

                    <div className="flex gap-[6px]">
                        <span className="text-text-muted shrink-0">{cleanLabel(t('spaces.field_posting'))}:</span>
                        <span className="text-text-main">{t(`spaces.posting_${space.posting_rule || 'all'}`)}</span>
                    </div>

                    {staffMembers.length > 0 && (
                        <div className="pt-[6px] border-t border-dashed border-border flex flex-col gap-[5px]">
                            <span className="text-[10px] font-bold text-text-muted uppercase">
                                {t('spaces.blocks_staff')}
                            </span>
                            <div className="flex flex-wrap gap-[6px]">
                                {staffMembers.map((staff) => (
                                    <Link
                                        key={staff.username}
                                        to={`/${staff.username}`}
                                        className="flex items-center gap-[6px] bg-bg-box border border-border px-[6px] py-[4px] no-underline hover:border-theme-link"
                                    >
                                        <Avatar
                                            user={staff}
                                            className="w-[22px] h-[22px] object-cover border border-border shrink-0"
                                        />
                                        <div className="flex flex-col leading-[1.2]">
                                            <span className="text-[11px] font-bold text-theme-link">
                                                {staff.first_name || staff.username}
                                            </span>
                                            <span className="text-[9px] text-text-muted">
                                                {staff.custom_title || t(`spaces.role_${staff.role}`)}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {space.links && space.links.length > 0 && (
                        <div className="pt-[6px] border-t border-dashed border-border flex flex-col gap-[4px]">
                            <span className="text-[10px] font-bold text-text-muted uppercase">
                                {t('spaces.friends_links')}
                            </span>
                            <div className="flex flex-wrap gap-[6px]">
                                {space.links.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.url}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-[7px] py-[3px] bg-bg-box border border-border text-[11px] text-theme-link no-underline hover:underline"
                                    >
                                        {link.title}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {canViewContent && (
                <nav className="flex border-t border-border bg-bg-page overflow-x-auto">
                    <Link to={spaceUrl} className={getTabClass('wall')}>
                        {t('spaces.tab_wall')}
                    </Link>
                    <Link to={`${spaceUrl}?tab=members`} className={`${getTabClass('members')} flex items-center gap-[4px]`}>
                        <span>{t('spaces.tab_members')}</span>
                        {canManageMembers && pendingRequestsCount > 0 && (
                            <span className="px-[4px] bg-theme-link text-white text-[9px] font-bold leading-[13px]">
                                +{pendingRequestsCount}
                            </span>
                        )}
                    </Link>
                    <Link to={`${spaceUrl}?tab=rules`} className={getTabClass('rules')}>
                        {t('spaces.tab_rules')}
                    </Link>
                    {canManageSettings && (
                        <Link to={`${spaceUrl}?tab=settings`} className={getTabClass('settings')}>
                            {t('spaces.tab_settings')}
                        </Link>
                    )}
                    {canManageInvites && (
                        <Link to={`${spaceUrl}?tab=invites`} className={getTabClass('invites')}>
                            {t('spaces.tab_invites')}
                        </Link>
                    )}
                    {canManageMembers && (
                        <Link to={`${spaceUrl}?tab=stats`} className={getTabClass('stats')}>
                            {t('spaces.tab_stats')}
                        </Link>
                    )}
                </nav>
            )}
        </div>
    );
};

export default SpaceMobileHeader;