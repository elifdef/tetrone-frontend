import { useCallback, type Dispatch, type MouseEvent, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import type { SetURLSearchParams } from 'react-router';
import chatService from '@/services/chat.service';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import type { ChatData, ChatInitResponse, ChatMessageItem } from '@/types/chat';
import type { TipTapDoc } from '@/types/user';

const MAX_PINNED_CHATS = 5;

export interface CreateNewChatParams {
    isGroup?: boolean;
    targetUsername?: string;
    title?: TipTapDoc | string | null;
    description?: TipTapDoc | string | null;
    participantUsernames?: string[];
    avatarFile?: File | null;
    onSuccess?: (res: ChatInitResponse) => void;
    onFinally?: () => void;
}

export interface UseChatListActionsParams {
    chats: ChatData[];
    setChats: Dispatch<SetStateAction<ChatData[]>>;
    activeChat: ChatData | null;
    activeChatSlug: string | null;
    openedChatSlugs: string[];
    setOpenedChatSlugs: Dispatch<SetStateAction<string[]>>;
    setMessagesMap: Dispatch<SetStateAction<Record<string, ChatMessageItem[]>>>;
    setSelectedMessageUuids: Dispatch<SetStateAction<string[]>>;
    setReplyingTo: Dispatch<SetStateAction<ChatMessageItem | null>>;
    setEditingMessage: Dispatch<SetStateAction<ChatMessageItem | null>>;
    setSearchParams: SetURLSearchParams;
}

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
    setSearchParams,
}: UseChatListActionsParams) {
    const { t } = useTranslation();

    const handleSelectChat = useCallback(
        (chatSlug: string | null | undefined) => {
            if (!chatSlug || chatSlug === 'undefined' || chatSlug === 'null') return;
            const slugStr = String(chatSlug);
            setOpenedChatSlugs((prev) => (prev.includes(slugStr) ? prev : [...prev, slugStr]));
            setSelectedMessageUuids([]);
            setReplyingTo(null);
            setEditingMessage(null);

            if (slugStr === 'saved') {
                setSearchParams({ saved: '' });
                return;
            }
            const targetChat = chats.find((c) => c.slug === slugStr);
            if (targetChat?.is_group) {
                setSearchParams({ gc: slugStr });
            } else {
                setSearchParams({ dm: slugStr });
            }
        },
        [chats, setOpenedChatSlugs, setSelectedMessageUuids, setReplyingTo, setEditingMessage, setSearchParams]
    );

    const handleBackToInbox = useCallback(() => {
        setSelectedMessageUuids([]);
        setSearchParams({});
    }, [setSelectedMessageUuids, setSearchParams]);

    const handleCloseChatTab = useCallback(
        (e: MouseEvent, chatSlug: string) => {
            e.stopPropagation();
            const slugStr = String(chatSlug);
            const nextOpenedChats = openedChatSlugs.filter((slug) => slug !== slugStr);
            setOpenedChatSlugs(nextOpenedChats);

            if (activeChatSlug !== slugStr) return;
            if (nextOpenedChats.length > 0) {
                handleSelectChat(nextOpenedChats[nextOpenedChats.length - 1]);
            } else {
                setSelectedMessageUuids([]);
                setSearchParams({});
            }
        },
        [activeChatSlug, openedChatSlugs, setOpenedChatSlugs, handleSelectChat, setSelectedMessageUuids, setSearchParams]
    );

    const handleMarkAllAsRead = useCallback(() => {
        chatService
            .markAllAsRead()
            .onSuccess(() => {
                setChats((prev) => prev.map((c) => ({ ...c, unread_count: 0, is_last_unread: false })));
            })
    }, [setChats]);

    const handleTogglePinChat = useCallback(
        (chatSlug: string) => {
            const target = chats.find((c) => c.slug === chatSlug);
            if (!target) return;
            const nextPinnedState = !target.is_pinned;

            if (nextPinnedState) {
                const currentPinnedCount = chats.filter((c) => c.is_pinned && !c.is_saved).length;
                if (currentPinnedCount >= MAX_PINNED_CHATS) {
                    notifyError(t('chat.errors.max_pinned_chats', { count: MAX_PINNED_CHATS }));
                    return;
                }
            }

            chatService
                .togglePinChat(chatSlug, nextPinnedState)
                .onSuccess(() => {
                    setChats((prev) => prev.map((c) => (c.slug === chatSlug ? { ...c, is_pinned: nextPinnedState } : c)));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [chats, setChats, t]
    );

    const handleMarkChatUnread = useCallback(
        (chatSlug: string) => {
            chatService
                .markAsUnread(chatSlug)
                .onSuccess(() => {
                    setChats((prev) =>
                        prev.map((c) =>
                            c.slug === chatSlug
                                ? { ...c, is_last_unread: true, unread_count: Math.max(1, c.unread_count) }
                                : c
                        )
                    );
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [setChats, t]
    );

    const handleMuteChat = useCallback(
        (chatSlug: string, duration: string | null) => {
            chatService
                .muteChat(chatSlug, duration)
                .onSuccess(() => {
                    setChats((prev) => prev.map((c) => (c.slug === chatSlug ? { ...c, muted_until: duration } : c)));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [setChats, t]
    );

    const handleClearChatHistory = useCallback(
        (chatSlug: string) => {
            chatService
                .clearChatHistory(chatSlug)
                .onSuccess(() => {
                    setMessagesMap((prev) => ({ ...prev, [chatSlug]: [] }));
                    setChats((prev) =>
                        prev.map((c) =>
                            c.slug === chatSlug
                                ? {
                                      ...c,
                                      last_message: null,
                                      last_message_files: [],
                                      last_message_shareable: null,
                                      unread_count: 0,
                                      is_last_unread: false,
                                  }
                                : c
                        )
                    );
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [setMessagesMap, setChats, t]
    );

    const handleDeleteChat = useCallback(
        (chatSlug?: string, forBoth = false) => {
            const slugStr = chatSlug || activeChatSlug;
            if (!slugStr) return;
            chatService
                .deleteChat(slugStr, forBoth)
                .onSuccess((res) => {
                    setChats((prev) => prev.filter((c) => c.slug !== slugStr));
                    setOpenedChatSlugs((prev) => prev.filter((s) => s !== slugStr));
                    if (activeChatSlug === slugStr) {
                        setSearchParams({});
                    }
                    notifySuccess(t(`code.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setChats, setOpenedChatSlugs, setSearchParams, t]
    );

    const handleCreateNewChat = useCallback(
        ({
            isGroup = true,
            targetUsername = '',
            title = null,
            description = '',
            participantUsernames = [],
            avatarFile = null,
            onSuccess,
            onFinally,
        }: CreateNewChatParams) => {
            const req = !isGroup
                ? chatService.initChat(targetUsername)
                : chatService.createGroupChat(title, description, participantUsernames, avatarFile);

            req.onSuccess((res) => {
                if (res?.chat) {
                    setChats((prev) => (prev.some((c) => c.slug === res.chat.slug) ? prev : [res.chat, ...prev]));
                }
                if (isGroup && res?.code) {
                    notifySuccess(t(`code.${res.code}`));
                }
                onSuccess?.(res);
                if (res?.slug) {
                    handleSelectChat(res.slug);
                }
            })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                })
                .onFinally(() => {
                    onFinally?.();
                });
        },
        [setChats, handleSelectChat, t]
    );

    const handleBlockUser = useCallback(
        (username?: string) => {
            const targetUsername = username || activeChat?.target_user?.username;
            if (!targetUsername) return;
            chatService
                .blockUser(targetUsername)
                .onSuccess((res) => {
                    if (activeChatSlug) {
                        setChats((prev) =>
                            prev.map((c) => (c.slug === activeChatSlug ? { ...c, is_blocked: true } : c))
                        );
                    }
                    notifySuccess(t(`code.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChat, activeChatSlug, setChats, t]
    );

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
        handleBlockUser,
    };
}