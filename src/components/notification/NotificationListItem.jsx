import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import RichText from "../common/RichText";
import { NotificationListAvatar } from "./NotificationListAvatar";

export const NotificationListItem = ({ notif, handleNotificationClick, getConfig, formatDate }) => {
    const { t } = useTranslation();

    const isUnread = !notif.read_at;
    const payload = notif.data || {};

    const type = payload.type || notif.type;
    const actor = payload.actor || {};
    const target = payload.target || {};

    const isSystem = actor.id === 0;
    const senderName = isSystem
        ? t('common.moderator')
        : `${actor.first_name || ''} ${actor.last_name || ''}`.trim();

    const { actionText, linkText, linkUrl, snippetText, mediaPreview, isReaction, mediaPosition } = getConfig(type, actor, target);

    const onBlockClick = () => {
        handleNotificationClick(notif, payload, isSystem);
    };

    return (
        <div className={`tetrone-notification-item ${isUnread ? 'unread' : ''}`} onClick={onBlockClick}>
            <div className="tetrone-notification-layout">
                <div className="tetrone-system-avatar-wrapper">
                    {isSystem ? (
                        <NotificationListAvatar isSystem={true} />
                    ) : (
                        <Link to={`/${actor.username}`}>
                            <NotificationListAvatar actor={actor} isSystem={false} />
                        </Link>
                    )}
                </div>

                <div className="tetrone-notification-content-box">
                    <div className="tetrone-notification-text-row">
                        {isSystem ? (
                            <span className="tetrone-comment-author">{senderName}</span>
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
                                    {linkText}{snippetText && !isReaction ? ':' : ''}
                                </Link>
                            ) : (
                                <>{linkText}{snippetText && !isReaction ? ':' : ''}</>
                            )}
                        </span>
                    </div>

                    {(snippetText || (mediaPreview && mediaPosition === 'left')) && (
                        <div className="ntf-snippet-container">
                            {mediaPreview && mediaPosition === 'left' && (
                                <div className="ntf-media-left">
                                    <img src={mediaPreview} alt="Media" className="ntf-media-img" />
                                </div>
                            )}

                            {snippetText && (
                                <div className="ntf-snippet-text-box">
                                    {isReaction ? (
                                        <img src={snippetText} alt="Reaction" className="ntf-reaction-img" />
                                    ) : typeof snippetText === 'object' ? (
                                        <RichText text={snippetText.text || snippetText} className="tetrone-notification-richtext" />
                                    ) : (
                                        <span>"{snippetText}"</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="tetrone-notification-date">
                        {formatDate(notif.created_at)}
                    </div>
                </div>
            </div>

            {mediaPreview && mediaPosition === 'right' && (
                <div className="ntf-media-right">
                    <img src={mediaPreview} alt="Media" className="ntf-media-img" />
                </div>
            )}

            {isUnread && (
                <div className="tetrone-notification-dot" title={t('notifications.mark_read')}></div>
            )}
        </div>
    );
};