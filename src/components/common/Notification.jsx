import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationText } from '../../hooks/useNotificationText';
import { extractPreviewText } from '../../utils/editorHelpers';
import ShieldIcon from '../../assets/shield.svg?react';
import RichText from './RichText';
import Avatar from '../ui/Avatar';

const NotificationAvatar = ({ src, isSystem }) => {
    if (isSystem) {
        return (
            <div className="tetrone-toast-avatar system-toast-avatar">
                <ShieldIcon width={64} height={64} className="system-toast-icon" />
            </div>
        );
    }

    return (
        <Avatar
            src={src}
            className="tetrone-toast-avatar toast-avatar-img"
        />
    );
};

const NotificationContent = ({ name, text, snippet, t }) => {
    let renderedSnippet = null;

    if (snippet) {
        if (typeof snippet === 'object') {
            renderedSnippet = (
                <div className="tetrone-toast-richtext-wrapper">
                    <RichText text={snippet} />
                </div>
            );
        } else if (typeof snippet === 'string') {
            if (snippet === 'POLL') renderedSnippet = `📊 ${t('common.poll')}`;
            else if (snippet === 'ATTACHMENT') renderedSnippet = `📎 ${t('post.attachment')}`;
            else renderedSnippet = `"${snippet}"`;
        }
    }

    return (
        <div className="tetrone-toast-content">
            <span className="tetrone-toast-name">
                {name}
            </span>
            <span className="tetrone-toast-text">
                {text}
            </span>
            {renderedSnippet && (
                <span className="tetrone-toast-snippet">
                    {renderedSnippet}
                </span>
            )}
        </div>
    );
};

export default function Notification({ notification, onClose }) {
    const { getNotificationData } = useNotificationText();
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(() => onClose(), 7000);
        return () => clearTimeout(timer);
    }, [onClose]);

    // 1. Беремо оригінальні дані
    const originalPayload = notification.data || notification;

    // 2. Парсимо текст повідомлення
    let parsedMessageText = originalPayload.message_text
        ? extractPreviewText(originalPayload.message_text, t)
        : null;

    // 3. Якщо тексту немає, але є файл — ставимо маркер прикріплення
    if (originalPayload.file_type) {
        parsedMessageText = 'ATTACHMENT';
    }

    // 4. Створюємо безпечні об'єкти без сирого JSON
    const safePayload = { ...originalPayload, message_text: parsedMessageText };
    const safeNotification = { ...notification, data: safePayload, message_text: parsedMessageText };

    // 5. Отримуємо переклади
    const { actionText, linkText } = getNotificationData(safeNotification.type, safeNotification);
    const fullText = `${actionText} ${linkText || ''}`.trim();

    const isSystem = safeNotification.type?.includes('ReportReviewed') || safePayload.type === 'report_reviewed';

    const senderName = isSystem
        ? t('common.moderation')
        : `${safeNotification.user_first_name || ''} ${safeNotification.user_last_name || ''}`.trim();

    // 6. Формуємо сніпет
    const snippetText = safePayload.admin_response || safePayload.post_snippet || parsedMessageText;

    return (
        <div className="tetrone-toast">
            <NotificationAvatar
                src={safeNotification.user_avatar}
                isSystem={isSystem}
            />

            <NotificationContent
                name={senderName}
                text={fullText}
                snippet={snippetText}
                t={t}
            />
        </div>
    );
}