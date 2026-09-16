import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Avatar from "../ui/Avatar";

export default function RecentUsersSection({ users, isMobile }) {
    const { t } = useTranslation();

    if (!users || users.length === 0) return null;

    if (isMobile) {
        return (
            <div className="w-full bg-bg-box border border-border p-[15px]">
                <div className="text-center text-[12px] font-bold text-text-main mb-[15px] uppercase">
                    {t('main.landing_recent_users')}
                </div>
                <div className="flex justify-center items-start gap-[15px] overflow-hidden">
                    {users.slice(0, 5).map(user => (
                        <Link
                            to={`/${user.username}`}
                            key={user.username}
                            className="flex flex-col items-center gap-[6px] no-underline w-[52px] shrink-0"
                        >
                            <Avatar
                                user={user}
                                className="w-[48px] h-[48px] object-cover shrink-0 border border-border p-[1px]"
                            />
                            <span 
                                className="text-[9px] font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center hover:underline"
                                style={{ color: user.username_color }}
                            >
                                {user.first_name || user.username}
                            </span>
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    // ПК версія
    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-input-bg text-text-main font-bold py-[6px] px-[10px] text-[11px] border-b border-border">
                {t('main.landing_recent_users')}
            </div>
            <div className="p-[10px] flex flex-col gap-[8px]">
                {users.map(user => (
                    <Link
                        to={`/${user.username}`}
                        key={user.id}
                        className="flex items-center gap-[8px] no-underline text-theme-link text-[11px] hover:underline"
                    >
                        <Avatar
                            user={user}
                            className="w-[28px] h-[28px] object-cover shrink-0 border border-border p-[1px]"
                        />
                        <span 
                            className="whitespace-nowrap overflow-hidden text-ellipsis font-bold" 
                            title={`${user.first_name} ${user.last_name}`}
                            style={{ color: user.username_color || 'var(--theme-text-main)' }}
                        >
                            {user.first_name} {user.last_name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}