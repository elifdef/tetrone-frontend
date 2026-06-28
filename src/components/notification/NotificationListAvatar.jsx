import ShieldIcon from '../../assets/shield.svg?react';
import Avatar from "../ui/Avatar";

export const NotificationListAvatar = ({ actor, isSystem }) => {
    if (isSystem) {
        return (
            <div className="tetrone-notification-avatar system-avatar">
                <ShieldIcon width={64} height={64} />
            </div>
        );
    }
    return <Avatar user={actor} className="tetrone-notification-avatar" />;
};