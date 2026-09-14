import { useState, useContext } from "react";
import { useTranslation } from "react-i18next";
import { useDateFormatter } from "../hooks/useDateFormatter.js";
import { NotificationContext } from "../context/NotificationContext.jsx";
import { usePageTitle } from '../hooks/usePageTitle.js';
import { useNotificationConfig } from '../hooks/useNotificationConfig.js';
import ReportResultModal from '../components/modals/ReportResultModal.jsx';
import { useModal } from "../context/ModalContext.jsx";
import { NotificationListItem } from "../components/notification/NotificationListItem.jsx";

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
        if (!notif.read_at) {
            markAsRead(notif.id);
        }
        if (isSystemReport) {
            setSelectedReport(payload);
        }
    };

    const handleReadAll = async () => {
        if (readAllNotifications) await readAllNotifications();
    };

    const handleDeleteAll = async () => {
        const isConfirmed = await openConfirm(t('notifications.confirm_delete_all'));
        if (isConfirmed && deleteAllNotifications) {
            await deleteAllNotifications();
        }
    };

    return (
        <div className="w-full max-w-[800px] mx-auto box-border p-[20px] bg-bg-page border border-border text-[11px] text-text-main max-md:p-[10px]">
            <div className="bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border flex justify-between items-center max-md:-mt-[10px] max-md:-mx-[10px]">
                <div className="flex items-center gap-[6px]">
                    <span>{t('notifications.my_notifications')}</span>
                    {unreadCount > 0 && <span className="bg-[#d26c6c] text-white px-[4px] py-[1px] font-bold text-[9px]">{+unreadCount}</span>}
                </div>

                {notifications.length > 0 && (
                    <div className="flex items-center gap-[10px] text-[10px] font-normal">
                        {unreadCount > 0 && (
                            <span
                                className="cursor-pointer hover:underline opacity-80 hover:opacity-100"
                                onClick={handleReadAll}
                            >
                                {t('notifications.read_all')}
                            </span>
                        )}
                        <span
                            className="cursor-pointer hover:underline text-text-muted hover:text-theme-error"
                            onClick={handleDeleteAll}
                        >
                            {t('notifications.delete_all')}
                        </span>
                    </div>
                )}
            </div>

            {notifications.length === 0 ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">
                    <p className="m-0">{t('empty.notifications')}</p>
                </div>
            ) : (
                <div className="flex flex-col bg-bg-box border border-border">
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