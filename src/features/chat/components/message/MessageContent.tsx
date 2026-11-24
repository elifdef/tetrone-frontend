import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import RichText from '@common/RichText.jsx';
import MessageReplyQuote from '../MessageReplyQuote';
import MessageShareableCard from '../MessageShareableCard';
import MessageAttachmentsList from '../MessageAttachmentsList';
import { parseRichText, hasRichContent } from '../utils/messageParser';
import type { ChatData, ChatMessageItem } from '@/types/chat';
import type { UserData } from '@/types/user';

export interface MessageContentProps {
    msg: ChatMessageItem;
    myself?: UserData | null;
    activeChat?: (ChatData & { onScrollToMessage?: (uuid: string) => void }) | null;
    showStatusBadges?: boolean;
}

export default React.memo(function MessageContent({
    msg,
    myself,
    activeChat,
    showStatusBadges = false,
}: MessageContentProps) {
    const { t } = useTranslation();

    const parsedDoc = useMemo(() => {
        if (!hasRichContent(msg.text)) return null;
        return parseRichText(msg.text);
    }, [msg.text]);

    return (
        <>
            {msg.reply_to && (
                <MessageReplyQuote
                    replyTo={msg.reply_to}
                    isForwarded={false}
                    isSameForwardAuthor={false}
                    isClusterStart={false}
                    isClusterEnd={false}
                    onScrollToMessage={activeChat?.onScrollToMessage}
                />
            )}

            {parsedDoc && (
                <div className="text-[12px] text-text-main leading-[1.4] break-words">
                    <RichText
                        text={parsedDoc}
                        className="post-text inline [&_p]:inline [&_p]:m-0"
                        limit={100000}
                    />
                    {showStatusBadges && (
                        <span className="inline-flex items-center gap-[4px] ml-[6px] text-[10px] text-text-muted">
                            {msg.status === 'sending' && (
                                <span>{t('chat.viewer.mod_sending')}</span>
                            )}
                            {msg.is_edited && (
                                <span>{t('chat.viewer.mod_edited')}</span>
                            )}
                            {msg.is_pinned && (
                                <span className="text-theme-link font-bold">
                                    {t('chat.viewer.mod_pinned')}
                                </span>
                            )}
                        </span>
                    )}
                </div>
            )}

            <MessageShareableCard
                shareable={msg.shareable}
                currentUsername={myself?.username}
            />

            <MessageAttachmentsList
                files={msg.files}
                activeChat={activeChat}
            />
        </>
    );
});