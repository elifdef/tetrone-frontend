import { createContext, useContext } from 'react';
import type { Socket } from 'socket.io-client';

export interface SocketContextValue {
    socket: Socket | null;
    onlineUsers: string[];
    lastSeenMap: Record<string, string>;
}

export const SocketContext = createContext<SocketContextValue>({
    socket: null,
    onlineUsers: [],
    lastSeenMap: {},
});

export const useSocket = () => useContext(SocketContext);
