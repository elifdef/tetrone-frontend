import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import chatService from '@/services/chat.service';
import { toTipTapDoc, hasRichContent } from '../utils/messageParser';
import { notifySuccess, notifyError } from '@/components/common/Notify';
import type { ChatAttachmentPreview, ChatData, ChatMessageItem } from '@/types/chat';
import type { TipTapDoc, UserData } from '@/types/user';
import type { ChatDraftText } from './useChatDrafts';
import type { PendingForwardState } from './useChatPage';

export interface UseMessageActionsParams {
    activeChatSlug: string | null;
    currentUser: UserData | null;
    text: ChatDraftText;
    setText: Dispatch<SetStateAction<ChatDraftText>>;
    files: ChatAttachmentPreview[];
    setFiles: Dispatch<SetStateAction<ChatAttachmentPreview[]>>;
    editingMessage: ChatMessageItem | null;
    setEditingMessage: Dispatch<SetStateAction<ChatMessageItem | null>>;
    replyingTo: ChatMessageItem | null;
    setReplyingTo: Dispatch<SetStateAction<ChatMessageItem | null>>;
    pendingForward: PendingForwardState | null;
    setPendingForward: Dispatch<SetStateAction<PendingForwardState | null>>;
    sendAsGroup: boolean;
    selectedMessageUuids: string[];
    setSelectedMessageUuids: Dispatch<SetStateAction<string[]>>;
    setMessagesMap: Dispatch<SetStateAction<Record<string, ChatMessageItem[]>>>;
    setChats: Dispatch<SetStateAction<ChatData[]>>;
    setEditorResetKey: Dispatch<SetStateAction<number>>;
    handleSelectChat: (chatSlug: string | null | undefined) => void;
}

export function useMessageActions({
    activeChatSlug,
    currentUser,
    text,
    setText,
    files,
    setFiles,
    editingMessage,
    setEditingMessage,
    replyingTo,
    setReplyingTo,
    pendingForward,
    setPendingForward,
    sendAsGroup,
    selectedMessageUuids,
    setSelectedMessageUuids,
    setMessagesMap,
    setChats,
    setEditorResetKey,
    handleSelectChat,
}: UseMessageActionsParams) {
    const { t } = useTranslation();

    const toggleSelectMessage = useCallback(
        (msgUuid: string) => {
            setSelectedMessageUuids((prev) =>
                prev.includes(msgUuid) ? prev.filter((u) => u !== msgUuid) : [...prev, msgUuid]
            );
        },
        [setSelectedMessageUuids]
    );

    const clearSelectedMessages = useCallback(() => {
        setSelectedMessageUuids([]);
    }, [setSelectedMessageUuids]);

    const toggleImportantMessage = useCallback(
        (msgUuid: string) => {
            if (!activeChatSlug) return;
            chatService
                .toggleImportantMessage(activeChatSlug, msgUuid)
                .onSuccess(() => {
                    setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).map((m) =>
                            m.uuid === msgUuid ? { ...m, is_important: !m.is_important } : m
                        ),
                    }));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setMessagesMap, t]
    );

    const handleBulkImportant = useCallback(() => {
        if (!activeChatSlug || selectedMessageUuids.length === 0) return;
        chatService
            .toggleBulkImportantMessages(activeChatSlug, selectedMessageUuids)
            .onSuccess(() => {
                setMessagesMap((prev) => ({
                    ...prev,
                    [activeChatSlug]: (prev[activeChatSlug] || []).map((m) =>
                        selectedMessageUuids.includes(m.uuid) ? { ...m, is_important: true } : m
                    ),
                }));
                setSelectedMessageUuids([]);
            })
            .onError((err) => {
                notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
            });
    }, [activeChatSlug, selectedMessageUuids, setMessagesMap, setSelectedMessageUuids, t]);

    const handleBulkDelete = useCallback(
        (forBoth = false) => {
            if (!activeChatSlug || selectedMessageUuids.length === 0) return;
            chatService
                .deleteBulkMessages(activeChatSlug, selectedMessageUuids, forBoth)
                .onSuccess(() => {
                    setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).filter(
                            (m) => !selectedMessageUuids.includes(m.uuid)
                        ),
                    }));
                    setSelectedMessageUuids([]);
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, selectedMessageUuids, setMessagesMap, setSelectedMessageUuids, t]
    );

    const handleForwardMessages = useCallback(
        (targetChatSlug: string, messageUuidsToForward: string[], comment: TipTapDoc | string = '') => {
            if (!activeChatSlug || !targetChatSlug || messageUuidsToForward.length === 0) return;
            chatService
                .forwardMessages(activeChatSlug, targetChatSlug, messageUuidsToForward, comment)
                .onSuccess(() => {
                    setSelectedMessageUuids([]);
                    handleSelectChat(targetChatSlug);
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setSelectedMessageUuids, handleSelectChat, t]
    );

    const handleSend = useCallback(() => {
        if (!activeChatSlug) return;
        const hasText = hasRichContent(text);
        const hasForward = Boolean(pendingForward && pendingForward.messageUuids.length > 0);
        if (!hasText && files.length === 0 && !hasForward) return;
        const richDoc = hasText ? toTipTapDoc(text) : null;

        if (hasForward && pendingForward) {
            chatService
                .forwardMessages(
                    pendingForward.sourceChatSlug,
                    activeChatSlug,
                    pendingForward.messageUuids,
                    richDoc || ''
                )
                .onSuccess((res) => {
                    if (Array.isArray(res?.messages)) {
                        setMessagesMap((prev) => ({
                            ...prev,
                            [activeChatSlug]: [...(prev[activeChatSlug] || []), ...res.messages],
                        }));
                    } else if (res?.message) {
                        const singleMessage = res.message;
                        setMessagesMap((prev) => ({
                            ...prev,
                            [activeChatSlug]: [...(prev[activeChatSlug] || []), singleMessage],
                        }));
                    }
                    setPendingForward(null);
                    setText(null);
                    setFiles([]);
                    setReplyingTo(null);
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
            return;
        }

        if (editingMessage) {
            chatService
                .updateMessage(activeChatSlug, editingMessage.uuid, richDoc, files)
                .onSuccess((res) => {
                    setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).map((m) =>
                            m.uuid === editingMessage.uuid
                                ? {
                                      ...m,
                                      text: richDoc,
                                      files: res?.message?.files ?? (files.length > 0 ? files : m.files),
                                      is_edited: true,
                                  }
                                : m
                        ),
                    }));
                    setEditingMessage(null);
                    setText(null);
                    setFiles([]);
                    notifySuccess(t(`code.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        } else {
            chatService
                .sendMessage(activeChatSlug, richDoc, files, null, replyingTo?.uuid ?? null, sendAsGroup)
                .onSuccess((res) => {
                    if (res?.message) {
                        const sentMessage = res.message;
                        setMessagesMap((prev) => {
                            const currentList = prev[activeChatSlug] || [];
                            const exists = currentList.some((m) => m.uuid === sentMessage.uuid);
                            return {
                                ...prev,
                                [activeChatSlug]: exists
                                    ? currentList.map((m) => (m.uuid === sentMessage.uuid ? sentMessage : m))
                                    : [...currentList, sentMessage],
                            };
                        });
                        setChats((prev) =>
                            prev.map((c) =>
                                c.slug === activeChatSlug
                                    ? {
                                          ...c,
                                          last_message: typeof sentMessage.text === 'string' ? null : sentMessage.text,
                                          last_message_files: sentMessage.files || [],
                                          last_message_shareable: sentMessage.shareable || null,
                                          last_message_sender_username: currentUser?.username ?? null,
                                          last_message_author: currentUser,
                                          last_message_author_type: sendAsGroup ? 'group' : 'user',
                                          updated_at: sentMessage.created_at,
                                      }
                                    : c
                            )
                        );
                    }
                    setText(null);
                    setFiles([]);
                    setReplyingTo(null);
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        }
    }, [
        activeChatSlug,
        currentUser,
        text,
        files,
        editingMessage,
        replyingTo,
        pendingForward,
        setPendingForward,
        sendAsGroup,
        setMessagesMap,
        setChats,
        setEditingMessage,
        setText,
        setFiles,
        setReplyingTo,
        t,
    ]);

    const handleDeleteClick = useCallback(
        (uuid: string, forBoth = false) => {
            if (!activeChatSlug) return;
            chatService
                .deleteMessage(activeChatSlug, uuid, forBoth)
                .onSuccess((res) => {
                    setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).filter((m) => m.uuid !== uuid),
                    }));
                    notifySuccess(t(`code.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setMessagesMap, t]
    );

    const handleEditClick = useCallback(
        (msg: ChatMessageItem) => {
            if (!msg?.can_edit) return;

            setEditingMessage(msg);
            setText(toTipTapDoc(msg.text));
            setEditorResetKey((k) => k + 1);
            setReplyingTo(null);
        },
        [setEditingMessage, setText, setEditorResetKey, setReplyingTo]
    );

    const togglePin = useCallback(
        (uuid: string) => {
            if (!activeChatSlug) return;
            chatService
                .togglePin(activeChatSlug, uuid)
                .onSuccess((res) => {
                    setMessagesMap((prev) => ({
                        ...prev,
                        [activeChatSlug]: (prev[activeChatSlug] || []).map((m) =>
                            m.uuid === uuid ? { ...m, is_pinned: !m.is_pinned } : { ...m, is_pinned: false }
                        ),
                    }));
                    notifySuccess(t(`code.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, setMessagesMap, t]
    );

    const handleReportMessage = useCallback(
        (messageUuid: string | null, reason: string) => {
            if (!activeChatSlug || !messageUuid) return;
            chatService
                .reportMessage(activeChatSlug, messageUuid, reason)
                .onSuccess((res) => {
                    notifySuccess(t(`code.${res.code}`));
                })
                .onError((err) => {
                    notifyError(t(`code.${err?.code || 'ERR_UNKNOWN'}`));
                });
        },
        [activeChatSlug, t]
    );

    const handleCancelReplyEdit = useCallback(() => {
        setEditingMessage(null);
        setReplyingTo(null);
        setPendingForward(null);
        setText(null);
        setEditorResetKey((k) => k + 1);
        setFiles([]);
    }, [setEditingMessage, setReplyingTo, setPendingForward, setText, setEditorResetKey, setFiles]);

    return {
        toggleSelectMessage,
        clearSelectedMessages,
        toggleImportantMessage,
        handleBulkImportant,
        handleBulkDelete,
        handleForwardMessages,
        handleSend,
        handleDeleteClick,
        handleEditClick,
        togglePin,
        handleReportMessage,
        handleCancelReplyEdit,
    };
}