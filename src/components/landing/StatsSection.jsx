import { useTranslation } from "react-i18next";

export default function StatsSection({ users, posts, online }) {
    const { t } = useTranslation();

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-input-bg text-text-main font-bold py-[6px] px-[10px] text-[11px] border-b border-border">
                {t('main.landing_stats_title')}
            </div>

            <div className="p-[10px] flex flex-col gap-[8px]">
                <div className="flex justify-between text-[11px]">
                    <span className="text-text-muted">{t('main.landing_stats_users')}:</span>
                    <span className="font-bold text-text-main">{users}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                    <span className="text-text-muted">{t('main.landing_stats_posts')}:</span>
                    <span className="font-bold text-text-main">{posts}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                    <span className="text-text-muted">{t('main.landing_stats_online')}:</span>
                    <span className="font-bold text-theme-success">{online}</span>
                </div>
            </div>
        </div>
    );
}