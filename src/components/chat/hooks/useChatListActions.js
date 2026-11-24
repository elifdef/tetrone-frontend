import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import chatService from '../../../services/chat.service.js';
import { notifySuccess, notifyError } from '../../common/Notify.jsx';

const MAX_PINNED_CHATS = 5;

export function useChatListActions({
    chats,
    setChats,
    activeChat,
    activeChatSlug,
    openedChatSlugs,
    setOpenedChatSlugs,
    setMessagesMap,
    setSelectedMessageUuids,
    setReplyingTo,
    setEditingMessage,
    setSearchParams
}) {
    const { t } = useTranslation();

    const handleSelectChat = useCallback((chatSlug) => {
        if (!chatSlug || chatSlug === 'undefined' || chatSlug === 'null') return;
        const slugStr = String(chatSlug);
        setOpenedChatSlugs(prev => (prev.includes(slugStr) ? prev : [...prev, slugStr]));
        setSelectedMessageUuids([]);
        setReplyingTo(null);
        setEditingMessage(null);

        if (slugStr === 'saved') {
            setSearchParams({ saved: '' });
            return;
        }
        const targetChat = chats.find(c => c.slug === slugStr);
        if (targetChat?.is_group) {
            setSearchParams({ gc: slugStr });
        } else {
            setSearchParams({ dm: slugStr });
        }
    }, [chats, setOpenedChatSlugs, setSelectedMessageUuids, setReplyingTo, setEditingMessage, setSearchParams]);

    const handleBackToInbox = useCallback(() => {
        setSelectedMessageUuids([]);
        setSearchParams({});
    }, [setSelectedMessageUuids, setSearchParams]);

    const handleCloseChatTab = useCallback((e, chatSlug) => {
        e.stopPropagation();
        const slugStr = String(chatSlug);
        const nextOpenedChats = openedChatSlugs.filter(slug => slug !== slugStr);
        setOpenedChatSlugs(nextOpenedChats);

        if (activeChatSlug !== slugStr) return;
        if (nextOpenedChats.length > 0) {
            handleSelectChat(nextOpenedChats[nextOpenedChats.length - 1]);
        } else {
            setSelectedMessageUuids([]);
            setSearchParams({});
        }
    }, [activeChatSlug, openedChatSlugs, setOpenedChatSlugs, handleSelectChat, setSelectedMessageUuids, setSearchParams]);

    const handleMarkAllAsRead = useCallback(() => {
        chatService.markAllAsRead()
            .onSuccess(() => {
                setChats(prev => prev.map(c => ({ ...c, unread_count: 0, is_last_unread: false })));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [setChats, t]);

    const handleTogglePinChat = useCallback((chatSlug) => {
        const target = chats.find(c => c.slug === chatSlug);
        if (!target) return;
        const nextPinnedState = !target.is_pinned;

        if (nextPinnedState) {
            const currentPinnedCount = chats.filter(c => c.is_pinned && !c.is_saved).length;
            if (currentPinnedCount >= MAX_PINNED_CHATS) {
                notifyError(t('chat.errors.max_pinned_chats', { count: MAX_PINNED_CHATS }));
                return;
            }
        }

        chatService.togglePinChat(chatSlug, nextPinnedState)
            .onSuccess(() => {
                setChats(prev => prev.map(c => (c.slug === chatSlug ? { ...c, is_pinned: nextPinnedState } : c)));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [chats, setChats, t]);

    const handleMarkChatUnread = useCallback((chatSlug) => {
        chatService.markAsUnread(chatSlug)
            .onSuccess(() => {
                setChats(prev =>
                    prev.map(c => (c.slug === chatSlug ? { ...c, is_last_unread: true, unread_count: Math.max(1, c.unread_count) } : c))
                );
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [setChats, t]);

    const handleMuteChat = useCallback((chatSlug, duration) => {
        chatService.muteChat(chatSlug, duration)
            .onSuccess(() => {
                setChats(prev => prev.map(c => (c.slug === chatSlug ? { ...c, muted_until: duration } : c)));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [setChats, t]);

    const handleClearChatHistory = useCallback((chatSlug) => {
        chatService.clearChatHistory(chatSlug)
            .onSuccess(() => {
                setMessagesMap(prev => ({ ...prev, [chatSlug]: [] }));
                setChats(prev =>
                    prev.map(c => (c.slug === chatSlug ? { ...c, last_message: null, last_message_files: [], last_message_shareable: null, unread_count: 0, is_last_unread: false } : c))
                );
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [setMessagesMap, setChats, t]);

    const handleDeleteChat = useCallback((chatSlug, forBoth = false) => {
        const slugStr = String(chatSlug || activeChatSlug);
        if (!slugStr) return;
        chatService.deleteChat(slugStr, forBoth)
            .onSuccess((res) => {
                setChats(prev => prev.filter(c => c.slug !== slugStr));
                setOpenedChatSlugs(prev => prev.filter(s => s !== slugStr));
                if (activeChatSlug === slugStr) {
                    setSearchParams({});
                }
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, setChats, setOpenedChatSlugs, setSearchParams, t]);

    const handleCreateNewChat = useCallback(({
        isGroup = true,
        targetUsername,
        title,
        description,
        participantUsernames = [],
        avatarFile = null,
        onSuccess,
        onFinally
    }) => {
        const req = !isGroup
            ? chatService.initChat(targetUsername)
            : chatService.createGroupChat(title, description, participantUsernames, avatarFile);

        req.onSuccess((res) => {
            if (res?.chat) {
                setChats(prev => (prev.some(c => c.slug === res.chat.slug) ? prev : [res.chat, ...prev]));
            }
            if (isGroup && res?.code) {
                notifySuccess(t(`api.success.${res.code}`));
            }
            onSuccess?.(res);
            if (res?.slug) {
                handleSelectChat(res.slug);
            }
        }).onError((err) => {
            notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
        }).onFinally(() => {
            onFinally?.();
        });
    }, [setChats, handleSelectChat, t]);

    const handleBlockUser = useCallback((username) => {
        const targetUsername = username || activeChat?.target_user?.username;
        if (!targetUsername) return;
        chatService.blockUser(targetUsername)
            .onSuccess((res) => {
                if (activeChatSlug) {
                    setChats(prev => prev.map(c => (c.slug === activeChatSlug ? { ...c, is_blocked: true } : c)));
                }
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChat, activeChatSlug, setChats, t]);

    return {
        handleSelectChat,
        handleBackToInbox,
        handleCloseChatTab,
        handleMarkAllAsRead,
        handleTogglePinChat,
        handleMarkChatUnread,
        handleMuteChat,
        handleClearChatHistory,
        handleDeleteChat,
        handleCreateNewChat,
        handleBlockUser
    };
}