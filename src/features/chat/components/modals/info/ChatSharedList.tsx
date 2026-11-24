import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '@hooks/useDateFormatter';
import type { ExtractedChatLink, FlattenedChatFile } from '../../utils/chatMediaExtractor';

export type ChatSharedItem = FlattenedChatFile | ExtractedChatLink;

export interface ChatSharedListProps {
    items?: ChatSharedItem[];
    isLinks?: boolean;
    onJumpToMessage: (messageId: string | number) => void;
}

const LinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const FileIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
);

const ArrowJumpSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

export default function ChatSharedList({
    items = [],
    isLinks = false,
    onJumpToMessage,
}: ChatSharedListProps) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    if (items.length === 0) {
        return (
            <div className="p-[20px] text-center italic text-text-muted">
                {t('chat.empty.files')}
            </div>
        );
    }

    return (
        <div className="flex flex-col border border-border border-t-0 max-h-[300px] overflow-y-auto custom-scrollbar bg-bg-box">
            {items.map((item, idx) => (
                <div
                    key={idx}
                    className="flex justify-between items-center p-[10px_15px] border-b border-border last:border-b-0 hover:bg-bg-page transition-colors"
                >
                    <div className="flex items-center gap-[10px] overflow-hidden">
                        <span className="text-text-muted">
                            {isLinks ? <LinkIcon /> : <FileIcon />}
                        </span>
                        <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-theme-link hover:underline whitespace-nowrap overflow-hidden text-ellipsis"
                        >
                            {isLinks ? item.url : ('name' in item ? item.name : item.url)}
                        </a>
                    </div>
                    <div className="flex items-center gap-[15px] shrink-0 ml-[10px]">
                        <span className="text-[10px] text-text-muted">
                            {formatDate(item.createdAt)}
                        </span>
                        <button
                            type="button"
                            className="text-theme-link bg-transparent border-none cursor-pointer flex items-center"
                            onClick={() => onJumpToMessage(item.messageId)}
                        >
                            <ArrowJumpSvg />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}