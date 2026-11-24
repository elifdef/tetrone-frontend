import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { AuthContext } from '@context/AuthContext';
import { useSocket } from '@context/SocketContext';
import { ChatContext } from '@context/ChatContext';
import chatService from '@services/chat.service';
import friendService from '@services/friend.service';
import { getPlainText } from '../utils/messageParser';
import { notifyError } from '../../common/Notify';
import { useChatDrafts } from './useChatDrafts.js';
import { useChatSocket } from './useChatSocket.js';
import { useChatListActions } from './useChatListActions.js';
import { useMessageActions } from './useMessageActions.js';
import { useGroupActions } from './useGroupActions';
import type { ChatData, ChatMessageItem } from '@/types/chat';
import type { UserData } from '@/types/user';

export interface PendingForwardState {
    sourceChatSlug: string;
    messageUuids: string[];
    items: ChatMessageItem[];
}

export function useChatPage() {
    const { t } = useTranslation();
    const authContext = useContext(AuthContext) as { user?: UserData | null } | undefined;
    const currentUser = authContext?.user ?? null;
    const socketContext = useSocket() as unknown as {
        socket?: { emit: (event: string, payload: unknown) => void };
    } | null;
    const socket = socketContext?.socket;
    const chatContext = useContext(ChatContext) as {
        chats: ChatData[];
        setChats: Dispatch<SetStateAction<ChatData[]>>;
    };
    const { chats, setChats } = chatContext;
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
            setOpenedChatSlugs((prev) => (prev.includes(activeChatSlug) ? prev : [...prev, activeChatSlug]));
            if (socket) {
                socket.emit('chat:join', { chat_slug: activeChatSlug });
            }
            chatService
                .getMessages(activeChatSlug)
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
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
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
        () => openedChatSlugs.map((slug) => chats.find((c) => c.slug === slug)).filter((c): c is ChatData => Boolean(c)),
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
        if (!activeChatSlug || isLoadingMore) return;
        setIsLoadingMore(true);
        chatService
            .getMessages(activeChatSlug, 2)
            .onSuccess(() => {
                setIsLoadingMore(false);
                setHasMoreMessages(false);
            })
            .onError(() => {
                setIsLoadingMore(false);
            });
    }, [activeChatSlug, isLoadingMore]);

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
        isTyping: Boolean(activeChatSlug && (typingUsers as Record<string, unknown>)[activeChatSlug]),
        typingUser: activeChatSlug ? (typingUsers as Record<string, unknown>)[activeChatSlug] : undefined,
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