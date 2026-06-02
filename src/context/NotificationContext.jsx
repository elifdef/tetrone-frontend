import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';
import fetchClient from '../api/client';
import Notification from '../components/common/Notification';
import { audioManager } from '../utils/audioManager';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { user } = useContext(AuthContext);
    const { socket } = useSocket();

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
    const [activeToasts, setActiveToasts] = useState([]);
    const [incomingMessage, setIncomingMessage] = useState(null);

    const fetchInitialData = useCallback(async () => {
        if (!user) return;
        const [notifRes, chatRes] = await Promise.all([
            fetchClient('/notifications'),
            fetchClient('/chat')
        ]);

        if (notifRes.success) {
            setNotifications(notifRes.data?.notifications || []);
            setUnreadCount(notifRes.data?.unread_count || 0);
        }
        if (chatRes.success) {
            const chats = chatRes.data || [];
            const totalUnreadMsg = chats.reduce((sum, chat) => sum + (chat.unread_count || 0), 0);
            setUnreadMessagesCount(totalUnreadMsg);
        }
    }, [user]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        // Якщо сокет ще не підключився або юзера немає - чекаємо
        if (!socket || !user) return;

        const handleNotification = (notification) => {
            const toastId = Date.now();
            const isNewMessage = notification.type === 'new_message' || notification.type?.includes('NewMessage');
            const shouldShowToast = notification.show_toast !== false;

            // 1. Логіка для нових повідомлень у чаті
            if (isNewMessage) {
                setIncomingMessage(notification);
                const currentParams = new URLSearchParams(window.location.search);

                // Не показуємо тост і не плюсуємо лічильник якщо юзер вже відкрив цей чат
                if (currentParams.get('dm') === notification.chat_slug) return;

                setUnreadMessagesCount(prev => prev + 1);

                if (shouldShowToast) {
                    if (notification.sound && notification.sound !== 'none') {
                        audioManager.playMessageSound(notification.sound);
                    }
                    setActiveToasts(prev => [...prev, { ...notification, toastId }].slice(-3));
                }
                return;
            }

            // 2. Звичайні сповіщення (лайки, друзі і т.д.)
            const { id, type, ...customData } = notification;
            const normalizedNotif = {
                id, type, read_at: null, created_at: new Date().toISOString(), data: customData
            };

            setNotifications(prev => [normalizedNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            if (shouldShowToast) {
                if (notification.sound && notification.sound !== 'none') {
                    audioManager.playMessageSound(notification.sound);
                }
                setActiveToasts(prev => [...prev, { ...notification, toastId }].slice(-3));
            }
        };

        const handleMessageDeleted = (event) => {
            setIncomingMessage({
                type: 'message_deleted',
                chat_slug: event.chat_slug,
                message_id: event.message_id
            });
        };

        // ПІДПИСУЄМОСЯ НА ПОДІЇ
        socket.on('notification', handleNotification);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [socket, user]);

    const markAsRead = async (id) => {
        const res = await fetchClient(`/notifications/${id}/read`, { method: 'POST' });
        if (res.success) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        }
    };

    const removeToast = (toastId) => setActiveToasts(prev => prev.filter(t => t.toastId !== toastId));

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, markAsRead, unreadMessagesCount, setUnreadMessagesCount,
            incomingMessage
        }}>
            {children}
            <div className="tetrone-toast-container">
                {activeToasts.map(toast => (
                    <Notification key={toast.toastId} notification={toast} onClose={() => removeToast(toast.toastId)} />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};