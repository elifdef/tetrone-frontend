import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import RichText from '../common/RichText.jsx';
import ChatScrollContainer from '../common/ChatScrollContainer.jsx';
import MessageItem from './MessageItem';
import ChatComposer from './ChatComposer';
import { useLocalMessageSearch } from './hooks/useLocalMessageSearch.js';
import { parseRichText, getPlainText } from './utils/messageParser.js';
import {PinSvg, CloseSvg, PencilTypingIcon, SavedMessagesIcon} from '../ui/Icons.jsx';

export default function ChatWindow(props) {
    const {
        currentUser,
        activeChat,
        messages,
        selectedMessageUuids,
        toggleSelectMessage,
        clearSelectedMessages,
        toggleImportantMessage,
        handleBulkImportant,
        handleBulkDelete,
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
        onScrollToMessage,
        renderChatTitle,
        getTypingText,
        onOpenForwardModal,
        onOpenDateModal,
        onOpenReportModal
    } = props;

    const {
        isSearchOpen,
        toggleSearch,
        messageSearchQuery,
        setMessageSearchQuery,
        filteredMessages
    } = useLocalMessageSearch(messages);

    const { t, i18n } = useTranslation();

    const pinnedMessage = useMemo(() => messages.find(m => m.is_pinned), [messages]);
    const typingLabel = getTypingText(activeChat, isTyping);

    const groupedMessageDays = useMemo(() => {
        const groups = [];
        filteredMessages.forEach((msg) => {
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
            const prevAuthorKey = prevMsg
                ? (prevMsg.author_type === 'group' ? `group_${activeChat?.slug}` : (prevMsg.isMine ? currentUser?.username : prevMsg.author?.username))
                : null;
            const currAuthorKey = msg.author_type === 'group'
                ? `group_${activeChat?.slug}`
                : (msg.isMine ? currentUser?.username : msg.author?.username);

            const isSameAuthor = Boolean(
                prevMsg &&
                prevAuthorKey === currAuthorKey &&
                !msg.reply_to &&
                !msg.shared_post
            );

            currentGroup.items.push({ ...msg, isSameAuthor });
        });
        return groups;
    }, [filteredMessages, currentUser, activeChat, i18n.language]);

    const floatingDateLabel = groupedMessageDays.length > 0
        ? groupedMessageDays[groupedMessageDays.length - 1].label
        : '';

    const canSendAsGroup = Boolean(
        activeChat.is_group && (
            activeChat.owner_username === currentUser?.username ||
            activeChat.participants?.some(p => p.user.username === currentUser?.username && (p.role === 'owner' || p.role === 'admin'))
        )
    );

    return (
        <div className="im_page page-other flex flex-col">
            {/* Шапка відкритого чату */}
            <div
                onClick={onOpenInfo}
                className="flex items-center justify-between px-[12px] py-[8px] bg-bg-page border-b border-border cursor-pointer hover:bg-bg-hover transition-colors"
            >
                <div className="flex items-center gap-[8px]">
                    {activeChat.is_saved ? (
                        <div className="w-[22px] h-[22px] bg-theme-link/15 border border-theme-link/40 flex items-center justify-center text-theme-link">
                            <SavedMessagesIcon size={14} />
                        </div>
                    ) : activeChat.is_group && activeChat.avatar ? (
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
                    {!activeChat.is_saved && (
                        typingLabel ? (
                            <span className="inline-flex items-center gap-[4px] text-[10px] text-theme-link font-bold">
                                <PencilTypingIcon />
                                <span>{typingLabel}</span>
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
                        )
                    )}
                </div>

                {/* Права частина шапки: або масові дії над виділеними, або кнопка пошуку */}
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-[6px] text-[11px]"
                >
                    {selectedMessageUuids.length > 0 ? (
                        <div className="flex items-center gap-[6px] flex-wrap">
                            <span className="font-bold text-theme-link mr-[4px]">
                                {t('chat.viewer.selected_count', { count: selectedMessageUuids.length })}
                            </span>
                            <Button
                                variant="primary"
                                onClick={() => onOpenForwardModal(selectedMessageUuids)}
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
                    ) : (
                        <button
                            type="button"
                            onClick={toggleSearch}
                            className="text-[11px] text-theme-link hover:underline bg-transparent border-none cursor-pointer"
                        >
                            {t('chat.actions.search_placeholder')}
                        </button>
                    )}
                </div>
            </div>

            {/* Випадаюче поле локального пошуку повідомлень */}
            {isSearchOpen && (
                <div className="flex items-center gap-[6px] px-[12px] py-[6px] bg-header-bg border-b border-border">
                    <input
                        type="text"
                        autoFocus
                        value={messageSearchQuery}
                        onChange={(e) => setMessageSearchQuery(e.target.value)}
                        placeholder={t('chat.actions.search_placeholder')}
                        className="flex-1 px-[8px] py-[4px] text-[11px] bg-bg-box text-text-main border border-border outline-none focus:border-theme-link"
                    />
                    <Button variant="secondary" onClick={toggleSearch}>
                        <CloseSvg size={11} />
                    </Button>
                </div>
            )}

            {/* Закріплене повідомлення */}
            {pinnedMessage && (
                <div
                    onClick={() => onScrollToMessage?.(pinnedMessage.uuid)}
                    className="flex items-center justify-between gap-[10px] px-[12px] py-[6px] bg-header-bg border-b border-border cursor-pointer hover:bg-bg-hover transition-colors"
                >
                    <div className="flex items-center gap-[8px] min-w-0 flex-1">
                        <span className="text-theme-link">
                            <PinSvg />
                        </span>
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-bold text-theme-link">
                                {t('chat.pinned_message')}{' '}
                                {pinnedMessage.author_type === 'group'
                                    ? getPlainText(activeChat.title)
                                    : pinnedMessage.isMine
                                        ? currentUser?.first_name
                                        : pinnedMessage.author?.first_name}
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
                            togglePin(pinnedMessage.uuid);
                        }}
                        className="text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer flex items-center"
                    >
                        <CloseSvg size={13} />
                    </button>
                </div>
            )}

            {/* Історія повідомлень */}
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
                        {isSearchOpen && messageSearchQuery ? (
                            t('chat.empty.search_no_results', 'Повідомлень не знайдено')
                        ) : activeChat?.is_saved ? (
                            t('chat.saved_meme')
                        ) : (
                            t('chat.empty.messages')
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-[6px]">
                        {groupedMessageDays.map((dayGroup) => (
                            <div key={dayGroup.dateKey} className="flex flex-col">
                                <div className="flex justify-center my-[6px]">
                                    <b
                                        onClick={() => onOpenDateModal(dayGroup.dateKey)}
                                        title={t('chat.viewer.select_date_title')}
                                        className="text-[11px] text-text-muted font-bold cursor-pointer hover:underline"
                                    >
                                        {dayGroup.label}
                                    </b>
                                </div>

                                <div className="flex flex-col">
                                    {dayGroup.items.map((msg) => (
                                        <MessageItem
                                            key={msg.uuid}
                                            msg={msg}
                                            myself={currentUser}
                                            activeChat={activeChat}
                                            isSelected={selectedMessageUuids.includes(msg.uuid)}
                                            onToggleSelect={() => toggleSelectMessage(msg.uuid)}
                                            onToggleImportant={() => toggleImportantMessage(msg.uuid)}
                                            onForward={() => onOpenForwardModal([msg.uuid])}
                                            onReport={() => onOpenReportModal(msg.uuid)}
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

            {/* Нижня панель вводу */}
            <div className="flex flex-col border-t border-border bg-header-bg">
                {canWrite ? (
                    <ChatComposer
                        {...props}
                        myself={currentUser}
                        activeChat={activeChat}
                        canSendAsGroup={canSendAsGroup}
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
    );
}