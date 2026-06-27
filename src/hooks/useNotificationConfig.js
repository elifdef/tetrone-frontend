import { useTranslation } from 'react-i18next';
import { useGender } from './useGender';

export const useNotificationConfig = () => {
    const { t } = useTranslation();
    const { getGenderMap } = useGender(null);

    const getConfig = (type, actor, target) => {
        if (!actor || !target) {
            return { actionText: '', linkText: null, linkUrl: null, snippetText: null, mediaPreview: null };
        }

        const genderId = actor.gender || 1;
        const genderTextMap = getGenderMap(t);
        const phrase = genderTextMap[genderId] || {};

        // Зберігаємо оригінальний текст для перевірок (чи писав юзер щось словами)
        const hasRealText = !!target.preview_text;

        let snippetText = target.preview_text || null;
        const mediaPreview = target.media_preview || null;
        const attachmentType = target.attachment_type || null;
        const attachmentName = target.attachment_name || null;

        // Формуємо сніпет
        if (!hasRealText && attachmentType === 'document' && attachmentName) {
            snippetText = `${attachmentName}`;
        } else if (!hasRealText && target.has_media && !attachmentType) {
            snippetText = t('common.attachment');
        }

        switch (type) {
            case 'like_post':
                return {
                    actionText: phrase.liked,
                    linkText: t('notifications.your_post'),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                };
            case 'new_comment':
                return {
                    actionText: phrase.commented,
                    linkText: t('notifications.your_post'),
                    linkUrl: `/post/${target.target_id}?comment=${target.sub_target_id}`,
                    snippetText,
                    mediaPreview,
                };
            case 'mention_post':
                return {
                    actionText: phrase.mentioned,
                    linkText: t('notifications.in_post'),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                };
            case 'mention_comment':
                return {
                    actionText: phrase.mentioned,
                    linkText: t('notifications.in_comment'),
                    linkUrl: `/post/${target.target_id}?comment=${target.sub_target_id}`,
                    snippetText,
                };
            case 'new_friend_request':
                return {
                    actionText: t('notifications.friend_request'),
                    linkText: null,
                    linkUrl: `/${target.target_id}`,
                    snippetText: null,
                };
            case 'wall_post':
                let wallPostLinkText = phrase.left_post;

                if (attachmentType === 'poll') {
                    wallPostLinkText = phrase.left_poll;
                } else if (!hasRealText && attachmentType) {
                    // Якщо користувач НЕ писав текст, а тільки прикріпив 1 файл
                    switch (attachmentType) {
                        case 'video': wallPostLinkText = phrase.left_video; break;
                        case 'image': wallPostLinkText = phrase.left_image; break;
                        case 'audio': wallPostLinkText = phrase.left_audio; break;
                        case 'document':
                        default:
                            wallPostLinkText = phrase.left_file;
                            break;
                    }
                }

                return {
                    actionText: '',
                    linkText: wallPostLinkText,
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                };
            case 'repost_post':
                return {
                    actionText: '',
                    linkText: phrase.repost,
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                };
            case 'new_message':
                return {
                    actionText: phrase.wrote,
                    linkText: null,
                    linkUrl: `/messages?dm=${target.target_id}`,
                    snippetText,
                };
            case 'report_reviewed':
                return {
                    actionText: t('notifications.report_reviewed_click'),
                    linkText: '',
                    linkUrl: null,
                    snippetText,
                };
            default:
                return { actionText: '', linkText: null, linkUrl: null, snippetText: null, mediaPreview: null };
        }
    };

    return { getConfig };
};