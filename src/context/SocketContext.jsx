import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { WS_URL } from '../config';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [lastSeenMap, setLastSeenMap] = useState({});
    const { isAuthenticated } = useContext(AuthContext);

    useEffect(() => {
        if (!isAuthenticated) {
            return;
        }

        const cleanWsUrl = WS_URL ? WS_URL.replace(/\/+$/, '') : '';

        const newSocket = io(cleanWsUrl, {
            withCredentials: true,
            transports: ['websocket'],
            path: '/socket.io/',
        });

        newSocket.on('connect', () => {
            console.log('socket connected');
        });

        newSocket.on('online_users_list', (users) => {
            setOnlineUsers(users);
        });

        newSocket.on('user_online', (data) => {
            setOnlineUsers(prev => [...new Set([...prev, data.username])]);
        });

        newSocket.on('user_offline', (data) => {
            setOnlineUsers(prev => prev.filter(username => username !== data.username));
            if (data.last_seen) {
                setLastSeenMap(prev => ({ ...prev, [data.username]: data.last_seen }));
            }
        });

        newSocket.on('force_disconnect', (data) => {
            if (data?.reason === 'TOO_MANY_TABS') {
                console.warn('Disconnected by server: Too many active tabs open.');
            }
        });

        newSocket.on('connect_error', (err) => {
            console.error('Socket connection error:', err.message);
        });

        setSocket(newSocket);

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && !newSocket.connected) {
                newSocket.connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.disconnect();
        };
    }, [isAuthenticated]);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers, lastSeenMap }}>
            {children}
        </SocketContext.Provider>
    );
};