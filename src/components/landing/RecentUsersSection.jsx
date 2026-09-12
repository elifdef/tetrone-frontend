import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import Avatar from "../ui/Avatar";

export default function RecentUsersSection({ users }) {
    const { t } = useTranslation();

    if (!users || users.length === 0) return null;

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
                        {/* Аватар з класичною 1px рамкою ВК */}
                        <Avatar
                            user={user}
                            className="w-[28px] h-[28px] object-cover shrink-0 border border-border p-[1px] rounded-[1px]"
                        />
                        <span className="whitespace-nowrap overflow-hidden text-ellipsis font-bold" title={`${user.first_name} ${user.last_name}`}>
                            {user.first_name} {user.last_name}
                        </span>
                    </Link>
                ))}
            </div>
        </div>
    );
}