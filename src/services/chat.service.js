import fetchClient from "../api/client";

const USE_MOCK_STUBS = true;

const createMockResponse = (code, data = {}, endpoint = '', options = {}) => {
    const responsePayload = {
        code,
        data,
        meta: {
            endpoint,
            method: options.method || 'GET',
            timestamp: new Date().toISOString()
        }
    };

    let successCallback = null;
    let errorCallback = null;

    const promise = new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                if (successCallback) successCallback(responsePayload);
                resolve(responsePayload);
            } catch (err) {
                if (errorCallback) errorCallback(err);
                reject(err);
            }
        }, 80);
    });

    promise.onSuccess = (cb) => {
        successCallback = cb;
        return promise;
    };

    promise.onError = (cb) => {
        errorCallback = cb;
        return promise;
    };

    return promise;
};

const request = (endpoint, options = {}, mockCode = 'SUCCESS', mockData = {}) => {
    if (USE_MOCK_STUBS) {
        return createMockResponse(mockCode, mockData, endpoint, options);
    }
    return fetchClient(endpoint, options);
};

const ChatService = {
    getChats: () => request('/chat', { method: 'GET' }, 'CHATS_LOADED'),

    initChat: (targetUserId) => {
        return request('/chat/init', {
            method: 'POST',
            body: { target_user_id: targetUserId }
        }, 'CHAT_INITIALIZED', { target_user_id: targetUserId });
    },

    createGroupChat: (title, description = '', participantIds = [], avatarFile = null) => {
        const formData = new FormData();
        formData.append('title', typeof title === 'object' ? JSON.stringify(title) : title);
        if (description) {
            formData.append('description', typeof description === 'object' ? JSON.stringify(description) : description);
        }
        participantIds.forEach(id => formData.append('participants[]', id));
        if (avatarFile) formData.append('avatar', avatarFile);

        return request('/chat/group', {
            method: 'POST',
            body: formData
        }, 'GROUP_CHAT_CREATED');
    },

    getMessages: (slug, page = 1, date = null) => {
        const dateParam = date ? `&date=${encodeURIComponent(date)}` : '';
        return request(`/chat/${slug}/messages?page=${page}${dateParam}&_t=${Date.now()}`, {
            method: 'GET'
        }, 'MESSAGES_LOADED');
    },

    sendMessage: (slug, text, files = [], sharedPostId = null, replyToId = null) => {
        const formData = new FormData();
        if (text) formData.append('text', typeof text === 'object' ? JSON.stringify(text) : text);
        if (sharedPostId) formData.append('shared_post_id', sharedPostId);
        if (replyToId) formData.append('reply_to_id', replyToId);
        files.forEach(file => formData.append('media[]', file));

        return request(`/chat/${slug}/message`, {
            method: 'POST',
            body: formData
        }, 'MESSAGE_SENT');
    },

    updateMessage: (slug, messageId, text, newFiles = [], deletedMedia = []) => {
        const formData = new FormData();
        formData.append('_method', 'PUT');

        if (text) formData.append('text', typeof text === 'object' ? JSON.stringify(text) : text);
        newFiles.forEach(file => formData.append('media[]', file));
        deletedMedia.forEach(fileName => formData.append('deleted_media[]', fileName));

        return request(`/chat/${slug}/message/${messageId}/update`, {
            method: 'POST',
            body: formData
        }, 'MESSAGE_UPDATED');
    },

    deleteMessage: (slug, messageId, forBoth = false) => {
        return request(`/chat/${slug}/message/${messageId}`, {
            method: 'DELETE',
            body: { for_both: forBoth }
        }, 'MESSAGE_DELETED');
    },

    deleteBulkMessages: (slug, messageIds = [], forBoth = false) => {
        return request(`/chat/${slug}/messages/bulk-delete`, {
            method: 'POST',
            body: { message_ids: messageIds, for_both: forBoth }
        }, 'MESSAGES_BULK_DELETED');
    },

    forwardMessages: (sourceSlug, targetSlug, messageIds = [], comment = '') => {
        return request(`/chat/${targetSlug}/forward`, {
            method: 'POST',
            body: {
                source_slug: sourceSlug,
                message_ids: messageIds,
                comment: typeof comment === 'object' ? JSON.stringify(comment) : comment
            }
        }, 'MESSAGES_FORWARDED');
    },

    toggleImportantMessage: (slug, messageId) => {
        return request(`/chat/${slug}/message/${messageId}/important`, {
            method: 'POST'
        }, 'MESSAGE_IMPORTANT_TOGGLED');
    },

    toggleBulkImportantMessages: (slug, messageIds = []) => {
        return request(`/chat/${slug}/messages/bulk-important`, {
            method: 'POST',
            body: { message_ids: messageIds }
        }, 'MESSAGES_IMPORTANT_UPDATED');
    },

    togglePin: (slug, messageId) => {
        return request(`/chat/${slug}/message/${messageId}/pin`, {
            method: 'POST'
        }, 'MESSAGE_PIN_TOGGLED');
    },

    reportMessage: (slug, messageId, reason) => {
        return request(`/chat/${slug}/message/${messageId}/report`, {
            method: 'POST',
            body: { reason }
        }, 'MESSAGE_REPORTED');
    },

    markAsRead: (slug) => {
        return request(`/chat/${slug}/read`, {
            method: 'POST'
        }, 'CHAT_READ');
    },

    markAsUnread: (slug) => {
        return request(`/chat/${slug}/unread`, {
            method: 'POST'
        }, 'CHAT_MARKED_UNREAD');
    },

    markAllAsRead: () => {
        return request('/chat/read-all', {
            method: 'POST'
        }, 'ALL_CHATS_READ');
    },

    togglePinChat: (slug, isPinned = true) => {
        return request(`/chat/${slug}/pin-chat`, {
            method: 'POST'
        }, isPinned ? 'CHAT_PINNED' : 'CHAT_UNPINNED');
    },

    muteChat: (slug, duration = 'forever') => {
        const code = duration === null ? 'CHAT_UNMUTED' : 'CHAT_MUTED';
        return request(`/chat/${slug}/mute`, {
            method: 'POST',
            body: { duration }
        }, code, { duration });
    },

    clearChatHistory: (slug) => {
        return request(`/chat/${slug}/history`, {
            method: 'DELETE'
        }, 'CHAT_HISTORY_CLEARED');
    },

    deleteChat: (slug, forBoth = false) => {
        return request(`/chat/${slug}`, {
            method: 'DELETE',
            body: { for_both: forBoth }
        }, 'CHAT_DELETED');
    },

    updateGroupInfo: (slug, title, description) => {
        return request(`/chat/${slug}/group`, {
            method: 'PUT',
            body: {
                title: typeof title === 'object' ? JSON.stringify(title) : title,
                description: typeof description === 'object' ? JSON.stringify(description) : description
            }
        }, 'GROUP_INFO_UPDATED');
    },

    inviteGroupMember: (slug, userId) => {
        return request(`/chat/${slug}/members`, {
            method: 'POST',
            body: { user_id: userId }
        }, 'GROUP_MEMBER_INVITED');
    },

    updateGroupMemberRole: (slug, userId, role) => {
        return request(`/chat/${slug}/members/${userId}/role`, {
            method: 'PUT',
            body: { role }
        }, 'GROUP_ROLE_UPDATED');
    },

    kickGroupMember: (slug, userId) => {
        return request(`/chat/${slug}/members/${userId}`, {
            method: 'DELETE'
        }, 'GROUP_MEMBER_KICKED');
    },

    blockUser: (userId) => {
        return request(`/users/${userId}/block`, {
            method: 'POST'
        }, 'USER_BLOCKED');
    }
};

export default ChatService;