import { useState, useEffect, useCallback, useRef, type Dispatch, type SetStateAction } from 'react';
import chatService from '@/services/chat.service';
import type { ChatData, ChatMessageItem, TypingUserInfo } from '@/types/chat';
import type { UserData } from '@/types/user';

export interface ChatSocketLike {
    emit: (event: string, payload: unknown) => void;
    on: (event: string, handler: (...args: never[]) => void) => void;
    off: (event: string, handler: (...args: never[]) => void) => void;
}

interface MessageSentSocketPayload {
    slug?: string;
    message?: ChatMessageItem;
}

interface TypingSocketPayload {
    chat_slug?: string;
    sender_username?: string;
    user?: TypingUserInfo;
}

interface MessageUpdatedSocketPayload {
    slug?: string;
    uuid?: string;
    message?: Partial<ChatMessageItem>;
}

interface MessageDeletedSocketPayload {
    slug?: string;
    message_uuids?: string[];
}

interface MessagePinnedSocketPayload {
    slug?: string;
    uuid?: string;
    is_pinned?: boolean;
}

interface ChatReadSocketPayload {
    slug?: string;
    read_at?: string;
}

export interface UseChatSocketParams {
    socket?: ChatSocketLike | null;
    activeChatSlug: string | null;
    activeChat: ChatData | null;
    canWrite?: boolean;
    currentUser: UserData | null;
    setChats: Dispatch<SetStateAction<ChatData[]>>;
    setMessagesMap: Dispatch<SetStateAction<Record<string, ChatMessageItem[]>>>;
}

const playIncomingMessageSound = (): void => {
    try {
        const audio = new Audio('/sounds/IR End.mp3');
        audio.volume = 0.31415;
        audio.play().catch(() => {});
    } catch {
        // ignore audio autoplay restriction
    }
};

const normalizeSocketMessage = (
    msg: ChatMessageItem,
    slug: string,
    currentUser: UserData | null
): ChatMessageItem => {
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

export function useChatSocket({
    socket,
    activeChatSlug,
    activeChat,
    canWrite = true,
    currentUser,
    setChats,
    setMessagesMap,
}: UseChatSocketParams) {
    const [typingUsers, setTypingUsers] = useState<Record<string, TypingUserInfo>>({});
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!socket) return;

        const handleMessageSent = (data: MessageSentSocketPayload) => {
            if (!data?.slug || !data?.message) return;
            const slug = data.slug;
            const rawMsg = data.message;
            const normalizedMessage = normalizeSocketMessage(rawMsg, slug, currentUser);

            setMessagesMap((prev) => {
                const currentMsgs = prev[slug] || [];
                if (currentMsgs.some((m) => m.uuid === normalizedMessage.uuid)) return prev;
                return { ...prev, [slug]: [...currentMsgs, normalizedMessage] };
            });

            if (
                activeChatSlug === slug &&
                !normalizedMessage.isMine &&
                normalizedMessage.author?.username !== currentUser?.username
            ) {
                chatService.markAsRead(slug);
                playIncomingMessageSound();
            }

            setChats((prev) => {
                const exists = prev.some((c) => c.slug === slug);
                if (!exists) {
                    chatService.getChats().onSuccess((r) => {
                        if (Array.isArray(r?.chats)) setChats(r.chats);
                    });
                    return prev;
                }
                return prev.map((c) => {
                    if (c.slug === slug) {
                        return {
                            ...c,
                            last_message: typeof rawMsg.text === 'string' ? null : rawMsg.text,
                            last_message_files: rawMsg.files || [],
                            last_message_shareable: rawMsg.shareable || null,
                            last_message_sender_username: rawMsg.author?.username ?? null,
                            last_message_author: rawMsg.author ?? null,
                            last_message_author_type: rawMsg.author_type || 'user',
                            updated_at: rawMsg.created_at,
                            unread_count: activeChatSlug === slug ? 0 : (c.unread_count || 0) + 1,
                            is_last_unread: activeChatSlug !== slug,
                        };
                    }
                    return c;
                });
            });
        };

        const handleTypingStart = (data: TypingSocketPayload) => {
            if (!data?.chat_slug || data.sender_username === currentUser?.username) return;
            const slug = data.chat_slug;
            const senderUsername = data.sender_username || '';
            setTypingUsers((prev) => ({
                ...prev,
                [slug]: data.user || { username: senderUsername, first_name: senderUsername },
            }));
            setChats((prev) => prev.map((c) => (c.slug === slug ? { ...c, is_typing: true } : c)));
        };

        const handleTypingStop = (data: TypingSocketPayload) => {
            if (!data?.chat_slug || data.sender_username === currentUser?.username) return;
            const slug = data.chat_slug;
            setTypingUsers((prev) => {
                const copy = { ...prev };
                delete copy[slug];
                return copy;
            });
            setChats((prev) => prev.map((c) => (c.slug === slug ? { ...c, is_typing: false } : c)));
        };

        const handleMessageUpdated = (data: MessageUpdatedSocketPayload) => {
            if (!data?.slug || !data?.uuid) return;
            setMessagesMap((prev) => ({
                ...prev,
                [data.slug!]: (prev[data.slug!] || []).map((m) =>
                    m.uuid === data.uuid
                        ? {
                              ...m,
                              ...data.message,
                              isMine: m.isMine,
                              can_edit: m.can_edit,
                              can_delete: m.can_delete,
                              is_edited: true,
                          }
                        : m
                ),
            }));
        };

        const handleMessageDeleted = (data: MessageDeletedSocketPayload) => {
            if (!data?.slug || !Array.isArray(data?.message_uuids)) return;
            const deletedSet = new Set(data.message_uuids);
            setMessagesMap((prev) => ({
                ...prev,
                [data.slug!]: (prev[data.slug!] || []).filter((m) => !deletedSet.has(m.uuid)),
            }));
        };

        const handleMessagePinned = (data: MessagePinnedSocketPayload) => {
            if (!data?.slug || !data?.uuid) return;
            setMessagesMap((prev) => ({
                ...prev,
                [data.slug!]: (prev[data.slug!] || []).map((m) =>
                    m.uuid === data.uuid ? { ...m, is_pinned: Boolean(data.is_pinned) } : { ...m, is_pinned: false }
                ),
            }));
        };

        const handleChatRead = (data: ChatReadSocketPayload) => {
            if (!data?.slug) return;
            const readAt = data.read_at || new Date().toISOString();
            setChats((prev) =>
                prev.map((c) => (c.slug === data.slug ? { ...c, unread_count: 0, is_last_unread: false } : c))
            );
            setMessagesMap((prev) => ({
                ...prev,
                [data.slug!]: (prev[data.slug!] || []).map((m) => ({
                    ...m,
                    status: 'read',
                    read_at: readAt,
                })),
            }));
        };

        socket.on('chat.message.sent', handleMessageSent as (...args: never[]) => void);
        socket.on('chat.message.updated', handleMessageUpdated as (...args: never[]) => void);
        socket.on('chat.message.deleted', handleMessageDeleted as (...args: never[]) => void);
        socket.on('chat.message.pinned', handleMessagePinned as (...args: never[]) => void);
        socket.on('typing_start', handleTypingStart as (...args: never[]) => void);
        socket.on('typing_stop', handleTypingStop as (...args: never[]) => void);
        socket.on('chat.read', handleChatRead as (...args: never[]) => void);

        return () => {
            socket.off('chat.message.sent', handleMessageSent as (...args: never[]) => void);
            socket.off('chat.message.updated', handleMessageUpdated as (...args: never[]) => void);
            socket.off('chat.message.deleted', handleMessageDeleted as (...args: never[]) => void);
            socket.off('chat.message.pinned', handleMessagePinned as (...args: never[]) => void);
            socket.off('typing_start', handleTypingStart as (...args: never[]) => void);
            socket.off('typing_stop', handleTypingStop as (...args: never[]) => void);
            socket.off('chat.read', handleChatRead as (...args: never[]) => void);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [socket, activeChatSlug, currentUser, setChats, setMessagesMap]);

    const handleTyping = useCallback(() => {
        if (!socket || !activeChatSlug || !canWrite) return;
        const receiverUsername = activeChat?.target_user?.username;
        socket.emit('typing_start', {
            chat_slug: activeChatSlug,
            receiver_username: receiverUsername,
        });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', {
                chat_slug: activeChatSlug,
                receiver_username: receiverUsername,
            });
        }, 2500);
    }, [socket, activeChatSlug, activeChat, canWrite]);

    return {
        typingUsers,
        handleTyping,
    };
}