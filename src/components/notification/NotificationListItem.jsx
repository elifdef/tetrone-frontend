import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import ShieldIcon from '../assets/shield.svg?react';
import Avatar from "../components/ui/Avatar";
import RichText from "../common/RichText";

const ListAvatar = ({ actor, isSystem }) => {
    if (isSystem) {
        return (
            <div className="tetrone-notification-avatar system-avatar">
                <ShieldIcon width={64} height={64} />
            </div>
        );
    }
    return <Avatar user={actor} className="tetrone-notification-avatar" />;
};

export const NotificationListItem = ({ notif, handleNotificationClick, getConfig, formatDate }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const isUnread = !notif.read_at;
    const payload = notif.data || {};

    const type = payload.type || notif.type;
    const actor = payload.actor || {};
    const target = payload.target || {};

    const isSystem = actor.id === 0;
    const senderName = isSystem
        ? t('common.moderator')
        : `${actor.first_name || ''} ${actor.last_name || ''}`.trim();

    const { actionText, linkText, linkUrl, snippetText } = getConfig(type, actor, target);

    const onBlockClick = (e) => {
        handleNotificationClick(notif, payload, isSystem);
        if (!isSystem && linkUrl && e.target.tagName !== 'A') {
            navigate(linkUrl);
        }
    };

    return (
        <div
            className={`tetrone-notification-item ${isUnread ? 'unread' : ''}`}
            onClick={onBlockClick}
            style={{ cursor: 'pointer' }}
        >
            <div className="tetrone-system-avatar-wrapper">
                {isSystem ? (
                    <ListAvatar isSystem={true} />
                ) : (
                    <Link to={`/${actor.username}`}>
                        <ListAvatar actor={actor} isSystem={false} />
                    </Link>
                )}
            </div>

            <div className="tetrone-notification-content">
                <div className="tetrone-notification-text-row">
                    {isSystem ? (
                        <span className="tetrone-comment-author">
                            {senderName}
                        </span>
                    ) : (
                        <Link
                            to={`/${actor.username}`}
                            className="tetrone-comment-author"
                            style={actor.personalization?.username_color ? { color: actor.personalization.username_color } : undefined}
                        >
                            {senderName}
                        </Link>
                    )}

                    {' '}

                    <span className="tetrone-notification-action">
                        {actionText}
                        {actionText && linkText ? ' ' : ''}

                        {linkUrl && linkText ? (
                            <Link to={linkUrl} className="tetrone-link">
                                {linkText}{snippetText ? ':' : ''}
                            </Link>
                        ) : (
                            <>{linkText}{snippetText ? ':' : ''}</>
                        )}
                    </span>
                </div>

                {snippetText && (
                    <div className="tetrone-notification-snippet">
                        {typeof snippetText === 'object' ? (
                            <RichText text={snippetText} className="tetrone-notification-richtext" />
                        ) : (
                            <span>"{snippetText}"</span>
                        )}
                    </div>
                )}

                <div className="tetrone-notification-date">
                    {formatDate(notif.created_at)}
                </div>
            </div>

            {isUnread && (
                <div className="tetrone-notification-dot" title={t('notifications.mark_read')}></div>
            )}
        </div>
    );
};