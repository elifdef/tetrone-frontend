import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';
import RichText from '../common/RichText.jsx';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import ChatModals from './ChatModals';
import { getPlainText, parseRichText, hasRichContent } from './utils/messageParser.js';
import { CloseSvg } from '../ui/Icons.jsx';

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
        handleForwardMessages,
        handleReportMessage,
        onOpenInfo,
        onScrollToMessage
    } = props;

    const { t } = useTranslation();

    const [openMenuChatSlug, setOpenMenuChatSlug] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [forwardModalState, setForwardModalState] = useState({ isOpen: false, messageUuids: [] });
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedDateJump, setSelectedDateJump] = useState('');
    const [reportModalState, setReportModalState] = useState({ isOpen: false, messageUuid: null });

    const renderChatTitle = (chat, className = '') => {
        if (!chat) return null;
        if (chat.is_saved) {
            return <span className={className}>{t('chat.saved_messages')}</span>;
        }
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
        return <span className={className}>{fullName || chat.target_user?.username}</span>;
    };

    const getChatPlainShortTitle = (chat) => {
        if (!chat) return '';
        if (chat.is_saved) return t('chat.saved_messages');
        if (chat.is_group) return getPlainText(chat.title);
        if (chat.target_user?.is_deleted) return t('chat.deleted_user');
        return chat.target_user?.first_name || chat.target_user?.username || '';
    };

    const getTypingText = (chat, forceTyping = false) => {
        if (!chat) return '';
        let typers = Array.isArray(chat.typing_users) ? [...chat.typing_users] : [];

        if (typers.length === 0 && (chat.is_typing || forceTyping)) {
            if (!chat.is_group && chat.target_user) {
                typers = [chat.target_user];
            } else if (chat.is_group && chat.participants?.length > 0) {
                const other = chat.participants.find(p => p.user.username !== currentUser?.username)?.user;
                if (other) typers = [other];
            }
        }

        if (typers.length === 0) return '';
        if (!chat.is_group) return t('chat.typing');

        if (typers.length === 1) {
            return t('chat.typing_one', { user: typers[0].first_name });
        }
        if (typers.length === 2) {
            return t('chat.typing_two', { user1: typers[0].first_name, user2: typers[1].first_name });
        }
        return t('chat.typing_many', { user: typers[0].first_name, count: typers.length - 1 });
    };

    const handleJumpToDate = () => {
        if (!selectedDateJump) return;
        const targetMsg = messages.find(m => m.created_at.startsWith(selectedDateJump));
        if (targetMsg) {
            onScrollToMessage?.(targetMsg.uuid);
        }
        setIsDateModalOpen(false);
    };

    return (
        <div
            id="im_container"
            onClick={() => setOpenMenuChatSlug(null)}
            className="bg-bg-box border border-border flex flex-col font-sans text-text-main w-full"
        >
            {/* ВЕРХНІЙ БАНЕР ТА ПАНЕЛЬ ВКЛАДОК */}
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
                                className={`px-[12px] py-[6px] text-[11px] font-bold cursor-pointer border-b-[2px] transition-colors ${
                                    !activeChat
                                        ? 'text-theme-link border-theme-link bg-bg-box'
                                        : 'text-text-muted border-transparent hover:text-theme-link hover:bg-bg-hover'
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
                                        onClick={() => handleSelectChat(chatTab.slug)}
                                        className={`flex items-center gap-[6px] px-[10px] py-[5px] text-[11px] font-bold cursor-pointer border-b-[2px] transition-colors ${
                                            isSelected
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
                                        {chatTab.unread_count > 0 && (
                                            <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                                                {t('chat.plus_count', { count: chatTab.unread_count })}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            title={t('chat.tabs.close_tab')}
                                            onClick={(e) => handleCloseChatTab(e, chatTab.slug)}
                                            className={`ml-[2px] flex items-center justify-center cursor-pointer bg-transparent border-none p-0 ${
                                                isSelected ? 'text-white hover:opacity-75' : 'text-text-muted hover:text-theme-error'
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

            {/* КОНТЕЙНЕР СПИСКУ АБО АКТИВНОГО ЧАТУ */}
            <div id="im_page_containers">
                {!activeChat ? (
                    <ConversationList
                        currentUser={currentUser}
                        chats={chats}
                        draftsMap={draftsMap}
                        draftFilesMap={draftFilesMap}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        openMenuChatSlug={openMenuChatSlug}
                        setOpenMenuChatSlug={setOpenMenuChatSlug}
                        onSelectChat={handleSelectChat}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        onTogglePinChat={handleTogglePinChat}
                        onMarkChatUnread={handleMarkChatUnread}
                        onMuteChat={handleMuteChat}
                        onClearChatHistory={handleClearChatHistory}
                        onDeleteChat={handleDeleteChat}
                        renderChatTitle={renderChatTitle}
                        getTypingText={getTypingText}
                    />
                ) : (
                    <ChatWindow
                        {...props}
                        renderChatTitle={renderChatTitle}
                        getTypingText={getTypingText}
                        onOpenForwardModal={(uuids) => setForwardModalState({ isOpen: true, messageUuids: uuids })}
                        onOpenDateModal={(dateKey) => {
                            setSelectedDateJump(dateKey);
                            setIsDateModalOpen(true);
                        }}
                        onOpenReportModal={(uuid) => setReportModalState({ isOpen: true, messageUuid: uuid })}
                    />
                )}
            </div>

            <ChatModals
                friendsList={friendsList}
                allChats={allChats}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                handleCreateNewChat={handleCreateNewChat}
                forwardModalState={forwardModalState}
                setForwardModalState={setForwardModalState}
                handleForwardMessages={handleForwardMessages}
                isDateModalOpen={isDateModalOpen}
                setIsDateModalOpen={setIsDateModalOpen}
                selectedDateJump={selectedDateJump}
                setSelectedDateJump={setSelectedDateJump}
                onJumpToDate={handleJumpToDate}
                reportModalState={reportModalState}
                setReportModalState={setReportModalState}
                handleReportMessage={handleReportMessage}
                renderChatTitle={renderChatTitle}
            />
        </div>
    );
}