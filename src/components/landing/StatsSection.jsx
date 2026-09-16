import { useTranslation } from "react-i18next";

export default function StatsSection({ users, posts, online, isMobile }) {
    const { t } = useTranslation();

    if (isMobile) {
        return (
            <div className="flex gap-[8px] w-full justify-between shrink-0">
                <div className="flex-1 bg-bg-box border border-border p-[10px_5px] flex flex-col items-center justify-center">
                    <span className="text-[16px] font-bold text-text-main leading-none mb-[2px]">{users}</span>
                    <span className="text-[9px] text-text-muted uppercase tracking-[0.5px] text-center">{t('main.landing_stats_users')}</span>
                </div>
                <div className="flex-1 bg-bg-box border border-border p-[10px_5px] flex flex-col items-center justify-center">
                    <span className="text-[16px] font-bold text-text-main leading-none mb-[2px]">{posts}</span>
                    <span className="text-[9px] text-text-muted uppercase tracking-[0.5px] text-center">{t('main.landing_stats_posts')}</span>
                </div>
                <div className="flex-1 bg-theme-success/10 border border-theme-success/30 p-[10px_5px] flex flex-col items-center justify-center">
                    <span className="text-[16px] font-bold text-theme-success leading-none mb-[2px]">{online}</span>
                    <span className="text-[9px] text-theme-success uppercase tracking-[0.5px] text-center">{t('main.landing_stats_online')}</span>
                </div>
            </div>
        );
    }

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