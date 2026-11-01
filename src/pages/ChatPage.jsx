import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { useChatPage } from '../components/chat/hooks/useChatPage.js';
import ChatLayout from '../components/chat/ChatLayout';
import ChatInfoModal from '../components/chat/ChatInfoModal';

export default function ChatPage() {
    const { t } = useTranslation();
    usePageTitle(t('chat.title'));

    const { layoutProps } = useChatPage();
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const handleScrollToMessage = useCallback((uuid) => {
        const el = document.getElementById(`msg2-${uuid}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-[rgba(91,155,213,0.3)]', 'transition-colors', 'duration-[2000ms]');
            setTimeout(() => el.classList.remove('bg-[rgba(91,155,213,0.3)]'), 2000);
        }
    }, []);

    layoutProps.onOpenInfo = () => setIsInfoOpen(true);
    layoutProps.onScrollToMessage = handleScrollToMessage;

    return (
        <>
            <div className="w-full max-w-[800px] mx-auto flex flex-col gap-[15px]">
                <ChatLayout {...layoutProps} />
            </div>

            {isInfoOpen && layoutProps.activeChat && (
                <ChatInfoModal
                    chat={layoutProps.activeChat}
                    messages={layoutProps.messages}
                    friendsList={layoutProps.friendsList}
                    currentUser={layoutProps.currentUser}
                    onClose={() => setIsInfoOpen(false)}
                    onScrollToMessage={handleScrollToMessage}
                    onUpdateGroupInfo={layoutProps.handleUpdateGroupInfo}
                    onInviteMember={layoutProps.handleInviteGroupMember}
                    onUpdateMemberRole={layoutProps.handleUpdateGroupMemberRole}
                    onKickMember={layoutProps.handleKickGroupMember}
                    onDeleteChat={() => {
                        layoutProps.handleDeleteChat(layoutProps.activeChat.slug, true);
                        setIsInfoOpen(false);
                    }}
                    onBlockUser={() => {
                        layoutProps.handleBlockUser(layoutProps.activeChat.target_user?.username);
                        setIsInfoOpen(false);
                    }}
                />
            )}
        </>
    );
}