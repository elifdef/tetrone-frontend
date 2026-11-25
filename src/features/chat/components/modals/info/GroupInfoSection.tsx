import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '@ui/Avatar';
import Button from '@ui/Button';
import { CloseIcon } from '@ui/Icons';
import SmartEditor from '@components/editor/SmartEditor';
import RichText from '@common/RichText';
import userService from '@/services/user.service';
import { parseRichText } from '../../utils/messageParser';
import type { ChatData, ChatRoleValue } from '@/types/chat';
import type { TipTapDoc, UserData } from '@/types/user';

const GroupPlaceholderSvg = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export interface GroupInfoSectionProps {
    chat: ChatData;
    currentUser: UserData | null | undefined;
    friendsList?: UserData[];
    onUpdateGroupInfo?: (title: TipTapDoc | string | null, description: TipTapDoc | string | null) => void;
    onInviteMember?: (username: string, invitedUser?: UserData) => void;
    onUpdateMemberRole?: (username: string, role: ChatRoleValue) => void;
    onKickMember?: (username: string) => void;
}

export default function GroupInfoSection({
    chat,
    currentUser,
    friendsList = [],
    onUpdateGroupInfo,
    onInviteMember,
    onUpdateMemberRole,
    onKickMember,
}: GroupInfoSectionProps) {
    const { t } = useTranslation();
    const [inviteUsername, setInviteUsername] = useState<string>('');
    const [memberSearch, setMemberSearch] = useState<string>('');
    const [remoteUsers, setRemoteUsers] = useState<UserData[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState<boolean>(false);
    const [isInvitePanelOpen, setIsInvitePanelOpen] = useState<boolean>(false);
    const [groupTitle, setGroupTitle] = useState<TipTapDoc | null>(() => parseRichText(chat?.title));
    const [groupDesc, setGroupDesc] = useState<TipTapDoc | null>(() => parseRichText(chat?.description));

    const currentUsername = currentUser?.username ?? null;

    const isGroupAdmin = useMemo(() => {
        if (!currentUsername) return false;
        if (chat.owner_username === currentUsername) return true;
        return (chat.participants || []).some(
            (p) => p.user?.username === currentUsername && (p.role === 'owner' || p.role === 'admin')
        );
    }, [chat.owner_username, chat.participants, currentUsername]);

    const participantUsernames = useMemo(() => {
        const set = new Set<string>();
        (chat.participants || []).forEach((p) => {
            if (p.user?.username) {
                set.add(p.user.username);
            }
        });
        return set;
    }, [chat.participants]);

    useEffect(() => {
        if (!isInvitePanelOpen) return undefined;
        const query = memberSearch.trim();
        if (query.length < 2) {
            setRemoteUsers([]);
            setIsSearchingUsers(false);
            return undefined;
        }

        let isCancelled = false;
        setIsSearchingUsers(true);

        const timer = setTimeout(() => {
            userService
                .searchUsers(query)
                .onSuccess((res) => {
                    if (isCancelled) return;
                    const list = Array.isArray(res?.users) ? res.users : [];
                    setRemoteUsers(list);
                })
                .onError(() => {
                    if (!isCancelled) setRemoteUsers([]);
                })
                .onFinally(() => {
                    if (!isCancelled) setIsSearchingUsers(false);
                });
        }, 280);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [memberSearch, isInvitePanelOpen]);

    const availableFriendsToInvite = useMemo(
        () =>
            friendsList.filter(
                (f) => Boolean(f.username) && !participantUsernames.has(f.username)
            ),
        [friendsList, participantUsernames]
    );

    const searchableCandidates = useMemo(() => {
        const query = memberSearch.trim().toLowerCase();
        const combinedMap = new Map<string, UserData>();

        availableFriendsToInvite.forEach((u) => {
            combinedMap.set(u.username, u);
        });

        remoteUsers.forEach((u) => {
            if (u.username && !participantUsernames.has(u.username) && !combinedMap.has(u.username)) {
                combinedMap.set(u.username, u);
            }
        });

        const list = Array.from(combinedMap.values());
        if (!query) return list;

        return list.filter((u) => {
            const fullName = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
            const username = u.username.toLowerCase();
            return fullName.includes(query) || username.includes(query);
        });
    }, [availableFriendsToInvite, remoteUsers, participantUsernames, memberSearch]);

    const handleSaveGroupInfo = () => {
        onUpdateGroupInfo?.(groupTitle, groupDesc);
    };

    const handleInviteSelectedFriend = () => {
        if (!inviteUsername) return;
        const targetUser = availableFriendsToInvite.find((f) => f.username === inviteUsername);
        onInviteMember?.(inviteUsername, targetUser);
        setInviteUsername('');
    };

    const handleInviteUser = (targetUser: UserData) => {
        if (!targetUser.username) return;
        onInviteMember?.(targetUser.username, targetUser);
    };

    return (
        <div className="flex flex-col gap-[15px]">
            <div className="flex flex-col items-center p-[15px] bg-bg-page border border-border">
                <div className="w-[60px] h-[60px] rounded-full bg-input-bg border border-border mb-[10px] flex items-center justify-center text-text-muted overflow-hidden">
                    {chat.avatar ? (
                        <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <GroupPlaceholderSvg />
                    )}
                </div>

                {isGroupAdmin ? (
                    <div className="w-full flex flex-col gap-[10px]">
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            {t('chat.info_modal.group_title')}
                        </div>
                        <div className="border border-input-border bg-input-bg focus-within:border-theme-link transition-colors">
                            <SmartEditor
                                key={`group_title_${chat.slug}`}
                                className="min-h-[40px] text-[12px] outline-none"
                                value={groupTitle}
                                onChange={setGroupTitle}
                            />
                        </div>

                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-[5px]">
                            {t('chat.info_modal.group_desc')}
                        </div>
                        <div className="border border-input-border bg-input-bg focus-within:border-theme-link transition-colors">
                            <SmartEditor
                                key={`group_desc_${chat.slug}`}
                                className="min-h-[60px] text-[12px] outline-none"
                                value={groupDesc}
                                onChange={setGroupDesc}
                            />
                        </div>

                        <Button variant="primary" onClick={handleSaveGroupInfo} className="mt-[5px]">
                            {t('chat.actions.save')}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="font-bold text-[14px] text-theme-link mb-[5px]">
                            <RichText
                                text={parseRichText(chat.title)}
                                className="post-text [&_p]:inline [&_p]:m-0"
                                limit={100000}
                            />
                        </div>
                        <div className="text-[11px] text-text-main">
                            <RichText
                                text={parseRichText(chat.description)}
                                className="post-text [&_p]:inline [&_p]:m-0"
                                limit={100000}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="border border-border">
                <div className="bg-header-bg p-[8px_15px] border-b border-border font-bold flex justify-between items-center gap-[8px] flex-wrap">
                    <span>
                        {t('chat.info_modal.participants')} ({chat.participants_count})
                    </span>

                    {isGroupAdmin && (
                        <div className="flex items-center gap-[6px] flex-wrap">
                            {availableFriendsToInvite.length > 0 && (
                                <>
                                    <select
                                        value={inviteUsername}
                                        onChange={(e) => setInviteUsername(e.target.value)}
                                        aria-label={t('chat.modals.select_friend')}
                                        className="px-[6px] py-[3px] text-[11px] bg-bg-box border border-border text-text-main font-normal"
                                    >
                                        <option value="">{t('chat.modals.select_friend')}</option>
                                        {availableFriendsToInvite.map((f) => (
                                            <option key={f.username} value={f.username}>
                                                {f.first_name || f.username} {f.last_name || ''} (@{f.username})
                                            </option>
                                        ))}
                                    </select>
                                    <Button
                                        variant="primary"
                                        disabled={!inviteUsername}
                                        onClick={handleInviteSelectedFriend}
                                    >
                                        {t('chat.info_modal.invite')}
                                    </Button>
                                </>
                            )}
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setIsInvitePanelOpen((prev) => !prev)}
                            >
                                {isInvitePanelOpen ? t('chat.actions.cancel') : t('chat.info_modal.add_member')}
                            </Button>
                        </div>
                    )}
                </div>

                {isGroupAdmin && isInvitePanelOpen && (
                    <div className="p-[10px_15px] border-b border-border bg-bg-page flex flex-col gap-[8px]">
                        <div className="relative flex items-center border border-border bg-input-bg focus-within:border-theme-link">
                            <input
                                type="text"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                                placeholder={t('chat.modals.search_users_placeholder')}
                                className="w-full px-[8px] py-[5px] pr-[24px] bg-transparent border-none text-[11px] text-text-main outline-none"
                            />
                            {memberSearch && (
                                <button
                                    type="button"
                                    onClick={() => setMemberSearch('')}
                                    title={t('action.close')}
                                    className="absolute right-[6px] bg-transparent border-none p-0 text-text-muted hover:text-theme-link flex items-center justify-center cursor-pointer"
                                >
                                    <CloseIcon width={11} height={11} />
                                </button>
                            )}
                        </div>

                        <div className="border border-border bg-bg-box max-h-[150px] overflow-y-auto divide-y divide-border">
                            {isSearchingUsers && searchableCandidates.length === 0 ? (
                                <div className="p-[10px] text-center text-[11px] text-text-muted">
                                    {t('chat.modals.loading_users')}
                                </div>
                            ) : searchableCandidates.length === 0 ? (
                                <div className="p-[10px] text-center text-[11px] text-text-muted">
                                    {t('chat.modals.no_users_found')}
                                </div>
                            ) : (
                                searchableCandidates.map((candidate) => (
                                    <div
                                        key={candidate.username}
                                        className="flex items-center justify-between gap-[8px] px-[8px] py-[6px] hover:bg-bg-hover"
                                    >
                                        <div className="flex items-center gap-[8px] min-w-0">
                                            <Avatar
                                                user={candidate}
                                                className="w-[26px] h-[26px] object-cover border border-border shrink-0"
                                            />
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-bold text-[11px] text-theme-link truncate">
                                                    {candidate.first_name || candidate.username} {candidate.last_name || ''}
                                                </span>
                                                <span className="text-[10px] text-text-muted truncate">
                                                    @{candidate.username}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            onClick={() => handleInviteUser(candidate)}
                                            className="px-[8px] py-[2px] text-[10px] shrink-0"
                                        >
                                            {t('chat.info_modal.invite')}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                <div className="flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar bg-bg-box">
                    {(chat.participants || []).map((p) => {
                        if (!p.user) return null;
                        const participantUsername = p.user.username;
                        return (
                            <div
                                key={participantUsername}
                                className="flex justify-between items-center p-[8px_15px] border-b border-border last:border-b-0 hover:bg-bg-page"
                            >
                                <div className="flex items-center gap-[10px]">
                                    <Avatar
                                        user={p.user}
                                        className="w-[30px] h-[30px] object-cover border border-border"
                                    />
                                    <div className="flex flex-col">
                                        <Link
                                            to={`/${participantUsername}`}
                                            className="font-bold text-theme-link hover:underline leading-tight"
                                        >
                                            {p.user.first_name || participantUsername} {p.user.last_name || ''}
                                        </Link>
                                        <span className="text-[10px] text-text-muted leading-tight mt-[2px]">
                                            {p.role === 'owner'
                                                ? t('chat.roles.owner')
                                                : p.role === 'admin'
                                                  ? t('chat.roles.admin')
                                                  : t('chat.roles.member')}
                                        </span>
                                    </div>
                                </div>

                                {isGroupAdmin && participantUsername !== currentUsername && (
                                    <div className="flex items-center gap-[8px]">
                                        <select
                                            value={p.role}
                                            onChange={(e) =>
                                                onUpdateMemberRole?.(participantUsername, e.target.value as ChatRoleValue)
                                            }
                                            className="px-[4px] py-[2px] text-[10px] bg-bg-box border border-border text-text-main"
                                        >
                                            <option value="member">{t('chat.roles.member')}</option>
                                            <option value="admin">{t('chat.roles.admin')}</option>
                                            <option value="owner">{t('chat.roles.owner')}</option>
                                        </select>
                                        <Button
                                            variant="danger"
                                            onClick={() => onKickMember?.(participantUsername)}
                                            className="px-[8px] py-[2px] text-[10px]"
                                        >
                                            {t('chat.info_modal.kick')}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}