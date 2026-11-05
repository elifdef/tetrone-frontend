import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import { useSocket } from '../../../context/SocketContext';
import chatService from '../../../services/chat.service.js';
import { getPlainText, toTipTapDoc, hasRichContent } from '../utils/messageParser.js';
import { notifySuccess, notifyError } from '../../common/Notify.jsx';

const MAX_PINNED_CHATS = 5;

export function useChatPage() {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext) || {};
    const currentUser = authUser;
    const { socket } = useSocket();

const [searchParams, setSearchParams] = useSearchParams();

    const activeChatSlug = useMemo(() => {
        if (searchParams.has('saved')) return 'saved';
        return searchParams.get('dm') || searchParams.get('gc') || null;
    }, [searchParams]);

    const [chats, setChats] = useState([]);
    const [messagesMap, setMessagesMap] = useState({});
    const [openedChatSlugs, setOpenedChatSlugs] = useState(() => (activeChatSlug ? [activeChatSlug] : []));
    const [selectedMessageUuids, setSelectedMessageUuids] = useState([]);
    const [friendsList, setFriendsList] = useState([]);

    const [draftsMap, setDraftsMap] = useState({});
    const [draftFilesMap, setDraftFilesMap] = useState({});
    const [sendAsGroup, setSendAsGroup] = useState(false);
    const [editorResetKey, setEditorResetKey] = useState(0);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);

    // Стан "пише..." для активного чату
    const [typingUsers, setTypingUsers] = useState({});

    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);

    const [isBannerVisible, setIsBannerVisible] = useState(() => {
        return localStorage.getItem('tetrone_hide_im_banner') !== 'true';
    });

    // Завантаження списку чатів
    useEffect(() => {
        chatService.getChats()
            .onSuccess((res) => {
                if (Array.isArray(res?.chats)) {
                    setChats(res.chats);
                }
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [t]);

    // Завантаження повідомлень та керування кімнатами сокета при відкритті чату
    useEffect(() => {
        if (activeChatSlug) {
            setSendAsGroup(false);
            setOpenedChatSlugs(prev => (prev.includes(activeChatSlug) ? prev : [...prev, activeChatSlug]));

            // Реєструємося у кімнаті чату на сокеті
            if (socket) {
                socket.emit('chat:join', { chat_slug: activeChatSlug });
            }

            chatService.getMessages(activeChatSlug)
                .onSuccess((res) => {
                    if (res?.chat) {
                        setChats(prev =>
                            prev.some(c => c.slug === res.chat.slug)
                                ? prev.map(c => (c.slug === res.chat.slug ? res.chat : c))
                                : [res.chat, ...prev]
                        );
                    }
                    if (Array.isArray(res?.messages)) {
                        setMessagesMap(prev => ({ ...prev, [activeChatSlug]: res.messages }));
                    }
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });

            if (activeChatSlug !== 'saved') {
                chatService.markAsRead(activeChatSlug)
                    .onSuccess(() => {
                        setChats(prev =>
                            prev.map(c => (c.slug === activeChatSlug ? { ...c, unread_count: 0, is_last_unread: false } : c))
                        );
                        setMessagesMap(prev => ({
                            ...prev,
                            [activeChatSlug]: (prev[activeChatSlug] || []).map(m => ({ ...m, status: 'read', read_at: m.read_at || new Date().toISOString() }))
                        }));
                    });
            }
            return () => {
                if (socket) {
                    socket.emit('chat:leave', { chat_slug: activeChatSlug });
                }
            };
        }
    }, [activeChatSlug, socket, t]);

    // Реалтайм-слухачі подій через WebSocket
    useEffect(() => {
        if (!socket) return;

        const handleMessageSent = (data) => {
            if (!data?.slug || !data?.message) return;
            const slug = data.slug;

            setMessagesMap(prev => {
                const currentMsgs = prev[slug] || [];
                if (currentMsgs.some(m => m.uuid === data.message.uuid)) return prev;
                return { ...prev, [slug]: [...currentMsgs, data.message] };
            });

            setChats(prev => {
                const exists = prev.some(c => c.slug === slug);
                if (!exists) {
                    chatService.getChats().onSuccess((r) => {
                        if (Array.isArray(r?.chats)) setChats(r.chats);
                    });
                    return prev;
                }
                return prev.map(c => {
                    if (c.slug === slug) {
                        return {
                            ...c,
                            last_message: data.message.text,
                            last_message_files: data.message.files || [],
                            last_message_shareable: data.message.shareable || null,
                            last_message_sender_username: data.message.author?.username,
                            last_message_author: data.message.author,
                            last_message_author_type: data.message.author_type || 'user',
                            updated_at: data.message.created_at,
                            unread_count: activeChatSlug === slug ? 0 : (c.unread_count || 0) + 1,
                            is_last_unread: activeChatSlug !== slug
                        };
                    }
                    return c;
                });
            });
        };

        const handleTypingStart = (data) => {
            if (!data?.chat_slug || data.sender_username === currentUser?.username) return;
            const slug = data.chat_slug;

            setTypingUsers(prev => ({
                ...prev,
                [slug]: data.user || { username: data.sender_username, first_name: data.sender_username }
            }));
            setChats(prev => prev.map(c => c.slug === slug ? { ...c, is_typing: true } : c));
        };

        const handleTypingStop = (data) => {
            if (!data?.chat_slug || data.sender_username === currentUser?.username) return;
            const slug = data.chat_slug;

            setTypingUsers(prev => {
                const copy = { ...prev };
                delete copy[slug];
                return copy;
            });
            setChats(prev => prev.map(c => c.slug === slug ? { ...c, is_typing: false } : c));
        };

        const handleMessageUpdated = (data) => {
            if (!data?.slug || !data?.uuid) return;
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).map(m =>
                    m.uuid === data.uuid ? { ...m, ...data.message, is_edited: true } : m
                )
            }));
        };

        const handleMessageDeleted = (data) => {
            if (!data?.slug || !Array.isArray(data?.message_uuids)) return;
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).filter(m => !data.message_uuids.includes(m.uuid))
            }));
        };

        const handleMessagePinned = (data) => {
            if (!data?.slug || !data?.uuid) return;
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).map(m =>
                    m.uuid === data.uuid ? { ...m, is_pinned: data.is_pinned } : { ...m, is_pinned: false }
                )
            }));
        };

        const handleChatRead = (data) => {
            if (!data?.slug) return;
            setChats(prev => prev.map(c => c.slug === data.slug ? { ...c, unread_count: 0, is_last_unread: false } : c));
            setMessagesMap(prev => ({
                ...prev,
                [data.slug]: (prev[data.slug] || []).map(m => ({ ...m, status: 'read', read_at: data.read_at || new Date().toISOString() }))
            }));
        };

        socket.on('chat.message.sent', handleMessageSent);
        socket.on('chat.message.updated', handleMessageUpdated);
        socket.on('chat.message.deleted', handleMessageDeleted);
        socket.on('chat.message.pinned', handleMessagePinned);
        socket.on('typing_start', handleTypingStart);
        socket.on('typing_stop', handleTypingStop);
        socket.on('chat.read', handleChatRead);

        return () => {
            socket.off('chat.message.sent', handleMessageSent);
            socket.off('chat.message.updated', handleMessageUpdated);
            socket.off('chat.message.deleted', handleMessageDeleted);
            socket.off('chat.message.pinned', handleMessagePinned);
            socket.off('typing_start', handleTypingStart);
            socket.off('typing_stop', handleTypingStop);
            socket.off('chat.read', handleChatRead);
        };
    }, [socket, activeChatSlug, currentUser]);

    const text = useMemo(() => {
        if (!activeChatSlug) return null;
        return draftsMap[activeChatSlug] ?? null;
    }, [draftsMap, activeChatSlug]);

    const setText = useCallback((valOrUpdater) => {
        if (!activeChatSlug) return;
        setDraftsMap(prev => {
            const currentVal = prev[activeChatSlug] ?? null;
            const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
            return { ...prev, [activeChatSlug]: nextVal };
        });
    }, [activeChatSlug]);

    const files = useMemo(() => {
        if (!activeChatSlug) return [];
        return draftFilesMap[activeChatSlug] ?? [];
    }, [draftFilesMap, activeChatSlug]);

    const setFiles = useCallback((valOrUpdater) => {
        if (!activeChatSlug) return;
        setDraftFilesMap(prev => {
            const currentVal = prev[activeChatSlug] ?? [];
            const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
            return { ...prev, [activeChatSlug]: nextVal };
        });
    }, [activeChatSlug]);

    const activeChat = useMemo(
        () => chats.find(c => c.slug === activeChatSlug) || null,
        [chats, activeChatSlug]
    );

    const openedChats = useMemo(
        () => openedChatSlugs.map(slug => chats.find(c => c.slug === slug)).filter(Boolean),
        [openedChatSlugs, chats]
    );

    const messages = useMemo(
        () => (activeChatSlug ? messagesMap[activeChatSlug] || [] : []),
        [messagesMap, activeChatSlug]
    );

    const sortedAndSearchedChats = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const filtered = chats.filter(chat => {
            if (!query) return true;
            const chatTitle = chat.is_saved
                ? t('chat.saved_messages').toLowerCase()
                : chat.is_group
                    ? getPlainText(chat.title).toLowerCase()
                    : `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''}`.toLowerCase();
            const lastMsg = getPlainText(chat.last_message || '').toLowerCase();

            const historyMatch = (messagesMap[chat.slug] || []).some(m =>
                getPlainText(m.text).toLowerCase().includes(query)
            );

            return chatTitle.includes(query) || lastMsg.includes(query) || historyMatch;
        });

        return [...filtered].sort((a, b) => {
            if (Boolean(a.is_pinned) !== Boolean(b.is_pinned)) {
                return a.is_pinned ? -1 : 1;
            }
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
    }, [chats, messagesMap, searchQuery, t]);

    const handleDismissBanner = useCallback(() => {
        localStorage.setItem('tetrone_hide_im_banner', 'true');
        setIsBannerVisible(false);
    }, []);

const handleSelectChat = useCallback((chatSlug) => {
        if (!chatSlug || chatSlug === 'undefined' || chatSlug === 'null') return;

        const slugStr = String(chatSlug);
        setOpenedChatSlugs(prev => (prev.includes(slugStr) ? prev : [...prev, slugStr]));
        setSelectedMessageUuids([]);
        setReplyingTo(null);
        setEditingMessage(null);

        if (slugStr === 'saved') {
            setSearchParams({ saved: '' });
            return;
        }

        // Перевіряємо тип чату зі списку
        const targetChat = chats.find(c => c.slug === slugStr);
        if (targetChat?.is_group) {
            setSearchParams({ gc: slugStr });
        } else {
            setSearchParams({ dm: slugStr });
        }
    }, [chats, setSearchParams]);

    const handleBackToInbox = useCallback(() => {
        setSelectedMessageUuids([]);
        setSearchParams({});
    }, [setSearchParams]);

    const handleCloseChatTab = useCallback((e, chatSlug) => {
        e.stopPropagation();
        const slugStr = String(chatSlug);
        setOpenedChatSlugs(prev => {
            const next = prev.filter(s => s !== slugStr);
            if (activeChatSlug === slugStr) {
                if (next.length > 0) {
                    handleSelectChat(next[next.length - 1]);
                } else {
                    setSearchParams({});
                }
            }
            return next;
        });
    }, [activeChatSlug, setSearchParams]);

    const handleMarkAllAsRead = useCallback(() => {
        chatService.markAllAsRead()
            .onSuccess((res) => {
                setChats(prev => prev.map(c => ({ ...c, unread_count: 0, is_last_unread: false })));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [t]);

    const handleTogglePinChat = useCallback((chatSlug) => {
        const target = chats.find(c => c.slug === chatSlug);
        if (!target) return;

        const nextPinnedState = !target.is_pinned; // <-- виправлення: оголошення змінної

        if (nextPinnedState) {
            const currentPinnedCount = chats.filter(c => c.is_pinned && !c.is_saved).length;
            if (currentPinnedCount >= MAX_PINNED_CHATS) {
                notifyError(t('chat.errors.max_pinned_chats', { count: MAX_PINNED_CHATS }));
                return;
            }
        }

        chatService.togglePinChat(chatSlug, nextPinnedState)
            .onSuccess((res) => {
                setChats(prev => prev.map(c => (c.slug === chatSlug ? { ...c, is_pinned: nextPinnedState } : c)));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [chats, t]);

    const handleMarkChatUnread = useCallback((chatSlug) => {
        chatService.markAsUnread(chatSlug)
            .onSuccess((res) => {
                setChats(prev =>
                    prev.map(c => (c.slug === chatSlug ? { ...c, is_last_unread: true, unread_count: Math.max(1, c.unread_count) } : c))
                );
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [t]);

    const handleMuteChat = useCallback((chatSlug, duration) => {
        chatService.muteChat(chatSlug, duration)
            .onSuccess((res) => {
                setChats(prev => prev.map(c => (c.slug === chatSlug ? { ...c, muted_until: duration } : c)));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [t]);

    const handleClearChatHistory = useCallback((chatSlug) => {
        chatService.clearChatHistory(chatSlug)
            .onSuccess((res) => {
                setMessagesMap(prev => ({ ...prev, [chatSlug]: [] }));
                setChats(prev =>
                    prev.map(c => (c.slug === chatSlug ? { ...c, last_message: null, last_message_files: [], last_message_shareable: null, unread_count: 0, is_last_unread: false } : c))
                );
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [t]);

    const handleDeleteChat = useCallback((chatSlug, forBoth = false) => {
        const slugStr = String(chatSlug || activeChatSlug);
        if (!slugStr) return;

        chatService.deleteChat(slugStr, forBoth)
            .onSuccess((res) => {
                setChats(prev => prev.filter(c => c.slug !== slugStr));
                setOpenedChatSlugs(prev => prev.filter(s => s !== slugStr));
                if (activeChatSlug === slugStr) {
                    setSearchParams({});
                }
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, setSearchParams, t]);

    const handleCreateNewChat = useCallback(({ isGroup, targetUsername, title, description, participantUsernames = [] }) => {
        const req = !isGroup
            ? chatService.initChat(targetUsername)
            : chatService.createGroupChat(title, description, participantUsernames);

        req.onSuccess((res) => {
            if (res?.chat) {
                setChats(prev => prev.some(c => c.slug === res.chat.slug) ? prev : [res.chat, ...prev]);
            }
            if (res?.slug) {
                handleSelectChat(res.slug);
            }
            notifySuccess(t(`api.success.${res.code}`));
        }).onError((err) => {
            notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
        });
    }, [handleSelectChat, t]);

    const toggleSelectMessage = useCallback((msgUuid) => {
        setSelectedMessageUuids(prev =>
            prev.includes(msgUuid) ? prev.filter(u => u !== msgUuid) : [...prev, msgUuid]
        );
    }, []);

    const clearSelectedMessages = useCallback(() => {
        setSelectedMessageUuids([]);
    }, []);

    const toggleImportantMessage = useCallback((msgUuid) => {
        if (!activeChatSlug) return;
        chatService.toggleImportantMessage(activeChatSlug, msgUuid)
            .onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatSlug]: (prev[activeChatSlug] || []).map(m =>
                        m.uuid === msgUuid ? { ...m, is_important: !m.is_important } : m
                    )
                }));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleBulkImportant = useCallback(() => {
        if (!activeChatSlug || selectedMessageUuids.length === 0) return;
        chatService.toggleBulkImportantMessages(activeChatSlug, selectedMessageUuids)
            .onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatSlug]: (prev[activeChatSlug] || []).map(m =>
                        selectedMessageUuids.includes(m.uuid) ? { ...m, is_important: true } : m
                    )
                }));
                setSelectedMessageUuids([]);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, selectedMessageUuids, t]);

    const handleBulkDelete = useCallback((forBoth = false) => {
        if (!activeChatSlug || selectedMessageUuids.length === 0) return;
        chatService.deleteBulkMessages(activeChatSlug, selectedMessageUuids, forBoth)
            .onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatSlug]: (prev[activeChatSlug] || []).filter(m => !selectedMessageUuids.includes(m.uuid))
                }));
                setSelectedMessageUuids([]);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, selectedMessageUuids, t]);

    const handleForwardMessages = useCallback((targetChatSlug, messageUuidsToForward, comment = '') => {
        if (!activeChatSlug || !targetChatSlug || messageUuidsToForward.length === 0) return;
        chatService.forwardMessages(activeChatSlug, targetChatSlug, messageUuidsToForward, comment)
            .onSuccess((res) => {
                setSelectedMessageUuids([]);
                handleSelectChat(targetChatSlug);
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, handleSelectChat, t]);

    const handleSend = useCallback(() => {
        if (!activeChatSlug) return;
        const hasText = hasRichContent(text);
        if (!hasText && files.length === 0) return;

        const richDoc = hasText ? toTipTapDoc(text) : null;

        if (editingMessage) {
            chatService.updateMessage(activeChatSlug, editingMessage.uuid, richDoc, files)
                .onSuccess((res) => {
                    setMessagesMap(prev => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).map(m =>
                            m.uuid === editingMessage.uuid
                                ? { ...m, text: richDoc, files: files.length > 0 ? files : m.files, is_edited: true }
                                : m
                        )
                    }));
                    setEditingMessage(null);
                    setText(null);
                    setFiles([]);
                    notifySuccess(t(`api.success.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });
        } else {
            chatService.sendMessage(activeChatSlug, richDoc, files, null, replyingTo?.uuid, sendAsGroup)
                .onSuccess((res) => {
                    if (res?.message) {
                        setMessagesMap(prev => ({
                            ...prev,
                            [activeChatSlug]: [...(prev[activeChatSlug] || []), res.message]
                        }));
                        setChats(prev => prev.map(c => c.slug === activeChatSlug ? {
                            ...c,
                            last_message: res.message.text,
                            last_message_files: res.message.files || [],
                            last_message_shareable: res.message.shareable || null,
                            last_message_sender_username: currentUser?.username,
                            last_message_author: currentUser,
                            last_message_author_type: sendAsGroup ? 'group' : 'user',
                            updated_at: res.message.created_at
                        } : c));
                    }
                    setText(null);
                    setFiles([]);
                    setReplyingTo(null);
                    notifySuccess(t(`api.success.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
                });
        }
    }, [activeChatSlug, currentUser, text, files, editingMessage, replyingTo, sendAsGroup, setText, setFiles, t]);

    const handleDeleteClick = useCallback((uuid) => {
        if (!activeChatSlug) return;
        chatService.deleteMessage(activeChatSlug, uuid, true)
            .onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatSlug]: (prev[activeChatSlug] || []).filter(m => m.uuid !== uuid)
                }));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleEditClick = useCallback((msg) => {
        setEditingMessage(msg);
        setText(toTipTapDoc(msg.text));
        setEditorResetKey(k => k + 1);
        setReplyingTo(null);
    }, [setText]);

    const togglePin = useCallback((uuid) => {
        if (!activeChatSlug) return;
        chatService.togglePin(activeChatSlug, uuid)
            .onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatSlug]: (prev[activeChatSlug] || []).map(m =>
                        m.uuid === uuid ? { ...m, is_pinned: !m.is_pinned } : { ...m, is_pinned: false }
                    )
                }));
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleReportMessage = useCallback((messageUuid, reason) => {
        if (!activeChatSlug) return;
        chatService.reportMessage(activeChatSlug, messageUuid, reason)
            .onSuccess((res) => {
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleCancelReplyEdit = useCallback(() => {
        setEditingMessage(null);
        setReplyingTo(null);
        setText(null);
        setEditorResetKey(k => k + 1);
        setFiles([]);
    }, [setText, setFiles]);

    const handleFileChange = useCallback((e) => {
        if (e.target.files?.length > 0) {
            const incoming = Array.from(e.target.files).map(rawFile => ({
                rawFile,
                name: rawFile.name,
                type: rawFile.type || 'application/octet-stream',
                url: URL.createObjectURL(rawFile),
                previewUrl: URL.createObjectURL(rawFile)
            }));
            setFiles(prev => [...prev, ...incoming]);
            e.target.value = null;
        }
    }, [setFiles]);

    const handleAddGraffitiFile = useCallback((dataUrl) => {
        const graffitiAttachment = {
            name: `graffiti_${Date.now()}.png`,
            type: 'image/png',
            url: dataUrl,
            previewUrl: dataUrl
        };
        setFiles(prev => [...prev, graffitiAttachment]);
    }, [setFiles]);

    const handleRemoveFile = useCallback((index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, [setFiles]);

    const getReplyName = useCallback(() => {
        if (!replyingTo) return '';
        if (replyingTo.author_type === 'group') return getPlainText(activeChat?.title);
        return replyingTo.isMine
            ? currentUser?.first_name
            : (replyingTo.author?.first_name || activeChat?.target_user?.first_name || '');
    }, [replyingTo, currentUser, activeChat]);

    // Обробник "пише..." з емітом на сокет
    const handleTyping = useCallback(() => {
        if (!socket || !activeChatSlug) return;

        const receiverUsername = activeChat?.target_user?.username;

        socket.emit('typing_start', {
            chat_slug: activeChatSlug,
            receiver_username: receiverUsername
        });

        if (window.typingTimeout) clearTimeout(window.typingTimeout);
        window.typingTimeout = setTimeout(() => {
            if (socket) {
                socket.emit('typing_stop', {
                    chat_slug: activeChatSlug,
                    receiver_username: receiverUsername
                });
            }
        }, 2500);
    }, [socket, activeChatSlug, activeChat]);

    const handleLoadMoreMessages = useCallback(() => {
        if (!activeChatSlug || isLoadingMore) return;
        setIsLoadingMore(true);
        chatService.getMessages(activeChatSlug, 2)
            .onSuccess(() => {
                setIsLoadingMore(false);
                setHasMoreMessages(false);
            })
            .onError(() => {
                setIsLoadingMore(false);
            });
    }, [activeChatSlug, isLoadingMore]);

    const handleUpdateGroupInfo = useCallback((title, description) => {
        if (!activeChatSlug) return;
        const tiptapTitle = toTipTapDoc(title);
        const tiptapDesc = toTipTapDoc(description);

        chatService.updateGroupInfo(activeChatSlug, tiptapTitle, tiptapDesc)
            .onSuccess((res) => {
                setChats(prev =>
                    prev.map(c => (c.slug === activeChatSlug ? { ...c, title: tiptapTitle, description: tiptapDesc } : c))
                );
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleInviteGroupMember = useCallback((username) => {
        if (!activeChatSlug) return;
        chatService.inviteGroupMember(activeChatSlug, username)
            .onSuccess((res) => {
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleUpdateGroupMemberRole = useCallback((username, newRole) => {
        if (!activeChatSlug) return;
        chatService.updateGroupMemberRole(activeChatSlug, username, newRole)
            .onSuccess((res) => {
                setChats(prev =>
                    prev.map(c => {
                        if (c.slug !== activeChatSlug) return c;
                        return {
                            ...c,
                            participants: (c.participants || []).map(p =>
                                p.user.username === username ? { ...p, role: newRole } : p
                            )
                        };
                    })
                );
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleKickGroupMember = useCallback((username) => {
        if (!activeChatSlug) return;
        chatService.kickGroupMember(activeChatSlug, username)
            .onSuccess((res) => {
                setChats(prev =>
                    prev.map(c => {
                        if (c.slug !== activeChatSlug) return c;
                        const updatedParticipants = (c.participants || []).filter(p => p.user.username !== username);
                        return {
                            ...c,
                            participants: updatedParticipants,
                            participants_count: updatedParticipants.length
                        };
                    })
                );
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, t]);

    const handleBlockUser = useCallback((username) => {
        const targetUsername = username || activeChat?.target_user?.username;
        if (!targetUsername) return;

        chatService.blockUser(targetUsername)
            .onSuccess((res) => {
                if (activeChatSlug) {
                    setChats(prev => prev.map(c => (c.slug === activeChatSlug ? { ...c, is_blocked: true } : c)));
                }
                notifySuccess(t(`api.success.${res.code}`));
            })
            .onError((err) => {
                notifyError(t(`api.error.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChat, activeChatSlug, t]);

    const canWrite = !activeChat?.target_user?.is_deleted && !activeChat?.is_blocked;

    const layoutProps = {
        currentUser,
        friendsList,
        chats: sortedAndSearchedChats,
        allChats: chats,
        openedChats,
        draftsMap,
        draftFilesMap,
        sendAsGroup,
        setSendAsGroup,
        editorResetKey,
        messages,
        activeChat,
        activeChatSlug,
        selectedMessageUuids,
        toggleSelectMessage,
        clearSelectedMessages,
        toggleImportantMessage,
        handleBulkImportant,
        handleBulkDelete,
        handleForwardMessages,
        handleReportMessage,
        searchQuery,
        setSearchQuery,
        isBannerVisible,
        handleDismissBanner,
        text,
        setText,
        files,
        setFiles,
        editingMessage,
        replyingTo,
        setReplyingTo,
        replyingToName: getReplyName(),
        handleSelectChat,
        handleBackToInbox,
        handleCloseChatTab,
        handleMarkAllAsRead,
        handleTogglePinChat,
        handleMarkChatUnread,
        handleMuteChat,
        handleClearChatHistory,
        handleDeleteChat,
        handleCreateNewChat,
        handleSend,
        handleEditClick,
        handleDelete: handleDeleteClick,
        togglePin,
        handleCancelReplyEdit,
        handleFileChange,
        handleAddGraffitiFile,
        handleRemoveFile,
        isTyping: Boolean(typingUsers[activeChatSlug]),
        typingUser: typingUsers[activeChatSlug],
        onTyping: handleTyping,
        isLoadingMore,
        hasMoreMessages,
        onLoadMore: handleLoadMoreMessages,
        handleUpdateGroupInfo,
        handleInviteGroupMember,
        handleUpdateGroupMemberRole,
        handleKickGroupMember,
        handleBlockUser,
        canWrite,
        cantWriteReason: '',
    };

    return { layoutProps };
}