import { useTranslation } from "react-i18next";

export default function StatsSection({ users, posts, online })
{
    const { t } = useTranslation();

    return (<div className="tetrone-landing-stats-panel">
        <div className="tetrone-landing-stats-header">
            { t('main.landing_stats_title') }
        </div>
        <div className="tetrone-landing-stats-body">
            <div className="tetrone-landing-stat-item">
                <span className="tetrone-landing-stat-label">{ t('main.landing_stats_users') }:</span>
                <span className="tetrone-landing-stat-value">{ users }</span>
            </div>
            <div className="tetrone-landing-stat-item">
                <span className="tetrone-landing-stat-label">{ t('main.landing_stats_posts') }:</span>
                <span className="tetrone-landing-stat-value">{ posts }</span>
            </div>
            <div className="tetrone-landing-stat-item">
                <span className="tetrone-landing-stat-label">{ t('main.landing_stats_online') }:</span>
                <span className="tetrone-landing-stat-value tetrone-landing-stat-online">{ online }</span>
            </div>
        </div>
    </div>);
}