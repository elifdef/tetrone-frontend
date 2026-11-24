import fetchClient from '../api/client';
import type { ApiRequestHandle } from '@/types/api';
import type {
    ChatData,
    ChatListResponse,
    ChatMessagesResponse,
    ChatRoleValue,
    GroupInfoUpdatedResponse,
    GroupMemberInvitedResponse,
    GroupMemberKickedResponse,
    GroupMemberRoleUpdatedResponse,
} from '@/types/chat';
import type { TipTapDoc } from '@/types/user';

export interface UploadableChatFile {
    rawFile?: File;
}

export interface ShareableInput {
    type?: string;
    id?: string | number | null;
}

const ChatService = {
    getChats: (): ApiRequestHandle<ChatListResponse> => {
        return fetchClient<ChatListResponse>('/chat', { method: 'GET' });
    },

    initChat: (targetUsername: string): ApiRequestHandle<{ code: string; chat: ChatData }> => {
        return fetchClient<{ code: string; chat: ChatData }>('/chat/init', {
            method: 'POST',
            body: { target_username: targetUsername },
        });
    },

    createGroupChat: (
        title: TipTapDoc | string | null,
        description: TipTapDoc | string | null = '',
        participantUsernames: string[] = [],
        avatarFile: File | null = null
    ): ApiRequestHandle<{ code: string; chat: ChatData }> => {
        const formData = new FormData();
        formData.append('title', typeof title === 'object' && title !== null ? JSON.stringify(title) : String(title ?? ''));
        if (description) {
            formData.append('description', typeof description === 'object' ? JSON.stringify(description) : description);
        }
        participantUsernames.forEach((username) => formData.append('participants[]', username));
        if (avatarFile) {
            formData.append('avatar', avatarFile);
        }

        return fetchClient<{ code: string; chat: ChatData }>('/chat/group', {
            method: 'POST',
            body: formData,
        });
    },

    getMessages: (
        slug: string,
        page = 1,
        date: string | null = null
    ): ApiRequestHandle<ChatMessagesResponse> => {
        const dateParam = date ? `&date=${encodeURIComponent(date)}` : '';
        return fetchClient<ChatMessagesResponse>(`/chat/${encodeURIComponent(slug)}/messages?page=${page}${dateParam}&_t=${Date.now()}`, {
            method: 'GET',
        });
    },

    sendMessage: (
        slug: string,
        text: TipTapDoc | string | null,
        files: Array<UploadableChatFile | File> = [],
        shareable: ShareableInput | null = null,
        replyToUuid: string | null = null,
        sendAsGroup = false
    ): ApiRequestHandle<Record<string, unknown>> => {
        const formData = new FormData();
        if (text) {
            formData.append('text', typeof text === 'object' ? JSON.stringify(text) : text);
        }
        if (shareable?.type && shareable?.id !== undefined && shareable?.id !== null) {
            formData.append('shareable_type', shareable.type);
            formData.append('shareable_id', String(shareable.id));
        }
        if (replyToUuid) {
            formData.append('reply_to_uuid', replyToUuid);
        }
        if (sendAsGroup) {
            formData.append('send_as_group', 'true');
        }
        files.forEach((file) => {
            const raw = file instanceof File ? file : file.rawFile;
            if (raw) {
                formData.append('media[]', raw);
            }
        });

        return fetchClient(`/chat/${encodeURIComponent(slug)}/message`, {
            method: 'POST',
            body: formData,
        });
    },

    updateMessage: (
        slug: string,
        messageUuid: string,
        text: TipTapDoc | string | null,
        newFiles: Array<UploadableChatFile | File> = [],
        deletedMedia: string[] = []
    ): ApiRequestHandle<Record<string, unknown>> => {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (text) {
            formData.append('text', typeof text === 'object' ? JSON.stringify(text) : text);
        }
        newFiles.forEach((file) => {
            const raw = file instanceof File ? file : file.rawFile;
            if (raw) {
                formData.append('media[]', raw);
            }
        });
        deletedMedia.forEach((fileName) => formData.append('deleted_media[]', fileName));

        return fetchClient(`/chat/${encodeURIComponent(slug)}/message/${encodeURIComponent(messageUuid)}/update`, {
            method: 'POST',
            body: formData,
        });
    },

    deleteMessage: (slug: string, messageUuid: string, forBoth = false): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/message/${encodeURIComponent(messageUuid)}`, {
            method: 'DELETE',
            body: { for_both: forBoth },
        });
    },

    deleteBulkMessages: (slug: string, messageUuids: string[] = [], forBoth = false): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/messages/bulk-delete`, {
            method: 'POST',
            body: { message_uuids: messageUuids, for_both: forBoth },
        });
    },

    forwardMessages: (
        sourceSlug: string,
        targetSlug: string,
        messageUuids: string[] = [],
        comment: TipTapDoc | string = ''
    ): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(targetSlug)}/forward`, {
            method: 'POST',
            body: {
                source_slug: sourceSlug,
                message_uuids: messageUuids,
                comment: typeof comment === 'object' ? JSON.stringify(comment) : comment,
            },
        });
    },

    toggleImportantMessage: (slug: string, messageUuid: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/message/${encodeURIComponent(messageUuid)}/important`, {
            method: 'POST',
        });
    },

    toggleBulkImportantMessages: (slug: string, messageUuids: string[] = []): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/messages/bulk-important`, {
            method: 'POST',
            body: { message_uuids: messageUuids },
        });
    },

    togglePin: (slug: string, messageUuid: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/message/${encodeURIComponent(messageUuid)}/pin`, {
            method: 'POST',
        });
    },

    reportMessage: (slug: string, messageUuid: string, reason: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/message/${encodeURIComponent(messageUuid)}/report`, {
            method: 'POST',
            body: { reason },
        });
    },

    markAsRead: (slug: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/read`, {
            method: 'POST',
        });
    },

    markAsUnread: (slug: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/unread`, {
            method: 'POST',
        });
    },

    markAllAsRead: (): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient('/chat/read-all', {
            method: 'POST',
        });
    },

    togglePinChat: (slug: string, isPinned = true): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/pin-chat`, {
            method: 'POST',
            body: { is_pinned: isPinned },
        });
    },

    muteChat: (slug: string, duration: string | null = 'forever'): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/mute`, {
            method: 'POST',
            body: { duration },
        });
    },

    clearChatHistory: (slug: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}/history`, {
            method: 'DELETE',
        });
    },

    deleteChat: (slug: string, forBoth = false): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/chat/${encodeURIComponent(slug)}`, {
            method: 'DELETE',
            body: { for_both: forBoth },
        });
    },

    updateGroupInfo: (
        slug: string,
        title: TipTapDoc | string | null,
        description: TipTapDoc | string | null
    ): ApiRequestHandle<GroupInfoUpdatedResponse> => {
        return fetchClient<GroupInfoUpdatedResponse>(`/chat/${encodeURIComponent(slug)}/group`, {
            method: 'PUT',
            body: {
                title: typeof title === 'object' && title !== null ? JSON.stringify(title) : title,
                description: typeof description === 'object' && description !== null ? JSON.stringify(description) : description,
            },
        });
    },

    inviteGroupMember: (slug: string, username: string): ApiRequestHandle<GroupMemberInvitedResponse> => {
        return fetchClient<GroupMemberInvitedResponse>(`/chat/${encodeURIComponent(slug)}/members`, {
            method: 'POST',
            body: { username },
        });
    },

    updateGroupMemberRole: (
        slug: string,
        username: string,
        role: ChatRoleValue
    ): ApiRequestHandle<GroupMemberRoleUpdatedResponse> => {
        return fetchClient<GroupMemberRoleUpdatedResponse>(
            `/chat/${encodeURIComponent(slug)}/members/${encodeURIComponent(username)}/role`,
            {
                method: 'PUT',
                body: { role },
            }
        );
    },

    kickGroupMember: (slug: string, username: string): ApiRequestHandle<GroupMemberKickedResponse> => {
        return fetchClient<GroupMemberKickedResponse>(
            `/chat/${encodeURIComponent(slug)}/members/${encodeURIComponent(username)}`,
            {
                method: 'DELETE',
            }
        );
    },

    blockUser: (username: string): ApiRequestHandle<Record<string, unknown>> => {
        return fetchClient(`/users/${encodeURIComponent(username)}/block`, {
            method: 'POST',
        });
    },
};

export default ChatService;