import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';

const StatCard = ({ title, value, trend, trendLabel }) => (
    <div className="bg-bg-page border border-border p-[10px] flex flex-col justify-between h-full">
        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-[5px]">{title}</div>
        <div className="text-[18px] font-bold text-theme-link mb-[5px]">{value}</div>
        {trend !== undefined && trend !== null && (
            <div className={`text-[10px] font-bold flex items-center gap-[4px] ${trend > 0 ? 'text-[#4bb34b]' : 'text-[#ff3347]'}`}>
                {trend > 0 ? '▲' : '▼'} {Math.abs(trend)}% <span className="text-text-muted font-normal ml-[2px]">{trendLabel}</span>
            </div>
        )}
    </div>
);

const StatBar = ({ label, percentage, count, color = '#5b9bd5' }) => (
    <div className="mb-[8px] last:mb-0">
        <div className="flex justify-between text-[10px] mb-[2px]">
            <span className="text-text-main">{label}</span>
            <span className="text-text-muted font-bold">{count} ({percentage}%)</span>
        </div>
        <div className="h-[4px] w-full bg-[rgba(128,128,128,0.1)] overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${percentage}%`, backgroundColor: color }}></div>
        </div>
    </div>
);

const SpaceStatsTab = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!space) return;
        const fetchStats = async () => {
            try {
                const res = await SpaceService.getSpaceStats(space.username);
                if (res.stats) setStats(res.stats);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [space]);

    if (!space) return null;
    if (loading) return <div className="p-[20px] text-center text-text-muted bg-bg-box border border-border">{t('common.loading')}</div>;
    if (!stats) return null;

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="bg-theme-header-bg border border-border p-[10px] flex justify-between items-center">
                <div>
                    <h2 className="m-0 text-[13px] font-bold text-theme-link">{t('spaces.stats_title')}</h2>
                    <div className="text-[10px] text-text-muted mt-[2px]">{t('spaces.stats_subtitle')}</div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
                <StatCard title={t('spaces.stat_total_members')} value={stats.total_members} trend={stats.member_trend} trendLabel={t('spaces.stat_vs_last_week')} />
                <StatCard title={t('spaces.stat_engagement_rate')} value={`${stats.engagement_rate}%`} />
                <StatCard title={t('spaces.stat_posts_today')} value={stats.posts_today} trend={stats.activity_trend} trendLabel={t('spaces.stat_vs_yesterday')} />
                <StatCard title={t('spaces.stat_dau')} value={stats.dau} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                <div className="bg-bg-box border border-border p-[15px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">{t('spaces.stat_content_velocity')}</div>
                    <div className="flex gap-[15px]">
                        <div className="flex-1 flex flex-col justify-center items-center p-[10px] bg-bg-page border border-border">
                            <span className="text-[20px] font-bold text-text-main">{stats.posts_today}</span>
                            <span className="text-[10px] text-text-muted text-center mt-[4px]">{t('spaces.stat_posts_created')}</span>
                        </div>
                        <div className="flex-1 flex flex-col justify-center items-center p-[10px] bg-bg-page border border-border">
                            <span className="text-[20px] font-bold text-text-main">{stats.comments_today}</span>
                            <span className="text-[10px] text-text-muted text-center mt-[4px]">{t('spaces.stat_comments_written')}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-bg-box border border-border p-[15px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">{t('spaces.stat_audience_segmentation')}</div>
                    <div>
                        {stats.demographics.map((item, idx) => (
                            <StatBar key={idx} label={item.label} percentage={item.percentage} count={item.count} color={item.color} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpaceStatsTab;