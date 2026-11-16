import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '@hooks/useDateFormatter';
import Avatar from '@ui/Avatar';
import RichText from '@common/RichText.jsx';
import ChatTitle from '../common/ChatTitle.jsx';
import ConversationContextMenu from './ConversationContextMenu.jsx';
import { parseRichText, hasRichContent } from '../../utils/messageParser.js';
import { getAttachmentBadges, getSenderPrefix } from '../../utils/chatBadges.js';
import {GroupIcon, PinSvg, MutedSvg, MediaClipSvg, PostBadgeSvg, PencilTypingIcon, SavedMessagesIcon} from '@ui/Icons.jsx';

export default function ConversationItem({
    chat,
    currentUser,
    isOnline,
    draftDoc,
    draftFiles = [],
    typingText,
    isMenuOpen,
    onToggleMenu,
    onCloseMenu,
    onSelectChat,
    onTogglePinChat,
    onMarkChatUnread,
    onMuteChat,
    onClearChatHistory,
    onDeleteChat
}) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const isUnreadHighlight = chat.unread_count > 0 || chat.is_last_unread;
    const hasDraft = hasRichContent(draftDoc) || draftFiles.length > 0;
    const badges = getAttachmentBadges(chat, hasDraft ? draftDoc : null, draftFiles, t);
    const hasLastContent = hasRichContent(chat.last_message) || badges.length > 0;

    return (
        <div
            onClick={() => onSelectChat(chat.slug)}
            className={`relative flex items-center gap-[10px] p-[8px_10px] cursor-pointer transition-colors hover:bg-bg-hover ${
                chat.is_pinned ? 'bg-[rgba(91,155,213,0.05)]' : ''
            }`}
        >
            {/* Ліва частина: Аватар чату + Назва + Дата */}
            <div className="flex items-center gap-[8px] w-[185px] sm:w-[215px] shrink-0">
                {chat.is_saved ? (
                    <div className="w-[38px] h-[38px] bg-theme-link/15 border border-theme-link/40 flex items-center justify-center text-theme-link shrink-0">
                        <SavedMessagesIcon size={20} />
                    </div>
                ) : chat.is_group ? (
                    chat.avatar ? (
                        <img
                            src={chat.avatar}
                            alt=""
                            loading="lazy"
                            className="w-[38px] h-[38px] object-cover border border-border block shrink-0"
                        />
                    ) : (
                        <div className="w-[38px] h-[38px] bg-bg-page border border-border flex items-center justify-center text-text-muted shrink-0">
                            <GroupIcon />
                        </div>
                    )
                ) : (
                    <div className="relative shrink-0">
                        <Avatar
                            user={chat.target_user}
                            className="w-[38px] h-[38px] object-cover border border-border block"
                        />
                        {isOnline && (
                            <span className="absolute bottom-[-1px] right-[-1px] w-[7px] h-[7px] bg-theme-success border border-bg-box" />
                        )}
                    </div>
                )}

                <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-[4px] font-bold text-[11px] text-theme-link hover:underline truncate">
                        {chat.is_pinned && (
                            <span title={t('chat.menu.pinned')} className="text-theme-link">
                                <PinSvg />
                            </span>
                        )}
                        {chat.muted_until && (
                            <span title={t('chat.menu.muted')}>
                                <MutedSvg />
                            </span>
                        )}
                        <div className="truncate">
                            <ChatTitle chat={chat} />
                        </div>
                    </div>
                    <span className="text-[10px] text-text-muted mt-[1px]">
                        {formatDate(chat.updated_at)}
                    </span>
                </div>
            </div>

            {/* Середня частина: Текст / Чернетка / Бейджі / Друкує */}
            <div
                className={`flex items-center gap-[8px] flex-1 min-w-0 p-[5px_8px] transition-colors ${
                    isUnreadHighlight
                        ? 'bg-[rgba(91,155,213,0.14)] dark:bg-[rgba(91,155,213,0.2)]'
                        : ''
                }`}
            >
                <div className="text-[11px] text-text-main truncate flex-1 flex items-center gap-[5px]">
                    {typingText ? (
                        <span className="inline-flex items-center gap-[5px] text-theme-link font-bold truncate">
                            <PencilTypingIcon />
                            <span className="truncate">{typingText}</span>
                        </span>
                    ) : hasDraft ? (
                        <div className="flex items-center gap-[5px] truncate">
                            <strong className="text-theme-error shrink-0">
                                {t('chat.draft_badge')}:
                            </strong>
                            {badges.map((b) => (
                                <span key={b.key} className="inline-flex items-center gap-[4px] text-theme-link font-bold shrink-0">
                                    {b.thumbUrl ? (
                                        <img src={b.thumbUrl} alt="" className="w-[16px] h-[16px] object-cover border border-border" />
                                    ) : (
                                        <MediaClipSvg />
                                    )}
                                    <span>[{b.label}]</span>
                                </span>
                            ))}
                            {hasRichContent(draftDoc) && (
                                <RichText
                                    text={parseRichText(draftDoc)}
                                    className="post-text [&_p]:inline [&_p]:m-0 text-[11px] truncate"
                                    limit={100000}
                                />
                            )}
                        </div>
                    ) : hasLastContent ? (
                        <div className="flex items-center gap-[5px] truncate">
                            <span className="text-text-muted font-bold shrink-0">
                                {getSenderPrefix(chat, currentUser, t)}
                            </span>
                            {badges.map((b) => (
                                <span key={b.key} className="inline-flex items-center gap-[4px] text-theme-link font-bold shrink-0">
                                    {b.thumbUrl ? (
                                        <img src={b.thumbUrl} alt="" className="w-[16px] h-[16px] object-cover border border-border" />
                                    ) : b.isPost ? (
                                        <PostBadgeSvg />
                                    ) : (
                                        <MediaClipSvg />
                                    )}
                                    <span>[{b.label}]</span>
                                </span>
                            ))}
                            {hasRichContent(chat.last_message) && (
                                <RichText
                                    text={parseRichText(chat.last_message)}
                                    className="post-text [&_p]:inline [&_p]:m-0 text-[11px] truncate"
                                    limit={100000}
                                />
                            )}
                        </div>
                    ) : (
                        <span className="italic text-text-muted">
                            {t('chat.empty.messages')}
                        </span>
                    )}
                </div>
            </div>

            {/* Права частина: Лічильник + Контекстне меню */}
            <div className="flex items-center gap-[8px] shrink-0">
                {chat.unread_count > 0 && (
                    <div className="text-[11px] font-bold text-theme-link">
                        {t('chat.plus_count', { count: chat.unread_count })}
                    </div>
                )}

                <ConversationContextMenu
                    chat={chat}
                    isOpen={isMenuOpen}
                    onToggleMenu={onToggleMenu}
                    onCloseMenu={onCloseMenu}
                    onTogglePinChat={onTogglePinChat}
                    onMarkChatUnread={onMarkChatUnread}
                    onMuteChat={onMuteChat}
                    onClearChatHistory={onClearChatHistory}
                    onDeleteChat={onDeleteChat}
                />
            </div>
        </div>
    );
}