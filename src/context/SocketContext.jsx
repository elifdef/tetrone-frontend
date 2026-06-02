import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) return;

        const wsUrl = import.meta.env.VITE_WS_URL;

        const newSocket = io(wsUrl, {
            auth: { token: token },
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('socket connected');
        });

        // Отримуємо початковий список при підключенні
        newSocket.on('online_users_list', (users) => {
            setOnlineUsers(users.map(id => parseInt(id)));
        });

        // Хтось зайшов
        newSocket.on('user_online', (data) => {
            setOnlineUsers(prev => [...new Set([...prev, parseInt(data.user_id)])]);
        });

        // Хтось вийшов
        newSocket.on('user_offline', (data) => {
            setOnlineUsers(prev => prev.filter(id => id !== parseInt(data.user_id)));
        });

        newSocket.on('connect_error', (err) => {
            console.error('error connection socket:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, onlineUsers }}>
            {children}
        </SocketContext.Provider>
    );
};