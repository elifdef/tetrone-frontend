import { useState } from 'react';
import type { Dispatch, MouseEvent, SetStateAction } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '@ui/Button';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import type { ChatWindowProps } from './ChatWindow';
import ChatModals from './ChatModals';
import type { ReportModalState } from './ChatModals';
import type { CreateGroupChatPayload } from './modals/CreateChatModal';
import ChatTabs from './ChatTabs';
import { getTypingText } from './utils/chatHelpers';
import type { ChatMuteDuration } from './sidebar/ConversationContextMenu';
import type { PendingForwardState } from './composer/ComposerReplyEditBanner';
import type { TipTapDoc } from '@/types/tiptap';
import type { UserData } from '@/types/user';
import type { ChatAttachmentPreview, ChatData, ChatMessageItem } from '@/types/chat';


export interface ChatLayoutProps extends Omit<ChatWindowProps, 'activeChat' | 'getTypingText' | 'onOpenDateModal' | 'onOpenReportModal' | 'onStartForward'> {
    currentUser: UserData | null | undefined;
    friendsList?: UserData[];
    chats: ChatData[];
    allChats?: ChatData[];
    openedChats: ChatData[];
    draftsMap?: Record<string, TipTapDoc | string | null>;
    draftFilesMap?: Record<string, ChatAttachmentPreview[]>;
    messages: ChatMessageItem[];
    activeChat: ChatData | null;
    searchQuery: string;
    setSearchQuery: Dispatch<SetStateAction<string>>;
    isBannerVisible: boolean;
    handleDismissBanner: () => void;
    handleSelectChat: (slug: string) => void;
    handleBackToInbox: () => void;
    handleCloseChatTab: (e: MouseEvent<HTMLButtonElement>, slug: string) => void;
    handleMarkAllAsRead: () => void;
    handleTogglePinChat: (slug: string) => void;
    handleMarkChatUnread: (slug: string) => void;
    handleMuteChat: (slug: string, duration: ChatMuteDuration) => void;
    handleClearChatHistory: (slug: string) => void;
    handleDeleteChat: (slug: string, deleteForBoth?: boolean) => void;
    handleCreateNewChat: (payload: CreateGroupChatPayload) => void;
    pendingForward?: PendingForwardState | null;
    setPendingForward: Dispatch<SetStateAction<PendingForwardState | null>>;
    handleStartForward: (uuids: string[]) => void;
    handleReportMessage: (messageUuid: string | null, reason: string) => void;
    onOpenInfo?: () => void;
    onScrollToMessage?: (uuid: string) => void;
}

export default function ChatLayout(props: ChatLayoutProps) {
    const {
        currentUser,
        friendsList = [],
        chats,
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
        pendingForward,
        setPendingForward,
        handleStartForward,
        handleReportMessage,
        onOpenInfo,
        onScrollToMessage,
    } = props;

    const { t } = useTranslation();

    const [openMenuChatSlug, setOpenMenuChatSlug] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);
    const [selectedDateJump, setSelectedDateJump] = useState('');
    const [reportModalState, setReportModalState] = useState<ReportModalState>({ isOpen: false, messageUuid: null });

    const handleGetTypingText = (chat: ChatData, forceTyping = false) =>
        getTypingText(chat, currentUser, t, forceTyping);

    const handleJumpToDate = () => {
        if (!selectedDateJump) return;
        const targetMsg = messages.find((m) => m.created_at.startsWith(selectedDateJump));
        if (targetMsg) {
            onScrollToMessage?.(targetMsg.uuid);
        }
        setIsDateModalOpen(false);
    };

    return (
        <div
            id="im_container"
            onClick={() => setOpenMenuChatSlug(null)}
            className="bg-bg-box border border-border flex flex-col flex-1 font-sans text-text-main w-full"
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

                    <ChatTabs
                        openedChats={openedChats}
                        activeChat={activeChat}
                        draftsMap={draftsMap}
                        draftFilesMap={draftFilesMap}
                        onSelectChat={handleSelectChat}
                        onCloseChatTab={handleCloseChatTab}
                        onBackToInbox={handleBackToInbox}
                        onOpenInfo={onOpenInfo}
                    />
                </div>
            </div>

            <div id="im_page_containers" className="flex-1 flex flex-col min-h-0">
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
                        pendingForward={pendingForward}
                        onCancelForward={() => setPendingForward(null)}
                        onSelectChat={handleSelectChat}
                        onMarkAllAsRead={handleMarkAllAsRead}
                        onOpenCreateModal={() => setIsCreateModalOpen(true)}
                        onTogglePinChat={handleTogglePinChat}
                        onMarkChatUnread={handleMarkChatUnread}
                        onMuteChat={handleMuteChat}
                        onClearChatHistory={handleClearChatHistory}
                        onDeleteChat={handleDeleteChat}
                        getTypingText={handleGetTypingText}
                    />
                ) : (
                    <ChatWindow
                        {...props}
                        activeChat={activeChat}
                        getTypingText={handleGetTypingText}
                        onStartForward={handleStartForward}
                        onOpenDateModal={(dateKey) => {
                            setSelectedDateJump(dateKey);
                            setIsDateModalOpen(true);
                        }}
                        onOpenReportModal={(uuid) => setReportModalState({ isOpen: true, messageUuid: uuid })}
                    />
                )}
            </div>

            <ChatModals
                currentUser={currentUser}
                friendsList={friendsList}
                isCreateModalOpen={isCreateModalOpen}
                setIsCreateModalOpen={setIsCreateModalOpen}
                handleCreateNewChat={handleCreateNewChat}
                isDateModalOpen={isDateModalOpen}
                setIsDateModalOpen={setIsDateModalOpen}
                selectedDateJump={selectedDateJump}
                setSelectedDateJump={setSelectedDateJump}
                onJumpToDate={handleJumpToDate}
                reportModalState={reportModalState}
                setReportModalState={setReportModalState}
                handleReportMessage={handleReportMessage}
            />
        </div>
    );
}