import { useTranslation } from 'react-i18next';
import { useGender } from './useGender';

export const useNotificationConfig = () => {
    const { t } = useTranslation();
    const { getGenderMap } = useGender(null);

    const getConfig = (type, actor, target) => {
        if (!actor || !target) {
            return { actionText: '', linkText: null, linkUrl: null, snippetText: null, mediaPreview: null, mediaPosition: 'right' };
        }

        const genderId = actor.gender || 1;
        const genderTextMap = getGenderMap(t);
        const phrase = genderTextMap[genderId] || {};

        const hasRealText = !!target.preview_text;
        let snippetText = target.preview_text || null;
        const mediaPreview = target.media_preview || null;
        const attachmentType = target.attachment_type || null;
        const attachmentName = target.attachment_name || null;

        const getTargetName = () => {
            switch (attachmentType) {
                case 'video': return t('notifications.your_video');
                case 'image': return t('notifications.your_photo');
                case 'audio': return t('notifications.your_audio');
                case 'document': return t('notifications.your_document');
                case 'poll': return t('notifications.your_poll');
                default: return t('notifications.your_post');
            }
        };

        if (!hasRealText && attachmentType === 'document' && attachmentName) {
            snippetText = `${attachmentName}`;
        } else if (!hasRealText && target.has_media && !attachmentType) {
            snippetText = t('common.attachment');
        }

        switch (type) {
            case 'like_post':
                return {
                    actionText: phrase.liked,
                    linkText: getTargetName(),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'right'
                };
            case 'reaction_post':
                return {
                    actionText: phrase.reacted,
                    linkText: getTargetName(),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    isReaction: true,
                    mediaPosition: 'right'
                };
            case 'new_comment':
                return {
                    actionText: phrase.commented,
                    linkText: getTargetName(),
                    linkUrl: `/post/${target.target_id}?comment=${target.sub_target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'right'
                };
            case 'mention_post':
                return {
                    actionText: phrase.mentioned,
                    linkText: t('notifications.in_post'),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'right'
                };
            case 'mention_comment':
                return {
                    actionText: phrase.mentioned,
                    linkText: `${t('notifications.in_comment_under')} ${getTargetName()}`,
                    linkUrl: `/post/${target.target_id}?comment=${target.sub_target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'right'
                };
            case 'new_friend_request':
                return {
                    actionText: t('notifications.friend_request'),
                    linkText: null,
                    linkUrl: `/${target.target_id}`,
                    snippetText: null,
                };
            case 'friend_request_accepted':
                return {
                    actionText: phrase.accepted_friend,
                    linkText: null,
                    linkUrl: `/${target.target_id}`,
                    snippetText: null,
                };
            case 'new_subscription_post':
                return {
                    actionText: phrase.published,
                    linkText: t('notifications.new_post'),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'left'
                };
            case 'poll_vote':
                return {
                    actionText: phrase.voted,
                    linkText: t('notifications.in_your_poll'),
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview: null,
                };
            case 'wall_post':
                let wallPostLinkText = phrase.left_post;
                if (attachmentType === 'poll') wallPostLinkText = phrase.left_poll;
                else if (!hasRealText && attachmentType) {
                    switch (attachmentType) {
                        case 'video': wallPostLinkText = phrase.left_video; break;
                        case 'image': wallPostLinkText = phrase.left_image; break;
                        case 'audio': wallPostLinkText = phrase.left_audio; break;
                        default: wallPostLinkText = phrase.left_file; break;
                    }
                }
                return {
                    actionText: '',
                    linkText: wallPostLinkText,
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'left'
                };
            case 'repost_post':
                return {
                    actionText: '',
                    linkText: phrase.repost,
                    linkUrl: `/post/${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'right'
                };
            case 'new_message':
                return {
                    actionText: phrase.wrote,
                    linkText: null,
                    linkUrl: `/messages?dm=${target.target_id}`,
                    snippetText,
                    mediaPreview,
                    mediaPosition: 'left'
                };
            case 'report_reviewed':
                return {
                    actionText: t('notifications.report_reviewed_click'),
                    linkText: '',
                    linkUrl: null,
                    snippetText,
                };
            default:
                return { actionText: '', linkText: null, linkUrl: null, snippetText: null, mediaPreview: null, mediaPosition: 'right' };
        }
    };

    return { getConfig };
};