import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import { ChatContext } from '../../../context/ChatContext';
import chatService from '../../../services/chat.service.js';
import { getPlainText } from '../utils/messageParser.js';
import { notifyError } from '../../common/Notify.jsx';

import { useChatDrafts } from './useChatDrafts.js';
import { useChatSocket } from './useChatSocket.js';
import { useChatListActions } from './useChatListActions.js';
import { useMessageActions } from './useMessageActions.js';
import { useGroupActions } from './useGroupActions.js';

export function useChatPage() {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext) || {};
    const currentUser = authUser;
    const { socket } = useSocket();
    const { chats, setChats } = useContext(ChatContext);
    const [searchParams, setSearchParams] = useSearchParams();

    const activeChatSlug = useMemo(() => {
        if (searchParams.has('saved')) return 'saved';
        return searchParams.get('dm') || searchParams.get('gc') || null;
    }, [searchParams]);

    const [messagesMap, setMessagesMap] = useState({});
    const [openedChatSlugs, setOpenedChatSlugs] = useState(() => (activeChatSlug ? [activeChatSlug] : []));
    const [selectedMessageUuids, setSelectedMessageUuids] = useState([]);
    const [friendsList, setFriendsList] = useState([]);
    const [sendAsGroup, setSendAsGroup] = useState(false);
    const [editorResetKey, setEditorResetKey] = useState(0);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [pendingForward, setPendingForward] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);
    const [isBannerVisible, setIsBannerVisible] = useState(() => {
        return localStorage.getItem('tetrone_hide_im_banner') !== 'true';
    });

    const activeChat = useMemo(
        () => chats.find(c => c.slug === activeChatSlug) || null,
        [chats, activeChatSlug]
    );

    const canWrite = useMemo(() => {
        if (!activeChat) return false;
        if (activeChat.can_send_message === false) return false;
        if (activeChat.target_user?.is_deleted || activeChat.target_user?.is_banned || activeChat.is_blocked) {
            return false;
        }
        return true;
    }, [activeChat]);

    const cantWriteReason = useMemo(() => {
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
        setMessagesMap
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
        setSearchParams
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
        handleSelectChat: listActions.handleSelectChat
    });

    const groupActions = useGroupActions({
        activeChatSlug,
        setChats
    });

    useEffect(() => {
        if (activeChatSlug) {
            setSendAsGroup(false);
            setOpenedChatSlugs(prev => (prev.includes(activeChatSlug) ? prev : [...prev, activeChatSlug]));
            if (socket) {
                socket.emit('chat:join', { chat_slug: activeChatSlug });
            }
            chatService.getMessages(activeChatSlug)
                .onSuccess((res) => {
                    if (res?.chat) {
                        setChats(prev =>
                            prev.some(c => c.slug === res.chat.slug)
                                ? prev.map(c => (c.slug === res.chat.slug ? res.chat : c))
                                : [res.chat, ...prev]
                        );
                    }
                    if (Array.isArray(res?.messages)) {
                        const sorted = [...res.messages].sort(
                            (a, b) => new Date(a.created_at) - new Date(b.created_at)
                        );
                        setMessagesMap(prev => ({ ...prev, [activeChatSlug]: sorted }));
                    }
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });

            if (activeChatSlug !== 'saved') {
                chatService.markAsRead(activeChatSlug)
                    .onSuccess(() => {
                        setChats(prev =>
                            prev.map(c => (c.slug === activeChatSlug ? { ...c, unread_count: 0, is_last_unread: false } : c))
                        );
                        setMessagesMap(prev => ({
                            ...prev,
                            [activeChatSlug]: (prev[activeChatSlug] || []).map(m => ({ ...m, status: 'read', read_at: m.read_at || new Date().toISOString() }))
                        }));
                    });
            }

            return () => {
                if (socket) {
                    socket.emit('chat:leave', { chat_slug: activeChatSlug });
                }
            };
        }
    }, [activeChatSlug, socket, setChats, t]);

    const openedChats = useMemo(
        () => openedChatSlugs.map(slug => chats.find(c => c.slug === slug)).filter(Boolean),
        [openedChatSlugs, chats]
    );

    const messages = useMemo(
        () => (activeChatSlug ? messagesMap[activeChatSlug] || [] : []),
        [messagesMap, activeChatSlug]
    );

    const sortedAndSearchedChats = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        const filtered = chats.filter(chat => {
            if (!query) return true;
            const chatTitle = chat.is_saved
                ? t('chat.saved_messages').toLowerCase()
                : chat.is_group
                    ? getPlainText(chat.title).toLowerCase()
                    : `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''}`.toLowerCase();
            const lastMsg = getPlainText(chat.last_message || '').toLowerCase();
            const historyMatch = (messagesMap[chat.slug] || []).some(m =>
                getPlainText(m.text).toLowerCase().includes(query)
            );
            return chatTitle.includes(query) || lastMsg.includes(query) || historyMatch;
        });

        return [...filtered].sort((a, b) => {
            if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
                return a.is_pinned ? -1 : 1;
            }
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
    }, [chats, messagesMap, searchQuery, t]);

    const handleDismissBanner = useCallback(() => {
        localStorage.setItem('tetrone_hide_im_banner', 'true');
        setIsBannerVisible(false);
    }, []);

    const getReplyName = useCallback(() => {
        if (!replyingTo) return '';
        if (replyingTo.author_type === 'group') return getPlainText(activeChat?.title);
        return replyingTo.isMine
            ? currentUser?.first_name
            : (replyingTo.author?.first_name || activeChat?.target_user?.first_name || '');
    }, [replyingTo, currentUser, activeChat]);

    const handleLoadMoreMessages = useCallback(() => {
        if (!activeChatSlug || isLoadingMore) return;
        setIsLoadingMore(true);
        chatService.getMessages(activeChatSlug, 2)
            .onSuccess(() => {
                setIsLoadingMore(false);
                setHasMoreMessages(false);
            })
            .onError(() => {
                setIsLoadingMore(false);
            });
    }, [activeChatSlug, isLoadingMore]);

    const handleStartForward = useCallback((uuids) => {
        if (!activeChatSlug || !Array.isArray(uuids) || uuids.length === 0) return;
        const currentMessages = messagesMap[activeChatSlug] || [];
        const items = currentMessages.filter(m => uuids.includes(m.uuid));
        setPendingForward({
            sourceChatSlug: activeChatSlug,
            messageUuids: uuids,
            items
        });
        setSelectedMessageUuids([]);
        setEditingMessage(null);
        setReplyingTo(null);
        setSearchParams({});
    }, [activeChatSlug, messagesMap, setSelectedMessageUuids, setEditingMessage, setReplyingTo, setSearchParams]);

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
        isTyping: Boolean(typingUsers[activeChatSlug]),
        typingUser: typingUsers[activeChatSlug],
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