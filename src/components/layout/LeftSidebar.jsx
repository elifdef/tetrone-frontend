import { useState, useContext, useEffect, memo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTranslation } from 'react-i18next';
import { APP_NAME, userRole } from "../../config";
import { AuthContext } from "../../context/AuthContext";
import { NotificationContext } from "../../context/NotificationContext";
import GlobalAudioPlayer from "./GlobalAudioPlayer";
import { useIsMobile } from "../../hooks/useIsMobile";
import Avatar from "../ui/Avatar";

const LeftSidebar = () => {
    const { t } = useTranslation();
    const { logout, user } = useContext(AuthContext);
    const { unreadCount, unreadMessagesCount } = useContext(NotificationContext);
    const location = useLocation();
    const navigate = useNavigate();

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const isMobile = useIsMobile();

    useEffect(() => {
        setIsMobileOpen(false);
    }, [location.pathname]);

    const closeMenu = () => setIsMobileOpen(false);

    const getLinkClass = (path) => {
        const isActive = location.pathname === path;
        return `flex items-center justify-between py-[6px] px-[10px] max-md:py-[6px] max-md:px-[8px] text-text-main no-underline text-[12px] transition-colors hover:bg-nav-hover ${isActive ? "bg-nav-active font-bold" : ""}`;
    };

    const handleLogout = () => {
        closeMenu();
        logout();
        navigate('/');
    };

    const badgeClass = "bg-[#c95151] text-white text-[9px] px-[4px] py-[2px] font-bold leading-none";

    return (
        <>
            {/* Мобільна шапка */}
            <div className="hidden max-md:flex max-md:items-center max-md:justify-between max-md:fixed max-md:top-0 max-md:left-0 max-md:w-full max-md:h-[45px] max-md:bg-bg-box max-md:border-b max-md:border-border max-md:z-[1999] max-md:px-[12px] max-md:box-border">
                <button
                    className="bg-transparent border-none text-text-main text-[20px] cursor-pointer p-0 flex items-center justify-center w-[30px] h-[30px] outline-none"
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label={t('action.toggle_menu')}
                >
                    {isMobileOpen ? '✕' : '☰'}
                </button>

                <Link to="/" className="text-[14px] font-bold text-text-main no-underline" onClick={closeMenu}>
                    {APP_NAME}
                </Link>

                {user ? (
                    <Link to={`/${user.username}`} onClick={closeMenu} className="flex items-center justify-center">
                        <Avatar
                            user={user}
                            className="w-[26px] h-[26px] object-cover border border-border rounded-none"
                        />
                    </Link>
                ) : (
                    <div className="w-[30px]"></div>
                )}
            </div>

            {/* Затемнення фону на мобільному */}
            <div
                className={`hidden max-md:block max-md:fixed max-md:inset-0 max-md:w-full max-md:h-full max-md:bg-black/60 max-md:z-[1400] max-md:transition-all max-md:duration-300 ${isMobileOpen ? 'max-md:opacity-100 max-md:visible' : 'max-md:opacity-0 max-md:invisible'}`}
                onClick={closeMenu}
            />

            {/* Саме меню */}
            <aside className={`w-[10%] min-w-[170px] shrink-0 py-[15px] sticky top-0 h-screen box-border flex flex-col max-md:w-full max-md:min-w-auto max-md:h-auto max-md:max-h-[75vh] max-md:fixed max-md:top-0 max-md:left-0 max-md:z-[2000] max-md:bg-bg-box max-md:border-b max-md:border-border max-md:pt-[55px] max-md:px-[10px] max-md:pb-[15px] max-md:transition-transform max-md:duration-300 max-md:overflow-y-auto max-md:shadow-none ${isMobileOpen ? 'max-md:translate-y-0 max-md:shadow-[0_4px_20px_rgba(0,0,0,0.5)]' : 'max-md:-translate-y-full'}`}>
                <Link to="/" className="block font-bold text-[20px] text-text-main no-underline mb-[25px] pl-[10px] max-md:hidden" onClick={closeMenu}>
                    {APP_NAME}
                </Link>

                {isMobile && (
                    <div className="block w-full mb-[10px] box-border [&_.tetrone-global-player]:mb-0 [&_.tetrone-global-player]:border-l-0 [&_.tetrone-global-player]:border-r-0 [&_.tetrone-global-player]:bg-bg-page">
                        <GlobalAudioPlayer />
                    </div>
                )}

                <nav className="flex flex-col gap-[2px]">
                    {user ? (
                        <>
                            <Link to="/" className={getLinkClass("/")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.home')}</span>
                            </Link>
                            <Link to={`/${user.username}`} className={getLinkClass(`/${user.username}`)} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.profile')}</span>
                            </Link>
                            <Link to="/messages" className={getLinkClass("/messages")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.messages')}</span>
                                {unreadMessagesCount > 0 && (<span className={badgeClass}>+{unreadMessagesCount}</span>)}
                            </Link>
                            <Link to="/friends" className={getLinkClass("/friends")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.friends')}</span>
                            </Link>
                            <Link to="/notifications" className={getLinkClass("/notifications")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.notifications')}</span>
                                {unreadCount > 0 && (<span className={badgeClass}>+{unreadCount}</span>)}
                            </Link>
                            <Link to="/activity" className={getLinkClass("/activity")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.activity')}</span>
                            </Link>
                            <Link to="/stickers-shop" className={getLinkClass("/stickers-shop")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.stickers_shop')}</span>
                            </Link>
                            <Link to="/spaces" className={getLinkClass("/spaces")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.spaces')}</span>
                            </Link>
                            <Link to="/settings" className={getLinkClass("/settings")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.settings')}</span>
                            </Link>

                            {user.role === userRole.Support && (
                                <>
                                    <hr className="w-full border-border my-[4px]" />
                                    <Link to="/support-panel" className={getLinkClass("/support-panel")} onClick={closeMenu}>
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.support_panel')}</span>
                                    </Link>
                                </>
                            )}

                            {user.role === userRole.Moderator && (
                                <>
                                    <hr className="w-full border-border my-[4px]" />
                                    <Link to="/moderation" className={getLinkClass("/moderation")} onClick={closeMenu}>
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.moderator_panel')}</span>
                                    </Link>
                                </>
                            )}

                            {user.role >= userRole.Admin && (
                                <>
                                    <hr className="w-full border-border my-[4px]" />
                                    <Link to="/control-panel" className={getLinkClass("/control-panel")} onClick={closeMenu}>
                                        <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('common.admin_panel')}</span>
                                    </Link>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            <Link to="/login" className={getLinkClass("/login")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('action.login')}</span>
                            </Link>
                            <Link to="/register" className={getLinkClass("/register")} onClick={closeMenu}>
                                <span className="whitespace-nowrap overflow-hidden text-ellipsis">{t('action.register')}</span>
                            </Link>
                        </>
                    )}
                </nav>

                {user && (
                    <div className="mt-auto pt-[10px] border-t border-dashed border-border max-md:flex max-md:items-center max-md:justify-between max-md:flex-row max-md:pt-[10px] max-md:mt-[10px]">
                        <Link to={`/${user.username}`} className="flex items-center no-underline mb-[8px] max-md:mb-0 max-md:flex-1 max-md:overflow-hidden" onClick={closeMenu}>
                            <Avatar
                                user={user}
                                className="w-[24px] h-[24px] mr-[6px] object-cover bg-bg-page border border-border rounded-none"
                            />
                            <div className="text-[11px] text-text-main font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">
                                {user.first_name || user.username}
                            </div>
                        </Link>
                        <button onClick={handleLogout} className="bg-transparent border-none text-text-muted text-[11px] cursor-pointer p-[4px] text-left transition-colors hover:text-theme-error max-md:bg-[rgba(230,70,70,0.1)] max-md:text-theme-error max-md:border max-md:border-theme-error max-md:py-[4px] max-md:px-[8px] max-md:text-center max-md:hover:bg-theme-error max-md:hover:text-white">
                            {t('action.logout')}
                        </button>
                    </div>
                )}

                {!user && (
                    <div className="mt-auto pt-[10px] border-t border-dashed border-border text-[10px] text-text-muted text-center max-md:pt-[10px] max-md:mt-[10px]">
                        {t('sidebar.guest.view_like_guest')}
                    </div>
                )}
            </aside>
        </>
    );
};

export default memo(LeftSidebar);