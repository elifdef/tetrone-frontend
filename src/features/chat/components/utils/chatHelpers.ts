import type { TFunction } from 'i18next';
import { getPlainText } from './messageParser';
import type { ChatData, TypingUserInfo } from '@/types/chat';
import type { UserData } from '@/types/user';

export const getChatPlainShortTitle = (chat: ChatData | null | undefined, t: TFunction): string => {
    if (!chat) return '';
    if (chat.is_saved) return t('chat.saved_messages');
    if (chat.is_group) return getPlainText(chat.title);
    if (chat.target_user?.is_deleted) return t('chat.deleted_user');
    return chat.target_user?.first_name || chat.target_user?.username || '';
};

export const getTypingText = (
    chat: ChatData | null | undefined,
    currentUser: UserData | null | undefined,
    t: TFunction,
    forceTyping = false
): string => {
    if (!chat) return '';
    let typers: TypingUserInfo[] = Array.isArray(chat.typing_users) ? [...chat.typing_users] : [];

    if (typers.length === 0 && (chat.is_typing || forceTyping)) {
        if (!chat.is_group && chat.target_user) {
            typers = [chat.target_user];
        } else if (chat.is_group && chat.participants?.length > 0) {
            const other = chat.participants.find((p) => p.user?.username !== currentUser?.username)?.user;
            if (other) typers = [other];
        }
    }

    if (typers.length === 0) return '';
    if (!chat.is_group) return t('chat.typing');

    const firstName0 = typers[0].first_name || typers[0].username || '';
    if (typers.length === 1) {
        return t('chat.typing_one', { user: firstName0 });
    }
    if (typers.length === 2) {
        const firstName1 = typers[1].first_name || typers[1].username || '';
        return t('chat.typing_two', { user1: firstName0, user2: firstName1 });
    }
    return t('chat.typing_many', { user: firstName0, count: typers.length - 1 });
};