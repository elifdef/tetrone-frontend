import type { TFunction } from 'i18next';
import { hasRichContent, detectTipTapFeatures, getPlainText } from './messageParser';
import type { ChatAttachmentPreview, ChatData } from '@/types/chat';
import type { TipTapDoc, UserData } from '@/types/user';

export interface AttachmentBadge {
    key: string;
    label: string;
    isPost?: boolean;
    thumbUrl?: string | null;
}

export const getAttachmentBadges = (
    chat: ChatData,
    draftDoc: TipTapDoc | string | null,
    draftFiles: ChatAttachmentPreview[] = [],
    t: TFunction
): AttachmentBadge[] => {
    const badges: AttachmentBadge[] = [];
    const filesArr = draftFiles.length > 0 ? draftFiles : chat.last_message_files || [];
    const docToInspect = draftDoc || chat.last_message;

    const isForward = Boolean(
        chat.last_message_is_forward ||
            chat.last_message_source_uuid ||
            (chat.last_message_reply_to && !hasRichContent(chat.last_message))
    );

    if (isForward && !draftDoc && draftFiles.length === 0 && !chat.last_message_shareable) {
        badges.push({
            key: 'forwarded_msg',
            label: t('chat.badges.forwarded_message'),
        });
    }

    if (chat.last_message_shareable && !draftDoc && draftFiles.length === 0) {
        const shareType = chat.last_message_shareable.type;
        const labelKey =
            shareType === 'comment'
                ? 'chat.badges.forwarded_comment'
                : shareType === 'user'
                  ? 'chat.badges.shared_profile'
                  : 'chat.badges.forwarded_post';
        badges.push({
            key: `share_${shareType}`,
            label: t(labelKey),
            isPost: shareType === 'post',
        });
        const sharedPost = chat.last_message_shareable.post as { poll?: unknown } | null | undefined;
        if (shareType === 'post' && sharedPost?.poll) {
            badges.push({
                key: 'poll',
                label: t('chat.badges.poll'),
            });
        }
    }

    if (filesArr.length > 0) {
        const first = filesArr[0];
        const isImg =
            Boolean(first.type?.startsWith('image/')) || Boolean(first.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i));
        const isVid =
            Boolean(first.type?.startsWith('video/')) || Boolean(first.name?.match(/\.(mp4|webm)$/i));
        const isAud =
            Boolean(first.type?.startsWith('audio/')) || Boolean(first.name?.match(/\.(mp3|ogg|wav)$/i));

        badges.push({
            key: 'file',
            label: isImg
                ? t('chat.composer.attach.photo')
                : isVid
                  ? t('chat.composer.attach.video')
                  : isAud
                    ? t('chat.composer.attach.audio')
                    : t('chat.composer.attach.document'),
            thumbUrl: isImg ? first.previewUrl || first.url : null,
        });
    }

    const features = detectTipTapFeatures(docToInspect);
    if (features.hasTable) {
        badges.push({ key: 'table', label: t('chat.badges.table') });
    }
    if (features.hasCode) {
        badges.push({ key: 'code', label: t('chat.badges.code') });
    }

    return badges;
};

export const getSenderPrefix = (
    chat: ChatData,
    currentUser: UserData | null | undefined,
    t: TFunction
): string => {
    if (chat.last_message_author_type === 'group') {
        return `${getPlainText(chat.title)}:`;
    }
    if (chat.last_message_sender_username === currentUser?.username) {
        return `${t('chat.you')}:`;
    }
    const sender = chat.last_message_author || chat.target_user;
    if (!sender) return '';
    return `${sender.first_name || sender.username}:`;
};