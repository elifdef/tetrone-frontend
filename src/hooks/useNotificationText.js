import { useTranslation } from 'react-i18next';
import { useGender } from './useGender';

const normalizeNotificationType = (rawKey) => {
    if (!rawKey) return '';
    const key = String(rawKey);

    if (key.includes('NewLike')) return 'new_like';
    if (key.includes('NewComment')) return 'new_comment';
    if (key.includes('NewFriendRequest')) return 'new_friend_request';
    if (key.includes('NewWallPost') || key === 'wall_post') return 'wall_post';
    if (key.includes('NewRepost') || key === 'repost') return 'repost';
    if (key.includes('ReportReviewed') || key === 'report_reviewed') return 'report_reviewed';
    if (key.includes('NewMessage') || key === 'new_message') return 'new_message';
    if (key.includes('MentionNotification') || key === 'mention') return 'mention';

    return key;
};

const formatPostSnippet = (snippet, t) => {
    if (typeof snippet !== 'string') return snippet;

    if (snippet.startsWith('POLL:')) {
        const question = snippet.replace('POLL:', '');
        return `📊 ${t('notifications.poll')}: ${question}`;
    }

    switch (snippet) {
        case 'POLL':
            return `${t('notifications.poll')}`;
        case 'ATTACHMENT':
            return `${t('notifications.attachment')}`;
        case 'AVATAR_UPDATE':
            return `${t('notifications.avatar_update')}`;
        default:
            return snippet;
    }
};

const formatMessageSnippet = (payload, phrase) => {
    if (payload.message_text) return payload.message_text;

    switch (payload.file_type) {
        case 'image': return phrase.sent_image;
        case 'video': return phrase.sent_video;
        default: return phrase.sent_file;
    }
};

export const useNotificationText = () => {
    const { t } = useTranslation();
    const { getGenderMap } = useGender(null);
    const genderTextMap = getGenderMap(t);

    const getNotificationData = (typeKey, data) => {
        if (!data) return { actionText: '', linkText: null, linkUrl: null, snippetText: null };

        const payload = data.post_snippet !== undefined || data.message_text !== undefined ? data : (data.data || {});

        const actualUser = payload.user || payload;
        const genderId = actualUser.user_gender || actualUser.gender || 1;
        const phrase = genderTextMap[genderId];

        const normalizedKey = normalizeNotificationType(typeKey);
        const linkUrl = payload.post_id ? `/post/${payload.post_id}` : null;

        let finalSnippet = payload.post_snippet || null;
        if (finalSnippet) {
            finalSnippet = formatPostSnippet(finalSnippet, t);
        }

        switch (normalizedKey) {
            case 'new_like':
                return { actionText: phrase.liked, linkText: t('notifications.your_post'), linkUrl, snippetText: finalSnippet };

            case 'new_comment':
                const commentLink = payload.comment_uid
                    ? `/post/${payload.post_id}?comment=${payload.comment_uid}`
                    : `/post/${payload.post_id}`;

                return {
                    actionText: phrase.commented,
                    linkText: t('notifications.your_post'),
                    linkUrl: commentLink,
                    snippetText: finalSnippet
                };

            case 'new_friend_request':
                return { actionText: t('notifications.friend_request'), linkText: null, linkUrl: null, snippetText: null };

            case 'wall_post':
                return { actionText: '', linkText: phrase.wall_post, linkUrl, snippetText: finalSnippet };

            case 'repost':
                return { actionText: '', linkText: phrase.repost, linkUrl, snippetText: finalSnippet };

            case 'report_reviewed':
                return { actionText: t('notifications.report_reviewed_click'), linkText: '', linkUrl: null, snippetText: payload.admin_response };

            case 'new_message':
                return {
                    actionText: phrase.wrote,
                    linkText: null,
                    linkUrl: `/messages?dm=${payload.chat_slug}`,
                    snippetText: formatMessageSnippet(payload, phrase)
                };

            case 'mention':
                return {
                    actionText: phrase.mentioned,
                    linkText: payload.comment_uid ? t('notifications.in_comment') : t('notifications.in_post'),
                    linkUrl: payload.comment_uid ? `/post/${payload.post_id}?comment=${payload.comment_uid}` : `/post/${payload.post_id}`,
                    snippetText: finalSnippet
                };

            default:
                return { actionText: '', linkText: null, linkUrl: null, snippetText: null };
        }
    };

    return { getNotificationData };
};