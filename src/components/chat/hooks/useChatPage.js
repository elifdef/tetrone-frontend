import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { mockCurrentUser, mockChats, mockMessages } from '../utils/mock.js';
import { notifySuccess } from '../../common/Notify.jsx';

export function useChatPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const dmSlug = searchParams.get('dm');

    const [theme, setTheme] = useState('classic');
    const [chats, setChats] = useState(mockChats);
    const [messages, setMessages] = useState(mockMessages);

    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    const activeChat = chats.find(c => c.slug === dmSlug);

    const handleSelectChat = useCallback((slug) => {
        setSearchParams({ dm: slug });
    }, [setSearchParams]);

    const handleBackToInbox = useCallback(() => {
        setSearchParams({});
    }, [setSearchParams]);

    const handleSend = useCallback(() => {
        const isTextEmpty = !text || (typeof text === 'string' && !text.trim());
        if (isTextEmpty && files.length === 0) return;

        if (editingMessage) {
            setMessages(prev => prev.map(m => m.id === editingMessage.id ? { ...m, text, is_edited: true } : m));
            setEditingMessage(null);
        } else {
            const newMsg = {
                id: Date.now(),
                isMine: true,
                text: typeof text === 'object' ? JSON.stringify(text) : text,
                status: 'read',
                created_at: new Date().toISOString(),
                read_at: null,
                is_edited: false,
                is_pinned: false,
                reply_to: replyingTo ? {
                    sender_name: replyingTo.isMine ? mockCurrentUser.first_name : activeChat?.target_user?.first_name,
                    text: replyingTo.text
                } : null,
                files: files.map((f) => ({ url: URL.createObjectURL(f) }))
            };
            setMessages(prev => [...prev, newMsg]);
        }

        setText('');
        setFiles([]);
        setReplyingTo(null);
    }, [text, files, editingMessage, replyingTo, activeChat]);

    const handleDeleteClick = useCallback((id) => {
        setMessages(prev => prev.filter(m => m.id !== id));
        notifySuccess(t('action.deleted'));
    }, [t]);

    const handleEditClick = useCallback((msg) => {
        setEditingMessage(msg);
        setText(msg.text);
        setReplyingTo(null);
    }, []);

    const togglePin = useCallback((id) => {
        setMessages(prev => prev.map(m => {
            if (m.id === id) return { ...m, is_pinned: !m.is_pinned };
            return { ...m, is_pinned: false }; // Імітуємо, що закріплено може бути лише одне
        }));
    }, []);

    const handleCancelReplyEdit = useCallback(() => {
        setEditingMessage(null);
        setReplyingTo(null);
        setText('');
        setFiles([]);
    }, []);

    const handleFileChange = useCallback((e) => {
        if (e.target.files?.length > 0) {
            setFiles(prev => [...prev, ...Array.from(e.target.files)]);
            e.target.value = null;
        }
    }, []);

    const handleRemoveFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const getReplyName = useCallback(() => {
        if (!replyingTo) return '';
        return replyingTo.isMine ? mockCurrentUser.first_name : activeChat?.target_user?.first_name;
    }, [replyingTo, activeChat]);

    // Імітація події "Друкує" (isTyping)
    const handleTyping = useCallback(() => {
        if (!isTyping) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
        }
    }, [isTyping]);

    // Об'єднуємо всі пропси для передачі у будь-який Layout (Classic чи Modern)
    const layoutProps = {
        currentUser: mockCurrentUser,
        chats,
        messages,
        activeChat,
        dmSlug,
        text, setText,
        files, setFiles,
        editingMessage,
        replyingTo, setReplyingTo,
        replyingToName: getReplyName(),
        handleSelectChat,
        handleBackToInbox,
        handleSend,
        handleEditClick,
        handleDelete: handleDeleteClick,
        togglePin,
        handleCancelReplyEdit,
        handleFileChange,
        handleRemoveFile,
        isTyping,
        onTyping: handleTyping,
        canWrite: true,
        cantWriteReason: '',
    };

    return { theme, setTheme, layoutProps };
}