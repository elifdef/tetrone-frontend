import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '../ui/Avatar';
import RichText from '../common/RichText.jsx';
import MessageShareableCard from './MessageShareableCard.jsx';
import MessageAttachmentsList from './MessageAttachmentsList.jsx';
import MessageReplyQuote from './MessageReplyQuote.jsx';
import MessageActions from './MessageActions.jsx';
import MessageStatusTicks from './MessageStatusTicks.jsx';
import { parseRichText, hasRichContent, getPlainText } from './utils/messageParser.js';
import { GroupIcon } from '../ui/Icons.jsx';

const CheckSvg = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default function MessageItem({
    msg,
    myself,
    activeChat,
    isSelected,
    onToggleSelect,
    onToggleImportant,
    onForward,
    onReport,
    handleEditClick,
    handleDelete,
    setReplyingTo,
    togglePin
}) {
    const { t } = useTranslation();

    const isGroupSender = msg.author_type === 'group';
    const sender = isGroupSender
        ? {
            username: activeChat?.slug,
            first_name: getPlainText(activeChat?.title),
            last_name: '',
            avatar: activeChat?.avatar
        }
        : (msg.isMine ? myself : (msg.author || {}));

    const senderName = `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim() || sender?.username;
    const senderLink = !isGroupSender && sender?.username ? `/${sender.username}` : '#';

    const timeString = new Date(msg.created_at).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    // Якщо це повідомлення має reply_to, але водночас немає власного тексту — це чисте пересилання
    const isPureForward = Boolean(msg.reply_to && !hasRichContent(msg.text));

    return (
<div
            id={`msg2-${msg.uuid}`}
            data-msg-id={msg.uuid}
            className={`group flex items-start gap-[8px] px-[6px] transition-colors ${
                msg.isSameForwardAuthor
                    ? 'pt-0 pb-[1px]'
                    : msg.isSameAuthor
                        ? 'same-author pt-[2px] pb-[2px]'
                        : 'mt-[4px] py-[4px]'
            } ${
                isSelected
                    ? 'bg-[rgba(91,155,213,0.22)]'
                    : !msg.isMine && (!msg.read_at && msg.status !== 'read')
                        ? 'bg-[rgba(91,155,213,0.1)]'
                        : 'hover:bg-bg-hover'
            }`}
        >
            {/* Чекбокс вибору */}
            <div
                onClick={onToggleSelect}
                className="w-[18px] pt-[4px] flex justify-center shrink-0 cursor-pointer select-none"
            >
                <div
                    className={`w-[13px] h-[13px] border flex items-center justify-center transition-opacity ${
                        isSelected
                            ? 'bg-theme-link border-theme-link text-white opacity-100'
                            : 'border-border bg-bg-box opacity-0 group-hover:opacity-100'
                    }`}
                >
                    {isSelected && <CheckSvg />}
                </div>
            </div>

            {/* Аватар */}
            <div className="w-[34px] shrink-0">
                {!msg.isSameAuthor && (
                    isGroupSender ? (
                        activeChat?.avatar ? (
                            <img
                                src={activeChat.avatar}
                                alt=""
                                className="w-[34px] h-[34px] object-cover border border-border block"
                            />
                        ) : (
                            <div className="w-[34px] h-[34px] bg-bg-page border border-border flex items-center justify-center text-text-muted">
                                <GroupIcon size={18} />
                            </div>
                        )
                    ) : (
                        <Link to={senderLink}>
                            <Avatar
                                user={sender}
                                className="w-[34px] h-[34px] object-cover border border-border block"
                            />
                        </Link>
                    )
                )}
            </div>

            {/* Тіло повідомлення */}
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-[8px]">
                    {!msg.isSameAuthor ? (
                        isGroupSender ? (
                            <span className="text-[11px] font-bold text-theme-link flex items-center gap-[4px]">
                                <RichText
                                    text={parseRichText(activeChat?.title || senderName)}
                                    className="post-text [&_p]:inline [&_p]:m-0"
                                    limit={100000}
                                />
                                <span className="text-[9px] font-normal px-[4px] py-[0.5px] bg-bg-page border border-border text-text-muted">
                                    {t('chat.badges.group_author')}
                                </span>
                            </span>
                        ) : (
                            <Link
                                to={senderLink}
                                className="text-[11px] font-bold text-theme-link hover:underline"
                            >
                                <strong>{senderName}</strong>
                            </Link>
                        )
                    ) : (
                        <span />
                    )}

                    <div className="flex items-center gap-[8px] shrink-0 ml-auto">
                        <MessageActions
                            msg={msg}
                            onToggleImportant={onToggleImportant}
                            setReplyingTo={setReplyingTo}
                            onForward={onForward}
                            handleEditClick={handleEditClick}
                            togglePin={togglePin}
                            onReport={onReport}
                            handleDelete={handleDelete}
                        />

                        <MessageStatusTicks
                            msg={msg}
                            timeString={timeString}
                        />
                    </div>
                </div>

                <MessageReplyQuote
                    replyTo={msg.reply_to}
                    isForwarded={isPureForward}
                    isSameForwardAuthor={msg.isSameForwardAuthor}
                />

                {/* Власний текст повідомлення (якщо є) */}
                {hasRichContent(msg.text) && (
                    <div className="text-[12px] text-text-main leading-[1.4] break-words">
                        <RichText
                            text={parseRichText(msg.text)}
                            className="post-text inline [&_p]:inline [&_p]:m-0"
                            limit={100000}
                        />

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
                    </div>
                )}

                {/* Пости/репости */}
                <MessageShareableCard
                    shareable={msg.shareable}
                    currentUsername={myself?.username}
                />

                {/* Список вкладень (фото, відео, аудіо, файли) */}
                <MessageAttachmentsList files={msg.files} />
            </div>
        </div>
    );
}