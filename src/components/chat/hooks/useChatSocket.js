import { useState, useEffect, useCallback, useRef } from 'react';
import chatService from '../../../services/chat.service.js';

const playIncomingMessageSound = () => {
    try {
        const audio = new Audio('/sounds/IR End.mp3');
        audio.volume = 0.31415;
        audio.play().catch(() => {});
    } catch {
        // ignore audio autoplay restriction
    }
};

const normalizeSocketMessage = (msg, slug, currentUser) => {
    const isOwnAuthor = Boolean(
        currentUser?.username &&
        msg.author?.username === currentUser.username &&
        msg.author_type !== 'group'
    );
    const isMine = Boolean(msg.isMine || isOwnAuthor);
    const isSaved = slug === 'saved';
    const canDelete = Boolean(msg.can_delete || isMine || isSaved);
    const canEdit = Boolean(msg.can_edit || (isMine && !msg.forwarded_from));

    return {
        ...msg,
        isMine,
        can_delete: canDelete,
        can_edit: canEdit,
    };
};

export function useChatSocket({ socket, activeChatSlug, activeChat, canWrite = true, currentUser, setChats, setMessagesMap }) {
    const [typingUsers, setTypingUsers] = useState({});
    const typingTimeoutRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessageSent = (data) => {
            if (!data?.slug || !data?.message) return;
            const slug = data.slug;
            const normalizedMessage = normalizeSocketMessage(data.message, slug, currentUser);

            setMessagesMap(prev => {
                const currentMsgs = prev[slug] || [];
                if (currentMsgs.some(m => m.uuid === normalizedMessage.uuid)) return prev;
                return { ...prev, [slug]: [...currentMsgs, normalizedMessage] };
            });

            if (activeChatSlug === slug && !normalizedMessage.isMine && normalizedMessage.author?.username !== currentUser?.username) {
                chatService.markAsRead(slug);
                playIncomingMessageSound();
            }

            setChats(prev => {
                const exists = prev.some(c => c.slug === slug);
                if (!exists) {
                    chatService.getChats().onSuccess((r) => {
                        if (Array.isArray(r?.chats)) setChats(r.chats);
                    });
                    return prev;
                }
                return prev.map(c => {
                    if (c.slug === slug) {
                        return {
                            ...c,
                            last_message: data.message.text,
                            last_message_files: data.message.files || [],
                            last_message_shareable: data.message.shareable || null,
                            last_message_sender_username: data.message.author?.username,
                            last_message_author: data.message.author,
                            last_message_author_type: data.message.author_type || 'user',
                            updated_at: data.message.created_at,
                            unread_count: activeChatSlug === slug ? 0 : (c.unread_count || 0) + 1,
                            is_last_unread: activeChatSlug !== slug
                        };
                    }
                    return c;
                });
            });
        };

        const handleTypingStart = (data) => {
            if (!data?.chat_slug || data.sender_username === currentUser?.username) return;
            const slug = data.chat_slug;
            setTypingUsers(prev => ({
                ...prev,
                [slug]: data.user || { username: data.sender_username, first_name: data.sender_username }
            }));
            setChats(prev => prev.map(c => (c.slug === slug ? { ...c, is_typing: true } : c)));
        };

        const handleTypingStop = (data) => {
            if (!data?.chat_slug || data.sender_username === currentUser?.username) return;
            const slug = data.chat_slug;
            setTypingUsers(prev => {
                const copy = { ...prev };
                delete copy[slug];
                return copy;
            });
            setChats(prev => prev.map(c => (c.slug === slug ? { ...c, is_typing: false } : c)));
        };

        const handleMessageUpdated = (data) => {
            if (!data?.slug || !data?.uuid) return;
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).map(m =>
                    m.uuid === data.uuid
                        ? {
                            ...m,
                            ...data.message,
                            isMine: m.isMine,
                            can_edit: m.can_edit,
                            can_delete: m.can_delete,
                            is_edited: true
                        }
                        : m
                )
            }));
        };

        const handleMessageDeleted = (data) => {
            if (!data?.slug || !Array.isArray(data?.message_uuids)) return;
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).filter(m => !data.message_uuids.includes(m.uuid))
            }));
        };

        const handleMessagePinned = (data) => {
            if (!data?.slug || !data?.uuid) return;
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).map(m =>
                    m.uuid === data.uuid ? { ...m, is_pinned: data.is_pinned } : { ...m, is_pinned: false }
                )
            }));
        };

        const handleChatRead = (data) => {
            if (!data?.slug) return;
            setChats(prev => prev.map(c => (c.slug === data.slug ? { ...c, unread_count: 0, is_last_unread: false } : c)));
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).map(m => ({ ...m, status: 'read', read_at: data.read_at || new Date().toISOString() }))
            }));
        };

        socket.on('chat.message.sent', handleMessageSent);
        socket.on('chat.message.updated', handleMessageUpdated);
        socket.on('chat.message.deleted', handleMessageDeleted);
        socket.on('chat.message.pinned', handleMessagePinned);
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);
        socket.on('chat.read', handleChatRead);

        return () => {
            socket.off('chat.message.sent', handleMessageSent);
            socket.off('chat.message.updated', handleMessageUpdated);
            socket.off('chat.message.deleted', handleMessageDeleted);
            socket.off('chat.message.pinned', handleMessagePinned);
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_stop', handleTypingStop);
            socket.off('chat.read', handleChatRead);
        };
    }, [socket, activeChatSlug, currentUser, setChats, setMessagesMap]);

    const handleTyping = useCallback(() => {
        if (!socket || !activeChatSlug || !canWrite) return;
        const receiverUsername = activeChat?.target_user?.username;
        socket.emit('typing_start', {
            chat_slug: activeChatSlug,
            receiver_username: receiverUsername
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            if (socket) {
                socket.emit('typing_stop', {
                    chat_slug: activeChatSlug,
                    receiver_username: receiverUsername
                });
            }
        }, 2500);
    }, [socket, activeChatSlug, activeChat, canWrite]);

    return {
        typingUsers,
        handleTyping
    };
}