import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { useChatPage } from '@/features/chat/components/hooks/useChatPage';
import ChatLayout from '@/features/chat/components/ChatLayout';
import ChatInfoModal from '@/features/chat/components/ChatInfoModal';

export default function ChatPage() {
    const { t } = useTranslation();
    usePageTitle(t('chat.title'));

    const { layoutProps } = useChatPage();
    const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

    const handleScrollToMessage = useCallback((uuid: string) => {
        const el = document.getElementById(`msg2-${uuid}`);

        if (!el) return;

        el.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });

        el.classList.add(
            'bg-[rgba(91,155,213,0.3)]',
            'transition-colors',
            'duration-[2000ms]'
        );

        setTimeout(() => {
            el.classList.remove('bg-[rgba(91,155,213,0.3)]');
        }, 2000);
    }, []);

    const chatLayoutProps = {
        ...layoutProps,
        onOpenInfo: () => setIsInfoOpen(true),
        onScrollToMessage: handleScrollToMessage,
    };

    return (
        <>
            <div className="w-full max-w-[800px] mx-auto flex flex-col gap-[15px] min-h-[calc(100vh-85px)]">
                <ChatLayout {...chatLayoutProps} />
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
                        if (layoutProps.activeChat) {
                            layoutProps.handleDeleteChat(layoutProps.activeChat.slug, true);
                        }
                        setIsInfoOpen(false);
                    }}
                    onBlockUser={() => {
                        const targetUsername = layoutProps.activeChat?.target_user?.username;
                        if (targetUsername) {
                            layoutProps.handleBlockUser(targetUsername);
                        }
                        setIsInfoOpen(false);
                    }}
                />
            )}
        </>
    );
}