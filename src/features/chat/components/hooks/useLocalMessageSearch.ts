import { useState, useMemo, useCallback, type Dispatch, type SetStateAction } from 'react';
import { getPlainText } from '../utils/messageParser';
import type { ChatMessageItem } from '@/types/chat';

export interface UseLocalMessageSearchResult {
    isSearchOpen: boolean;
    toggleSearch: () => void;
    messageSearchQuery: string;
    setMessageSearchQuery: Dispatch<SetStateAction<string>>;
    filteredMessages: ChatMessageItem[];
}

export function useLocalMessageSearch(messages: ChatMessageItem[] = []): UseLocalMessageSearchResult {
    const [messageSearchQuery, setMessageSearchQuery] = useState<string>('');
    const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

    const filteredMessages = useMemo(() => {
        const q = messageSearchQuery.trim().toLowerCase();
        if (!q) return messages;

        return messages.filter((msg) => {
            const plain = getPlainText(msg.text || '').toLowerCase();
            const authorName = `${msg.author?.first_name || ''} ${msg.author?.last_name || ''}`.toLowerCase();

            const replyPlain = getPlainText(msg.reply_to?.text || '').toLowerCase();
            const replyAuthor = (msg.reply_to?.sender_name || '').toLowerCase();

            const hasMatchingFile = (msg.files || []).some((f) => (f.name || '').toLowerCase().includes(q));
            const hasMatchingReplyFile = (msg.reply_to?.files || []).some((f) =>
                (f.name || '').toLowerCase().includes(q)
            );

            return (
                plain.includes(q) ||
                authorName.includes(q) ||
                replyPlain.includes(q) ||
                replyAuthor.includes(q) ||
                hasMatchingFile ||
                hasMatchingReplyFile
            );
        });
    }, [messages, messageSearchQuery]);

    const toggleSearch = useCallback(() => {
        setIsSearchOpen((prev) => {
            if (prev) setMessageSearchQuery('');
            return !prev;
        });
    }, []);

    return {
        isSearchOpen,
        toggleSearch,
        messageSearchQuery,
        setMessageSearchQuery,
        filteredMessages,
    };
}