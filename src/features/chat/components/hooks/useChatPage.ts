import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { AuthContext } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { ChatContext } from '@/context/ChatContext';
import chatService from '@/services/chat.service';
import friendService from '@/services/friend.service';
import { getPlainText } from '../utils/messageParser';
import { notifyError } from '@/components/common/Notify';
import { useChatDrafts } from './useChatDrafts';
import { useChatSocket, type ChatSocketLike } from './useChatSocket';
import { useChatListActions } from './useChatListActions';
import { useMessageActions } from './useMessageActions';
import { useGroupActions } from './useGroupActions';
import type { ChatData, ChatMessageItem, PendingForwardState } from '@/types/chat';
import type { UserData } from '@/types/user';

export type { PendingForwardState };

export function useChatPage() {
    const { t } = useTranslation();
    const { user: currentUser = null } = useContext(AuthContext);
    const socketContext = useSocket();
    const socket = socketContext?.socket as ChatSocketLike | null | undefined;
    const { chats, setChats } = useContext(ChatContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const activeChatSlug = useMemo<string | null>(() => {
        if (searchParams.has('saved')) return 'saved';
        return searchParams.get('dm') || searchParams.get('gc') || null;
    }, [searchParams]);

    const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessageItem[]>>({});
    const [openedChatSlugs, setOpenedChatSlugs] = useState<string[]>(() =>
        activeChatSlug ? [activeChatSlug] : []
    );
    const [selectedMessageUuids, setSelectedMessageUuids] = useState<string[]>([]);
    const [friendsList, setFriendsList] = useState<UserData[]>([]);
    const [sendAsGroup, setSendAsGroup] = useState<boolean>(false);

    useEffect(() => {
        const controller = new AbortController();
        friendService
            .getList('friends', '', controller.signal)
            .onSuccess((res) => {
                if (!controller.signal.aborted) {
                    setFriendsList(Array.isArray(res?.users) ? res.users : []);
                }
            })
            .onError(() => {
                if (!controller.signal.aborted) {
                    setFriendsList([]);
                }
            });

        return () => controller.abort();
    }, []);

    const [editorResetKey, setEditorResetKey] = useState<number>(0);
    const [editingMessage, setEditingMessage] = useState<ChatMessageItem | null>(null);
    const [replyingTo, setReplyingTo] = useState<ChatMessageItem | null>(null);
    const [pendingForward, setPendingForward] = useState<PendingForwardState | null>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
    const [hasMoreMessages, setHasMoreMessages] = useState<boolean>(false);
    const [isBannerVisible, setIsBannerVisible] = useState<boolean>(() => {
        return localStorage.getItem('tetrone_hide_im_banner') !== 'true';
    });

    const activeChat = useMemo<ChatData | null>(
        () => chats.find((c) => c.slug === activeChatSlug) || null,
        [chats, activeChatSlug]
    );

    const canWrite = useMemo<boolean>(() => {
        if (!activeChat) return false;
        if (activeChat.can_send_message === false) return false;
        if (activeChat.target_user?.is_deleted || activeChat.target_user?.is_banned || activeChat.is_blocked) {
            return false;
        }
        return true;
    }, [activeChat]);

    const cantWriteReason = useMemo<string>(() => {
        if (!activeChat || canWrite) return '';
        if (activeChat.target_user?.is_deleted) return t('chat.cannot_write_deleted');
        if (activeChat.target_user?.is_banned) return t('chat.cannot_write_banned');
        if (activeChat.is_blocked) return t('chat.cannot_write_blocked');
        return t('chat.cannot_write');
    }, [activeChat, canWrite, t]);

    const drafts = useChatDrafts(activeChatSlug);

    const { typingUsers, handleTyping } = useChatSocket({
        socket,
        activeChatSlug,
        activeChat,
        canWrite,
        currentUser,
        setChats,
        setMessagesMap,
    });

    const listActions = useChatListActions({
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
    });

    const messageActions = useMessageActions({
        activeChatSlug,
        currentUser,
        text: drafts.text,
        setText: drafts.setText,
        files: drafts.files,
        setFiles: drafts.setFiles,
        editingMessage,
        setEditingMessage,
        replyingTo,
        setReplyingTo,
        pendingForward,
        setPendingForward,
        sendAsGroup,
        selectedMessageUuids,
        setSelectedMessageUuids,
        setMessagesMap,
        setChats,
        setEditorResetKey,
        handleSelectChat: listActions.handleSelectChat,
    });

    const groupActions = useGroupActions({
        activeChatSlug,
        setChats,
    });

    useEffect(() => {
        if (activeChatSlug) {
            setSendAsGroup(false);
            setCurrentPage(1);
            setHasMoreMessages(false);
            setOpenedChatSlugs((prev) => (prev.includes(activeChatSlug) ? prev : [...prev, activeChatSlug]));
            if (socket) {
                socket.emit('chat:join', { chat_slug: activeChatSlug });
            }
            chatService
                .getMessages(activeChatSlug, 1)
                .onSuccess((res) => {
                    if (res?.chat) {
                        const updatedChat = res.chat;
                        setChats((prev) =>
                            prev.some((c) => c.slug === updatedChat.slug)
                                ? prev.map((c) => (c.slug === updatedChat.slug ? updatedChat : c))
                                : [updatedChat, ...prev]
                        );
                    }
                    if (Array.isArray(res?.messages)) {
                        const sorted = [...res.messages].sort(
                            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                        setMessagesMap((prev) => ({ ...prev, [activeChatSlug]: sorted }));
                    }
                    setHasMoreMessages(Boolean(res?.meta?.has_more));
                    setCurrentPage(res?.meta?.current_page ?? 1);
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });

            if (activeChatSlug !== 'saved') {
                chatService.markAsRead(activeChatSlug).onSuccess(() => {
                    setChats((prev) =>
                        prev.map((c) =>
                            c.slug === activeChatSlug ? { ...c, unread_count: 0, is_last_unread: false } : c
                        )
                    );
                    setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).map((m) => ({
                            ...m,
                            status: 'read',
                            read_at: m.read_at || new Date().toISOString(),
                        })),
                    }));
                });
            }

            return () => {
                if (socket) {
                    socket.emit('chat:leave', { chat_slug: activeChatSlug });
                }
            };
        }
        return undefined;
    }, [activeChatSlug, socket, setChats, t]);

    const openedChats = useMemo(
        () =>
            openedChatSlugs
                .map((slug) => chats.find((c) => c.slug === slug))
                .filter((c): c is ChatData => Boolean(c)),
        [openedChatSlugs, chats]
    );

    const messages = useMemo(
        () => (activeChatSlug ? messagesMap[activeChatSlug] || [] : []),
        [messagesMap, activeChatSlug]
    );

    const sortedAndSearchedChats = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const filtered = chats.filter((chat) => {
            if (!query) return true;
            const chatTitle = chat.is_saved
                ? t('chat.saved_messages').toLowerCase()
                : chat.is_group
                  ? getPlainText(chat.title).toLowerCase()
                  : `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''}`.toLowerCase();
            const lastMsg = getPlainText(chat.last_message || '').toLowerCase();
            const historyMatch = (messagesMap[chat.slug] || []).some((m) =>
                getPlainText(m.text).toLowerCase().includes(query)
            );
            return chatTitle.includes(query) || lastMsg.includes(query) || historyMatch;
        });

        return [...filtered].sort((a, b) => {
            if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
                return a.is_pinned ? -1 : 1;
            }
            return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        });
    }, [chats, messagesMap, searchQuery, t]);

    const handleDismissBanner = useCallback(() => {
        localStorage.setItem('tetrone_hide_im_banner', 'true');
        setIsBannerVisible(false);
    }, []);

    const getReplyName = useCallback((): string => {
        if (!replyingTo) return '';
        if (replyingTo.author_type === 'group') return getPlainText(activeChat?.title ?? null);
        return replyingTo.isMine
            ? currentUser?.first_name || ''
            : replyingTo.author?.first_name || activeChat?.target_user?.first_name || '';
    }, [replyingTo, currentUser, activeChat]);

    const handleLoadMoreMessages = useCallback(() => {
        if (!activeChatSlug || isLoadingMore || !hasMoreMessages) return;
        const nextPage = currentPage + 1;
        setIsLoadingMore(true);
        chatService
            .getMessages(activeChatSlug, nextPage)
            .onSuccess((res) => {
                if (Array.isArray(res?.messages) && res.messages.length > 0) {
                    setMessagesMap((prev) => {
                        const existing = prev[activeChatSlug] || [];
                        const existingIds = new Set(existing.map((m) => m.uuid));
                        const older = res.messages.filter((m) => !existingIds.has(m.uuid));
                        const merged = [...older, ...existing].sort(
                            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                        return { ...prev, [activeChatSlug]: merged };
                    });
                }
                setCurrentPage(res?.meta?.current_page ?? nextPage);
                setHasMoreMessages(Boolean(res?.meta?.has_more));
                setIsLoadingMore(false);
            })
            .onError(() => {
                setIsLoadingMore(false);
            });
    }, [activeChatSlug, isLoadingMore, hasMoreMessages, currentPage]);

    const handleStartForward = useCallback(
        (uuids: string[]) => {
            if (!activeChatSlug || !Array.isArray(uuids) || uuids.length === 0) return;
            const currentMessages = messagesMap[activeChatSlug] || [];
            const items = currentMessages.filter((m) => uuids.includes(m.uuid));
            setPendingForward({
                sourceChatSlug: activeChatSlug,
                messageUuids: uuids,
                items,
            });
            setSelectedMessageUuids([]);
            setEditingMessage(null);
            setReplyingTo(null);
            setSearchParams({});
        },
        [activeChatSlug, messagesMap, setSelectedMessageUuids, setEditingMessage, setReplyingTo, setSearchParams]
    );

    const activeTypingUser = activeChatSlug ? typingUsers[activeChatSlug] : undefined;

    const layoutProps = {
        currentUser,
        friendsList,
        chats: sortedAndSearchedChats,
        allChats: chats,
        openedChats,
        sendAsGroup,
        setSendAsGroup,
        editorResetKey,
        messages,
        activeChat,
        activeChatSlug,
        selectedMessageUuids,
        searchQuery,
        setSearchQuery,
        isBannerVisible,
        handleDismissBanner,
        isTyping: Boolean(activeTypingUser),
        typingUser: activeTypingUser,
        onTyping: handleTyping,
        isLoadingMore,
        hasMoreMessages,
        onLoadMore: handleLoadMoreMessages,
        canWrite,
        cantWriteReason,
        ...drafts,
        ...listActions,
        ...messageActions,
        handleDelete: messageActions.handleDeleteClick,
        ...groupActions,
        editingMessage,
        replyingTo,
        setReplyingTo,
        replyingToName: getReplyName(),
        pendingForward,
        setPendingForward,
        handleStartForward,
    };

    return { layoutProps };
}