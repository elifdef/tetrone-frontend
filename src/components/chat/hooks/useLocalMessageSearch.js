import { useState, useMemo } from 'react';
import { getPlainText } from '../utils/messageParser.js';

export function useLocalMessageSearch(messages = []) {
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    const filteredMessages = useMemo(() => {
        const q = messageSearchQuery.trim().toLowerCase();
        if (!q) return messages;

        return messages.filter((msg) => {
            const plain = getPlainText(msg.text || '').toLowerCase();
            const authorName = `${msg.author?.first_name || ''} ${msg.author?.last_name || ''}`.toLowerCase();
            const hasMatchingFile = (msg.files || []).some(f =>
                (f.name || '').toLowerCase().includes(q)
            );
            return plain.includes(q) || authorName.includes(q) || hasMatchingFile;
        });
    }, [messages, messageSearchQuery]);

    const toggleSearch = () => {
        setIsSearchOpen(prev => {
            if (prev) setMessageSearchQuery('');
            return !prev;
        });
    };

    return {
        isSearchOpen,
        toggleSearch,
        messageSearchQuery,
        setMessageSearchQuery,
        filteredMessages
    };
}