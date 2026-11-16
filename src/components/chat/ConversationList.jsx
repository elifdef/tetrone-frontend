import { useTranslation } from 'react-i18next';
import { useSocket } from '@context/SocketContext';
import Button from '@ui/Button';
import ConversationItem from './components/sidebar/ConversationItem.jsx';

export default function ConversationList({
    currentUser,
    chats,
    draftsMap,
    draftFilesMap,
    searchQuery,
    setSearchQuery,
    openMenuChatSlug,
    setOpenMenuChatSlug,
    pendingForward,
    onCancelForward,
    onSelectChat,
    onMarkAllAsRead,
    onOpenCreateModal,
    onTogglePinChat,
    onMarkChatUnread,
    onMuteChat,
    onClearChatHistory,
    onDeleteChat,
    getTypingText
}) {
    const { t } = useTranslation();
    const { onlineUsers = [] } = useSocket() || {};

    return (
        <div className="im_page page-conversations flex flex-col flex-1">
            {pendingForward?.messageUuids?.length > 0 && (
                <div className="flex items-center justify-between px-[12px] py-[8px] bg-theme-link/10 border-b border-border text-[11px]">
                    <span className="font-bold text-theme-link">
                        {t('chat.modals.forward_title')} ({pendingForward.messageUuids.length})
                    </span>
                    <Button variant="secondary" onClick={onCancelForward}>
                        {t('chat.actions.cancel')}
                    </Button>
                </div>
            )}

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
            <div className="flex flex-col divide-y divide-border flex-1">
                {chats.map((chat) => {
                    const isOnline = Boolean(
                        !chat.is_saved &&
                        !chat.is_group &&
                        chat.target_user?.username &&
                        onlineUsers.includes(chat.target_user.username)
                    );

                    return (
                        <ConversationItem
                            key={chat.slug}
                            chat={chat}
                            currentUser={currentUser}
                            isOnline={isOnline}
                            draftDoc={draftsMap[chat.slug]}
                            draftFiles={draftFilesMap[chat.slug] || []}
                            typingText={getTypingText(chat)}
                            isMenuOpen={openMenuChatSlug === chat.slug}
                            onToggleMenu={() => setOpenMenuChatSlug(prev => (prev === chat.slug ? null : chat.slug))}
                            onCloseMenu={() => setOpenMenuChatSlug(null)}
                            onSelectChat={onSelectChat}
                            onTogglePinChat={onTogglePinChat}
                            onMarkChatUnread={onMarkChatUnread}
                            onMuteChat={onMuteChat}
                            onClearChatHistory={onClearChatHistory}
                            onDeleteChat={onDeleteChat}
                        />
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