import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { AuthContext } from '../../../context/AuthContext';
import chatService from '../../../services/chat.service.js';
import { fallbackCurrentUser, buildMockData, mockFriendsList } from '../utils/mock.js';
import { getPlainText, toTipTapDoc, hasRichContent } from '../utils/messageParser.js';
import { notifySuccess, notifyError } from '../../common/Notify.jsx';

const MAX_PINNED_CHATS = 5;

const generateUuidV7 = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `0192e8a0-${Math.random().toString(16).slice(2, 6)}-7000-8000-${Date.now().toString(16).padStart(12, '0')}`;
};

export function useChatPage() {
    const { t } = useTranslation();
    const { user: authUser } = useContext(AuthContext) || {};
    const currentUser = authUser && authUser.username ? authUser : fallbackCurrentUser;

    const isWipMode = localStorage.getItem('tetrone_WIP') === 'true';

    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatSlug = searchParams.get('id');

    const initialData = useMemo(() => {
        if (!isWipMode) return { chats: [], messagesByChat: {} };
        return buildMockData(currentUser);
    }, [isWipMode, currentUser]);

    const [chats, setChats] = useState(initialData.chats);
    const [messagesMap, setMessagesMap] = useState(initialData.messagesByChat);
    const [openedChatSlugs, setOpenedChatSlugs] = useState(() => (activeChatSlug ? [activeChatSlug] : []));
    const [selectedMessageUuids, setSelectedMessageUuids] = useState([]);

    const [draftsMap, setDraftsMap] = useState({});
    const [draftFilesMap, setDraftFilesMap] = useState({});
    const [sendAsGroup, setSendAsGroup] = useState(false);
    const [editorResetKey, setEditorResetKey] = useState(0);
    const [editingMessage, setEditingMessage] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [isTyping, setIsTyping] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [hasMoreMessages, setHasMoreMessages] = useState(false);

    const [isBannerVisible, setIsBannerVisible] = useState(() => {
        return localStorage.getItem('tetrone_hide_im_banner') !== 'true';
    });

    // Коли з AuthContext підвантажується реальний юзер при tetrone_WIP = true — оновлюємо мок під нього
    useEffect(() => {
        if (isWipMode && authUser?.username) {
            const fresh = buildMockData(authUser);
            setChats(fresh.chats);
            setMessagesMap(fresh.messagesByChat);
        } else if (!isWipMode) {
            chatService.getChats().onSuccess((res) => {
                if (Array.isArray(res?.chats)) {
                    setChats(res.chats);
                }
            });
        }
    }, [isWipMode, authUser]);

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

    useEffect(() => {
        if (activeChatSlug) {
            setSendAsGroup(false);
            setOpenedChatSlugs(prev => (prev.includes(activeChatSlug) ? prev : [...prev, activeChatSlug]));
            chatService.markAsRead(activeChatSlug).onSuccess(() => {
                setChats(prev =>
                    prev.map(c => (c.slug === activeChatSlug ? { ...c, unread_count: 0, is_last_unread: false } : c))
                );
            });
        }
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
    }, [chats, messagesMap, searchQuery]);

    const handleDismissBanner = useCallback(() => {
        localStorage.setItem('tetrone_hide_im_banner', 'true');
        setIsBannerVisible(false);
    }, []);

    const handleSelectChat = useCallback((chatSlug) => {
        const slugStr = String(chatSlug);
        setOpenedChatSlugs(prev => (prev.includes(slugStr) ? prev : [...prev, slugStr]));
        setSelectedMessageUuids([]);
        setReplyingTo(null);
        setEditingMessage(null);
        setSearchParams({ id: slugStr });
    }, [setSearchParams]);

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
                    setSearchParams({ id: next[next.length - 1] });
                } else {
                    setSearchParams({});
                }
            }
            return next;
        });
    }, [activeChatSlug, setSearchParams]);

    const handleMarkAllAsRead = useCallback(() => {
        chatService.markAllAsRead().onSuccess((res) => {
            setChats(prev => prev.map(c => ({ ...c, unread_count: 0, is_last_unread: false })));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleTogglePinChat = useCallback((chatSlug) => {
        const target = chats.find(c => c.slug === chatSlug);
        if (!target) return;

        const nextPinnedState = !target.is_pinned;
        if (nextPinnedState) {
            const currentPinnedCount = chats.filter(c => c.is_pinned).length;
            if (currentPinnedCount >= MAX_PINNED_CHATS) {
                notifyError(t('chat.errors.max_pinned_chats', { count: MAX_PINNED_CHATS }));
                return;
            }
        }

        chatService.togglePinChat(chatSlug, nextPinnedState).onSuccess((res) => {
            setChats(prev => prev.map(c => (c.slug === chatSlug ? { ...c, is_pinned: nextPinnedState } : c)));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [chats, t]);

    const handleMarkChatUnread = useCallback((chatSlug) => {
        chatService.markAsUnread(chatSlug).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => (c.slug === chatSlug ? { ...c, is_last_unread: true, unread_count: Math.max(1, c.unread_count) } : c))
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleMuteChat = useCallback((chatSlug, duration) => {
        chatService.muteChat(chatSlug, duration).onSuccess((res) => {
            setChats(prev => prev.map(c => (c.slug === chatSlug ? { ...c, muted_until: duration } : c)));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleClearChatHistory = useCallback((chatSlug) => {
        chatService.clearChatHistory(chatSlug).onSuccess((res) => {
            setMessagesMap(prev => ({ ...prev, [chatSlug]: [] }));
            setChats(prev =>
                prev.map(c => (c.slug === chatSlug ? { ...c, last_message: null, last_message_files: [], last_message_shared_post: null, unread_count: 0, is_last_unread: false } : c))
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleDeleteChat = useCallback((chatSlug, forBoth = false) => {
        const slugStr = String(chatSlug || activeChatSlug);
        if (!slugStr) return;

        chatService.deleteChat(slugStr, forBoth).onSuccess((res) => {
            setChats(prev => prev.filter(c => c.slug !== slugStr));
            setOpenedChatSlugs(prev => prev.filter(s => s !== slugStr));
            if (activeChatSlug === slugStr) {
                setSearchParams({});
            }
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, setSearchParams, t]);

    const handleCreateNewChat = useCallback(({ isGroup, targetUsername, title, description, participantUsernames = [] }) => {
        if (!isGroup) {
            const existing = chats.find(c => !c.is_group && c.target_user?.username === targetUsername);
            if (existing) {
                handleSelectChat(existing.slug);
                return;
            }
            const targetUser = mockFriendsList.find(u => u.username === targetUsername);
            if (!targetUser) return;

            chatService.initChat(targetUser.username).onSuccess((res) => {
                const newSlug = `dm_${targetUser.username}_${Date.now()}`;
                const newChat = {
                    slug: newSlug,
                    is_group: false,
                    is_pinned: false,
                    is_typing: false,
                    typing_users: [],
                    muted_until: null,
                    initiator_username: currentUser.username,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    target_user: targetUser,
                    last_message: null,
                    last_message_files: [],
                    last_message_sender_username: currentUser.username,
                    last_message_author_type: 'user',
                    last_message_author: currentUser,
                    is_last_unread: false,
                    unread_count: 0
                };
                setChats(prev => [newChat, ...prev]);
                setMessagesMap(prev => ({ ...prev, [newSlug]: [] }));
                handleSelectChat(newSlug);
                notifySuccess(t(`api.success.${res.code}`));
            });
        } else {
            const tiptapTitle = toTipTapDoc(title);
            const tiptapDesc = toTipTapDoc(description);

            chatService.createGroupChat(tiptapTitle, tiptapDesc, participantUsernames).onSuccess((res) => {
                const newSlug = `grp_${Date.now()}`;
                const selectedUsers = mockFriendsList.filter(u => participantUsernames.includes(u.username));
                const participants = [
                    { user: currentUser, role: 'owner' },
                    ...selectedUsers.map(u => ({ user: u, role: 'member' }))
                ];

                const newGroup = {
                    slug: newSlug,
                    is_group: true,
                    is_pinned: false,
                    is_typing: false,
                    typing_users: [],
                    muted_until: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    title: tiptapTitle,
                    description: tiptapDesc,
                    avatar: `https://picsum.photos/seed/${newSlug}/100/100`,
                    participants_count: participants.length,
                    owner_username: currentUser.username,
                    participants,
                    last_message: toTipTapDoc(t('chat.system.group_created')),
                    last_message_files: [],
                    last_message_sender_username: currentUser.username,
                    last_message_author_type: 'user',
                    last_message_author: currentUser,
                    is_last_unread: false,
                    unread_count: 0
                };

                setChats(prev => [newGroup, ...prev]);
                setMessagesMap(prev => ({ ...prev, [newSlug]: [] }));
                handleSelectChat(newSlug);
                notifySuccess(t(`api.success.${res.code}`));
            });
        }
    }, [chats, currentUser, handleSelectChat, t]);

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
        const targetMsg = (messagesMap[activeChatSlug] || []).find(m => m.uuid === msgUuid);
        if (!targetMsg) return;

        // Якщо ми вже в чаті "Важливі" і натискаємо зірочку — видаляємо повідомлення зі сховища
        if (activeChatSlug === 'saved') {
            chatService.deleteMessage('saved', msgUuid).onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    saved: (prev.saved || []).filter(m => m.uuid !== msgUuid)
                }));
                notifySuccess(t(`api.success.${res.code}`));
            });
            return;
        }

        const willBeImportant = !targetMsg.is_important;

        chatService.toggleImportantMessage(activeChatSlug, msgUuid).onSuccess((res) => {
            setMessagesMap(prev => {
                const updatedCurrentChat = (prev[activeChatSlug] || []).map(m =>
                    m.uuid === msgUuid ? { ...m, is_important: willBeImportant } : m
                );

                let updatedSavedChat = [...(prev.saved || [])];
                if (willBeImportant) {
                    const origAuthor = targetMsg.isMine ? currentUser : (targetMsg.author || activeChat?.target_user);
                    const savedCopy = {
                        uuid: generateUuidV7(),
                        source_msg_uuid: msgUuid,
                        isMine: true,
                        author_type: 'user',
                        author: currentUser,
                        text: toTipTapDoc(targetMsg.text),
                        shared_post: targetMsg.shared_post || null,
                        files: targetMsg.files || [],
                        status: 'read',
                        created_at: new Date().toISOString(),
                        is_edited: false,
                        is_pinned: false,
                        is_important: true,
                        reply_to: {
                            author: origAuthor,
                            sender_name: `${origAuthor?.first_name || ''} ${origAuthor?.last_name || ''}`.trim() || origAuthor?.username,
                            date: new Date(targetMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            text: toTipTapDoc(targetMsg.text)
                        }
                    };
                    updatedSavedChat.push(savedCopy);

                    setChats(chatsPrev =>
                        chatsPrev.map(c =>
                            c.slug === 'saved'
                                ? {
                                    ...c,
                                    last_message: savedCopy.text,
                                    last_message_files: savedCopy.files,
                                    last_message_shared_post: savedCopy.shared_post,
                                    last_message_sender_username: currentUser.username,
                                    last_message_author: currentUser,
                                    updated_at: savedCopy.created_at
                                }
                                : c
                        )
                    );
                } else {
                    updatedSavedChat = updatedSavedChat.filter(m => m.source_msg_uuid !== msgUuid);
                }

                return {
                    ...prev,
                    [activeChatSlug]: updatedCurrentChat,
                    saved: updatedSavedChat
                };
            });

            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, messagesMap, currentUser, activeChat, t]);

    const handleBulkImportant = useCallback(() => {
        if (!activeChatSlug || selectedMessageUuids.length === 0) return;
        const selectedMsgs = (messagesMap[activeChatSlug] || []).filter(m => selectedMessageUuids.includes(m.uuid));
        if (selectedMsgs.length === 0) return;

        chatService.toggleBulkImportantMessages(activeChatSlug, selectedMessageUuids).onSuccess((res) => {
            const now = new Date().toISOString();
            const newSavedItems = selectedMsgs.map(orig => {
                const origAuthor = orig.isMine ? currentUser : (orig.author || activeChat?.target_user);
                return {
                    uuid: generateUuidV7(),
                    source_msg_uuid: orig.uuid,
                    isMine: true,
                    author_type: 'user',
                    author: currentUser,
                    text: toTipTapDoc(orig.text),
                    shared_post: orig.shared_post || null,
                    files: orig.files || [],
                    status: 'read',
                    created_at: now,
                    is_edited: false,
                    is_pinned: false,
                    is_important: true,
                    reply_to: {
                        author: origAuthor,
                        sender_name: `${origAuthor?.first_name || ''} ${origAuthor?.last_name || ''}`.trim() || origAuthor?.username,
                        date: new Date(orig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        text: toTipTapDoc(orig.text)
                    }
                };
            });

            setMessagesMap(prev => ({
                ...prev,
                [activeChatSlug]: (prev[activeChatSlug] || []).map(m =>
                    selectedMessageUuids.includes(m.uuid) ? { ...m, is_important: true } : m
                ),
                saved: [...(prev.saved || []), ...newSavedItems]
            }));

            const lastItem = newSavedItems[newSavedItems.length - 1];
            setChats(prev =>
                prev.map(c =>
                    c.slug === 'saved'
                        ? {
                            ...c,
                            last_message: lastItem.text,
                            last_message_files: lastItem.files,
                            last_message_shared_post: lastItem.shared_post,
                            last_message_sender_username: currentUser.username,
                            last_message_author: currentUser,
                            updated_at: now
                        }
                        : c
                )
            );

            setSelectedMessageUuids([]);
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, selectedMessageUuids, messagesMap, currentUser, activeChat, t]);

    const handleBulkDelete = useCallback((forBoth = false) => {
        if (!activeChatSlug || selectedMessageUuids.length === 0) return;
        chatService.deleteBulkMessages(activeChatSlug, selectedMessageUuids, forBoth).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatSlug]: (prev[activeChatSlug] || []).filter(m => !selectedMessageUuids.includes(m.uuid))
            }));
            setSelectedMessageUuids([]);
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, selectedMessageUuids, t]);

    const handleForwardMessages = useCallback((targetChatSlug, messageUuidsToForward, comment = '') => {
        if (!activeChatSlug || !targetChatSlug || messageUuidsToForward.length === 0) return;
        const sourceMessages = (messagesMap[activeChatSlug] || []).filter(m => messageUuidsToForward.includes(m.uuid));
        if (sourceMessages.length === 0) return;

        chatService.forwardMessages(activeChatSlug, targetChatSlug, messageUuidsToForward, comment).onSuccess((res) => {
            const now = new Date().toISOString();
            const forwardedItems = sourceMessages.map((orig) => ({
                uuid: generateUuidV7(),
                isMine: true,
                author_type: 'user',
                author: currentUser,
                text: comment ? toTipTapDoc(comment) : toTipTapDoc(orig.text),
                shared_post: orig.shared_post || null,
                status: 'read',
                created_at: now,
                is_edited: false,
                is_pinned: false,
                is_important: false,
                reply_to: {
                    author: orig.isMine ? currentUser : orig.author,
                    sender_name: `${(orig.isMine ? currentUser : orig.author)?.first_name || ''} ${(orig.isMine ? currentUser : orig.author)?.last_name || ''}`.trim(),
                    date: new Date(orig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: toTipTapDoc(orig.text)
                },
                files: orig.files || []
            }));

            setMessagesMap(prev => ({
                ...prev,
                [targetChatSlug]: [...(prev[targetChatSlug] || []), ...forwardedItems]
            }));

            const lastForwarded = forwardedItems[forwardedItems.length - 1];
            setChats(prev =>
                prev.map(c =>
                    c.slug === targetChatSlug
                        ? {
                              ...c,
                              last_message: lastForwarded.text,
                              last_message_files: lastForwarded.files || [],
                              last_message_shared_post: lastForwarded.shared_post || null,
                              last_message_sender_username: currentUser.username,
                              last_message_author_type: 'user',
                              last_message_author: currentUser,
                              updated_at: now
                          }
                        : c
                )
            );

            setSelectedMessageUuids([]);
            handleSelectChat(targetChatSlug);
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, messagesMap, currentUser, handleSelectChat, t]);

    const handleSend = useCallback(() => {
        if (!activeChatSlug) return;
        const hasText = hasRichContent(text);
        if (!hasText && files.length === 0) return;

        const richDoc = hasText ? toTipTapDoc(text) : null;

        if (editingMessage) {
            chatService.updateMessage(activeChatSlug, editingMessage.uuid, richDoc, files).onSuccess((res) => {
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
            });
        } else {
            chatService.sendMessage(activeChatSlug, richDoc, files, null, replyingTo?.uuid).onSuccess((res) => {
                const replyAuthor = replyingTo
                    ? (replyingTo.isMine ? currentUser : (replyingTo.author || activeChat?.target_user))
                    : null;

                const normalizedFiles = files.map((f) => ({
                    name: f.name,
                    type: f.type || 'image/png',
                    url: f.url || f.previewUrl
                }));

                const isGroupIdentity = Boolean(activeChat?.is_group && sendAsGroup);
                const newMsg = {
                    uuid: generateUuidV7(),
                    isMine: true,
                    author_type: isGroupIdentity ? 'group' : 'user',
                    author: currentUser,
                    text: richDoc,
                    status: 'read',
                    created_at: new Date().toISOString(),
                    read_at: null,
                    is_edited: false,
                    is_pinned: false,
                    is_important: false,
                    reply_to: replyingTo ? {
                        uuid: replyingTo.uuid,
                        author: replyAuthor,
                        sender_name: `${replyAuthor?.first_name || ''} ${replyAuthor?.last_name || ''}`.trim() || replyAuthor?.username,
                        date: new Date(replyingTo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        text: toTipTapDoc(replyingTo.text)
                    } : null,
                    files: normalizedFiles
                };

                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatSlug]: [...(prev[activeChatSlug] || []), newMsg]
                }));

                setChats(prev =>
                    prev.map(c =>
                        c.slug === activeChatSlug
                            ? {
                                  ...c,
                                  last_message: richDoc,
                                  last_message_files: normalizedFiles,
                                  last_message_shared_post: null,
                                  last_message_sender_username: isGroupIdentity ? activeChatSlug : currentUser.username,
                                  last_message_author_type: isGroupIdentity ? 'group' : 'user',
                                  last_message_author: isGroupIdentity ? null : currentUser,
                                  updated_at: newMsg.created_at
                              }
                            : c
                    )
                );

                setText(null);
                setFiles([]);
                setReplyingTo(null);
                notifySuccess(t(`api.success.${res.code}`));
            });
        }
    }, [activeChatSlug, text, files, editingMessage, replyingTo, activeChat, currentUser, sendAsGroup, setText, setFiles, t]);

    const handleDeleteClick = useCallback((uuid) => {
        if (!activeChatSlug) return;
        chatService.deleteMessage(activeChatSlug, uuid).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatSlug]: (prev[activeChatSlug] || []).filter(m => m.uuid !== uuid)
            }));
            notifySuccess(t(`api.success.${res.code}`));
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
        chatService.togglePin(activeChatSlug, uuid).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatSlug]: (prev[activeChatSlug] || []).map(m =>
                    m.uuid === uuid ? { ...m, is_pinned: !m.is_pinned } : { ...m, is_pinned: false }
                )
            }));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, t]);

    const handleReportMessage = useCallback((messageUuid, reason) => {
        if (!activeChatSlug) return;
        chatService.reportMessage(activeChatSlug, messageUuid, reason).onSuccess((res) => {
            notifySuccess(t(`api.success.${res.code}`));
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
            ? currentUser.first_name
            : (replyingTo.author?.first_name || activeChat?.target_user?.first_name || '');
    }, [replyingTo, currentUser, activeChat]);

    const handleTyping = useCallback(() => {
        if (!isTyping) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
        }
    }, [isTyping]);

    const handleLoadMoreMessages = useCallback(() => {
        if (!activeChatSlug || isLoadingMore) return;
        setIsLoadingMore(true);
        chatService.getMessages(activeChatSlug, 2).onSuccess(() => {
            setIsLoadingMore(false);
            setHasMoreMessages(false);
        });
    }, [activeChatSlug, isLoadingMore]);

    const handleUpdateGroupInfo = useCallback((title, description) => {
        if (!activeChatSlug) return;
        const tiptapTitle = toTipTapDoc(title);
        const tiptapDesc = toTipTapDoc(description);

        chatService.updateGroupInfo(activeChatSlug, tiptapTitle, tiptapDesc).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => (c.slug === activeChatSlug ? { ...c, title: tiptapTitle, description: tiptapDesc } : c))
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, t]);

    const handleInviteGroupMember = useCallback((username) => {
        if (!activeChatSlug) return;
        const userToAdd = mockFriendsList.find(u => u.username === username);
        if (!userToAdd) return;

        chatService.inviteGroupMember(activeChatSlug, userToAdd.username).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => {
                    if (c.slug !== activeChatSlug) return c;
                    if (c.participants?.some(p => p.user.username === userToAdd.username)) return c;
                    const updatedParticipants = [...(c.participants || []), { user: userToAdd, role: 'member' }];
                    return {
                        ...c,
                        participants: updatedParticipants,
                        participants_count: updatedParticipants.length
                    };
                })
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatSlug, t]);

    const handleUpdateGroupMemberRole = useCallback((username, newRole) => {
        if (!activeChatSlug) return;
        chatService.updateGroupMemberRole(activeChatSlug, username, newRole).onSuccess((res) => {
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
        });
    }, [activeChatSlug, t]);

    const handleKickGroupMember = useCallback((username) => {
        if (!activeChatSlug) return;
        chatService.kickGroupMember(activeChatSlug, username).onSuccess((res) => {
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
        });
    }, [activeChatSlug, t]);

    const handleBlockUser = useCallback((username) => {
        const targetUsername = username || activeChat?.target_user?.username;
        if (!targetUsername) return;

        chatService.blockUser(targetUsername).onSuccess((res) => {
            if (activeChatSlug) {
                setChats(prev => prev.map(c => (c.slug === activeChatSlug ? { ...c, is_blocked: true } : c)));
            }
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChat, activeChatSlug, t]);

    const canWrite = !activeChat?.target_user?.is_deleted && !activeChat?.is_blocked;

    const layoutProps = {
        currentUser,
        friendsList: mockFriendsList,
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
        isTyping,
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