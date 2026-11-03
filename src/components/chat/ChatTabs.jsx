import { useTranslation } from 'react-i18next';
import { getPlainText, hasRichContent } from './utils/messageParser.js';

export default function ChatTabs({
    openedChats = [],
    activeChat,
    draftsMap = {},
    draftFilesMap = {},
    onSelectChat,
    onCloseChatTab,
    onBackToInbox,
    onOpenInfo
}) {
    const { t } = useTranslation();

    const getChatPlainShortTitle = (chat) => {
        if (!chat) return '';
        if (chat.is_saved) return t('chat.saved_messages');
        if (chat.is_group) return getPlainText(chat.title);
        if (chat.target_user?.is_deleted) return t('chat.deleted_user');
        return chat.target_user?.first_name || chat.target_user?.username || '';
    };

    return (
        <div className="flex justify-between items-end px-[12px] pt-[8px] border-b border-border bg-header-bg gap-[10px] flex-wrap">
            <div className="flex items-center gap-[4px] flex-wrap">
                <button
                    type="button"
                    onClick={onBackToInbox}
                    className={`px-[12px] py-[6px] text-[11px] font-bold cursor-pointer border-b-[2px] transition-colors ${
                        !activeChat
                            ? 'text-theme-link border-theme-link bg-bg-box'
                            : 'text-theme-link border-border bg-bg-box hover:bg-bg-hover'
                    }`}
                >
                    {t('chat.tabs.conversations')}
                </button>

                {openedChats.map((chatTab) => {
                    const isSelected = activeChat?.slug === chatTab.slug;
                    const hasDraft = hasRichContent(draftsMap[chatTab.slug]) || (draftFilesMap[chatTab.slug]?.length > 0);

                    return (
                        <div
                            key={chatTab.slug}
                            onClick={() => onSelectChat(chatTab.slug)}
                            className={`flex items-center gap-[6px] px-[10px] py-[5px] text-[11px] font-bold cursor-pointer border-b-[2px] transition-colors bg-bg-box text-theme-link ${
                                isSelected
                                    ? 'border-theme-link'
                                    : 'border-border hover:bg-bg-hover'
                            }`}
                        >
                            <span className="max-w-[130px] truncate">
                                {getChatPlainShortTitle(chatTab)}
                            </span>

                            {hasDraft && (
                                <span className="text-[9px] italic text-theme-error">
                                    ({t('chat.draft_badge')})
                                </span>
                            )}

                            {chatTab.unread_count > 0 && (
                                <span className="text-[10px] text-theme-link">
                                    {t('chat.plus_count', { count: chatTab.unread_count })}
                                </span>
                            )}

                            <button
                                type="button"
                                title={t('chat.tabs.close_tab')}
                                onClick={(e) => onCloseChatTab(e, chatTab.slug)}
                                className="ml-[2px] flex items-center justify-center cursor-pointer bg-transparent border-none p-0 text-text-muted hover:text-theme-error"
                            >
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                                    <line x1="18" y1="6" x2="6" y2="18"></line>
                                    <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
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
    );
}