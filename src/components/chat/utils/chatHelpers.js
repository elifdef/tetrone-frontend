import { getPlainText } from './messageParser.js';

export const getChatPlainShortTitle = (chat, t) => {
    if (!chat) return '';
    if (chat.is_saved) return t('chat.saved_messages');
    if (chat.is_group) return getPlainText(chat.title);
    if (chat.target_user?.is_deleted) return t('chat.deleted_user');
    return chat.target_user?.first_name || chat.target_user?.username || '';
};

export const getTypingText = (chat, currentUser, t, forceTyping = false) => {
    if (!chat) return '';
    let typers = Array.isArray(chat.typing_users) ? [...chat.typing_users] : [];

    if (typers.length === 0 && (chat.is_typing || forceTyping)) {
        if (!chat.is_group && chat.target_user) {
            typers = [chat.target_user];
        } else if (chat.is_group && chat.participants?.length > 0) {
            const other = chat.participants.find(p => p.user.username !== currentUser?.username)?.user;
            if (other) typers = [other];
        }
    }

    if (typers.length === 0) return '';
    if (!chat.is_group) return t('chat.typing');
    if (typers.length === 1) {
        return t('chat.typing_one', { user: typers[0].first_name });
    }
    if (typers.length === 2) {
        return t('chat.typing_two', { user1: typers[0].first_name, user2: typers[1].first_name });
    }
    return t('chat.typing_many', { user: typers[0].first_name, count: typers.length - 1 });
};