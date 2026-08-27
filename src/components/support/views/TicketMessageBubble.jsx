import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Avatar from '../../ui/Avatar';
import { SecurityIcon as SupportIcon } from '../../ui/Icons';
import ImagePreviewModal from '../../ui/ImagePreviewModal';

export default function TicketMessageBubble({ msg, ticketOwnerId, currentUserId, formatDate }) {
    const { t } = useTranslation();
    const [previewImage, setPreviewImage] = useState(null);

    const msgUserId = msg.user?.id;
    const isTicketOwner = msgUserId === ticketOwnerId;
    const isMe = msgUserId === currentUserId;

    const getRoleName = (roleId) => {
        switch (Number(roleId)) {
            case 1: return t('common.support');
            case 2: return t('common.moderator');
            case 3: return t('common.admin');
            case 4: return t('common.owner');
            default: return t('common.system');
        }
    };

    let authorName = isMe ? t('common.you') : (msg.user?.first_name || msg.user?.username || t('common.support'));

    if (!isTicketOwner && msg.user?.role !== undefined && msg.user?.role !== null) {
        authorName = `${authorName} (${getRoleName(msg.user.role)})`;
    }

    return (
        <div className="flex gap-[12px] items-start w-full">
            {/* Колонка з Аватаром */}
            <div className="shrink-0 w-[40px] flex justify-center mt-[2px]">
                {isTicketOwner ? (
                    <div className="w-[40px] h-[40px]">
                        <Avatar user={msg.user} />
                    </div>
                ) : (
                    <div className="w-[40px] h-[40px] bg-[rgba(128,128,128,0.05)] border border-border flex items-center justify-center text-theme-link">
                        <SupportIcon width={24} height={24} />
                    </div>
                )}
            </div>

            {/* Тіло повідомлення */}
            <div className={`flex-1 border p-[8px_10px] text-[11px] leading-[1.4] ${
                isTicketOwner
                    ? 'bg-bg-box border-border'
                    : 'bg-[rgba(91,155,213,0.05)] border-[#5b9bd5]'
            }`}>

                {/* Хедер повідомлення (Ім'я + Дата) */}
                <div className={`flex justify-between items-center mb-[5px] pb-[4px] border-b ${
                    isTicketOwner ? 'border-border' : 'border-[#5b9bd5] border-opacity-30'
                }`}>
                    <span className="font-bold text-theme-link">{authorName}</span>
                    <span className="text-[10px] text-text-muted">{formatDate(msg.created_at)}</span>
                </div>

                {/* Текст */}
                <div className="text-text-main whitespace-pre-wrap break-words">
                    {msg.message}
                </div>

                {/* Вкладення (якщо є) */}
                {msg.attachments?.length > 0 && (
                    <div className={`flex gap-[6px] flex-wrap mt-[8px] pt-[8px] border-t ${
                        isTicketOwner ? 'border-border' : 'border-[#5b9bd5] border-opacity-30'
                    }`}>
                        {msg.attachments.map(att => (
                            <div
                                key={att.id}
                                onClick={() => setPreviewImage(att.url || att.file_url)}
                                className="block cursor-zoom-in hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={att.url || att.file_url}
                                    alt="attachment"
                                    className="max-w-[120px] max-h-[120px] object-cover border border-border bg-bg-page"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Модалка для перегляду */}
            <ImagePreviewModal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                imageUrl={previewImage}
            />
        </div>
    );
}