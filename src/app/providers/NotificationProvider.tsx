import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
    NotificationContext,
    type IncomingMessageEvent,
    type NotificationItem,
} from './notification-context';
import { useAuth } from './auth-context';
import { useSocket } from './socket-context';
import fetchClient from '@/api/client';
import Notification, {
    type NotificationToastItem,
    type NotificationToastPayload,
} from '@/components/common/Notification';
import NotificationService from '@/services/notification.service';
import { audioManager } from '@/utils/audioManager';
import type { ChatMessageItem } from '@/types/chat';

interface NotificationProviderProps {
    children: ReactNode;
}

interface NotificationsListResponse {
    notifications: NotificationItem[];
    unread_count: number;
}

interface SocketNotificationPayload extends NotificationToastPayload {
    id?: number | string;
    type?: string;
    show_toast?: boolean;
    created_at?: string;
}

interface MessageDeletedSocketEvent {
    chat_slug?: string;
    message_id?: string | number;
}

interface ChatMessageSentSocketData {
    slug?: string;
    message?: ChatMessageItem;
}

interface ToastWithKey extends NotificationToastItem {
    toastId: number;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { socket } = useSocket();

    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [activeToasts, setActiveToasts] = useState<ToastWithKey[]>([]);
    const [incomingMessage, setIncomingMessage] = useState<IncomingMessageEvent | null>(null);

    useEffect(() => {
        if (!user) {
            return;
        }

        let cancelled = false;

        void fetchClient<NotificationsListResponse>('/notifications').then((notifRes) => {
            if (!cancelled && notifRes?.ok) {
                setNotifications(Array.isArray(notifRes.notifications) ? notifRes.notifications : []);
                setUnreadCount(typeof notifRes.unread_count === 'number' ? notifRes.unread_count : 0);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [user]);

    useEffect(() => {
        if (!socket || !user) return;

        const handleNotification = (payload: SocketNotificationPayload) => {
            const toastId = Date.now();
            const type = payload.type || '';
            const isNewMessage = type === 'new_message';
            const shouldShowToast = payload.show_toast !== false;

            if (isNewMessage) {
                setIncomingMessage({ ...payload, type: 'new_message' });
                return;
            }

            const { id, created_at } = payload;
            const normalizedNotif: NotificationItem = {
                id: id || toastId,
                type,
                read_at: null,
                created_at: created_at || new Date().toISOString(),
                data: payload,
            };

            setNotifications((prev) => [normalizedNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);

            if (shouldShowToast) {
                setActiveToasts((prev) => [...prev, { ...normalizedNotif, toastId }].slice(-3));
            }
        };

        const handleMessageDeleted = (event: MessageDeletedSocketEvent) => {
            setIncomingMessage({
                type: 'message_deleted',
                chat_slug: event.chat_slug,
                message_id: event.message_id,
            });
        };

        const handleChatMessageSent = (data: ChatMessageSentSocketData) => {
            if (!data?.slug || !data?.message) return;
            const msg = data.message;

            if (data.slug === 'saved' || msg.isMine || msg.author?.username === user.username) {
                return;
            }

            const currentParams = new URLSearchParams(window.location.search);
            const activeSlugInUrl =
                currentParams.get('dm') ||
                currentParams.get('gc') ||
                (currentParams.has('saved') ? 'saved' : null);
            const isViewingThisChat =
                window.location.pathname.startsWith('/chat') && activeSlugInUrl === data.slug;

            if (!isViewingThisChat) {
                const msgSettings = user.notification_settings?.messages;
                if (msgSettings?.is_enabled && msgSettings?.sound_id) {
                    audioManager.unlock();
                    void audioManager.play(msgSettings.sound_id);
                }

                const toastId = Date.now();
                const toastItem: ToastWithKey = {
                    toastId,
                    type: 'new_message',
                    slug: data.slug,
                    actor:
                        msg.author_type === 'group'
                            ? {
                                  username: data.slug,
                                  first_name: t('chat.badges.group_author'),
                                  avatar: null,
                              }
                            : msg.author || undefined,
                    message: {
                        text: msg.text,
                        shareable: msg.shareable ? { type: msg.shareable.type } : undefined,
                        files: msg.files?.map((f) => ({ type: f.type, name: f.name })),
                    },
                    link:
                        data.slug === 'saved'
                            ? '/chat?saved'
                            : msg.author_type === 'group'
                              ? `/chat?gc=${data.slug}`
                              : `/chat?dm=${data.slug}`,
                };

                setActiveToasts((prev) => [...prev, toastItem].slice(-3));
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
    }, [socket, user, t]);

    const markAsRead = useCallback(async (id: number | string) => {
        const res = await NotificationService.read(id);
        if (res.ok) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
            );
        }
    }, []);

    const readAllNotifications = useCallback(async () => {
        try {
            await NotificationService.readAll();
            setNotifications((prev) =>
                prev.map((notif) => ({
                    ...notif,
                    read_at: notif.read_at || new Date().toISOString(),
                }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to read all notifications', error);
        }
    }, []);

    const deleteAllNotifications = useCallback(async () => {
        try {
            await NotificationService.deleteAll();
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to delete all notifications', error);
        }
    }, []);

    const removeToast = useCallback((toastId: number) => {
        setActiveToasts((prev) => prev.filter((toast) => toast.toastId !== toastId));
    }, []);

    return (
        <NotificationContext.Provider
            value={{
                notifications: user ? notifications : [],
                unreadCount: user ? unreadCount : 0,
                markAsRead,
                incomingMessage: user ? incomingMessage : null,
                readAllNotifications,
                deleteAllNotifications,
            }}
        >
            {children}
            <div className="fixed bottom-[20px] left-[20px] z-[9999] flex flex-col gap-[8px]">
                {activeToasts.map((toast) => (
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
