import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { useSocket } from './SocketContext';
import fetchClient from '../api/client';
import Notification from '../components/common/Notification';
import NotificationService from '../services/notification.service';
import { audioManager } from '../utils/audioManager';
import { useTranslation } from 'react-i18next';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { t } = useTranslation();
    const { user } = useContext(AuthContext);
    const { socket } = useSocket();

   const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToasts, setActiveToasts] = useState([]);
    const [incomingMessage, setIncomingMessage] = useState(null);

    const fetchInitialData = useCallback(async () => {
        if (!user) return;

        const notifRes = await fetchClient('/notifications');

        if (notifRes) {
            setNotifications(notifRes.notifications);
            setUnreadCount(notifRes.unread_count);
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
                // Повідомлення чату вже обробляються в реальному часі через handleChatMessageSent
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

        const handleChatMessageSent = (data) => {
            if (!data?.slug || !data?.message) return;
            const msg = data.message;

            if (data.slug === 'saved' || msg.isMine || msg.author?.username === user?.username) {
                return;
            }

            const currentParams = new URLSearchParams(window.location.search);
            const activeSlugInUrl = currentParams.get('dm') || currentParams.get('gc') || (currentParams.has('saved') ? 'saved' : null);
            const isViewingThisChat = window.location.pathname.startsWith('/chat') && activeSlugInUrl === data.slug;

            if (!isViewingThisChat) {
                const msgSettings = user?.notification_settings?.messages;
                if (msgSettings?.is_enabled && msgSettings?.sound_id) {
                    audioManager.unlock();
                    audioManager.play(msgSettings.sound_id);
                }

                const toastId = Date.now();
                setActiveToasts(prev => [
                    ...prev,
                    {
                        toastId,
                        type: 'new_message',
                        slug: data.slug,
                        actor: msg.author_type === 'group'
                            ? { username: data.slug, first_name: t('chat.badges.group_author'), avatar: null }
                            : msg.author,
                        message: msg,
                        link: data.slug === 'saved'
                            ? '/chat?saved'
                            : msg.author_type === 'group'
                                ? `/chat?gc=${data.slug}`
                                : `/chat?dm=${data.slug}`
                    }
                ].slice(-3));
            }
        };

        socket.on('notification', handleNotification);
        socket.on('message_deleted', handleMessageDeleted);
        socket.on('chat.message.sent', handleChatMessageSent);

        return () => {
            socket.off('notification', handleNotification);
            socket.off('message_deleted', handleMessageDeleted);
            socket.off('chat.message.sent', handleChatMessageSent);
        };
    }, [socket, user]);

    const markAsRead = async (id) => {
        const res = await NotificationService.read(id);
        if (res.ok) {
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

    const removeToast = useCallback((toastId) => {
        setActiveToasts(prev => prev.filter(t => t.toastId !== toastId));
    }, []);

    return (
        <NotificationContext.Provider value={{
            notifications, unreadCount, markAsRead,
            incomingMessage, readAllNotifications, deleteAllNotifications
        }}>
            {children}
            <div className="fixed bottom-[20px] left-[20px] z-[9999] flex flex-col gap-[8px]">
                {activeToasts.map(toast => (
                    <Notification
                        key={toast.toastId}
                        notification={toast}
                        onClose={() => removeToast(toast.toastId)}
                    />
                ))}
            </div>
        </NotificationContext.Provider>
    );
};