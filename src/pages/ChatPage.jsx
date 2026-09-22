import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePageTitle } from '../hooks/usePageTitle';
import { useChatPage } from '../components/chat/hooks/useChatPage.js';
import ClassicChatLayout from '../components/chat/classic/ClassicChatLayout';
import ModernChatLayout from '../components/chat/modern/ModernChatLayout';
import ChatInfoModal from '../components/chat/ChatInfoModal';

export default function ChatPage() {
    const { t } = useTranslation();
    usePageTitle(t('common.messages'));

    const { theme, setTheme, layoutProps } = useChatPage();

    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const handleScrollToMessage = (id) => {
        const el = document.getElementById(`message-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('bg-[rgba(91,155,213,0.3)]', 'transition-colors', 'duration-[2000ms]');
            setTimeout(() => el.classList.remove('bg-[rgba(91,155,213,0.3)]'), 2000);
        }
    };

    // Прокидаємо функцію відкриття в загальні пропси
    layoutProps.onOpenInfo = () => setIsInfoOpen(true);

    return (
        <>
            <div className="w-full max-w-[800px] mx-auto flex flex-col gap-[15px]">
                {/* ТЕСТОВИЙ ПЕРЕМИКАЧ */}
                <div className="flex gap-[10px] p-[10px] bg-bg-box border border-border justify-center transition-colors">
                    <button
                        onClick={() => setTheme('classic')}
                        className={`px-[15px] py-[5px] text-[12px] font-bold border transition-colors ${theme === 'classic' ? 'bg-theme-link text-white border-theme-link' : 'bg-transparent text-text-main border-border hover:bg-bg-hover'}`}
                    >
                        {t('settings.theme.default')}
                    </button>
                    <button
                        onClick={() => setTheme('modern')}
                        className={`px-[15px] py-[5px] text-[12px] font-bold border transition-colors ${theme === 'modern' ? 'bg-theme-link text-white border-theme-link' : 'bg-transparent text-text-main border-border hover:bg-bg-hover'}`}
                    >
                        {t('settings.theme.xp')}
                    </button>
                </div>

                {theme === 'classic' ? (
                    <ClassicChatLayout {...layoutProps} />
                ) : (
                    <ModernChatLayout {...layoutProps} />
                )}
            </div>

            {/* Модалка інформації про чат */}
            {isInfoOpen && (
                <ChatInfoModal
                    chat={layoutProps.activeChat}
                    messages={layoutProps.messages}
                    onClose={() => setIsInfoOpen(false)}
                    onScrollToMessage={handleScrollToMessage}
                    onDeleteChat={() => { console.log('Delete Chat'); setIsInfoOpen(false); }}
                    onBlockUser={() => { console.log('Block User'); setIsInfoOpen(false); }}
                />
            )}
        </>
    );
}