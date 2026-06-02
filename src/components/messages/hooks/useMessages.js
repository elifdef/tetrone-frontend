import { useState, useCallback, useEffect, useRef, useContext } from 'react';
import MessageService from '../../../services/chat.service';
import { notifyError } from "../../common/Notify";
import { AuthContext } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';

export const useMessages = (slug) => {
    const { user } = useContext(AuthContext);
    const { socket } = useSocket();

    const [messages, setMessages] = useState([]);
    const [chatWasDeletedExternally, setChatWasDeletedExternally] = useState(false);
    const [currentChatInfo, setCurrentChatInfo] = useState(null);

    const pageRef = useRef(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingInitial, setIsLoadingInitial] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    const [targetIsTyping, setTargetIsTyping] = useState(false);

    // Таймери для логіки "друкує"
    const typingDisplayTimeoutRef = useRef(null);
    const emitTypingTimeoutRef = useRef(null);
    const lastTypingEmitRef = useRef(0);

    useEffect(() => {
        if (!slug || !socket || !user) return;

        setChatWasDeletedExternally(false);

        // Слухач: співрозмовник почав друкувати
        const handleTypingStart = (data) => {
            if (data.chat_slug === slug) {
                setTargetIsTyping(true);
                // Захисний таймер: якщо подія зупинки загубилась, ховаємо через 3 сек
                if (typingDisplayTimeoutRef.current) clearTimeout(typingDisplayTimeoutRef.current);
                typingDisplayTimeoutRef.current = setTimeout(() => setTargetIsTyping(false), 3000);
            }
        };

        // Слухач: співрозмовник перестав друкувати
        const handleTypingStop = (data) => {
            if (data.chat_slug === slug) {
                setTargetIsTyping(false);
                if (typingDisplayTimeoutRef.current) clearTimeout(typingDisplayTimeoutRef.current);
            }
        };

        // Слухач: повідомлення прочитані (приходить з мікросервісу від Laravel)
        const handleMessagesRead = (data) => {
            if (data.chat_slug === slug) {
                setMessages(prev => prev.map(msg =>
                    (msg.sender_id === user.id && !msg.read_at)
                        ? { ...msg, read_at: new Date().toISOString() }
                        : msg
                ));
            }
        };

        const handleChatDeleted = (data) => {
            if (data.chat_slug === slug) setChatWasDeletedExternally(true);
        };

        const handleUserBlocked = () => {
            setChatWasDeletedExternally(true);
        };

        // Підписуємось на події мікросервісу
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);
        socket.on('messages_read', handleMessagesRead);
        socket.on('chat_deleted', handleChatDeleted);
        socket.on('user_blocked', handleUserBlocked);

        return () => {
            // Очищуємо слухачів при зміні чату або розмонтуванні
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_stop', handleTypingStop);
            socket.off('messages_read', handleMessagesRead);
            socket.off('chat_deleted', handleChatDeleted);
            socket.off('user_blocked', handleUserBlocked);
            if (typingDisplayTimeoutRef.current) clearTimeout(typingDisplayTimeoutRef.current);
        };
    }, [slug, socket, user]);

    // Відправка події "я друкую" в мікросервіс
    const emitTyping = useCallback((receiverId) => {
        if (!slug || !socket || !receiverId) return;

        const now = Date.now();

        // Відправляємо 'typing_start' не частіше ніж раз на 2 секунди
        // Це постійно підтримує індикатор у співрозмовника, поки ми пишемо довгий текст
        if (now - lastTypingEmitRef.current > 2000) {
            socket.emit('typing_start', { chat_slug: slug, receiver_id: receiverId });
            lastTypingEmitRef.current = now;
        }

        // Автоматично відправляємо подію зупинки через 1.5 сек після ОСТАННЬОГО натискання
        if (emitTypingTimeoutRef.current) clearTimeout(emitTypingTimeoutRef.current);
        emitTypingTimeoutRef.current = setTimeout(() => {
            socket.emit('typing_stop', { chat_slug: slug, receiver_id: receiverId });
            lastTypingEmitRef.current = 0; // Скидаємо час
        }, 1500);
    }, [slug, socket]);

    const fetchMessages = useCallback(async ({ isLoadMore = false, silent = false } = {}) => {
        if (!slug) return;
        const currentPage = isLoadMore ? pageRef.current + 1 : 1;

        if (!silent) {
            if (isLoadMore) setIsLoadingMore(true);
            else setIsLoadingInitial(true);
        }

        const res = await MessageService.getMessages(slug, currentPage);

        if (res.success) {
            const items = res.data?.data || res.data || [];
            const meta = res.meta || res.data?.meta;
            const reversedData = [...items].reverse();

            if (res.chat_info) {
                setCurrentChatInfo(res.chat_info);
            } else if (res.data?.chat_info) {
                setCurrentChatInfo(res.data.chat_info);
            }

            if (isLoadMore) {
                setMessages(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const uniqueNew = reversedData.filter(m => !existingIds.has(m.id));
                    return [...uniqueNew, ...prev];
                });
                pageRef.current = currentPage;
            } else {
                setMessages(reversedData);
                pageRef.current = 1;
            }

            setHasMore(meta && meta.current_page < meta.last_page);

            // Якщо ми відкрили чат і завантажили повідомлення - позначаємо їх прочитаними.
            if (!isLoadMore) MessageService.markAsRead(slug).catch(e => { });
        } else {
            if (!silent) notifyError(res.message);
        }

        setIsLoadingInitial(false);
        setIsLoadingMore(false);
    }, [slug]);

    const loadMoreMessages = () => {
        if (!isLoadingMore && hasMore) fetchMessages({ isLoadMore: true });
    };

    const sendMessage = async (text, files = [], sharedPostId = null, replyToId = null) => {
        if (!text && files.length === 0 && !sharedPostId) return false;

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
            id: tempId,
            sender_id: user.id,
            text: text,
            files: files.map(f => ({ name: f.name, url: URL.createObjectURL(f) })),
            isMine: true,
            created_at: new Date().toISOString(),
            status: 'sending'
        };

        setMessages(prev => [...prev, tempMessage]);

        const res = await MessageService.sendMessage(slug, text, files, sharedPostId, replyToId);

        if (res.success) {
            await fetchMessages({ silent: true });
            return true;
        } else {
            setMessages(prev => prev.map(msg =>
                msg.id === tempId
                    ? { ...msg, status: 'error', errorText: res.message }
                    : msg
            ));
            return false;
        }
    };

    const updateMessage = async (messageId, text, newFiles = [], deletedMedia = []) => {
        const res = await MessageService.updateMessage(slug, messageId, text, newFiles, deletedMedia);
        if (res.success) {
            await fetchMessages({ silent: true });
            return true;
        }
        notifyError(res.message);
        return false;
    };

    const deleteMessage = async (messageId) => {
        const res = await MessageService.deleteMessage(slug, messageId);
        if (res.success) setMessages(prev => prev.filter(msg => msg.id !== messageId));
        else notifyError(res.message);
    };

    const togglePin = async (messageId) => {
        const res = await MessageService.togglePin(slug, messageId);
        if (res.success) await fetchMessages({ silent: true });
        else notifyError(res.message);
    };

    return {
        messages, isLoadingInitial, isLoadingMore, hasMore, targetIsTyping,
        chatWasDeletedExternally, fetchMessages, loadMoreMessages, sendMessage,
        updateMessage, deleteMessage, togglePin, emitTyping,
        currentChatInfo
    };
};