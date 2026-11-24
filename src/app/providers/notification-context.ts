import { createContext, useContext } from 'react';
import type { NotificationToastItem, NotificationToastPayload } from '@/components/common/Notification';

export interface NotificationItem extends NotificationToastItem {
    id: number | string;
    type: string;
    read_at: string | null;
    created_at: string;
    data?: NotificationToastPayload;
}

export interface IncomingMessageEvent {
    type: 'new_message' | 'message_deleted' | string;
    chat_slug?: string;
    message_id?: string | number;
    [key: string]: unknown;
}

export interface NotificationContextValue {
    notifications: NotificationItem[];
    unreadCount: number;
    markAsRead: (id: number | string) => Promise<void>;
    incomingMessage: IncomingMessageEvent | null;
    readAllNotifications: () => Promise<void>;
    deleteAllNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextValue>({
    notifications: [],
    unreadCount: 0,
    markAsRead: async () => {},
    incomingMessage: null,
    readAllNotifications: async () => {},
    deleteAllNotifications: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);
