import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useDateFormatter } from "../hooks/useDateFormatter";
import { NotificationContext } from "../context/NotificationContext";
import { usePageTitle } from '../hooks/usePageTitle';
import { useNotificationConfig } from '../hooks/useNotificationConfig';
import ReportResultModal from '../components/modals/ReportResultModal.jsx';
import { useModal } from "../context/ModalContext";
import { NotificationListItem } from "../components/notification/NotificationListItem";

export default function NotificationsPage()
{
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

    const handleNotificationClick = (notif, payload, isSystemReport) =>
    {
        if (!notif.read_at)
        {
            markAsRead(notif.id);
        }
        if (isSystemReport)
        {
            setSelectedReport(payload);
        }
    };

    const handleReadAll = async () =>
    {
        if (readAllNotifications)
        {
            await readAllNotifications();
        }
    };

    const handleDeleteAll = async () =>
    {
        const isConfirmed = await openConfirm(t('notifications.confirm_delete_all'));
        if (isConfirmed && deleteAllNotifications)
        {
            await deleteAllNotifications();
        }
    };

    return (
        <div className="tetrone-card-wrapper">
            <div className="tetrone-section-title tetrone-wall-header tetrone-wall-header-inner">
                <div>
                    <span>{ t('notifications.my_notifications') }</span>
                    { unreadCount > 0 && <span className="tetrone-wall-count">+{ unreadCount }</span> }
                </div>

                { notifications.length > 0 && (
                    <div className="tetrone-notification-actions">
                        { unreadCount > 0 && (
                            <span
                                className="tetrone-link tetrone-notification-action-link"
                                onClick={ handleReadAll }
                            >
                                { t('notifications.read_all') }
                            </span>
                        ) }
                        <span
                            className="tetrone-link tetrone-notification-action-delete"
                            onClick={ handleDeleteAll }
                        >
                            { t('notifications.delete_all') }
                        </span>
                    </div>
                ) }
            </div>

            { notifications.length === 0 ? (
                <div className="tetrone-empty-state">
                    <p>{ t('empty.notifications') }</p>
                </div>
            ) : (
                <div className="tetrone-notification-list">
                    { notifications.map((notif) => (
                        <NotificationListItem
                            key={ notif.id }
                            notif={ notif }
                            handleNotificationClick={ handleNotificationClick }
                            getConfig={ getConfig }
                            formatDate={ formatDate }
                        />
                    )) }
                </div>
            ) }

            <ReportResultModal
                payload={ selectedReport }
                onClose={ () => setSelectedReport(null) }
            />
        </div>
    );
}