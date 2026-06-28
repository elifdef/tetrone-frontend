import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';
import fetchClient from '../api/client';
import Notification from '../components/common/Notification';
import NotificationService from '../services/notification.service';

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
        if (!socket || !user) return;

        const handleNotification = (payload) => {
            const toastId = Date.now();
            const type = payload.type;
            const isNewMessage = type === 'new_message';
            const shouldShowToast = payload.show_toast !== false;

            if (isNewMessage) {
                setIncomingMessage(payload);
                const currentParams = new URLSearchParams(window.location.search);

                if (currentParams.get('dm') === payload.target?.target_id) return;

                setUnreadMessagesCount(prev => prev + 1);

                if (shouldShowToast) {
                    setActiveToasts(prev => [...prev, { ...payload, toastId }].slice(-3));
                }
                return;
            }

            const { id, read_at, created_at, ...customData } = payload;

            const normalizedNotif = {
                id: id || Date.now(),
                type: type,
                read_at: null,
                created_at: created_at || new Date().toISOString(),
                data: payload
            };

            setNotifications(prev => [normalizedNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            if (shouldShowToast) {
                setActiveToasts(prev => [...prev, { ...normalizedNotif, toastId }].slice(-3));
            }
        };

        const handleMessageDeleted = (event) => {
            setIncomingMessage({
                type: 'message_deleted',
                chat_slug: event.chat_slug,
                message_id: event.message_id
            });
        };

        socket.on('notification', handleNotification);
        socket.on('message_deleted', handleMessageDeleted);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('message_deleted', handleMessageDeleted);
        };
    }, [socket, user]);

    const markAsRead = async (id) => {
        const res = await NotificationService.read(id)
        if (res.success) {
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
        }
    };

    const readAllNotifications = async () => {
        try {
            await NotificationService.readAll();

            setNotifications(prev => prev.map(notif => ({
                ...notif,
                read_at: notif.read_at || new Date().toISOString()
            })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to read all notifications", error);
        }
    };

    const deleteAllNotifications = async () => {
        try {
            await NotificationService.deleteAll();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to delete all notifications", error);
        }
    };

    const removeToast = (toastId) => setActiveToasts(prev => prev.filter(t => t.toastId !== toastId));

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, markAsRead, unreadMessagesCount, setUnreadMessagesCount,
            incomingMessage, readAllNotifications, deleteAllNotifications
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