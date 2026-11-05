import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useSocket } from '../../context/SocketContext';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import RichText from '../common/RichText.jsx';
import { parseRichText, hasRichContent, detectTipTapFeatures, getPlainText } from './utils/messageParser.js';
import {
    GroupIcon,
    PinSvg,
    MutedSvg,
    DotsSvg,
    MediaClipSvg,
    PostBadgeSvg,
    PencilTypingIcon,
    SavedMessagesIcon
} from '../ui/Icons.jsx';

export default function ConversationList({
    currentUser,
    chats,
    draftsMap,
    draftFilesMap,
    searchQuery,
    setSearchQuery,
    openMenuChatSlug,
    setOpenMenuChatSlug,
    onSelectChat,
    onMarkAllAsRead,
    onOpenCreateModal,
    onTogglePinChat,
    onMarkChatUnread,
    onMuteChat,
    onClearChatHistory,
    onDeleteChat,
    renderChatTitle,
    getTypingText
}) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { onlineUsers = [] } = useSocket() || {};

    const getAttachmentBadges = (chat, draftDoc, draftFiles = []) => {
        const badges = [];
        const filesArr = draftFiles.length > 0 ? draftFiles : (chat.last_message_files || []);
        const docToInspect = draftDoc || chat.last_message;

        if (chat.last_message_shareable && !draftDoc && draftFiles.length === 0) {
            const shareType = chat.last_message_shareable.type;
            const labelKey = shareType === 'comment'
                ? 'chat.badges.forwarded_comment'
                : shareType === 'user'
                    ? 'chat.badges.shared_profile'
                    : 'chat.badges.forwarded_post';

            badges.push({
                key: `share_${shareType}`,
                label: t(labelKey),
                isPost: shareType === 'post'
            });

            if (shareType === 'post' && chat.last_message_shareable.post?.poll) {
                badges.push({ key: 'poll', label: t('chat.badges.poll') });
            }
        }

        if (filesArr.length > 0) {
            const first = filesArr[0];
            const isImg = first.type?.startsWith('image/') || first.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isVid = first.type?.startsWith('video/') || first.name?.match(/\.(mp4|webm)$/i);
            const isAud = first.type?.startsWith('audio/') || first.name?.match(/\.(mp3|ogg|wav)$/i);

            badges.push({
                key: 'file',
                label: isImg
                    ? t('chat.composer.attach.photo')
                    : isVid
                        ? t('chat.composer.attach.video')
                        : isAud
                            ? t('chat.composer.attach.audio')
                            : t('chat.composer.attach.document'),
                thumbUrl: isImg ? (first.previewUrl || first.url) : null
            });
        }

        const features = detectTipTapFeatures(docToInspect);
        if (features.hasTable) badges.push({ key: 'table', label: t('chat.badges.table') });
        if (features.hasCode) badges.push({ key: 'code', label: t('chat.badges.code') });

        return badges;
    };

    const getSenderPrefix = (chat) => {
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

    return (
        <div className="im_page page-conversations">
            {/* Панель пошуку та кнопок */}
            <div className="flex items-center gap-[6px] p-[8px_10px] border-b border-border bg-bg-page">
                <div className="flex-1">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t('chat.actions.search_placeholder')}
                        className="w-full px-[8px] py-[5px] text-[11px] bg-bg-box text-text-main border border-border outline-none focus:border-theme-link"
                    />
                </div>
                <Button variant="secondary" onClick={onMarkAllAsRead}>
                    {t('chat.actions.mark_all_read')}
                </Button>
                <Button variant="primary" onClick={onOpenCreateModal}>
                    {t('chat.actions.new_chat')}
                </Button>
            </div>

            {/* Список розмов */}
            <div className="flex flex-col divide-y divide-border">
                {chats.map((chat) => {
                    const isMineLast = chat.last_message_sender_username === currentUser?.username;
                    const senderUser = isMineLast
                        ? currentUser
                        : (chat.last_message_author || chat.target_user);

                    const isUnreadHighlight = chat.unread_count > 0 || chat.is_last_unread;
                    const draftDoc = draftsMap[chat.slug];
                    const draftFiles = draftFilesMap[chat.slug] || [];
                    const hasDraft = hasRichContent(draftDoc) || draftFiles.length > 0;

                    const typingText = getTypingText(chat);
                    const badges = getAttachmentBadges(chat, hasDraft ? draftDoc : null, draftFiles);
                    const hasLastContent = hasRichContent(chat.last_message) || badges.length > 0;

                    return (
                        <div
                            key={chat.slug}
                            onClick={() => onSelectChat(chat.slug)}
                            className={`relative flex items-center gap-[10px] p-[8px_10px] cursor-pointer transition-colors hover:bg-bg-hover ${chat.is_pinned ? 'bg-[rgba(91,155,213,0.05)]' : ''
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
                                        {!chat.is_saved && !chat.is_group && chat.target_user?.username && onlineUsers.includes(chat.target_user.username) && (
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
                                            {renderChatTitle(chat)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-text-muted mt-[1px]">
                                        {formatDate(chat.updated_at)}
                                    </span>
                                </div>
                            </div>

                            {/* Середня частина: Міні-аватар автора + Текст/Бейджі/Друкує */}
                            <div
                                className={`flex items-center gap-[8px] flex-1 min-w-0 p-[5px_8px] transition-colors ${isUnreadHighlight
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
                                                {getSenderPrefix(chat)}
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

                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenMenuChatSlug(prev => (prev === chat.slug ? null : chat.slug))}
                                        className="p-[4px] text-text-muted hover:text-theme-link bg-transparent border border-transparent hover:border-border cursor-pointer flex items-center justify-center"
                                    >
                                        <DotsSvg />
                                    </button>

                                    {openMenuChatSlug === chat.slug && (
                                        <div className="absolute right-0 top-full mt-[2px] w-[195px] bg-bg-box border border-border shadow-md z-30 flex flex-col divide-y divide-border text-[11px]">
                                            {!chat.is_saved && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onTogglePinChat(chat.slug);
                                                            setOpenMenuChatSlug(null);
                                                        }}
                                                        className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                    >
                                                        {chat.is_pinned ? t('chat.menu.unpin_chat') : t('chat.menu.pin_chat')}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            onMarkChatUnread(chat.slug);
                                                            setOpenMenuChatSlug(null);
                                                        }}
                                                        className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                    >
                                                        {t('chat.menu.mark_unread')}
                                                    </button>

                                                    {chat.muted_until ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onMuteChat(chat.slug, null);
                                                                setOpenMenuChatSlug(null);
                                                            }}
                                                            className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                        >
                                                            {t('chat.menu.unmute')}
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onMuteChat(chat.slug, '1h');
                                                                    setOpenMenuChatSlug(null);
                                                                }}
                                                                className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                            >
                                                                {t('chat.menu.mute_1h')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onMuteChat(chat.slug, '8h');
                                                                    setOpenMenuChatSlug(null);
                                                                }}
                                                                className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                            >
                                                                {t('chat.menu.mute_8h')}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    onMuteChat(chat.slug, 'forever');
                                                                    setOpenMenuChatSlug(null);
                                                                }}
                                                                className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                            >
                                                                {t('chat.menu.mute_forever')}
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onClearChatHistory(chat.slug);
                                                    setOpenMenuChatSlug(null);
                                                }}
                                                className="px-[10px] py-[6px] text-left text-theme-error hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                            >
                                                {t('chat.menu.clear_history')}
                                            </button>

                                            {!chat.is_saved && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        onDeleteChat(chat.slug, false);
                                                        setOpenMenuChatSlug(null);
                                                    }}
                                                    className="px-[10px] py-[6px] text-left text-theme-error font-bold hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                >
                                                    {t('chat.menu.delete_chat')}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}

                {chats.length === 0 && (
                    <div className="p-[24px] text-center text-[11px] text-text-muted italic">
                        {t('chat.empty.inbox')}
                    </div>
                )}
            </div>
            <div className="flex justify-between items-center p-[8px_12px] bg-header-bg border-t border-border text-[11px] text-text-muted">
                <div>
                    {t('chat.bottom.conversations_count', { count: chats.filter(c => !c.is_saved).length })}
                </div>
            </div>
        </div>
    );
}