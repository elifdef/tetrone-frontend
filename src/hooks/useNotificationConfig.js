import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useGender } from './useGender';
import { AuthContext } from '../context/AuthContext';
import { useDateFormatter } from "./useDateFormatter.js";

export const useNotificationConfig = () =>
{
    const { t } = useTranslation();
    const { getGenderMap } = useGender(null);
    const { user: currentUser } = useContext(AuthContext);
    const formatDate = useDateFormatter(); // ДОДАНО ФОРМАТЕР

    const getConfig = (type, actor, target) =>
    {
        if (!actor || !target)
        {
            return {
                actionText: '',
                linkText: null,
                linkUrl: null,
                snippetText: null,
                mediaPreview: null,
                mediaPosition: 'right'
            };
        }

        const genderId = actor.gender || 1;
        const phrase = getGenderMap(t)[genderId] || {};

        let snippetText = target.preview_text || null;
        if (!target.preview_text && target.attachment_type === 'document' && target.attachment_name)
        {
            snippetText = `${ target.attachment_name }`;
        }
        else if (!target.preview_text && target.has_media && !target.attachment_type)
        {
            snippetText = t('common.attachment');
        }

        const getTargetName = () =>
        {
            const map = {
                video: t('notifications.your_video'),
                image: t('notifications.your_photo'),
                audio: t('notifications.your_audio'),
                document: t('notifications.your_document'),
                poll: t('notifications.your_poll')
            };
            return map[target.attachment_type] || t('notifications.your_post');
        };

        const getWallPostLinkText = () =>
        {
            const map = {
                poll: phrase.left_poll,
                video: phrase.left_video,
                image: phrase.left_image,
                audio: phrase.left_audio,
            };
            return map[target.attachment_type] || (target.attachment_type ? phrase.left_file : phrase.left_post);
        };

        const getMentionCommentText = () =>
        {
            if (target.post_author_id === currentUser?.id)
            {
                return t('notifications.in_comment_under_yours');
            }
            if (target.post_author_id === actor.id)
            {
                return t('notifications.in_comment_under_theirs');
            }
            return t('notifications.in_comment_under');
        };

        // Загальний шаблон для всіх сповіщень
        const defaultConfig = {
            actionText: '',
            linkText: null,
            linkUrl: null,
            snippetText,
            mediaPreview: target.media_preview || null,
            mediaPosition: 'right',
            isReaction: false
        };

        const configs = {
            like_post: () => ({
                actionText: phrase.liked,
                linkText: getTargetName(),
                linkUrl: `/post/${ target.target_id }`
            }),
            reaction_post: () => ({
                actionText: phrase.reacted,
                linkText: getTargetName(),
                linkUrl: `/post/${ target.target_id }`,
                isReaction: true
            }),
            new_comment: () => ({
                actionText: phrase.commented,
                linkText: getTargetName(),
                linkUrl: `/post/${ target.target_id }?comment=${ target.sub_target_id }`
            }),
            mention_post: () => ({
                actionText: phrase.mentioned,
                linkText: t('notifications.in_post'),
                linkUrl: `/post/${ target.target_id }`
            }),
            mention_comment: () => ({
                actionText: `${ phrase.mentioned } ${ getMentionCommentText() }`,
                linkText: t('notifications.post_accusative'),
                linkUrl: `/post/${ target.target_id }?comment=${ target.sub_target_id }`
            }),
            new_friend_request: () => ({
                actionText: t('notifications.friend_request'),
                linkUrl: `/${ target.target_id }`,
                snippetText: null,
                mediaPreview: null
            }),
            friend_request_accepted: () => ({
                actionText: phrase.accepted_friend,
                linkUrl: `/${ target.target_id }`,
                snippetText: null,
                mediaPreview: null
            }),
            new_subscription_post: () => ({
                actionText: phrase.published,
                linkText: t('notifications.new_post'),
                linkUrl: `/post/${ target.target_id }`,
                mediaPosition: 'left'
            }),
            poll_vote: () => ({
                actionText: phrase.voted,
                linkText: t('notifications.in_your_poll'),
                linkUrl: `/post/${ target.target_id }`,
                mediaPreview: null
            }),
            wall_post: () => ({
                actionText: '',
                linkText: getWallPostLinkText(),
                linkUrl: `/post/${ target.target_id }`,
                mediaPosition: 'left'
            }),
            repost_post: () => ({ actionText: '', linkText: phrase.repost, linkUrl: `/post/${ target.target_id }` }),
            new_message: () => ({
                actionText: phrase.wrote,
                linkUrl: `/messages?dm=${ target.target_id }`,
                mediaPosition: 'left'
            }),
            like_comment: () => ({
                actionText: phrase.liked,
                linkText: t('notifications.your_comment'),
                linkUrl: `/post/${ target.target_id }?comment=${ target.sub_target_id }`,
                mediaPreview: null
            }),
            reaction_comment: () => ({
                actionText: phrase.reacted,
                linkText: t('notifications.your_comment'),
                linkUrl: `/post/${ target.target_id }?comment=${ target.sub_target_id }`,
                mediaPreview: null,
                isReaction: true
            }),
            report_reviewed: () => ({
                actionText: t('notifications.report_reviewed_click'),
                linkText: '',
                snippetText: null,
                mediaPreview: null
            }),
            report_reverted: () => ({
                actionText: t('notifications.report_reverted_click'),
                linkText: '',
                snippetText: null,
                mediaPreview: null
            }),
            content_deleted: () => ({
                actionText: t('notifications.content_deleted_click'),
                linkText: '',
                snippetText: null,
                mediaPreview: null
            }),
            content_restored: () => ({
                actionText: t('notifications.content_restored_click'),
                linkText: '',
                snippetText: null,
                mediaPreview: null
            }),
            ticket_reply: () => ({
                actionText: '',
                linkText: t('notifications.ticket_reply_click', {
                    date: target.ticket_date ? formatDate(target.ticket_date) : ''
                }),
                linkUrl: `/support?view=ticket_detail&ticket_id=${target.ticket_id}&message_id=${target.message_id}`,
                snippetText: null,
                mediaPreview: null
            })
        };

        const generateConfig = configs[type];
        return generateConfig ? { ...defaultConfig, ...generateConfig() } : defaultConfig;
    };

    return { getConfig };
};