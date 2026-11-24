import { useTranslation } from 'react-i18next';
import type { FlattenedChatFile } from '../../utils/chatMediaExtractor';

export interface ChatMediaGridProps {
    mediaFiles?: FlattenedChatFile[];
    onPreviewImage?: (url: string) => void;
    onJumpToMessage: (messageId: string | number) => void;
}

export default function ChatMediaGrid({
    mediaFiles = [],
    onJumpToMessage,
}: ChatMediaGridProps) {
    const { t } = useTranslation();

    if (mediaFiles.length === 0) {
        return (
            <div className="grid grid-cols-4 gap-[5px] border border-border p-[5px] bg-bg-page">
                <div className="col-span-4 p-[20px] text-center italic text-text-muted">
                    {t('chat.empty.files')}
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4 gap-[5px] border border-border p-[5px] bg-bg-page max-h-[300px] overflow-y-auto custom-scrollbar">
            {mediaFiles.map((file, idx) => {
                const isVideo = Boolean(file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm)$/i));

                return (
                    <div
                        key={idx}
                        onClick={() => onJumpToMessage(file.messageId)}
                        className="relative aspect-square border border-border cursor-pointer group overflow-hidden bg-bg-box"
                    >
                        {isVideo ? (
                            <video
                                src={file.url}
                                className="w-full h-full object-cover"
                                muted
                            />
                        ) : (
                            <img
                                src={file.url}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}