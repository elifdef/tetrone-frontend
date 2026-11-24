import { useTranslation } from 'react-i18next';
import { useSocket } from '@context/SocketContext';
import { useDateFormatter } from '@hooks/useDateFormatter';
import Avatar from '@ui/Avatar';
import Button from '@ui/Button';
import ChatTitle from '../common/ChatTitle';
import { PencilTypingIcon, SavedMessagesIcon } from '@ui/Icons.jsx';
import type { ChatData } from '@/types/chat';

export interface ChatWindowHeaderProps {
    activeChat: ChatData;
    typingLabel?: string;
    selectedMessageUuids: string[];
    canDeleteSelected: boolean;
    onOpenInfo?: () => void;
    onStartForward: (uuids: string[]) => void;
    handleBulkImportant: () => void;
    handleBulkDelete: (deleteForBoth?: boolean) => void;
    clearSelectedMessages: () => void;
    toggleSearch: () => void;
}

export default function ChatWindowHeader({
    activeChat,
    typingLabel,
    selectedMessageUuids,
    canDeleteSelected,
    onOpenInfo,
    onStartForward,
    handleBulkImportant,
    handleBulkDelete,
    clearSelectedMessages,
    toggleSearch,
}: ChatWindowHeaderProps) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const socket = useSocket() as { onlineUsers?: string[] } | null;
    const onlineUsers = socket?.onlineUsers ?? [];

    const getLastSeenText = () => {
        if (!activeChat.target_user?.last_seen) {
            return t('chat.offline');
        }
        const formattedTime = formatDate(activeChat.target_user.last_seen);
        const genderKey = activeChat.target_user.gender === 2 ? 'chat.was_online_female' : 'chat.was_online_male';
        return t(genderKey, { time: formattedTime });
    };

    const isTargetOnline = Boolean(
        !activeChat.is_saved &&
        !activeChat.is_group &&
        activeChat.target_user?.username &&
        onlineUsers.includes(activeChat.target_user.username)
    );

    return (
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
                    <ChatTitle chat={activeChat} />
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
                    ) : isTargetOnline ? (
                        <span className="text-[10px] text-text-muted flex items-center gap-[4px]">
                            <span className="inline-block w-[6px] h-[6px] bg-theme-success" />
                            <span>{t('chat.online')}</span>
                        </span>
                    ) : (
                        <span className="text-[10px] text-text-muted flex items-center gap-[4px]">
                            <span className="inline-block w-[6px] h-[6px] bg-border" />
                            <span>{getLastSeenText()}</span>
                        </span>
                    )
                )}
            </div>

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
                            onClick={() => onStartForward(selectedMessageUuids)}
                        >
                            {t('chat.viewer.forward_selected')}
                        </Button>
                        <Button variant="secondary" onClick={handleBulkImportant}>
                            {t('chat.viewer.star_selected')}
                        </Button>
                        {canDeleteSelected && (
                            <Button variant="danger" onClick={() => handleBulkDelete(true)}>
                                {t('chat.viewer.delete_selected')}
                            </Button>
                        )}
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
    );
}