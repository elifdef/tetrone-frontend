import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Modal from '../modals/Modal.jsx';
import SmartEditor from '../editor/SmartEditor';
import RichText from '../common/RichText.jsx';
import ChatScrollContainer from '../common/ChatScrollContainer.jsx';
import MessageItem from './MessageItem';
import ChatComposer from './ChatComposer';
import { getPlainText, parseRichText, hasRichContent } from './utils/messageParser.js';

const GroupIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const PinSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <line x1="12" y1="17" x2="12" y2="22" />
        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
    </svg>
);

const MutedSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-text-muted">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <line x1="23" y1="9" x2="17" y2="15" />
        <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
);

const DotsSvg = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="19" cy="12" r="1.5" />
        <circle cx="5" cy="12" r="1.5" />
    </svg>
);

const CloseSvg = ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

const ArrowRightSvg = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

const MediaClipSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

export const PencilTypingIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 text-theme-link inline-block overflow-visible">
        <g>
            <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 2.5 -1.5; 5 0; 2.5 1; 0 0"
                dur="0.55s"
                repeatCount="indefinite"
                calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1; 0.4 0 0.2 1"
            />
            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
        </g>
    </svg>
);

export default function ChatLayout(props) {
    const {
        currentUser,
        friendsList = [],
        chats,
        allChats = [],
        openedChats,
        draftsMap = {},
        draftFilesMap = {},
        messages,
        activeChat,
        selectedMessageIds,
        toggleSelectMessage,
        clearSelectedMessages,
        toggleImportantMessage,
        handleBulkImportant,
        handleBulkDelete,
        handleForwardMessages,
        handleReportMessage,
        searchQuery,
        setSearchQuery,
        isBannerVisible,
        handleDismissBanner,
        handleSelectChat,
        handleBackToInbox,
        handleCloseChatTab,
        handleMarkAllAsRead,
        handleTogglePinChat,
        handleMarkChatUnread,
        handleMuteChat,
        handleClearChatHistory,
        handleDeleteChat,
        handleCreateNewChat,
        handleEditClick,
        handleDelete,
        setReplyingTo,
        togglePin,
        isTyping,
        isLoadingMore,
        hasMoreMessages,
        onLoadMore,
        canWrite,
        cantWriteReason,
        onOpenInfo,
        onScrollToMessage
    } = props;

    const { t, i18n } = useTranslation();
    const formatDate = useDateFormatter();

    const [openMenuChatId, setOpenMenuChatId] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createMode, setCreateMode] = useState('dm');
    const [selectedFriendId, setSelectedFriendId] = useState(friendsList[0]?.id || '');
    const [newGroupTitle, setNewGroupTitle] = useState(null);
    const [newGroupDesc, setNewGroupDesc] = useState(null);
    const [newGroupMembers, setNewGroupMembers] = useState([]);

    const [forwardModalState, setForwardModalState] = useState({ isOpen: false, messageIds: [] });
    const [forwardComment, setForwardComment] = useState('');

    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedDateJump, setSelectedDateJump] = useState('');

    const [reportModalState, setReportModalState] = useState({ isOpen: false, messageId: null });
    const [reportReason, setReportReason] = useState('');

    const pinnedMessage = useMemo(() => messages.find(m => m.is_pinned), [messages]);

    const renderChatTitle = (chat, className = '') => {
        if (!chat) return null;
        if (chat.is_group) {
            return (
                <RichText
                    text={parseRichText(chat.title)}
                    className={`post-text [&_p]:inline [&_p]:m-0 ${className}`}
                    limit={100000}
                />
            );
        }
        if (chat.target_user?.is_deleted) {
            return <span className={className}>{t('chat.deleted_user')}</span>;
        }
        const fullName = `${chat.target_user?.first_name || ''} ${chat.target_user?.last_name || ''}`.trim();
        return <span className={className}>{fullName}</span>;
    };

    const getChatPlainShortTitle = (chat) => {
        if (!chat) return '';
        if (chat.is_group) return getPlainText(chat.title);
        if (chat.target_user?.is_deleted) return t('chat.deleted_user');
        return chat.target_user?.first_name || '';
    };

    const getTypingText = (chat, forceTyping = false) => {
        if (!chat) return '';
        let typers = Array.isArray(chat.typing_users) ? [...chat.typing_users] : [];

        if (typers.length === 0 && (chat.is_typing || forceTyping)) {
            if (!chat.is_group && chat.target_user) {
                typers = [chat.target_user];
            } else if (chat.is_group && chat.participants?.length > 0) {
                const other = chat.participants.find(p => p.user.id !== currentUser?.id)?.user;
                if (other) typers = [other];
            }
        }

        if (typers.length === 0) return '';

        // В особистій переписці показуємо просто "друкує..." без імені
        if (!chat.is_group) {
            return t('chat.typing');
        }

        // У груповій бесіді показуємо хто саме пише
        if (typers.length === 1) {
            return t('chat.typing_one', { user: typers[0].first_name });
        }
        if (typers.length === 2) {
            return t('chat.typing_two', { user1: typers[0].first_name, user2: typers[1].first_name });
        }
        return t('chat.typing_many', { user: typers[0].first_name, count: typers.length - 1 });
    };

    const getAttachmentLabel = (filesArr = []) => {
        if (!filesArr || filesArr.length === 0) return '';
        const first = filesArr[0];
        if (first.type?.startsWith('image/') || first.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            return t('chat.composer.attach.photo');
        }
        if (first.type?.startsWith('video/') || first.name?.match(/\.(mp4|webm)$/i)) {
            return t('chat.composer.attach.video');
        }
        if (first.type?.startsWith('audio/') || first.name?.match(/\.(mp3|ogg|wav)$/i)) {
            return t('chat.composer.attach.audio');
        }
        return t('chat.composer.attach.document');
    };

    const groupedMessageDays = useMemo(() => {
        const groups = [];
        messages.forEach((msg) => {
            const d = new Date(msg.created_at);
            const dateKey = d.toISOString().slice(0, 10);
            const label = d.toLocaleDateString(i18n.language || 'uk-UA', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });

            let currentGroup = groups[groups.length - 1];
            if (!currentGroup || currentGroup.dateKey !== dateKey) {
                currentGroup = { dateKey, label, items: [] };
                groups.push(currentGroup);
            }

            const prevMsg = currentGroup.items[currentGroup.items.length - 1];
            const prevAuthorId = prevMsg ? (prevMsg.isMine ? currentUser?.id : prevMsg.author?.id) : null;
            const currAuthorId = msg.isMine ? currentUser?.id : msg.author?.id;
            const isSameAuthor = Boolean(prevMsg && prevAuthorId === currAuthorId && !msg.reply_to);

            currentGroup.items.push({ ...msg, isSameAuthor });
        });
        return groups;
    }, [messages, currentUser, i18n.language]);

    const floatingDateLabel = groupedMessageDays.length > 0
        ? groupedMessageDays[groupedMessageDays.length - 1].label
        : '';

    const handleJumpToDate = () => {
        if (!selectedDateJump) return;
        const targetMsg = messages.find(m => m.created_at.startsWith(selectedDateJump));
        if (targetMsg) {
            onScrollToMessage?.(targetMsg.id);
        }
        setIsDateModalOpen(false);
    };

    const submitCreateChat = () => {
        if (createMode === 'dm') {
            if (!selectedFriendId) return;
            handleCreateNewChat({ isGroup: false, targetUserId: Number(selectedFriendId) });
        } else {
            if (!hasRichContent(newGroupTitle)) return;
            handleCreateNewChat({
                isGroup: true,
                title: newGroupTitle,
                description: newGroupDesc,
                participantIds: newGroupMembers
            });
        }
        setIsCreateModalOpen(false);
        setNewGroupTitle(null);
        setNewGroupDesc(null);
        setNewGroupMembers([]);
    };

    return (
        <div
            id="im_container"
            onClick={() => setOpenMenuChatId(null)}
            className="bg-bg-box border border-border flex flex-col font-sans text-text-main w-full"
        >
            <div id="im_page_tabs">
                <div className="flex flex-col">
                    {!activeChat && isBannerVisible && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[16px] p-[14px_16px] m-[10px_10px_4px_10px] bg-header-bg border border-border">
                            <div className="shrink-0 w-[150px] h-[112px] sm:w-[176px] sm:h-[132px] overflow-hidden border border-border bg-bg-box flex items-center justify-center">
                                <img
                                    src="/icantdrawandigeneratethisingemini.png"
                                    alt=""
                                    className="w-full h-full object-cover block"
                                />
                            </div>

                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="font-bold text-[13px] text-theme-link mb-[6px] leading-[1.35]">
                                    {t('chat.banner.title')}
                                </div>
                                <div className="text-[11px] leading-[1.45] text-text-main mb-[10px]">
                                    {t('chat.banner.text')}
                                </div>
                                <div>
                                    <Button variant="secondary" onClick={handleDismissBanner}>
                                        {t('chat.banner.close')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-between items-end px-[12px] pt-[8px] border-b border-border bg-header-bg gap-[10px] flex-wrap">
                        <div className="flex items-center gap-[4px] flex-wrap">
                            <button
                                type="button"
                                onClick={handleBackToInbox}
                                className={`px-[12px] py-[6px] text-[11px] font-bold cursor-pointer border-b-[2px] transition-colors ${!activeChat
                                    ? 'text-theme-link border-theme-link bg-bg-box'
                                    : 'text-text-muted border-transparent hover:text-theme-link hover:bg-bg-hover'
                                    }`}
                            >
                                {t('chat.tabs.conversations')}
                            </button>

                            {openedChats.map((chatTab) => {
                                const isSelected = activeChat?.id === chatTab.id;
                                const hasDraft = hasRichContent(draftsMap[chatTab.id]) || (draftFilesMap[chatTab.id]?.length > 0);

                                return (
                                    <div
                                        key={chatTab.id}
                                        onClick={() => handleSelectChat(chatTab.id)}
                                        className={`flex items-center gap-[6px] px-[10px] py-[5px] text-[11px] font-bold cursor-pointer border-b-[2px] transition-colors ${isSelected
                                            ? 'bg-theme-link text-white border-theme-link'
                                            : 'bg-bg-box text-theme-link border-border hover:bg-bg-hover'
                                            }`}
                                    >
                                        <span className="max-w-[130px] truncate">
                                            {getChatPlainShortTitle(chatTab)}
                                        </span>
                                        {hasDraft && (
                                            <span className={`text-[9px] italic ${isSelected ? 'text-white/90' : 'text-theme-error'}`}>
                                                ({t('chat.draft_badge')})
                                            </span>
                                        )}
                                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                                            {t('chat.plus_count', { count: chatTab.unread_count || 0 })}
                                        </span>
                                        <button
                                            type="button"
                                            title={t('chat.tabs.close_tab')}
                                            onClick={(e) => handleCloseChatTab(e, chatTab.id)}
                                            className={`ml-[2px] flex items-center justify-center cursor-pointer bg-transparent border-none p-0 ${isSelected ? 'text-white hover:opacity-75' : 'text-text-muted hover:text-theme-error'
                                                }`}
                                        >
                                            <CloseSvg size={11} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {activeChat && (
                            <div className="flex items-center pb-[6px] text-[11px] shrink-0">
                                <button
                                    type="button"
                                    onClick={onOpenInfo}
                                    className="bg-transparent border-none p-0 text-[11px] text-theme-link hover:underline cursor-pointer"
                                >
                                    {t('chat.tabs.info')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div id="im_page_containers">
                {!activeChat ? (
                    <div className="im_page page-conversations">
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
                            <Button variant="secondary" onClick={handleMarkAllAsRead}>
                                {t('chat.actions.mark_all_read')}
                            </Button>
                            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                                {t('chat.actions.new_chat')}
                            </Button>
                        </div>

                        <div className="flex flex-col divide-y divide-border">
                            {chats.map((chat) => {
                                const senderUser = chat.last_message_sender_id === currentUser?.id
                                    ? currentUser
                                    : (chat.last_message_author || chat.target_user);

                                const isUnreadHighlight = chat.unread_count > 0 || chat.is_last_unread;
                                const draftDoc = draftsMap[chat.id];
                                const draftFiles = draftFilesMap[chat.id] || [];
                                const hasDraft = hasRichContent(draftDoc) || draftFiles.length > 0;

                                const lastFiles = chat.last_message_files || [];
                                const firstPreviewFile = draftFiles[0] || lastFiles[0];
                                const isFirstFileImage = firstPreviewFile && (
                                    firstPreviewFile.type?.startsWith('image/') ||
                                    firstPreviewFile.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                                );

                                return (
                                    <div
                                        key={chat.id}
                                        onClick={() => handleSelectChat(chat.id)}
                                        className={`relative flex items-center gap-[10px] p-[8px_10px] cursor-pointer transition-colors hover:bg-bg-hover ${chat.is_pinned ? 'bg-[rgba(91,155,213,0.05)]' : ''
                                            }`}
                                    >
                                        <div className="flex items-center gap-[8px] w-[185px] sm:w-[215px] shrink-0">
                                            {chat.is_group ? (
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
                                                <Avatar
                                                    user={chat.target_user}
                                                    className="w-[38px] h-[38px] object-cover border border-border block shrink-0"
                                                />
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

                                        <div
                                            className={`flex items-center gap-[8px] flex-1 min-w-0 p-[5px_8px] transition-colors ${isUnreadHighlight
                                                ? 'bg-[rgba(91,155,213,0.14)] dark:bg-[rgba(91,155,213,0.2)]'
                                                : ''
                                                }`}
                                        >
                                            <Avatar
                                                user={senderUser}
                                                className="w-[22px] h-[22px] object-cover border border-border shrink-0"
                                            />

                                            <div className="text-[11px] text-text-main truncate flex-1 flex items-center gap-[6px]">
                                                {getTypingText(chat) ? (
                                                    <span className="inline-flex items-center gap-[5px] text-theme-link font-bold truncate">
                                                        <PencilTypingIcon />
                                                        <span className="truncate">{getTypingText(chat)}</span>
                                                    </span>
                                                ) : hasDraft ? (
                                                    <div className="flex items-center gap-[6px] truncate">
                                                        <strong className="text-theme-error shrink-0">
                                                            {t('chat.draft_badge')}:
                                                        </strong>
                                                        {draftFiles.length > 0 && (
                                                            <span className="inline-flex items-center gap-[4px] text-theme-link font-bold shrink-0">
                                                                {isFirstFileImage ? (
                                                                    <img
                                                                        src={firstPreviewFile.previewUrl || firstPreviewFile.url}
                                                                        alt=""
                                                                        className="w-[18px] h-[18px] object-cover border border-border"
                                                                    />
                                                                ) : (
                                                                    <MediaClipSvg />
                                                                )}
                                                                <span>[{getAttachmentLabel(draftFiles)}]</span>
                                                            </span>
                                                        )}
                                                        {hasRichContent(draftDoc) && (
                                                            <RichText
                                                                text={parseRichText(draftDoc)}
                                                                className="post-text [&_p]:inline [&_p]:m-0 text-[11px] truncate"
                                                                limit={100000}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (hasRichContent(chat.last_message) || lastFiles.length > 0) ? (
                                                    <div className="flex items-center gap-[6px] truncate">
                                                        {lastFiles.length > 0 && (
                                                            <span className="inline-flex items-center gap-[4px] text-theme-link font-bold shrink-0">
                                                                {isFirstFileImage ? (
                                                                    <img
                                                                        src={firstPreviewFile.url}
                                                                        alt=""
                                                                        className="w-[18px] h-[18px] object-cover border border-border"
                                                                    />
                                                                ) : (
                                                                    <MediaClipSvg />
                                                                )}
                                                                <span>[{getAttachmentLabel(lastFiles)}]</span>
                                                            </span>
                                                        )}
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

                                        <div className="flex items-center gap-[8px] shrink-0">
                                            <div
                                                className={`text-[11px] font-bold ${chat.unread_count > 0 ? 'text-theme-link' : 'text-text-muted'
                                                    }`}
                                            >
                                                {t('chat.plus_count', { count: chat.unread_count || 0 })}
                                            </div>

                                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenMenuChatId(prev => (prev === chat.id ? null : chat.id))}
                                                    className="p-[4px] text-text-muted hover:text-theme-link bg-transparent border border-transparent hover:border-border cursor-pointer flex items-center justify-center"
                                                >
                                                    <DotsSvg />
                                                </button>

                                                {openMenuChatId === chat.id && (
                                                    <div className="absolute right-0 top-full mt-[2px] w-[195px] bg-bg-box border border-border shadow-md z-30 flex flex-col divide-y divide-border text-[11px]">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleTogglePinChat(chat.id);
                                                                setOpenMenuChatId(null);
                                                            }}
                                                            className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                        >
                                                            {chat.is_pinned ? t('chat.menu.unpin_chat') : t('chat.menu.pin_chat')}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleMarkChatUnread(chat.id);
                                                                setOpenMenuChatId(null);
                                                            }}
                                                            className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                        >
                                                            {t('chat.menu.mark_unread')}
                                                        </button>

                                                        {chat.muted_until ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleMuteChat(chat.id, null);
                                                                    setOpenMenuChatId(null);
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
                                                                        handleMuteChat(chat.id, '1h');
                                                                        setOpenMenuChatId(null);
                                                                    }}
                                                                    className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                                >
                                                                    {t('chat.menu.mute_1h')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleMuteChat(chat.id, '8h');
                                                                        setOpenMenuChatId(null);
                                                                    }}
                                                                    className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                                >
                                                                    {t('chat.menu.mute_8h')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleMuteChat(chat.id, 'forever');
                                                                        setOpenMenuChatId(null);
                                                                    }}
                                                                    className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                                >
                                                                    {t('chat.menu.mute_forever')}
                                                                </button>
                                                            </>
                                                        )}

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleClearChatHistory(chat.id);
                                                                setOpenMenuChatId(null);
                                                            }}
                                                            className="px-[10px] py-[6px] text-left text-theme-error hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                        >
                                                            {t('chat.menu.clear_history')}
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                handleDeleteChat(chat.id, false);
                                                                setOpenMenuChatId(null);
                                                            }}
                                                            className="px-[10px] py-[6px] text-left text-theme-error font-bold hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                                        >
                                                            {t('chat.menu.delete_chat')}
                                                        </button>
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
                                {t('chat.bottom.conversations_count', { count: chats.length })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="im_page page-other flex flex-col">
                        <div
                            onClick={onOpenInfo}
                            className="flex items-center justify-between px-[12px] py-[8px] bg-bg-page border-b border-border cursor-pointer hover:bg-bg-hover transition-colors"
                        >
                            <div className="flex items-center gap-[8px]">
                                {activeChat.is_group && activeChat.avatar ? (
                                    <img
                                        src={activeChat.avatar}
                                        alt=""
                                        className="w-[22px] h-[22px] object-cover border border-border"
                                    />
                                ) : (
                                    <Avatar
                                        user={activeChat.target_user}
                                        className="w-[22px] h-[22px] object-cover border border-border"
                                    />
                                )}
                                <div className="font-bold text-[12px] text-theme-link hover:underline">
                                    {renderChatTitle(activeChat)}
                                </div>
                                {getTypingText(activeChat, isTyping) ? (
                                    <span className="inline-flex items-center gap-[4px] text-[10px] text-theme-link font-bold">
                                        <PencilTypingIcon />
                                        <span>{getTypingText(activeChat, isTyping)}</span>
                                    </span>
                                ) : activeChat.is_group ? (
                                    <span className="text-[10px] text-text-muted">
                                        ({t('chat.participants_count', { count: activeChat.participants_count })})
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-text-muted flex items-center gap-[4px]">
                                        <span className="inline-block w-[6px] h-[6px] bg-theme-success" />
                                        <span>{t('chat.online')}</span>
                                    </span>
                                )}
                            </div>

                            {selectedMessageIds.length > 0 && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-[6px] text-[11px] flex-wrap"
                                >
                                    <span className="font-bold text-theme-link mr-[4px]">
                                        {t('chat.viewer.selected_count', { count: selectedMessageIds.length })}
                                    </span>
                                    <Button
                                        variant="primary"
                                        onClick={() => setForwardModalState({ isOpen: true, messageIds: selectedMessageIds })}
                                    >
                                        {t('chat.viewer.forward_selected')}
                                    </Button>
                                    <Button variant="secondary" onClick={handleBulkImportant}>
                                        {t('chat.viewer.star_selected')}
                                    </Button>
                                    <Button variant="danger" onClick={() => handleBulkDelete(true)}>
                                        {t('chat.viewer.delete_selected')}
                                    </Button>
                                    <Button variant="secondary" onClick={clearSelectedMessages}>
                                        {t('chat.viewer.clear_selection')}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {pinnedMessage && (
                            <div
                                onClick={() => onScrollToMessage?.(pinnedMessage.id)}
                                className="flex items-center justify-between gap-[10px] px-[12px] py-[6px] bg-header-bg border-b border-border cursor-pointer hover:bg-bg-hover transition-colors"
                            >
                                <div className="flex items-center gap-[8px] min-w-0 flex-1">
                                    <span className="text-theme-link">
                                        <PinSvg />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <div className="text-[10px] font-bold text-theme-link">
                                            {t('chat.pinned_message')}{' '}
                                            {pinnedMessage.isMine ? currentUser?.first_name : pinnedMessage.author?.first_name}
                                        </div>
                                        <div className="text-[11px] text-text-main truncate">
                                            <RichText
                                                text={parseRichText(pinnedMessage.text)}
                                                className="post-text [&_p]:inline [&_p]:m-0"
                                                limit={100000}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePin(pinnedMessage.id);
                                    }}
                                    className="text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer flex items-center"
                                >
                                    <CloseSvg size={13} />
                                </button>
                            </div>
                        )}

                        <ChatScrollContainer
                            messagesLength={messages.length}
                            isLoadingMore={isLoadingMore}
                            isLoadingInitial={false}
                            hasMore={hasMoreMessages}
                            onLoadMore={onLoadMore}
                            className="relative flex flex-col h-[460px] overflow-y-auto custom-scrollbar bg-bg-box px-[10px] py-[8px]"
                        >
                            {floatingDateLabel && (
                                <div className="sticky top-[4px] z-10 flex justify-center pointer-events-none mb-[4px]">
                                    <b className="px-[10px] py-[2px] text-[10px] bg-header-bg border border-border text-text-muted shadow-sm">
                                        {floatingDateLabel}
                                    </b>
                                </div>
                            )}

                            {groupedMessageDays.length === 0 ? (
                                <div className="p-[24px] text-center text-[11px] text-text-muted italic">
                                    {t('chat.empty.messages')}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-[6px]">
                                    {groupedMessageDays.map((dayGroup) => (
                                        <div key={dayGroup.dateKey} className="flex flex-col">
                                            <div className="flex justify-center my-[6px]">
                                                <b
                                                    onClick={() => {
                                                        setSelectedDateJump(dayGroup.dateKey);
                                                        setIsDateModalOpen(true);
                                                    }}
                                                    title={t('chat.viewer.select_date_title')}
                                                    className="text-[11px] text-text-muted font-bold cursor-pointer hover:underline"
                                                >
                                                    {dayGroup.label}
                                                </b>
                                            </div>

                                            <div className="flex flex-col">
                                                {dayGroup.items.map((msg) => (
                                                    <MessageItem
                                                        key={msg.id}
                                                        msg={msg}
                                                        myself={currentUser}
                                                        isSelected={selectedMessageIds.includes(msg.id)}
                                                        onToggleSelect={() => toggleSelectMessage(msg.id)}
                                                        onToggleImportant={() => toggleImportantMessage(msg.id)}
                                                        onForward={() => setForwardModalState({ isOpen: true, messageIds: [msg.id] })}
                                                        onReport={() => setReportModalState({ isOpen: true, messageId: msg.id })}
                                                        handleEditClick={handleEditClick}
                                                        handleDelete={handleDelete}
                                                        setReplyingTo={setReplyingTo}
                                                        togglePin={togglePin}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ChatScrollContainer>

                        <div className="flex flex-col border-t border-border bg-header-bg">
                            {canWrite ? (
                                <ChatComposer
                                    {...props}
                                    myself={currentUser}
                                    targetUser={activeChat.is_group ? null : activeChat.target_user}
                                    targetAvatar={activeChat.is_group ? activeChat.avatar : null}
                                />
                            ) : (
                                <div className="p-[16px] text-center text-[11px] text-text-muted italic bg-bg-box">
                                    {cantWriteReason || t('chat.cannot_write')}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsCreateModalOpen(false)}
                    title={t('chat.modals.create_title')}
                    sizeClass="modal-md"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[12px] text-[11px]">
                        <div className="flex gap-[8px] border-b border-border pb-[8px]">
                            <Button
                                variant={createMode === 'dm' ? 'primary' : 'secondary'}
                                onClick={() => setCreateMode('dm')}
                            >
                                {t('chat.modals.mode_dm')}
                            </Button>
                            <Button
                                variant={createMode === 'group' ? 'primary' : 'secondary'}
                                onClick={() => setCreateMode('group')}
                            >
                                {t('chat.modals.mode_group')}
                            </Button>
                        </div>

                        {createMode === 'dm' ? (
                            <div className="flex flex-col gap-[6px]">
                                <label className="font-bold text-text-muted">
                                    {t('chat.modals.select_friend')}
                                </label>
                                <select
                                    value={selectedFriendId}
                                    onChange={(e) => setSelectedFriendId(e.target.value)}
                                    className="p-[6px] bg-bg-box border border-border text-text-main outline-none"
                                >
                                    {friendsList.map(f => (
                                        <option key={f.id} value={f.id}>
                                            {f.first_name} {f.last_name} (@{f.username})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-[10px]">
                                <div>
                                    <div className="font-bold text-text-muted mb-[4px]">
                                        {t('chat.info_modal.group_title')}
                                    </div>
                                    <div className="border border-border bg-bg-box">
                                        <SmartEditor
                                            className="min-h-[38px] p-[6px] text-[12px] outline-none"
                                            value={newGroupTitle}
                                            onChange={setNewGroupTitle}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="font-bold text-text-muted mb-[4px]">
                                        {t('chat.info_modal.group_desc')}
                                    </div>
                                    <div className="border border-border bg-bg-box">
                                        <SmartEditor
                                            className="min-h-[54px] p-[6px] text-[12px] outline-none"
                                            value={newGroupDesc}
                                            onChange={setNewGroupDesc}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="font-bold text-text-muted mb-[4px]">
                                        {t('chat.info_modal.participants')}
                                    </div>
                                    <div className="flex flex-col gap-[4px] max-h-[140px] overflow-y-auto p-[6px] border border-border bg-bg-page">
                                        {friendsList.map(friend => {
                                            const checked = newGroupMembers.includes(friend.id);
                                            return (
                                                <label key={friend.id} className="flex items-center gap-[8px] cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => {
                                                            setNewGroupMembers(prev =>
                                                                checked
                                                                    ? prev.filter(id => id !== friend.id)
                                                                    : [...prev, friend.id]
                                                            );
                                                        }}
                                                    />
                                                    <span>{friend.first_name} {friend.last_name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-[8px] mt-[8px]">
                            <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button variant="primary" onClick={submitCreateChat}>
                                {t('chat.actions.new_chat')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {forwardModalState.isOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setForwardModalState({ isOpen: false, messageIds: [] })}
                    title={t('chat.modals.forward_title')}
                    sizeClass="modal-md"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[10px] text-[11px]">
                        <input
                            type="text"
                            value={forwardComment}
                            onChange={(e) => setForwardComment(e.target.value)}
                            placeholder={t('chat.modals.forward_comment_placeholder')}
                            className="w-full p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        />
                        <div className="flex flex-col divide-y divide-border border border-border max-h-[240px] overflow-y-auto">
                            {allChats.map(target => (
                                <div
                                    key={target.id}
                                    onClick={() => {
                                        handleForwardMessages(target.id, forwardModalState.messageIds, forwardComment);
                                        setForwardModalState({ isOpen: false, messageIds: [] });
                                        setForwardComment('');
                                    }}
                                    className="flex items-center justify-between p-[8px_10px] hover:bg-bg-hover cursor-pointer"
                                >
                                    <div className="font-bold text-theme-link">
                                        {renderChatTitle(target)}
                                    </div>
                                    <span className="text-text-muted">
                                        <ArrowRightSvg />
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {isDateModalOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setIsDateModalOpen(false)}
                    title={t('chat.viewer.select_date_title')}
                    sizeClass="modal-sm"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[10px] text-[11px]">
                        <input
                            type="date"
                            value={selectedDateJump}
                            onChange={(e) => setSelectedDateJump(e.target.value)}
                            className="p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        />
                        <div className="flex justify-end gap-[8px]">
                            <Button variant="secondary" onClick={() => setIsDateModalOpen(false)}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button variant="primary" onClick={handleJumpToDate}>
                                {t('chat.modals.jump_to_date')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            {reportModalState.isOpen && (
                <Modal
                    isOpen={true}
                    onClose={() => setReportModalState({ isOpen: false, messageId: null })}
                    title={t('chat.modals.report_title')}
                    sizeClass="modal-sm"
                    bodyClassName="p-[15px]"
                >
                    <div className="flex flex-col gap-[10px] text-[11px]">
                        <textarea
                            rows={3}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            placeholder={t('chat.modals.report_placeholder')}
                            className="w-full p-[6px] bg-bg-box border border-border text-text-main outline-none"
                        />
                        <div className="flex justify-end gap-[8px]">
                            <Button variant="secondary" onClick={() => setReportModalState({ isOpen: false, messageId: null })}>
                                {t('chat.actions.cancel')}
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => {
                                    handleReportMessage(reportModalState.messageId, reportReason);
                                    setReportModalState({ isOpen: false, messageId: null });
                                    setReportReason('');
                                }}
                            >
                                {t('chat.modals.submit_report')}
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}