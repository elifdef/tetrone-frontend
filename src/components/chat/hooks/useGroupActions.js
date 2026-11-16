import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import chatService from '../../../services/chat.service.js';
import { toTipTapDoc } from '../utils/messageParser.js';
import { notifySuccess, notifyError } from '../../common/Notify.jsx';

export function useGroupActions({ activeChatSlug, setChats }) {
    const { t } = useTranslation();

    const handleUpdateGroupInfo = useCallback((title, description) => {
        if (!activeChatSlug) return;
        const tiptapTitle = toTipTapDoc(title);
        const tiptapDesc = toTipTapDoc(description);
        chatService.updateGroupInfo(activeChatSlug, tiptapTitle, tiptapDesc)
            .onSuccess(() => {
                setChats(prev =>
                    prev.map(c => (c.slug === activeChatSlug ? { ...c, title: tiptapTitle, description: tiptapDesc } : c))
                );
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, setChats, t]);

    const handleInviteGroupMember = useCallback((username) => {
        if (!activeChatSlug) return;
        chatService.inviteGroupMember(activeChatSlug, username)
            .onSuccess(() => {})
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleUpdateGroupMemberRole = useCallback((username, newRole) => {
        if (!activeChatSlug) return;
        chatService.updateGroupMemberRole(activeChatSlug, username, newRole)
            .onSuccess(() => {
                setChats(prev =>
                    prev.map(c => {
                        if (c.slug !== activeChatSlug) return c;
                        return {
                            ...c,
                            participants: (c.participants || []).map(p =>
                                p.user.username === username ? { ...p, role: newRole } : p
                            )
                        };
                    })
                );
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, setChats, t]);

    const handleKickGroupMember = useCallback((username) => {
        if (!activeChatSlug) return;
        chatService.kickGroupMember(activeChatSlug, username)
            .onSuccess((res) => {
                setChats(prev =>
                    prev.map(c => {
                        if (c.slug !== activeChatSlug) return c;
                        const updatedParticipants = (c.participants || []).filter(p => p.user.username !== username);
                        return {
                            ...c,
                            participants: updatedParticipants,
                            participants_count: updatedParticipants.length
                        };
                    })
                );
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, setChats, t]);

    return {
        handleUpdateGroupInfo,
        handleInviteGroupMember,
        handleUpdateGroupMemberRole,
        handleKickGroupMember
    };
}