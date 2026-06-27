import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { NotificationContext } from "../context/NotificationContext";
import { usePageTitle } from '../hooks/usePageTitle';
import { useNotificationConfig } from '../hooks/useNotificationConfig';
import ReportResultModal from '../components/common/ReportResultModal';
import ShieldIcon from '../assets/shield.svg?react';
import Avatar from "../components/ui/Avatar";
import RichText from "../components/common/RichText";
import { useModal } from "../context/ModalContext";

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

const NotificationListItem = ({ notif, handleNotificationClick, getConfig, formatDate }) => {
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

    const { actionText, linkText, linkUrl, snippetText, mediaPreview } = getConfig(type, actor, target);

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

                {(snippetText || mediaPreview) && (
                    <div className="tetrone-notification-snippet-container">
                        {snippetText && (
                            <div className="tetrone-notification-snippet">
                                {typeof snippetText === 'object' ? (
                                    <RichText text={snippetText.text || snippetText} className="tetrone-notification-richtext" />
                                ) : (
                                    <span>"{snippetText}"</span>
                                )}
                            </div>
                        )}

                        {mediaPreview && (
                            <div className="tetrone-notification-media">
                                <img src={mediaPreview} alt="Attachment preview" />
                            </div>
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

export default function NotificationsPage() {
    const { t } = useTranslation();
    const {
        notifications,
        markAsRead,
        unreadCount,
        readAllNotifications,
        deleteAllNotifications
    } = useContext(NotificationContext);

    const formatDate = useDateFormatter();
    const { openConfirm } = useModal();
    const { getConfig } = useNotificationConfig();

    usePageTitle(t('notifications.my_notifications'));

    const [selectedReport, setSelectedReport] = useState(null);

    const handleNotificationClick = (notif, payload, isSystemReport) => {
        if (!notif.read_at) markAsRead(notif.id);
        if (isSystemReport) setSelectedReport(payload);
    };

    const handleReadAll = async () => {
        if (readAllNotifications) {
            await readAllNotifications();
        }
    };

    const handleDeleteAll = async () => {
        const isConfirmed = await openConfirm(t('notifications.confirm_delete_all'));
        if (isConfirmed && deleteAllNotifications) {
            await deleteAllNotifications();
        }
    };

    return (
        <div className="tetrone-card-wrapper">
            <div
                className="tetrone-section-title tetrone-wall-header"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
                <div>
                    <span>{t('notifications.my_notifications')}</span>
                    {unreadCount > 0 && <span className="tetrone-wall-count">+{unreadCount}</span>}
                </div>

                {notifications.length > 0 && (
                    <div className="tetrone-notification-actions" style={{ fontSize: '13px', fontWeight: 'normal' }}>
                        {unreadCount > 0 && (
                            <span
                                className="tetrone-link"
                                onClick={handleReadAll}
                                style={{ cursor: 'pointer', marginRight: '15px' }}
                            >
                                {t('notifications.read_all')}
                            </span>
                        )}
                        <span
                            className="tetrone-link"
                            onClick={handleDeleteAll}
                            style={{ cursor: 'pointer', color: 'var(--theme-error)' }}
                        >
                            {t('notifications.delete_all')}
                        </span>
                    </div>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="tetrone-empty-state">
                    <p>{t('empty.notifications')}</p>
                </div>
            ) : (
                <div className="tetrone-notification-list">
                    {notifications.map((notif) => (
                        <NotificationListItem
                            key={notif.id}
                            notif={notif}
                            handleNotificationClick={handleNotificationClick}
                            getConfig={getConfig}
                            formatDate={formatDate}
                        />
                    ))}
                </div>
            )}

            <ReportResultModal
                payload={selectedReport}
                onClose={() => setSelectedReport(null)}
            />
        </div>
    );
}