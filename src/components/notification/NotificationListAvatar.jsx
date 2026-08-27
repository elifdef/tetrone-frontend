import ShieldIcon from '../../assets/shield.svg?react';
import Avatar from "../ui/Avatar";

export const NotificationListAvatar = ({ actor, isSystem }) => {
    if (isSystem) {
        return (
            <div className="w-[50px] h-[50px] bg-theme-header-bg border border-border p-[5px] flex items-center justify-center text-white">
                <ShieldIcon width={64} height={64} />
            </div>
        );
    }
    return (
        <Avatar
            user={actor}
            className="w-[50px] h-[50px] object-cover border border-border p-[1px] rounded-none block"
        />
    );
};