import { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';
import chatService from '../services/chat.service';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const { socket } = useSocket();
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);

    const fetchChats = useCallback(async () => {
        if (!user) {
            setChats([]);
            setLoadingChats(false);
            return;
        }

        chatService.getChats()
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
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleChatMessageSent = (data) => {
            if (!data?.slug || !data?.message) return;
            const slug = data.slug;
            const msg = data.message;

            setChats(prev => {
                const exists = prev.some(c => c.slug === slug);
                if (!exists) {
                    fetchChats();
                    return prev;
                }
                return prev.map(c => {
                    if (c.slug === slug) {
                        const isMine = msg.isMine || msg.author?.username === user?.username;
                        const currentParams = new URLSearchParams(window.location.search);
                        const activeSlugInUrl = currentParams.get('dm') || currentParams.get('gc') || (currentParams.has('saved') ? 'saved' : null);
                        const isViewingThisChat = window.location.pathname.startsWith('/chat') && activeSlugInUrl === slug;

                        return {
                            ...c,
                            last_message: msg.text,
                            last_message_files: msg.files || [],
                            last_message_shareable: msg.shareable || null,
                            last_message_sender_username: msg.author?.username,
                            last_message_author: msg.author,
                            last_message_author_type: msg.author_type || 'user',
                            updated_at: msg.created_at,
                            unread_count: (isMine || isViewingThisChat) ? 0 : (c.unread_count || 0) + 1,
                            is_last_unread: !isMine && !isViewingThisChat
                        };
                    }
                    return c;
                });
            });
        };

        const handleChatRead = (data) => {
            if (!data?.slug) return;
            if (data.read_by_user_username === user.username) {
                setChats(prev => prev.map(c => c.slug === data.slug ? { ...c, unread_count: 0, is_last_unread: false } : c));
            }
        };

        socket.on('chat.message.sent', handleChatMessageSent);
        socket.on('chat.read', handleChatRead);

        return () => {
            socket.off('chat.message.sent', handleChatMessageSent);
            socket.off('chat.read', handleChatRead);
        };
    }, [socket, user, fetchChats]);

    const unreadMessagesCount = useMemo(() => {
        return chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
    }, [chats]);

    return (
        <ChatContext.Provider value={{
            chats,
            setChats,
            unreadMessagesCount,
            loadingChats,
            refetchChats: fetchChats
        }}>
            {children}
        </ChatContext.Provider>
    );
};