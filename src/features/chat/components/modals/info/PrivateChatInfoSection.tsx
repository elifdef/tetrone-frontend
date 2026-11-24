import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDateFormatter } from '@hooks/useDateFormatter';
import Avatar from '@ui/Avatar';
import Button from '@ui/Button';
import type { ChatData } from '@/types/chat';
import type { UserData } from '@/types/user';

export interface PrivateChatInfoSectionProps {
    chat: ChatData;
    currentUser: UserData | null | undefined;
    onBlockUser?: () => void;
    onDeleteChat?: () => void;
}

export default function PrivateChatInfoSection({
    chat,
    currentUser,
    onBlockUser,
    onDeleteChat,
}: PrivateChatInfoSectionProps) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const initiatorName = !chat.initiator_username || chat.initiator_username === currentUser?.username
        ? t('chat.you')
        : (chat.target_user?.first_name || `@${chat.initiator_username}`);

    return (
        <div className="flex flex-col">
            <div className="flex items-center gap-[15px] p-[15px] border border-border bg-bg-page">
                <Link to={`/${chat.target_user?.username}`}>
                    <Avatar
                        user={chat.target_user}
                        className="w-[80px] h-[80px] object-cover border border-border shadow-sm"
                    />
                </Link>
                <div className="flex flex-col gap-[4px] flex-1 min-w-0">
                    <Link
                        to={`/${chat.target_user?.username}`}
                        className="font-bold text-[14px] text-theme-link hover:underline"
                    >
                        {chat.target_user?.first_name} {chat.target_user?.last_name}
                    </Link>
                    <span className="text-[11px] text-text-muted">
                        @{chat.target_user?.username}
                    </span>
                    <div className="text-[11px] text-text-main mt-[5px] bg-[rgba(128,128,128,0.05)] p-[6px] border border-border">
                        {t('chat.info_modal.chat_started')}: <b>{initiatorName}</b> ({formatDate(chat.created_at || chat.updated_at)})
                    </div>
                    <div className="flex gap-[8px] mt-[10px]">
                        <Button variant="danger" onClick={onBlockUser}>
                            {t('chat.info_modal.block')}
                        </Button>
                        <Button variant="danger" onClick={onDeleteChat}>
                            {t('chat.info_modal.delete_for_both')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}