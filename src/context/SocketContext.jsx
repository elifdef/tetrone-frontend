import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);

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

        newSocket.on('connect_error', (err) => {
            console.error('error connection socket:', err.message);
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, []);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};