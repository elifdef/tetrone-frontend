
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

const ForwardSvg = () => (
    <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="shrink-0"
    >
        <polyline points="15 17 20 12 15 7" />
        <path d="M4 18v-2a4 4 0 0 1 4-4h12" />
    </svg>
);

function NestedForwardChain({ chain, depth = 1, children }) {
    if (!chain || depth > 4) {
        return <>{children}</>;
    }

    const author = chain.author || {};
    const authorName =
        chain.sender_name ||
        [author.first_name, author.last_name].filter(Boolean).join(' ') ||
        author.username ||
        '';
    const authorLink = author.username ? `/${author.username}` : null;
    const accentColor = author?.personalization?.username_color || 'var(--theme-link)';

    return (
        <div
            className="pl-[10px] border-l-[2px] my-[2px]"
            style={{ borderColor: accentColor }}
        >
            <div className="flex items-center gap-[5px] mb-[3px] text-[10px] text-text-muted">
                <ForwardSvg />
                {author.username && (
                    <Link to={authorLink}>
                        <Avatar
                            user={author}
                            className="w-[16px] h-[16px] object-cover border border-border block"
                        />
                    </Link>
                )}
                {authorLink ? (
                    <Link
                        to={authorLink}
                        className="font-bold hover:underline"
                        style={{ color: accentColor }}
                    >
                        {authorName}
                    </Link>
                ) : (
                    <span className="font-bold" style={{ color: accentColor }}>
                        {authorName}
                    </span>
                )}
                {chain.date && (
                    <span className="text-[10px] text-text-muted">{chain.date}</span>
                )}
            </div>
            {chain.forwarded_from ? (
                <NestedForwardChain chain={chain.forwarded_from} depth={depth + 1}>
                    {children}
                </NestedForwardChain>
            ) : (
                children
            )}
        </div>
    );
}

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
    const isForwarded = Boolean(msg.forwarded_from);
    const isReply = Boolean(msg.reply_to);

    const sender = isGroupSender
        ? {
            username: activeChat?.slug,
            first_name: getPlainText(activeChat?.title),
            last_name: '',
            avatar: activeChat?.avatar
        }
        : (msg.isMine ? myself : (msg.author || {}));

    const senderName = `${sender?.first_name || ''} ${sender?.last_name || ''}`.trim()
        || sender?.username
        || '';

    const senderLink = !isGroupSender && sender?.username
        ? `/${sender.username}`
        : '#';
const timeString = msg.created_at
        ? new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        })
        : '';

    const renderForwardedBundle = () => {
        const items = msg.forwardedItems || [msg];

        return (
            <div className="mt-[2px] pl-[10px] border-l-[2px] border-theme-link flex flex-col gap-[3px]">
                {items.map((fItem, idx) => {
                    const orig = fItem.forwarded_from || {};
                    const origAuthor = orig.author || {};
                    const origName =
                        orig.sender_name ||
                        [origAuthor.first_name, origAuthor.last_name].filter(Boolean).join(' ') ||
                        origAuthor.username ||
                        '';
                    const origLink = origAuthor.username ? `/${origAuthor.username}` : null;
                    const origColor = origAuthor?.personalization?.username_color;

                    const prevOrig = idx > 0 ? items[idx - 1]?.forwarded_from : null;
                    const prevKey = prevOrig
                        ? (prevOrig.author?.username || prevOrig.sender_name)
                        : null;
                    const currKey = origAuthor.username || origName;
                    const isSameOrigAuthor = Boolean(prevKey && prevKey === currKey);

                    const contentBlock = (
                        <>
                            {fItem.reply_to && (
                                <MessageReplyQuote
                                    replyTo={fItem.reply_to}
                                    isForwarded={false}
                                    isSameForwardAuthor={false}
                                    isClusterStart={false}
                                    isClusterEnd={false}
                                    onScrollToMessage={activeChat?.onScrollToMessage}
                                />
                            )}

                            {hasRichContent(fItem.text) && (
                                <div className="text-[12px] text-text-main leading-[1.4] break-words">
                                    <RichText
                                        text={parseRichText(fItem.text)}
                                        className="post-text inline [&_p]:inline [&_p]:m-0"
                                        limit={100000}
                                    />
                                </div>
                            )}

                            <MessageShareableCard
                                shareable={fItem.shareable}
                                currentUsername={myself?.username}
                            />

                            <MessageAttachmentsList
                                files={fItem.files}
                                activeChat={activeChat}
                            />
                        </>
                    );

                    return (
                        <div
                            key={fItem.uuid || idx}
                            id={`msg2-${fItem.uuid}`}
                            className={`flex items-start gap-[8px] ${isSameOrigAuthor ? 'pt-[1px]' : 'pt-[3px]'}`}
                        >
                            <div className="w-[30px] shrink-0">
                                {!isSameOrigAuthor && (
                                    origLink ? (
                                        <Link to={origLink}>
                                            <Avatar
                                                user={origAuthor}
                                                className="w-[30px] h-[30px] object-cover border border-border block"
                                            />
                                        </Link>
                                    ) : (
                                        <Avatar
                                            user={origAuthor}
                                            className="w-[30px] h-[30px] object-cover border border-border block"
                                        />
                                    )
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                {!isSameOrigAuthor && (
                                    <div className="flex items-center gap-[6px] mb-[2px]">
                                        {origLink ? (
                                            <Link
                                                to={origLink}
                                                className="text-[11px] font-bold hover:underline"
                                                style={origColor ? { color: origColor } : undefined}
                                            >
                                                <strong>{origName}</strong>
                                            </Link>
                                        ) : (
                                            <strong
                                                className="text-[11px]"
                                                style={origColor ? { color: origColor } : undefined}
                                            >
                                                {origName}
                                            </strong>
                                        )}
                                        {orig.date && (
                                            <span className="text-[10px] text-text-muted">
                                                {orig.date}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {orig.forwarded_from ? (
                                    <NestedForwardChain chain={orig.forwarded_from} depth={2}>
                                        {contentBlock}
                                    </NestedForwardChain>
                                ) : (
                                    contentBlock
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            id={`msg2-${msg.uuid}`}
            data-msg-id={msg.uuid}
            className={`group relative flex items-start gap-[8px] px-[6px] transition-colors ${
                msg.isSameAuthor
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
            <div className="w-[18px] pt-[3px] flex justify-center shrink-0 select-none">
                <div
                    onClick={onToggleSelect}
                    className={`w-[13px] h-[13px] border flex items-center justify-center cursor-pointer transition-opacity ${
                        isSelected
                            ? 'bg-theme-link border-theme-link text-white opacity-100'
                            : 'border-border bg-bg-box opacity-0 group-hover:opacity-100'
                    }`}
                >
                    {isSelected && <CheckSvg />}
                </div>
            </div>

            {/* Аватар автора повідомлення */}
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
            <div className="flex-1 min-w-0 pr-[110px]">

                {/* Шапка автора повідомлення */}
                {!msg.isSameAuthor && (
                    <div className="flex items-center gap-[8px] mb-[2px]">
                        {isGroupSender ? (
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
                                className="text-[11px] font-bold hover:underline"
                                style={{
                                    color: sender?.personalization?.username_color
                                }}
                            >
                                <strong>{senderName}</strong>
                            </Link>
                        )}
                    </div>
                )}

                {/* Панель дій і часу */}
                <div className="absolute right-[6px] top-[3px] flex items-center gap-[8px] z-10">
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

                {/* Позначка пересилання */}
                {isForwarded ? (
                    renderForwardedBundle()
                ) : (
                    <>
                        {isReply && (
                            <MessageReplyQuote
                                replyTo={msg.reply_to}
                                isForwarded={false}
                                isSameForwardAuthor={false}
                                isClusterStart={false}
                                isClusterEnd={false}
                                onScrollToMessage={activeChat?.onScrollToMessage}
                            />
                        )}

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

                        <MessageShareableCard
                            shareable={msg.shareable}
                            currentUsername={myself?.username}
                        />

                        <MessageAttachmentsList
                            files={msg.files}
                            activeChat={activeChat}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
