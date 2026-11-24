import type { Dispatch, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@context/SocketContext';
import Button from '@ui/Button';
import ConversationItem from './sidebar/ConversationItem';
import type { ChatMuteDuration } from './sidebar/ConversationContextMenu';
import type { PendingForwardState } from './composer/ComposerReplyEditBanner';
import type { ChatAttachmentPreview, ChatData } from '@/types/chat';
import type { TipTapDoc } from '@/types/tiptap';
import type { UserData } from '@/types/user';

export interface ConversationListProps {
    currentUser: UserData | null | undefined;
    chats: ChatData[];
    draftsMap: Record<string, TipTapDoc | string | null>;
    draftFilesMap: Record<string, ChatAttachmentPreview[]>;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    openMenuChatSlug: string | null;
    setOpenMenuChatSlug: Dispatch<SetStateAction<string | null>>;
    pendingForward?: PendingForwardState | null;
    onCancelForward: () => void;
    onSelectChat: (slug: string) => void;
    onMarkAllAsRead: () => void;
    onOpenCreateModal: () => void;
    onTogglePinChat: (slug: string) => void;
    onMarkChatUnread: (slug: string) => void;
    onMuteChat: (slug: string, duration: ChatMuteDuration) => void;
    onClearChatHistory: (slug: string) => void;
    onDeleteChat: (slug: string, deleteForBoth?: boolean) => void;
    getTypingText: (chat: ChatData, forceTyping?: boolean) => string;
}

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
    getTypingText,
}: ConversationListProps) {
    const { t } = useTranslation();
    const socket = useSocket() as { onlineUsers?: string[] } | null;
    const onlineUsers = socket?.onlineUsers ?? [];

    return (
        <div className="im_page page-conversations flex flex-col flex-1">
            {pendingForward?.messageUuids && pendingForward.messageUuids.length > 0 && (
                <div className="flex items-center justify-between px-[12px] py-[8px] bg-theme-link/10 border-b border-border text-[11px]">
                    <span className="font-bold text-theme-link">
                        {t('chat.modals.forward_title')} ({pendingForward.messageUuids.length})
                    </span>
                    <Button variant="secondary" onClick={onCancelForward}>
                        {t('chat.actions.cancel')}
                    </Button>
                </div>
            )}

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
                    {t('chat.actions.create_group')}
                </Button>
            </div>

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
                            onToggleMenu={() => setOpenMenuChatSlug((prev) => (prev === chat.slug ? null : chat.slug))}
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
                    {t('chat.bottom.conversations_count', { count: chats.filter((c) => !c.is_saved).length })}
                </div>
            </div>
        </div>
    );
}