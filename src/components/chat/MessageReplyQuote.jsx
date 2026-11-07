import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import RichText from '../common/RichText.jsx';
import MessageAttachmentsList from './MessageAttachmentsList.jsx';
import MessageShareableCard from './MessageShareableCard.jsx';
import { parseRichText, hasRichContent } from './utils/messageParser.js';

const ForwardArrowSvg = () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
        <polyline points="15 17 20 12 15 7" />
        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
);

export default function MessageReplyQuote({
    replyTo,
    isForwarded = false,
    isSameForwardAuthor = false,
    isClusterStart = false,
    isClusterEnd = false
}) {
    const { t } = useTranslation();

    if (!replyTo) return null;

    if (Array.isArray(replyTo)) {
        return (
            <div className="flex flex-col gap-[2px]">
                {replyTo.map((item, idx) => (
                    <MessageReplyQuote
                        key={item.uuid || idx}
                        replyTo={item}
                        isForwarded={true}
                        isSameForwardAuthor={idx > 0 && replyTo[idx - 1]?.sender_name === item.sender_name}
                        isClusterStart={idx === 0}
                        isClusterEnd={idx === replyTo.length - 1}
                    />
                ))}
            </div>
        );
    }

    const quoteColor = replyTo?.author?.personalization?.username_color;

    return (
        <div
            className={`relative pl-[12px] border-l-[2px] text-[11px] ${
                isClusterStart ? 'pt-[2px]' : 'pt-0'
            } ${isClusterEnd ? 'pb-[2px]' : 'pb-0'}`}
            style={{ 
                borderColor: quoteColor || 'var(--theme-link)' 
            }}
        >
            {isClusterStart && (
                <div 
                    className="flex items-center gap-[4px] text-[10px] font-bold pb-[3px] select-none"
                    style={{ color: quoteColor || 'var(--theme-link)' }}
                >
                    <ForwardArrowSvg />
                    <span>{t('chat.viewer.forwarded_messages')}</span>
                </div>
            )}

            {!isSameForwardAuthor && (
                <div className="relative flex items-center gap-[6px] pt-[3px] pb-[2px]">
                    <span 
                        className="absolute -left-[12px] top-[11px] w-[8px] h-[2px]" 
                        style={{ backgroundColor: quoteColor || 'var(--theme-link)' }}
                    />

                    {replyTo.author && (
                        <Avatar
                            user={replyTo.author}
                            className="w-[16px] h-[16px] object-cover border border-border shrink-0"
                        />
                    )}

                    <strong 
                        className="text-[11px] leading-none"
                        style={{ color: quoteColor || 'var(--theme-link)' }}
                    >
                        {replyTo.sender_name}
                    </strong>

                    {replyTo.date && (
                        <span className="text-[10px] text-text-muted leading-none">
                            {replyTo.date}
                        </span>
                    )}
                </div>
            )}

            <div className="pl-[8px] py-[2px]">
                {/* Якщо є попередній елемент у ланцюжку пересилання — рендеримо його рекурсивно */}
                {replyTo.reply_to && (
                    <MessageReplyQuote
                        replyTo={replyTo.reply_to}
                        isForwarded={true}
                        isSameForwardAuthor={replyTo.reply_to.sender_name === replyTo.sender_name}
                        isClusterStart={false}
                        isClusterEnd={false}
                    />
                )}

                {hasRichContent(replyTo.text) && (
                    <div className="text-text-main text-[11px] leading-[1.4]">
                        <RichText
                            text={parseRichText(replyTo.text)}
                            className="post-text [&_p]:inline [&_p]:m-0"
                            limit={100000}
                        />
                    </div>
                )}

                {replyTo.shareable && (
                    <MessageShareableCard shareable={replyTo.shareable} />
                )}

                {replyTo.files?.length > 0 && (
                    <MessageAttachmentsList files={replyTo.files} />
                )}
            </div>
        </div>
    );
}