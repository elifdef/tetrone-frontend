import { useTranslation } from 'react-i18next';
import RichText from '@common/RichText.jsx';
import { parseRichText, getPlainText } from '../utils/messageParser';
import { PinSvg, CloseSvg } from '@ui/Icons.jsx';
import type { ChatData, ChatMessageItem } from '@/types/chat';
import type { UserData } from '@/types/user';

export interface PinnedMessageBannerProps {
    pinnedMessage?: ChatMessageItem | null;
    activeChat: ChatData;
    currentUser: UserData | null | undefined;
    onScrollToMessage?: (uuid: string) => void;
    onUnpin: (uuid: string) => void;
}

export default function PinnedMessageBanner({
    pinnedMessage,
    activeChat,
    currentUser,
    onScrollToMessage,
    onUnpin,
}: PinnedMessageBannerProps) {
    const { t } = useTranslation();

    if (!pinnedMessage) return null;

    const authorName = pinnedMessage.author_type === 'group'
        ? getPlainText(activeChat.title)
        : pinnedMessage.isMine
            ? currentUser?.first_name
            : pinnedMessage.author?.first_name;

    return (
        <div
            onClick={() => onScrollToMessage?.(pinnedMessage.uuid)}
            className="flex items-center justify-between gap-[10px] px-[12px] py-[6px] bg-header-bg border-b border-border cursor-pointer hover:bg-bg-hover transition-colors"
        >
            <div className="flex items-center gap-[8px] min-w-0 flex-1">
                <span className="text-theme-link">
                    <PinSvg />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="text-[10px] font-bold text-theme-link">
                        {t('chat.pinned_message')} {authorName}
                    </div>
                    <div className="text-[11px] text-text-main truncate">
                        <RichText
                            text={parseRichText(pinnedMessage.text)}
                            className="post-text [&_p]:inline [&_p]:m-0"
                            limit={100000}
                        />
                    </div>
                </div>
            </div>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    onUnpin(pinnedMessage.uuid);
                }}
                className="text-text-muted hover:text-theme-error bg-transparent border-none cursor-pointer flex items-center"
            >
                <CloseSvg size={13} />
            </button>
        </div>
    );
}