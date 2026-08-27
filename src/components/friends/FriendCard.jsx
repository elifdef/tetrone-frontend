import { Link } from "react-router";
import { useTranslation } from 'react-i18next';
import Avatar from "../ui/Avatar";

export default function FriendCard({ user, viewMode, onAction }) {
    const { t } = useTranslation();

    const btnClass = "bg-transparent border-none cursor-pointer text-[10px] p-0 text-right text-theme-link hover:underline max-md:text-center pr-[5px]";
    const dangerBtnClass = `${btnClass} !text-theme-error`;
    const statusClass = "text-[#999] text-[10px] pr-[5px] text-right max-md:text-center";

    const renderButtons = () => {
        if (viewMode === 'my') {
            return (
                <>
                    <button className={btnClass} onClick={() => onAction('delete', user.username)}>
                        {t('action.delete')}
                    </button>
                    <button className={dangerBtnClass} onClick={() => onAction('block', user.username)}>
                        {t('action.block')}
                    </button>
                </>
            );
        }

        if (viewMode === 'requests') {
            return (
                <>
                    <button className={btnClass} onClick={() => onAction('accept', user.username)}>
                        {t('action.accept')}
                    </button>
                    <button className={btnClass} onClick={() => onAction('cancel_request', user.username)}>
                        {t('action.dismiss')}
                    </button>
                </>
            );
        }

        if (viewMode === 'subscriptions') {
            return (
                <button className={btnClass} onClick={() => onAction('cancel_request', user.username)}>
                    {t('action.cancel')}
                </button>
            );
        }

        if (viewMode === 'blocked') {
            return (
                <button className={btnClass} onClick={() => onAction('unblock', user.username)}>
                    {t('action.unblock')}
                </button>
            );
        }

        switch (user.friendship_status) {
            case 'friends':
                return <span className={statusClass}>{t('friends.your_contacts')}</span>;
            case 'pending_sent':
                return <button className={btnClass} onClick={() => onAction('cancel_request', user.username)}>{t('action.cancel')}</button>;
            case 'pending_received':
                return <button className={btnClass} onClick={() => onAction('accept', user.username)}>{t('action.accept')}</button>;
            case 'blocked_by_me':
                return <button className={btnClass} onClick={() => onAction('unblock', user.username)}>{t('action.unblock')}</button>;
            case 'blocked_by_target':
                return <span className={statusClass}>{t('common.blocked')}</span>;
            default:
                return <button className={btnClass} onClick={() => onAction('add', user.username)}>{t('action.add')}</button>;
        }
    };

    return (
        <div className="flex py-[10px] border-b border-border bg-bg-box max-md:flex-col max-md:items-center max-md:text-center">

            <Link to={`/${user.username}`} className="mr-[15px] max-md:mr-0 max-md:mb-[10px]">
                <Avatar
                    user={user}
                    className="w-[75px] h-[75px] object-cover border border-border p-[1px] rounded-none"
                />
            </Link>

            <div className="flex-1 flex flex-col justify-start">
                <Link to={`/${user.username}`} className="text-[12px] font-bold text-theme-link no-underline hover:underline mb-[4px]">
                    {user.first_name} {user.last_name}
                </Link>
                <div className="text-[10px] text-text-muted mb-[8px]">@{user.username}</div>
            </div>

            <div className="flex flex-col gap-[5px] min-w-[100px] text-right text-[10px] max-md:flex-row max-md:justify-center max-md:mt-[10px]">
                {renderButtons()}
            </div>

        </div>
    );
}