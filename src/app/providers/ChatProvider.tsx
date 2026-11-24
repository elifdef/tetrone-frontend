import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { ChatContext } from './chat-context';
import { useAuth } from './auth-context';
import { useSocket } from './socket-context';
import chatService from '@/services/chat.service';
import type { ChatData, ChatMessageItem } from '@/types/chat';

interface ChatProviderProps {
    children: ReactNode;
}

interface ChatMessageSentSocketPayload {
    slug?: string;
    message?: ChatMessageItem;
}

interface ChatReadSocketPayload {
    slug?: string;
    read_by_user_username?: string;
}

export const ChatProvider = ({ children }: ChatProviderProps) => {
    const { user } = useAuth();
    const { socket } = useSocket();
    const [chats, setChats] = useState<ChatData[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);

    const fetchChats = useCallback(async () => {
        if (!user) {
            return;
        }

        await chatService
            .getChats()
            .onSuccess((res) => {
                if (Array.isArray(res?.chats)) {
                    setChats(res.chats);
                }
            })
            .onFinally(() => {
                setLoadingChats(false);
            });
    }, [user]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        void chatService
            .getChats()
            .onSuccess((res) => {
                if (!cancelled && Array.isArray(res?.chats)) {
                    setChats(res.chats);
                }
            })
            .onFinally(() => {
                if (!cancelled) {
                    setLoadingChats(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleChatMessageSent = (data: ChatMessageSentSocketPayload) => {
            if (!data?.slug || !data?.message) return;
            const slug = data.slug;
            const msg = data.message;

            setChats((prev) => {
                const exists = prev.some((c) => c.slug === slug);
                if (!exists) {
                    void fetchChats();
                    return prev;
                }
                return prev.map((c) => {
                    if (c.slug === slug) {
                        const isMine = Boolean(
                            msg.isMine || msg.author?.username === user.username
                        );
                        const currentParams = new URLSearchParams(window.location.search);
                        const activeSlugInUrl =
                            currentParams.get('dm') ||
                            currentParams.get('gc') ||
                            (currentParams.has('saved') ? 'saved' : null);
                        const isViewingThisChat =
                            window.location.pathname.startsWith('/chat') &&
                            activeSlugInUrl === slug;

                        return {
                            ...c,
                            last_message: typeof msg.text === 'string' ? null : msg.text,
                            last_message_files: msg.files || [],
                            last_message_shareable: msg.shareable || null,
                            last_message_sender_username: msg.author?.username ?? null,
                            last_message_author: msg.author ?? null,
                            last_message_author_type: msg.author_type || 'user',
                            updated_at: msg.created_at,
                            unread_count:
                                isMine || isViewingThisChat ? 0 : (c.unread_count || 0) + 1,
                            is_last_unread: !isMine && !isViewingThisChat,
                        };
                    }
                    return c;
                });
            });
        };

        const handleChatRead = (data: ChatReadSocketPayload) => {
            if (!data?.slug) return;
            if (data.read_by_user_username === user.username) {
                setChats((prev) =>
                    prev.map((c) =>
                        c.slug === data.slug
                            ? { ...c, unread_count: 0, is_last_unread: false }
                            : c
                    )
                );
            }
        };

        socket.on('chat.message.sent', handleChatMessageSent);
        socket.on('chat.read', handleChatRead);

        return () => {
            socket.off('chat.message.sent', handleChatMessageSent);
            socket.off('chat.read', handleChatRead);
        };
    }, [socket, user, fetchChats]);

    const activeChats = useMemo(() => (user ? chats : []), [user, chats]);

    const unreadMessagesCount = useMemo(() => {
        return activeChats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
    }, [activeChats]);

    return (
        <ChatContext.Provider
            value={{
                chats: activeChats,
                setChats,
                unreadMessagesCount,
                loadingChats: user ? loadingChats : false,
                refetchChats: fetchChats,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
