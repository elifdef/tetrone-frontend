import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import chatService from '../../../services/chat.service';
import { toTipTapDoc } from '../utils/messageParser';
import { notifySuccess, notifyError } from '../../common/Notify.jsx';
import type { ChatData, ChatRoleValue } from '@/types/chat';
import type { TipTapDoc, UserData } from '@/types/user';

export interface UseGroupActionsParams {
    activeChatSlug: string | null;
    setChats: Dispatch<SetStateAction<ChatData[]>>;
}

export interface UseGroupActionsResult {
    handleUpdateGroupInfo: (title: TipTapDoc | string | null, description: TipTapDoc | string | null) => void;
    handleInviteGroupMember: (username: string, invitedUser?: UserData) => void;
    handleUpdateGroupMemberRole: (username: string, newRole: ChatRoleValue) => void;
    handleKickGroupMember: (username: string) => void;
}

export function useGroupActions({ activeChatSlug, setChats }: UseGroupActionsParams): UseGroupActionsResult {
    const { t } = useTranslation();

    const handleUpdateGroupInfo = useCallback(
        (title: TipTapDoc | string | null, description: TipTapDoc | string | null) => {
            if (!activeChatSlug) return;
            const tiptapTitle = toTipTapDoc(title);
            const tiptapDesc = toTipTapDoc(description);
            chatService
                .updateGroupInfo(activeChatSlug, tiptapTitle, tiptapDesc)
                .onSuccess((res) => {
                    setChats((prev) =>
                        prev.map((c) => {
                            if (c.slug !== activeChatSlug) return c;
                            return res.chat
                                ? res.chat
                                : { ...c, title: tiptapTitle, description: tiptapDesc };
                        })
                    );
                    notifySuccess(t(`api.success.${res.code || 'GROUP_INFO_UPDATED'}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setChats, t]
    );

    const handleInviteGroupMember = useCallback(
        (username: string, invitedUser?: UserData) => {
            if (!activeChatSlug || !username) return;
            chatService
                .inviteGroupMember(activeChatSlug, username)
                .onSuccess((res) => {
                    setChats((prev) =>
                        prev.map((c) => {
                            if (c.slug !== activeChatSlug) return c;
                            if (res.chat) {
                                return res.chat;
                            }
                            const existing = c.participants || [];
                            if (existing.some((p) => p.user?.username === username)) {
                                return c;
                            }
                            const fallbackUser: UserData = invitedUser || {
                                username,
                                aliases: null,
                                first_name: username,
                                last_name: null,
                                avatar: null,
                                gender: null,
                                is_setup_complete: true,
                                is_banned: false,
                                is_deleted: false,
                                is_verified: false,
                                verification_badge: null,
                                personalization: null,
                            };
                            const nextParticipants = [
                                ...existing,
                                { user: fallbackUser, role: 'member' as const },
                            ];
                            return {
                                ...c,
                                participants: nextParticipants,
                                participants_count: nextParticipants.length,
                            };
                        })
                    );
                    notifySuccess(t(`api.success.${res.code || 'GROUP_MEMBER_INVITED'}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setChats, t]
    );

    const handleUpdateGroupMemberRole = useCallback(
        (username: string, newRole: ChatRoleValue) => {
            if (!activeChatSlug || !username) return;
            chatService
                .updateGroupMemberRole(activeChatSlug, username, newRole)
                .onSuccess((res) => {
                    setChats((prev) =>
                        prev.map((c) => {
                            if (c.slug !== activeChatSlug) return c;
                            return {
                                ...c,
                                participants: (c.participants || []).map((p) =>
                                    p.user?.username === username ? { ...p, role: newRole } : p
                                ),
                            };
                        })
                    );
                    notifySuccess(t(`api.success.${res.code || 'GROUP_ROLE_UPDATED'}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setChats, t]
    );

    const handleKickGroupMember = useCallback(
        (username: string) => {
            if (!activeChatSlug || !username) return;
            chatService
                .kickGroupMember(activeChatSlug, username)
                .onSuccess((res) => {
                    setChats((prev) =>
                        prev.map((c) => {
                            if (c.slug !== activeChatSlug) return c;
                            const updatedParticipants = (c.participants || []).filter(
                                (p) => p.user?.username !== username
                            );
                            return {
                                ...c,
                                participants: updatedParticipants,
                                participants_count: updatedParticipants.length,
                            };
                        })
                    );
                    notifySuccess(t(`api.success.${res.code || 'GROUP_MEMBER_KICKED'}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setChats, t]
    );

    return {
        handleUpdateGroupInfo,
        handleInviteGroupMember,
        handleUpdateGroupMemberRole,
        handleKickGroupMember,
    };
}