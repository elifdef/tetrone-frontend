import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type { ChatData } from '@/types/chat';

export interface ChatContextValue {
    chats: ChatData[];
    setChats: Dispatch<SetStateAction<ChatData[]>>;
    unreadMessagesCount: number;
    loadingChats: boolean;
    refetchChats: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextValue>({
    chats: [],
    setChats: () => {},
    unreadMessagesCount: 0,
    loadingChats: true,
    refetchChats: async () => {},
});

export const useChat = () => useContext(ChatContext);
