import { useTranslation } from 'react-i18next';
import RichText from '@common/RichText.jsx';
import { parseRichText } from '../utils/messageParser';
import type { ChatData } from '@/types/chat';

export interface ChatTitleProps {
    chat: ChatData | null | undefined;
    className?: string;
}

export default function ChatTitle({ chat, className = '' }: ChatTitleProps) {
    const { t } = useTranslation();

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
}