import { useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { SocketContext } from './socket-context';
import { useAuth } from './auth-context';
import { APP_ENV, WS_URL } from '@/config';

interface SocketProviderProps {
    children: ReactNode;
}

interface UserPresencePayload {
    username?: string;
    last_seen?: string;
}

interface ForceDisconnectPayload {
    reason?: string;
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
    const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({});
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        let disposed = false;
        const cleanWsUrl = WS_URL ? WS_URL.replace(/\/+$/, '') : '';

        const newSocket = io(cleanWsUrl, {
            withCredentials: true,
            transports: ['websocket'],
            path: '/socket.io/',
        });

        queueMicrotask(() => {
            if (!disposed) {
                setSocket(newSocket);
            }
        });

        newSocket.on('connect', () => {
            if (APP_ENV === 'dev') {
                console.log('socket connected');
            }
        });

        newSocket.on('online_users_list', (users: string[]) => {
            setOnlineUsers(Array.isArray(users) ? users : []);
        });

        newSocket.on('user_online', (data: UserPresencePayload) => {
            const username = data?.username;
            if (username) {
                setOnlineUsers((prev) => [...new Set([...prev, username])]);
            }
        });

        newSocket.on('user_offline', (data: UserPresencePayload) => {
            const username = data?.username;
            if (username) {
                setOnlineUsers((prev) => prev.filter((item) => item !== username));
                if (data.last_seen) {
                    const lastSeen = data.last_seen;
                    setLastSeenMap((prev) => ({ ...prev, [username]: lastSeen }));
                }
            }
        });

        newSocket.on('force_disconnect', (data?: ForceDisconnectPayload) => {
            if (data?.reason === 'TOO_MANY_TABS') {
                console.warn('Disconnected by server: Too many active tabs open.');
            }
        });

        newSocket.on('connect_error', (err: Error) => {
            console.error('Socket connection error:', err.message);
        });

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !newSocket.connected) {
                newSocket.connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            disposed = true;
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.disconnect();
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider
            value={{
                socket: isAuthenticated ? socket : null,
                onlineUsers: isAuthenticated ? onlineUsers : [],
                lastSeenMap: isAuthenticated ? lastSeenMap : {},
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};
