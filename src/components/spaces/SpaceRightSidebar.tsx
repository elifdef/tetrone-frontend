import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import SpaceService from '@/services/space.service';
import NotificationSettingsService from '@/services/notification.settings.service';
import { SpaceContext, isSpaceStaffRole } from '@/context/space-context';
import { notifyError, notifySuccess } from '@/components/common/Notify';
import Avatar from '@/components/ui/Avatar';

interface SpaceRightSidebarProps {
    currentTab: string;
}

const SpaceRightSidebar = ({ currentTab }: SpaceRightSidebarProps) => {
    const { t } = useTranslation();
    const { space, updateSpace, isOwner, canManageSettings, canManageInvites, canManageMembers } = useContext(SpaceContext);
    const [isLoading, setIsLoading] = useState(false);
    const [isMuteLoading, setIsMuteLoading] = useState(false);

    if (!space) return null;

    const spaceUrl = `/${space.username}`;
    const privacyType = space.privacy_type ?? 'public';
    const isPending = space.membership_status === 'pending';
    const isPrivate = privacyType === 'private';
    const isClosed = privacyType === 'closed';
    const canViewContent = space.can_view_content !== false;
    const pendingRequestsCount = space.pending_requests_count ?? 0;

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

    const getLinkClass = (tabName: string): string => {
        const isActive = currentTab === tabName;
        return `block p-[5px_8px] text-[11px] text-left w-full transition-colors border-b last:border-b-0 border-border no-underline ${
            isActive
                ? 'bg-bg-page text-theme-link font-bold border-l-[3px] border-l-theme-link'
                : 'text-theme-link hover:bg-bg-page hover:underline'
        }`;
    };

    const staffMembers = (space.preview_members || []).filter((m) =>
        isSpaceStaffRole(m.role)
    );

    const getActionLabel = (): string => {
        if (isLoading) return t('common.loading');
        if (space.is_member) return t('spaces.leave');
        if (isPending) return t('spaces.members_requests');
        if (isPrivate) return t('spaces.request_join');
        return t('spaces.join');
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

    const showJoinButton = !isOwner && space.is_member !== null && (!isClosed || space.is_member || isPending);

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="bg-bg-box border border-border p-[4px] flex flex-col gap-[4px]">
                <Avatar
                    user={space}
                    className="w-full aspect-square block border border-border object-cover"
                />
                {showJoinButton && (
                    <button
                        type="button"
                        className="block py-[5px] px-[8px] bg-theme-header-bg hover:bg-theme-link hover:text-white text-theme-link border border-border text-[11px] font-bold text-center w-full transition-colors cursor-pointer disabled:opacity-60"
                        onClick={handleMembershipToggle}
                        disabled={isLoading || isPending}
                    >
                        {getActionLabel()}
                    </button>
                )}
                {space.is_member && (
                    <button
                        type="button"
                        className="block py-[5px] px-[8px] bg-bg-page hover:bg-theme-header-bg text-text-muted hover:text-theme-link border border-border text-[11px] text-center w-full transition-colors cursor-pointer disabled:opacity-60"
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
            </div>

            {canViewContent && (
                <div className="flex flex-col border border-border bg-bg-box">
                    <Link to={spaceUrl} className={getLinkClass('wall')}>
                        {t('spaces.tab_wall')}
                    </Link>
                    <Link to={`${spaceUrl}?tab=members`} className={`${getLinkClass('members')} flex items-center justify-between`}>
                        <span>{t('spaces.tab_members')}</span>
                        {canManageMembers && pendingRequestsCount > 0 && (
                            <span className="px-[5px] bg-theme-link text-white text-[10px] font-bold leading-[14px]">
                                +{pendingRequestsCount}
                            </span>
                        )}
                    </Link>
                    <Link to={`${spaceUrl}?tab=rules`} className={getLinkClass('rules')}>
                        {t('spaces.tab_rules')}
                    </Link>

                    {canManageSettings && (
                        <Link to={`${spaceUrl}?tab=settings`} className={getLinkClass('settings')}>
                            {t('spaces.tab_settings')}
                        </Link>
                    )}

                    {canManageInvites && (
                        <Link to={`${spaceUrl}?tab=invites`} className={getLinkClass('invites')}>
                            {t('spaces.tab_invites')}
                        </Link>
                    )}

                    {canManageMembers && (
                        <Link to={`${spaceUrl}?tab=stats`} className={getLinkClass('stats')}>
                            {t('spaces.tab_stats')}
                        </Link>
                    )}
                </div>
            )}

            {staffMembers.length > 0 && (
                <div className="bg-bg-box border border-border">
                    <div className="bg-theme-header-bg text-theme-link p-[4px_8px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                        {t('spaces.blocks_staff')}
                    </div>
                    <div className="p-[6px] flex flex-col gap-[6px]">
                        {staffMembers.map((staff) => (
                            <Link
                                key={staff.username}
                                to={`/${staff.username}`}
                                className="flex items-center gap-[8px] hover:bg-bg-page p-[2px] transition-colors no-underline"
                            >
                                <Avatar
                                    user={staff}
                                    className="w-[32px] h-[32px] object-cover border border-border shrink-0"
                                />
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] font-bold text-theme-link hover:underline truncate">
                                        {staff.first_name || staff.username}
                                    </span>
                                    <span className="text-[10px] text-text-muted truncate">
                                        {staff.custom_title || t(`spaces.role_${staff.role}`)}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-bg-box border border-border">
                <div className="bg-theme-header-bg text-theme-link p-[4px_8px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                    {t('spaces.privacy')}
                </div>
                <div className="p-[8px] text-text-muted text-[11px] leading-[1.4]">
                    {t(`spaces.privacy_desc_${privacyType}`)}
                </div>
            </div>

            {space.links && space.links.length > 0 && (
                <div className="bg-bg-box border border-border">
                    <div className="bg-theme-header-bg text-theme-link p-[4px_8px] text-[11px] font-bold border-b border-border border-t-[2px] border-t-theme-link">
                        {t('spaces.friends_links')}
                    </div>
                    <div className="flex flex-col">
                        {space.links.map((link, idx) => (
                            <a
                                key={idx}
                                href={link.url}
                                target="_blank"
                                rel="noreferrer"
                                className="p-[5px_8px] text-[11px] text-theme-link hover:bg-bg-page hover:underline block truncate border-b last:border-b-0 border-border"
                            >
                                {link.title}
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SpaceRightSidebar;