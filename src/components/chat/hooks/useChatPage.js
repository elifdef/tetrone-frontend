import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import chatService from '../../../services/chat.service.js';
import { mockCurrentUser, mockChats, mockMessagesByChat, mockFriendsList } from '../utils/mock.js';
import { getPlainText, toTipTapDoc, hasRichContent } from '../utils/messageParser.js';
import { notifySuccess, notifyError } from '../../common/Notify.jsx';

const MAX_PINNED_CHATS = 5;

export function useChatPage() {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeChatId = searchParams.get('id');

    const [chats, setChats] = useState(mockChats);
    const [messagesMap, setMessagesMap] = useState(mockMessagesByChat);
    const [openedChatIds, setOpenedChatIds] = useState(() => (activeChatId ? [activeChatId] : []));
    const [selectedMessageIds, setSelectedMessageIds] = useState([]);

    const [draftsMap, setDraftsMap] = useState({});
    const [draftFilesMap, setDraftFilesMap] = useState({});
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

    const text = useMemo(() => {
        if (!activeChatId) return null;
        return draftsMap[activeChatId] ?? null;
    }, [draftsMap, activeChatId]);

    const setText = useCallback((valOrUpdater) => {
        if (!activeChatId) return;
        setDraftsMap(prev => {
            const currentVal = prev[activeChatId] ?? null;
            const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
            return { ...prev, [activeChatId]: nextVal };
        });
    }, [activeChatId]);

    const files = useMemo(() => {
        if (!activeChatId) return [];
        return draftFilesMap[activeChatId] ?? [];
    }, [draftFilesMap, activeChatId]);

    const setFiles = useCallback((valOrUpdater) => {
        if (!activeChatId) return;
        setDraftFilesMap(prev => {
            const currentVal = prev[activeChatId] ?? [];
            const nextVal = typeof valOrUpdater === 'function' ? valOrUpdater(currentVal) : valOrUpdater;
            return { ...prev, [activeChatId]: nextVal };
        });
    }, [activeChatId]);

    useEffect(() => {
        if (activeChatId) {
            setOpenedChatIds(prev => (prev.includes(activeChatId) ? prev : [...prev, activeChatId]));
            chatService.markAsRead(activeChatId).onSuccess(() => {
                setChats(prev =>
                    prev.map(c => (c.id === activeChatId ? { ...c, unread_count: 0, is_last_unread: false } : c))
                );
            });
        }
    }, [activeChatId]);

    const activeChat = useMemo(
        () => chats.find(c => c.id === activeChatId) || null,
        [chats, activeChatId]
    );

    const openedChats = useMemo(
        () => openedChatIds.map(id => chats.find(c => c.id === id)).filter(Boolean),
        [openedChatIds, chats]
    );

    const messages = useMemo(
        () => (activeChatId ? messagesMap[activeChatId] || [] : []),
        [messagesMap, activeChatId]
    );

    const sortedAndSearchedChats = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const filtered = chats.filter(chat => {
            if (!query) return true;
            const chatTitle = chat.is_group
                ? getPlainText(chat.title).toLowerCase()
                : `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''}`.toLowerCase();
            const lastMsg = getPlainText(chat.last_message || '').toLowerCase();

            const historyMatch = (messagesMap[chat.id] || []).some(m =>
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

    const handleSelectChat = useCallback((chatId) => {
        const idStr = String(chatId);
        setOpenedChatIds(prev => (prev.includes(idStr) ? prev : [...prev, idStr]));
        setSelectedMessageIds([]);
        setReplyingTo(null);
        setEditingMessage(null);
        setSearchParams({ id: idStr });
    }, [setSearchParams]);

    const handleBackToInbox = useCallback(() => {
        setSelectedMessageIds([]);
        setSearchParams({});
    }, [setSearchParams]);

    const handleCloseChatTab = useCallback((e, chatId) => {
        e.stopPropagation();
        const idStr = String(chatId);
        setOpenedChatIds(prev => {
            const next = prev.filter(id => id !== idStr);
            if (activeChatId === idStr) {
                if (next.length > 0) {
                    setSearchParams({ id: next[next.length - 1] });
                } else {
                    setSearchParams({});
                }
            }
            return next;
        });
    }, [activeChatId, setSearchParams]);

    const handleMarkAllAsRead = useCallback(() => {
        chatService.markAllAsRead().onSuccess((res) => {
            setChats(prev => prev.map(c => ({ ...c, unread_count: 0, is_last_unread: false })));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleTogglePinChat = useCallback((chatId) => {
        const target = chats.find(c => c.id === chatId);
        if (!target) return;

        const nextPinnedState = !target.is_pinned;
        if (nextPinnedState) {
            const currentPinnedCount = chats.filter(c => c.is_pinned).length;
            if (currentPinnedCount >= MAX_PINNED_CHATS) {
                notifyError(t('chat.errors.max_pinned_chats', { count: MAX_PINNED_CHATS }));
                return;
            }
        }

        chatService.togglePinChat(chatId, nextPinnedState).onSuccess((res) => {
            setChats(prev => prev.map(c => (c.id === chatId ? { ...c, is_pinned: nextPinnedState } : c)));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [chats, t]);

    const handleMarkChatUnread = useCallback((chatId) => {
        chatService.markAsUnread(chatId).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => (c.id === chatId ? { ...c, is_last_unread: true, unread_count: Math.max(1, c.unread_count) } : c))
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleMuteChat = useCallback((chatId, duration) => {
        chatService.muteChat(chatId, duration).onSuccess((res) => {
            setChats(prev => prev.map(c => (c.id === chatId ? { ...c, muted_until: duration } : c)));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleClearChatHistory = useCallback((chatId) => {
        chatService.clearChatHistory(chatId).onSuccess((res) => {
            setMessagesMap(prev => ({ ...prev, [chatId]: [] }));
            setChats(prev =>
                prev.map(c => (c.id === chatId ? { ...c, last_message: null, last_message_files: [], unread_count: 0, is_last_unread: false } : c))
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [t]);

    const handleDeleteChat = useCallback((chatId, forBoth = false) => {
        const idStr = String(chatId || activeChatId);
        if (!idStr) return;

        chatService.deleteChat(idStr, forBoth).onSuccess((res) => {
            setChats(prev => prev.filter(c => c.id !== idStr));
            setOpenedChatIds(prev => prev.filter(id => id !== idStr));
            if (activeChatId === idStr) {
                setSearchParams({});
            }
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, setSearchParams, t]);

    const handleCreateNewChat = useCallback(({ isGroup, targetUserId, title, description, participantIds }) => {
        if (!isGroup) {
            const existing = chats.find(c => !c.is_group && c.target_user?.id === Number(targetUserId));
            if (existing) {
                handleSelectChat(existing.id);
                return;
            }
            const targetUser = mockFriendsList.find(u => u.id === Number(targetUserId));
            if (!targetUser) return;

            chatService.initChat(targetUser.id).onSuccess((res) => {
                const newId = String(Date.now());
                const newChat = {
                    id: newId,
                    slug: newId,
                    is_group: false,
                    is_pinned: false,
                    is_typing: false,
                    muted_until: null,
                    initiator_username: mockCurrentUser.username,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    target_user: targetUser,
                    last_message: null,
                    last_message_files: [],
                    last_message_sender_id: mockCurrentUser.id,
                    last_message_author: mockCurrentUser,
                    is_last_unread: false,
                    unread_count: 0
                };
                setChats(prev => [newChat, ...prev]);
                setMessagesMap(prev => ({ ...prev, [newId]: [] }));
                handleSelectChat(newId);
                notifySuccess(t(`api.success.${res.code}`));
            });
        } else {
            const tiptapTitle = toTipTapDoc(title);
            const tiptapDesc = toTipTapDoc(description);

            chatService.createGroupChat(tiptapTitle, tiptapDesc, participantIds).onSuccess((res) => {
                const newId = String(Date.now());
                const selectedUsers = mockFriendsList.filter(u => participantIds.includes(u.id));
                const participants = [
                    { user: mockCurrentUser, role: 'owner' },
                    ...selectedUsers.map(u => ({ user: u, role: 'member' }))
                ];

                const newGroup = {
                    id: newId,
                    slug: newId,
                    is_group: true,
                    is_pinned: false,
                    is_typing: false,
                    muted_until: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    title: tiptapTitle,
                    description: tiptapDesc,
                    avatar: `https://picsum.photos/seed/grp_${newId}/100/100`,
                    participants_count: participants.length,
                    owner_id: mockCurrentUser.id,
                    participants,
                    last_message: toTipTapDoc(t('chat.system.group_created')),
                    last_message_files: [],
                    last_message_sender_id: mockCurrentUser.id,
                    last_message_author: mockCurrentUser,
                    is_last_unread: false,
                    unread_count: 0
                };

                setChats(prev => [newGroup, ...prev]);
                setMessagesMap(prev => ({ ...prev, [newId]: [] }));
                handleSelectChat(newId);
                notifySuccess(t(`api.success.${res.code}`));
            });
        }
    }, [chats, handleSelectChat, t]);

    const toggleSelectMessage = useCallback((msgId) => {
        setSelectedMessageIds(prev =>
            prev.includes(msgId) ? prev.filter(id => id !== msgId) : [...prev, msgId]
        );
    }, []);

    const clearSelectedMessages = useCallback(() => {
        setSelectedMessageIds([]);
    }, []);

    const toggleImportantMessage = useCallback((msgId) => {
        if (!activeChatId) return;
        chatService.toggleImportantMessage(activeChatId, msgId).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatId]: (prev[activeChatId] || []).map(m =>
                    m.id === msgId ? { ...m, is_important: !m.is_important } : m
                )
            }));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

    const handleBulkImportant = useCallback(() => {
        if (!activeChatId || selectedMessageIds.length === 0) return;
        chatService.toggleBulkImportantMessages(activeChatId, selectedMessageIds).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatId]: (prev[activeChatId] || []).map(m =>
                    selectedMessageIds.includes(m.id) ? { ...m, is_important: true } : m
                )
            }));
            setSelectedMessageIds([]);
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, selectedMessageIds, t]);

    const handleBulkDelete = useCallback((forBoth = false) => {
        if (!activeChatId || selectedMessageIds.length === 0) return;
        chatService.deleteBulkMessages(activeChatId, selectedMessageIds, forBoth).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatId]: (prev[activeChatId] || []).filter(m => !selectedMessageIds.includes(m.id))
            }));
            setSelectedMessageIds([]);
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, selectedMessageIds, t]);

    const handleForwardMessages = useCallback((targetChatId, messageIdsToForward, comment = '') => {
        if (!activeChatId || !targetChatId || messageIdsToForward.length === 0) return;
        const sourceMessages = (messagesMap[activeChatId] || []).filter(m => messageIdsToForward.includes(m.id));
        if (sourceMessages.length === 0) return;

        chatService.forwardMessages(activeChatId, targetChatId, messageIdsToForward, comment).onSuccess((res) => {
            const now = new Date().toISOString();
            const forwardedItems = sourceMessages.map((orig, idx) => ({
                id: Date.now() + idx,
                isMine: true,
                author: mockCurrentUser,
                text: comment ? toTipTapDoc(comment) : toTipTapDoc(orig.text),
                status: 'read',
                created_at: now,
                is_edited: false,
                is_pinned: false,
                is_important: false,
                reply_to: {
                    author: orig.isMine ? mockCurrentUser : orig.author,
                    sender_name: `${(orig.isMine ? mockCurrentUser : orig.author)?.first_name || ''} ${(orig.isMine ? mockCurrentUser : orig.author)?.last_name || ''}`.trim(),
                    date: new Date(orig.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    text: toTipTapDoc(orig.text)
                },
                files: orig.files || []
            }));

            setMessagesMap(prev => ({
                ...prev,
                [targetChatId]: [...(prev[targetChatId] || []), ...forwardedItems]
            }));

            const lastForwarded = forwardedItems[forwardedItems.length - 1];
            setChats(prev =>
                prev.map(c =>
                    c.id === targetChatId
                        ? {
                              ...c,
                              last_message: lastForwarded.text,
                              last_message_files: lastForwarded.files || [],
                              last_message_sender_id: mockCurrentUser.id,
                              last_message_author: mockCurrentUser,
                              updated_at: now
                          }
                        : c
                )
            );

            setSelectedMessageIds([]);
            handleSelectChat(targetChatId);
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, messagesMap, handleSelectChat, t]);

    const handleSend = useCallback(() => {
        if (!activeChatId) return;
        const hasText = hasRichContent(text);
        if (!hasText && files.length === 0) return;

        const richDoc = hasText ? toTipTapDoc(text) : null;

        if (editingMessage) {
            chatService.updateMessage(activeChatId, editingMessage.id, richDoc, files).onSuccess((res) => {
                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatId]: (prev[activeChatId] || []).map(m =>
                        m.id === editingMessage.id
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
            chatService.sendMessage(activeChatId, richDoc, files, null, replyingTo?.id).onSuccess((res) => {
                const replyAuthor = replyingTo
                    ? (replyingTo.isMine ? mockCurrentUser : (replyingTo.author || activeChat?.target_user))
                    : null;

                const normalizedFiles = files.map((f) => ({
                    name: f.name,
                    type: f.type || 'image/png',
                    url: f.url || f.previewUrl
                }));

                const newMsg = {
                    id: Date.now(),
                    isMine: true,
                    author: mockCurrentUser,
                    text: richDoc,
                    status: 'read',
                    created_at: new Date().toISOString(),
                    read_at: null,
                    is_edited: false,
                    is_pinned: false,
                    is_important: false,
                    reply_to: replyingTo ? {
                        id: replyingTo.id,
                        author: replyAuthor,
                        sender_name: `${replyAuthor?.first_name || ''} ${replyAuthor?.last_name || ''}`.trim(),
                        date: new Date(replyingTo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        text: toTipTapDoc(replyingTo.text)
                    } : null,
                    files: normalizedFiles
                };

                setMessagesMap(prev => ({
                    ...prev,
                    [activeChatId]: [...(prev[activeChatId] || []), newMsg]
                }));

                setChats(prev =>
                    prev.map(c =>
                        c.id === activeChatId
                            ? {
                                  ...c,
                                  last_message: richDoc,
                                  last_message_files: normalizedFiles,
                                  last_message_sender_id: mockCurrentUser.id,
                                  last_message_author: mockCurrentUser,
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
    }, [activeChatId, text, files, editingMessage, replyingTo, activeChat, setText, setFiles, t]);

    const handleDeleteClick = useCallback((id) => {
        if (!activeChatId) return;
        chatService.deleteMessage(activeChatId, id).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatId]: (prev[activeChatId] || []).filter(m => m.id !== id)
            }));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

    const handleEditClick = useCallback((msg) => {
        setEditingMessage(msg);
        setText(toTipTapDoc(msg.text));
        setEditorResetKey(k => k + 1);
        setReplyingTo(null);
    }, [setText]);

    const togglePin = useCallback((id) => {
        if (!activeChatId) return;
        chatService.togglePin(activeChatId, id).onSuccess((res) => {
            setMessagesMap(prev => ({
                ...prev,
                [activeChatId]: (prev[activeChatId] || []).map(m =>
                    m.id === id ? { ...m, is_pinned: !m.is_pinned } : { ...m, is_pinned: false }
                )
            }));
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

    const handleReportMessage = useCallback((messageId, reason) => {
        if (!activeChatId) return;
        chatService.reportMessage(activeChatId, messageId, reason).onSuccess((res) => {
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

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
        return replyingTo.isMine
            ? mockCurrentUser.first_name
            : (replyingTo.author?.first_name || activeChat?.target_user?.first_name || '');
    }, [replyingTo, activeChat]);

    const handleTyping = useCallback(() => {
        if (!isTyping) {
            setIsTyping(true);
            setTimeout(() => setIsTyping(false), 3000);
        }
    }, [isTyping]);

    const handleLoadMoreMessages = useCallback(() => {
        if (!activeChatId || isLoadingMore) return;
        setIsLoadingMore(true);
        chatService.getMessages(activeChatId, 2).onSuccess(() => {
            setIsLoadingMore(false);
            setHasMoreMessages(false);
        });
    }, [activeChatId, isLoadingMore]);

    const handleUpdateGroupInfo = useCallback((title, description) => {
        if (!activeChatId) return;
        const tiptapTitle = toTipTapDoc(title);
        const tiptapDesc = toTipTapDoc(description);

        chatService.updateGroupInfo(activeChatId, tiptapTitle, tiptapDesc).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => (c.id === activeChatId ? { ...c, title: tiptapTitle, description: tiptapDesc } : c))
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

    const handleInviteGroupMember = useCallback((userId) => {
        if (!activeChatId) return;
        const userToAdd = mockFriendsList.find(u => u.id === Number(userId));
        if (!userToAdd) return;

        chatService.inviteGroupMember(activeChatId, userToAdd.id).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => {
                    if (c.id !== activeChatId) return c;
                    if (c.participants?.some(p => p.user.id === userToAdd.id)) return c;
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
    }, [activeChatId, t]);

    const handleUpdateGroupMemberRole = useCallback((userId, newRole) => {
        if (!activeChatId) return;
        chatService.updateGroupMemberRole(activeChatId, userId, newRole).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => {
                    if (c.id !== activeChatId) return c;
                    return {
                        ...c,
                        participants: (c.participants || []).map(p =>
                            p.user.id === userId ? { ...p, role: newRole } : p
                        )
                    };
                })
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

    const handleKickGroupMember = useCallback((userId) => {
        if (!activeChatId) return;
        chatService.kickGroupMember(activeChatId, userId).onSuccess((res) => {
            setChats(prev =>
                prev.map(c => {
                    if (c.id !== activeChatId) return c;
                    const updatedParticipants = (c.participants || []).filter(p => p.user.id !== userId);
                    return {
                        ...c,
                        participants: updatedParticipants,
                        participants_count: updatedParticipants.length
                    };
                })
            );
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChatId, t]);

    const handleBlockUser = useCallback((userId) => {
        const targetId = userId || activeChat?.target_user?.id;
        if (!targetId) return;

        chatService.blockUser(targetId).onSuccess((res) => {
            if (activeChatId) {
                setChats(prev => prev.map(c => (c.id === activeChatId ? { ...c, is_blocked: true } : c)));
            }
            notifySuccess(t(`api.success.${res.code}`));
        });
    }, [activeChat, activeChatId, t]);

    const canWrite = !activeChat?.target_user?.is_deleted && !activeChat?.is_blocked;

    const layoutProps = {
        currentUser: mockCurrentUser,
        friendsList: mockFriendsList,
        chats: sortedAndSearchedChats,
        allChats: chats,
        openedChats,
        draftsMap,
        draftFilesMap,
        editorResetKey,
        messages,
        activeChat,
        activeChatId,
        selectedMessageIds,
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