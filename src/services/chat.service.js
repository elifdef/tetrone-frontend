import fetchClient from "../api/client";

const ChatService = {
    getChats: () => {
        return fetchClient('/chat', { method: 'GET' });
    },

    initChat: (targetUsername) => {
        return fetchClient('/chat/init', {
            method: 'POST',
            body: { target_username: targetUsername }
        });
    },

    createGroupChat: (title, description = '', participantUsernames = [], avatarFile = null) => {
        const formData = new FormData();
        formData.append('title', typeof title === 'object' ? JSON.stringify(title) : title);
        if (description) {
            formData.append('description', typeof description === 'object' ? JSON.stringify(description) : description);
        }
        participantUsernames.forEach(username => formData.append('participants[]', username));
        if (avatarFile) formData.append('avatar', avatarFile);

        return fetchClient('/chat/group', {
            method: 'POST',
            body: formData
        });
    },

    getMessages: (slug, page = 1, date = null) => {
        const dateParam = date ? `&date=${encodeURIComponent(date)}` : '';
        return fetchClient(`/chat/${slug}/messages?page=${page}${dateParam}&_t=${Date.now()}`, {
            method: 'GET'
        });
    },

    sendMessage: (slug, text, files = [], shareable = null, replyToUuid = null, sendAsGroup = false) => {
        const formData = new FormData();
        if (text) formData.append('text', typeof text === 'object' ? JSON.stringify(text) : text);
        if (shareable?.type && shareable?.id !== undefined && shareable?.id !== null) {
            formData.append('shareable_type', shareable.type);
            formData.append('shareable_id', String(shareable.id));
        }
        if (replyToUuid) formData.append('reply_to_uuid', replyToUuid);
        if (sendAsGroup) formData.append('send_as_group', 'true');
        files.forEach(file => formData.append('media[]', file.rawFile || file));

        return fetchClient(`/chat/${slug}/message`, {
            method: 'POST',
            body: formData
        });
    },

    updateMessage: (slug, messageUuid, text, newFiles = [], deletedMedia = []) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (text) formData.append('text', typeof text === 'object' ? JSON.stringify(text) : text);
        newFiles.forEach(file => formData.append('media[]', file.rawFile || file));
        deletedMedia.forEach(fileName => formData.append('deleted_media[]', fileName));

        return fetchClient(`/chat/${slug}/message/${messageUuid}/update`, {
            method: 'POST',
            body: formData
        });
    },

    deleteMessage: (slug, messageUuid, forBoth = false) => {
        return fetchClient(`/chat/${slug}/message/${messageUuid}`, {
            method: 'DELETE',
            body: { for_both: forBoth }
        });
    },

    deleteBulkMessages: (slug, messageUuids = [], forBoth = false) => {
        return fetchClient(`/chat/${slug}/messages/bulk-delete`, {
            method: 'POST',
            body: { message_uuids: messageUuids, for_both: forBoth }
        });
    },

    forwardMessages: (sourceSlug, targetSlug, messageUuids = [], comment = '') => {
        return fetchClient(`/chat/${targetSlug}/forward`, {
            method: 'POST',
            body: {
                source_slug: sourceSlug,
                message_uuids: messageUuids,
                comment: typeof comment === 'object' ? JSON.stringify(comment) : comment
            }
        });
    },

    toggleImportantMessage: (slug, messageUuid) => {
        return fetchClient(`/chat/${slug}/message/${messageUuid}/important`, {
            method: 'POST'
        });
    },

    toggleBulkImportantMessages: (slug, messageUuids = []) => {
        return fetchClient(`/chat/${slug}/messages/bulk-important`, {
            method: 'POST',
            body: { message_uuids: messageUuids }
        });
    },

    togglePin: (slug, messageUuid) => {
        return fetchClient(`/chat/${slug}/message/${messageUuid}/pin`, {
            method: 'POST'
        });
    },

    reportMessage: (slug, messageUuid, reason) => {
        return fetchClient(`/chat/${slug}/message/${messageUuid}/report`, {
            method: 'POST',
            body: { reason }
        });
    },

    markAsRead: (slug) => {
        return fetchClient(`/chat/${slug}/read`, {
            method: 'POST'
        });
    },

    markAsUnread: (slug) => {
        return fetchClient(`/chat/${slug}/unread`, {
            method: 'POST'
        });
    },

    markAllAsRead: () => {
        return fetchClient('/chat/read-all', {
            method: 'POST'
        });
    },

    togglePinChat: (slug, isPinned = true) => {
        return fetchClient(`/chat/${slug}/pin-chat`, {
            method: 'POST',
            body: { is_pinned: isPinned }
        });
    },

    muteChat: (slug, duration = 'forever') => {
        return fetchClient(`/chat/${slug}/mute`, {
            method: 'POST',
            body: { duration }
        });
    },

    clearChatHistory: (slug) => {
        return fetchClient(`/chat/${slug}/history`, {
            method: 'DELETE'
        });
    },

    deleteChat: (slug, forBoth = false) => {
        return fetchClient(`/chat/${slug}`, {
            method: 'DELETE',
            body: { for_both: forBoth }
        });
    },

    updateGroupInfo: (slug, title, description) => {
        return fetchClient(`/chat/${slug}/group`, {
            method: 'PUT',
            body: {
                title: typeof title === 'object' ? JSON.stringify(title) : title,
                description: typeof description === 'object' ? JSON.stringify(description) : description
            }
        });
    },

    inviteGroupMember: (slug, username) => {
        return fetchClient(`/chat/${slug}/members`, {
            method: 'POST',
            body: { username }
        });
    },

    updateGroupMemberRole: (slug, username, role) => {
        return fetchClient(`/chat/${slug}/members/${username}/role`, {
            method: 'PUT',
            body: { role }
        });
    },

    kickGroupMember: (slug, username) => {
        return fetchClient(`/chat/${slug}/members/${username}`, {
            method: 'DELETE'
        });
    },

    blockUser: (username) => {
        return fetchClient(`/users/${username}/block`, {
            method: 'POST'
        });
    }
};

export default ChatService;