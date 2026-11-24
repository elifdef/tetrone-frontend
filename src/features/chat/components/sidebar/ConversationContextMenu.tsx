import { useTranslation } from 'react-i18next';
import { DotsSvg } from '@ui/Icons.jsx';
import type { ChatData } from '@/types/chat';

export type ChatMuteDuration = '1h' | '8h' | 'forever' | null;

export interface ConversationContextMenuProps {
    chat: ChatData;
    isOpen: boolean;
    onToggleMenu: () => void;
    onCloseMenu: () => void;
    onTogglePinChat: (slug: string) => void;
    onMarkChatUnread: (slug: string) => void;
    onMuteChat: (slug: string, duration: ChatMuteDuration) => void;
    onClearChatHistory: (slug: string) => void;
    onDeleteChat: (slug: string, deleteForBoth?: boolean) => void;
}

export default function ConversationContextMenu({
    chat,
    isOpen,
    onToggleMenu,
    onCloseMenu,
    onTogglePinChat,
    onMarkChatUnread,
    onMuteChat,
    onClearChatHistory,
    onDeleteChat,
}: ConversationContextMenuProps) {
    const { t } = useTranslation();

    const handleAction = (fn: () => void) => {
        fn();
        onCloseMenu();
    };

    return (
        <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
                type="button"
                onClick={onToggleMenu}
                className="p-[4px] text-text-muted hover:text-theme-link bg-transparent border border-transparent hover:border-border cursor-pointer flex items-center justify-center"
            >
                <DotsSvg />
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-[2px] w-[195px] bg-bg-box border border-border shadow-md z-30 flex flex-col divide-y divide-border text-[11px]">
                    {!chat.is_saved && (
                        <>
                            <button
                                type="button"
                                onClick={() => handleAction(() => onTogglePinChat(chat.slug))}
                                className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                            >
                                {chat.is_pinned ? t('chat.menu.unpin_chat') : t('chat.menu.pin_chat')}
                            </button>

                            <button
                                type="button"
                                onClick={() => handleAction(() => onMarkChatUnread(chat.slug))}
                                className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                            >
                                {t('chat.menu.mark_unread')}
                            </button>

                            {chat.muted_until ? (
                                <button
                                    type="button"
                                    onClick={() => handleAction(() => onMuteChat(chat.slug, null))}
                                    className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                >
                                    {t('chat.menu.unmute')}
                                </button>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => handleAction(() => onMuteChat(chat.slug, '1h'))}
                                        className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        {t('chat.menu.mute_1h')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAction(() => onMuteChat(chat.slug, '8h'))}
                                        className="px-[10px] py-[6px] text-left text-theme-link hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                                    >
                                        {t('chat.menu.mute_8h')}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleAction(() => onMuteChat(chat.slug, 'forever'))}
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
                        onClick={() => handleAction(() => onClearChatHistory(chat.slug))}
                        className="px-[10px] py-[6px] text-left text-theme-error hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                    >
                        {t('chat.menu.clear_history')}
                    </button>

                    {!chat.is_saved && (
                        <button
                            type="button"
                            onClick={() => handleAction(() => onDeleteChat(chat.slug, false))}
                            className="px-[10px] py-[6px] text-left text-theme-error font-bold hover:bg-bg-hover bg-transparent border-none cursor-pointer"
                        >
                            {t('chat.menu.delete_chat')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}