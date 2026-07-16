import {createContext, useContext, useEffect, useState} from 'react';
import {io} from 'socket.io-client';
import {AuthContext} from './AuthContext';
import {WS_URL} from '../config';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({children}) =>
{
    const [socket, setSocket] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);
    const {isAuthenticated} = useContext(AuthContext);

    useEffect(() =>
    {
        // Якщо юзер не авторизований, сокет не підключаємо
        if (!isAuthenticated)
        {
            return;
        }

        const newSocket = io(WS_URL, {
            withCredentials: true,
            transports: ['websocket'],
        });

        newSocket.on('connect', () =>
        {
            console.log('socket connected');
        });

        newSocket.on('online_users_list', (users) =>
        {
            setOnlineUsers(users.map(id => parseInt(id)));
        });

        newSocket.on('user_online', (data) =>
        {
            setOnlineUsers(prev => [...new Set([...prev, parseInt(data.user_id)])]);
        });

        newSocket.on('user_offline', (data) =>
        {
            setOnlineUsers(prev => prev.filter(id => id !== parseInt(data.user_id)));
        });

        newSocket.on('connect_error', (err) =>
        {
            console.error('error connection socket:', err.message);
        });

        setSocket(newSocket);

        const handleVisibilityChange = () =>
        {
            if (document.visibilityState === 'hidden')
            {
                // newSocket.disconnect();
            }
            else if (document.visibilityState === 'visible')
            {
                newSocket.connect();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () =>
        {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            newSocket.disconnect();
        };
    }, [isAuthenticated]); // Перепідключаємо, якщо статус авторизації змінився

    return (
        <SocketContext.Provider value={{socket, onlineUsers}}>
            {children}
        </SocketContext.Provider>
    );
};