import { useState, useRef, useEffect } from "react";
import { Link } from "react-router";
import { useTranslation } from 'react-i18next';
import Button from "../../ui/Button";

export default function ProfileActions({
                                           user, sameUser, loading, status, isBlockedByMe, isBlockedByTarget,
                                           onFriendAction, onBlockAction, onReportAction, isBanned
                                       }) {
    const { t } = useTranslation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Закриття дропдауну при кліку ззовні (єдиний локальний UI-стейт)
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) setIsMenuOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (sameUser) {
        return (
            <div className="flex flex-col gap-2">
                <Link to="/settings" className="no-underline">
                    <Button variant="primary" className="w-full">{t('action.edit')}</Button>
                </Link>
            </div>
        );
    }

    if (isBlockedByTarget || isBanned) return null;

    const getStatusLabel = () => {
        if (loading) return "...";
        if (isBlockedByMe) return t('profile.menu.you_have_blocked');
        switch (status) {
            case 'friends': return `${t('friends.your_contacts')} ✓`;
            case 'pending_sent': return t('friends.request_sent');
            case 'pending_received': return t('profile.menu.request_received');
            default: return t('profile.menu.not_your_friends');
        }
    };

    const getFriendActionLabel = () => {
        switch (status) {
            case 'friends': return t('action.remove');
            case 'pending_sent': return t('profile.menu.cancel_request');
            case 'pending_received': return t('action.accept');
            default: return t('profile.menu.add_friends');
        }
    };

    const handleAction = (actionFn) => {
        actionFn();
        setIsMenuOpen(false);
    };

    return (
        <div className="flex flex-col gap-2">
            {!isBlockedByMe && user.permissions?.can_message && (
                <Button variant="primary" className="w-full" disabled={loading}>
                    {t('messages.send_message')}
                </Button>
            )}

            <div className="relative" ref={menuRef}>
                <Button
                    variant="primary"
                    className="w-full text-left flex justify-between items-center after:content-['▼'] after:text-[8px] after:ml-2"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={loading}
                >
                    {getStatusLabel()}
                </Button>

                {isMenuOpen && (
                    <div className="absolute top-full left-0 w-full bg-bg-box border border-border shadow-[2px_2px_5px_rgba(0,0,0,0.3)] z-50 flex flex-col p-1 mt-1">
                        {!isBlockedByMe && (
                            <button className="bg-transparent border-none text-left px-2 py-1 text-[11px] text-text-main cursor-pointer hover:bg-theme-link hover:text-white" onClick={() => handleAction(onFriendAction)}>
                                {getFriendActionLabel()}
                            </button>
                        )}
                        <button className="bg-transparent border-none text-left px-2 py-1 text-[11px] text-text-main cursor-pointer hover:bg-theme-link hover:text-white" onClick={() => handleAction(onReportAction)}>
                            {t('reports.title')}
                        </button>
                        <button className={`bg-transparent border-none text-left px-2 py-1 text-[11px] cursor-pointer hover:bg-theme-error hover:text-white ${!isBlockedByMe ? 'text-theme-error' : 'text-text-main hover:bg-theme-link'}`} onClick={() => handleAction(onBlockAction)}>
                            {isBlockedByMe ? t('action.unblock') : t('action.block')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}