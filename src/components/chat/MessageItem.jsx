import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '../ui/Avatar';
import RichText from '../common/RichText.jsx';
import MessageActions from './MessageActions.jsx';
import MessageStatusTicks from './MessageStatusTicks.jsx';
import MessageContent from './components/message/MessageContent.jsx';
import ForwardedMessageBundle from './components/message/ForwardedMessageBundle.jsx';
import { parseRichText, getPlainText } from './utils/messageParser.js';
import { GroupIcon } from '../ui/Icons.jsx';

const CheckSvg = () => (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export default React.memo(function MessageItem({
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

    const timeString = useMemo(() => {
        if (!msg.created_at) return '';
        return new Date(msg.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }, [msg.created_at]);

    const itemUuids = msg.bundleUuids || [msg.uuid];

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
                    onClick={() => onToggleSelect(itemUuids, isSelected)}
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
                        itemUuids={itemUuids}
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

                {/* Контент повідомлення або пересланого бандлу */}
                {isForwarded ? (
                    <ForwardedMessageBundle
                        msg={msg}
                        myself={myself}
                        activeChat={activeChat}
                    />
                ) : (
                    <MessageContent
                        msg={msg}
                        myself={myself}
                        activeChat={activeChat}
                        showStatusBadges={true}
                    />
                )}
            </div>
        </div>
    );
});