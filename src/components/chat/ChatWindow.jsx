import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import ChatScrollContainer from '../common/ChatScrollContainer.jsx';
import MessageItem from './MessageItem';
import ChatComposer from './ChatComposer';
import ChatWindowHeader from './components/window/ChatWindowHeader.jsx';
import ChatSearchBar from './components/window/ChatSearchBar.jsx';
import PinnedMessageBanner from './components/window/PinnedMessageBanner.jsx';
import { useLocalMessageSearch } from './hooks/useLocalMessageSearch.js';
import { groupMessagesByDay } from './utils/messageGrouper.js';

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
        getTypingText,
        onStartForward,
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

    const groupedMessageDays = useMemo(
        () => groupMessagesByDay(filteredMessages, currentUser, activeChat, i18n.language || 'uk-UA'),
        [filteredMessages, currentUser, activeChat, i18n.language]
    );

    const floatingDateLabel = groupedMessageDays.length > 0
        ? groupedMessageDays[groupedMessageDays.length - 1].label
        : '';

    const canDeleteSelected = useMemo(() => {
        if (selectedMessageUuids.length === 0) return false;
        const selectedMsgs = messages.filter(m => selectedMessageUuids.includes(m.uuid));
        return selectedMsgs.length > 0 && selectedMsgs.every(m => Boolean(m.can_delete));
    }, [messages, selectedMessageUuids]);

    const canSendAsGroup = Boolean(
        activeChat.is_group && (
            activeChat.owner_username === currentUser?.username ||
            activeChat.participants?.some(p => p.user.username === currentUser?.username && (p.role === 'owner' || p.role === 'admin'))
        )
    );

    const handleToggleItemSelect = useCallback((itemUuids, currentlySelected) => {
        if (itemUuids.length === 1) {
            toggleSelectMessage(itemUuids[0]);
            return;
        }
        if (currentlySelected) {
            itemUuids.forEach(u => {
                if (selectedMessageUuids.includes(u)) toggleSelectMessage(u);
            });
        } else {
            itemUuids.forEach(u => {
                if (!selectedMessageUuids.includes(u)) toggleSelectMessage(u);
            });
        }
    }, [selectedMessageUuids, toggleSelectMessage]);

    const handleToggleBundleImportant = useCallback((itemUuids) => {
        itemUuids.forEach(u => toggleImportantMessage(u));
    }, [toggleImportantMessage]);

    const handleDeleteBundle = useCallback((itemUuids) => {
        itemUuids.forEach(u => handleDelete(u));
    }, [handleDelete]);

    return (
        <div className="im_page page-other flex flex-col flex-1 min-h-0">
            <ChatWindowHeader
                activeChat={activeChat}
                typingLabel={typingLabel}
                selectedMessageUuids={selectedMessageUuids}
                canDeleteSelected={canDeleteSelected}
                onOpenInfo={onOpenInfo}
                onStartForward={onStartForward}
                handleBulkImportant={handleBulkImportant}
                handleBulkDelete={handleBulkDelete}
                clearSelectedMessages={clearSelectedMessages}
                toggleSearch={toggleSearch}
            />

            <ChatSearchBar
                isOpen={isSearchOpen}
                query={messageSearchQuery}
                onChange={setMessageSearchQuery}
                onClose={toggleSearch}
            />

            <PinnedMessageBanner
                pinnedMessage={pinnedMessage}
                activeChat={activeChat}
                currentUser={currentUser}
                onScrollToMessage={onScrollToMessage}
                onUnpin={togglePin}
            />

            <ChatScrollContainer
                messagesLength={messages.length}
                isLoadingMore={isLoadingMore}
                isLoadingInitial={false}
                hasMore={hasMoreMessages}
                onLoadMore={onLoadMore}
                className="relative flex flex-col flex-1 min-h-[460px] max-h-[calc(100vh-225px)] overflow-y-auto custom-scrollbar bg-bg-box px-[10px] py-[8px]"
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
                            t('chat.empty.search_no_results')
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
                                    {dayGroup.items.map((msg) => {
                                        const itemUuids = msg.bundleUuids || [msg.uuid];
                                        const isItemSelected = itemUuids.every(u => selectedMessageUuids.includes(u));
                                        return (
                                            <MessageItem
                                                key={msg.uuid}
                                                msg={msg}
                                                myself={currentUser}
                                                activeChat={activeChat}
                                                isSelected={isItemSelected}
                                                onToggleSelect={handleToggleItemSelect}
                                                onToggleImportant={handleToggleBundleImportant}
                                                onForward={onStartForward}
                                                onReport={onOpenReportModal}
                                                handleEditClick={handleEditClick}
                                                handleDelete={handleDeleteBundle}
                                                setReplyingTo={setReplyingTo}
                                                togglePin={togglePin}
                                            />
                                        );
                                    })}
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