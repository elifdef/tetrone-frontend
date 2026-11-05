import React from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import RichText from '../common/RichText.jsx';
import { parseRichText } from './utils/messageParser.js';

const ForwardArrowSvg = () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="shrink-0">
        <polyline points="15 17 20 12 15 7" />
        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
);

export default function MessageReplyQuote({
    replyTo,
    isForwarded = false,
    isSameForwardAuthor = false
}) {
    const { t } = useTranslation();

    if (!replyTo) return null;

    return (
        <div
            className={`pl-[8px] border-l-[2px] border-theme-link bg-bg-page text-[11px] ${
                isSameForwardAuthor
                    ? 'py-[1px] my-0'
                    : isForwarded
                        ? 'mt-[2px] mb-[1px] pt-[4px] pb-[2px]'
                        : 'my-[4px] py-[4px]'
            }`}
        >
            {/* Заголовок автора показуємо ТІЛЬКИ на першому повідомленні блоку */}
            {!isSameForwardAuthor && (
                <div className="flex items-center gap-[6px] mb-[2px]">
                    {isForwarded && (
                        <span className="text-theme-link opacity-80 flex items-center gap-[2px]">
                            <ForwardArrowSvg />
                        </span>
                    )}

                    {replyTo.author && (
                        <Avatar
                            user={replyTo.author}
                            className="w-[16px] h-[16px] object-cover border border-border"
                        />
                    )}

                    <strong className="text-theme-link text-[11px]">
                        {replyTo.sender_name}
                    </strong>

                    {replyTo.date && (
                        <span className="text-[10px] text-text-muted">
                            {replyTo.date}
                        </span>
                    )}
                </div>
            )}

            {/* Текст цитати */}
            <div className="text-text-main text-[11px] leading-[1.35]">
                <RichText
                    text={parseRichText(replyTo.text)}
                    className="post-text [&_p]:inline [&_p]:m-0"
                    limit={100000}
                />
            </div>

            {/* Підпис показується ТІЛЬКИ для реальних реплаїв (відповідей), а не для пересланих повідомлень */}
            {!isForwarded && (
                <div className="text-[10px] text-text-muted italic mt-[2px]">
                    {t('chat.viewer.in_reply_to', {
                        name: replyTo.sender_name,
                        defaultValue: `у відповідь до повідомлення ${replyTo.sender_name}`
                    })}
                </div>
            )}
        </div>
    );
}