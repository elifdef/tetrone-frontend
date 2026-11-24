import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import RichText from '@common/RichText.jsx';
import { parseRichText, getPlainText } from '../utils/messageParser';
import type { ChatMessageItem, PendingForwardState, SharedEntityData } from '@/types/chat';
import type { TipTapDoc } from '@/types/tiptap';
import type { UserData } from '@/types/user';

export type { PendingForwardState };

export interface ComposerReplyEditBannerProps {
    editingMessage?: ChatMessageItem | null;
    replyingTo?: ChatMessageItem | null;
    replyingToName?: string;
    pendingForward?: PendingForwardState | null;
    onCancel?: () => void;
}

const CloseSmallSvg = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

function getShareablePreview(shareable: SharedEntityData | null | undefined, t: TFunction): string | null {
    if (!shareable) return null;
    const type = shareable.type;
    const rawData = (shareable.data ?? shareable) as Record<string, unknown>;

    if (type === 'post' || shareable.post) {
        const post = (shareable.post ?? rawData) as { text?: TipTapDoc | string | null };
        const textPreview = getPlainText(post?.text);
        return textPreview
            ? `${t('chat.badges.post')}: ${textPreview}`
            : t('chat.badges.post');
    }

    if (type === 'comment' || shareable.comment) {
        const comment = (shareable.comment ?? rawData) as {
            content?: TipTapDoc | string | null;
            text?: TipTapDoc | string | null;
        };
        const textPreview = getPlainText(comment?.content || comment?.text);
        return textPreview
            ? `${t('chat.badges.forwarded_comment')}: ${textPreview}`
            : t('chat.badges.forwarded_comment');
    }

    if (type === 'user' || type === 'profile' || shareable.user) {
        const user = (shareable.user ?? rawData) as Partial<UserData>;
        const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username;
        return fullName
            ? `${t('chat.badges.shared_profile')}: ${fullName}`
            : t('chat.badges.shared_profile');
    }

    return t('chat.badges.forwarded_message');
}

export default function ComposerReplyEditBanner({
    editingMessage,
    replyingTo,
    replyingToName,
    pendingForward,
    onCancel,
}: ComposerReplyEditBannerProps) {
    const { t } = useTranslation();

    const hasForward = Boolean(pendingForward?.messageUuids && pendingForward.messageUuids.length > 0);
    if (!replyingTo && !editingMessage && !hasForward) return null;

    if (hasForward && pendingForward) {
        const count = pendingForward.messageUuids.length;
        const firstItem = pendingForward.items?.[0];
        const previewText = firstItem
            ? (getPlainText(firstItem.text) ||
                getShareablePreview(firstItem.shareable, t) ||
                (firstItem.files?.length ? `[${firstItem.files[0].name || 'File'}]` : ''))
            : '';

        return (
            <div className="flex items-center justify-between px-[10px] py-[5px] mb-[8px] bg-bg-box border border-border text-[11px]">
                <div className="truncate pr-[10px] flex items-center gap-[6px]">
                    <span className="font-bold text-theme-link shrink-0">
                        {t('chat.composer.forwarding_count', { count })}:
                    </span>
                    {previewText && (
                        <span className="text-text-muted truncate">{previewText}</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-[11px] text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer shrink-0 flex items-center"
                >
                    <CloseSmallSvg />
                </button>
            </div>
        );
    }

    const targetObj = editingMessage || replyingTo;
    const contentText = targetObj?.text ?? targetObj?.reply_to?.text;
    const filesList = targetObj?.files ?? targetObj?.reply_to?.files ?? [];
    const shareableObj = targetObj?.shareable ?? targetObj?.reply_to?.shareable;
    const shareableLabel = getShareablePreview(shareableObj, t);

    return (
        <div className="flex items-center justify-between px-[10px] py-[5px] mb-[8px] bg-bg-box border border-border text-[11px]">
            <div className="truncate pr-[10px] flex items-center gap-[6px]">
                <span className="font-bold text-theme-link shrink-0">
                    {editingMessage
                        ? t('chat.composer.editing_message')
                        : t('chat.composer.replying_to', { name: replyingToName })}:
                </span>
                <div className="text-text-muted truncate">
                    {contentText ? (
                        <RichText
                            text={parseRichText(contentText)}
                            className="post-text [&_p]:inline [&_p]:m-0"
                            limit={100000}
                        />
                    ) : shareableLabel ? (
                        <span>[{shareableLabel}]</span>
                    ) : filesList.length > 0 ? (
                        <span>[{filesList[0].name || 'Attachment'}]</span>
                    ) : (
                        <span>[Media]</span>
                    )}
                </div>
            </div>
            <button
                type="button"
                onClick={onCancel}
                className="text-[11px] text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer shrink-0 flex items-center"
            >
                <CloseSmallSvg />
            </button>
        </div>
    );
}