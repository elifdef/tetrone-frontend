import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SpaceContext } from '@/context/space-context';
import SpaceService from '@/services/space.service';
import { notifyError } from '@/components/common/Notify';
import type { SpaceStatsData } from '@/types/space';

interface StatCardProps {
    title: string;
    value: string | number;
    trend?: number | null;
    trendLabel?: string;
}

const StatCard = ({ title, value, trend, trendLabel }: StatCardProps) => {
    const numericTrend = trend ?? 0;
    const isPositive = numericTrend > 0;
    const isNegative = numericTrend < 0;

    return (
        <div className="bg-bg-page border border-border p-[10px] flex flex-col justify-between h-full">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-[4px]">
                {title}
            </div>
            <div className="text-[18px] font-bold text-theme-link mb-[4px]">
                {value}
            </div>
            {trend !== undefined && trend !== null && (
                <div
                    className={`text-[10px] font-bold flex items-center gap-[4px] ${
                        isPositive ? 'text-[#4bb34b]' : isNegative ? 'text-[#ff3347]' : 'text-text-muted'
                    }`}
                >
                    {isPositive ? '▲' : isNegative ? '▼' : '•'} {Math.abs(numericTrend)}%
                    <span className="text-text-muted font-normal ml-[2px]">{trendLabel}</span>
                </div>
            )}
        </div>
    );
};

interface StatBarProps {
    label?: string;
    percentage: number;
    count: number;
    color?: string;
}

const StatBar = ({ label, percentage, count, color = '#5b9bd5' }: StatBarProps) => (
    <div className="mb-[8px] last:mb-0">
        <div className="flex justify-between text-[10px] mb-[2px]">
            <span className="text-text-main">{label}</span>
            <span className="text-text-muted font-bold">{count} ({percentage}%)</span>
        </div>
        <div className="h-[4px] w-full bg-[rgba(128,128,128,0.12)] overflow-hidden">
            <div
                className="h-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, percentage))}%`, backgroundColor: color }}
            />
        </div>
    </div>
);

const SpaceStatsTab = () => {
    const { t } = useTranslation();
    const { space } = useContext(SpaceContext);
    const [stats, setStats] = useState<SpaceStatsData | null>(null);
    const [loadedForUsername, setLoadedForUsername] = useState<string | null>(null);

    const spaceUsername = space?.username;

    useEffect(() => {
        if (!spaceUsername) return;

        let cancelled = false;

        SpaceService.getSpaceStats(spaceUsername)
            .onSuccess((res) => {
                if (!cancelled && res.stats) {
                    setStats(res.stats);
                }
            })
            .onError((err) => {
                if (!cancelled) {
                    notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
                }
            })
            .onFinally(() => {
                if (!cancelled) {
                    setLoadedForUsername(spaceUsername);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [spaceUsername, t]);

    const loading = Boolean(spaceUsername) && loadedForUsername !== spaceUsername;

    if (!space) return null;
    if (loading) {
        return (
            <div className="p-[20px] text-center text-text-muted bg-bg-box border border-border">
                {t('common.loading')}
            </div>
        );
    }
    if (!stats) return null;

    const maxDailyTotal = Math.max(
        1,
        ...(stats.daily_activity || []).map(
            (d) => (d.posts || 0) + (d.comments || 0) + (d.likes || 0) + (d.new_members || 0)
        )
    );

    const formatShortDate = (dateStr: string): string => {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        return parts.length === 3 ? `${parts[2]}.${parts[1]}` : dateStr;
    };

    const formatTime = (dateTimeStr: string | null): string => {
        if (!dateTimeStr) return '';
        const date = new Date(dateTimeStr);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex flex-col gap-[10px]">
            <div className="bg-theme-header-bg border border-border border-t-[2px] border-t-theme-link p-[5px_10px]">
                <h2 className="m-0 text-[11px] font-bold text-theme-link">{t('spaces.stats_title')}</h2>
                <div className="text-[10px] text-text-muted mt-[1px]">{t('spaces.stats_subtitle')}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px]">
                <StatCard
                    title={t('spaces.stat_total_members')}
                    value={stats.total_members}
                    trend={stats.member_trend}
                    trendLabel={t('spaces.stat_vs_last_week')}
                />
                <StatCard
                    title={t('spaces.stat_engagement_rate')}
                    value={`${stats.engagement_rate}%`}
                />
                <StatCard
                    title={t('spaces.stat_posts_today')}
                    value={stats.posts_today}
                    trend={stats.activity_trend}
                    trendLabel={t('spaces.stat_vs_yesterday')}
                />
                <StatCard
                    title={t('spaces.stat_dau')}
                    value={stats.dau}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                <div className="bg-bg-box border border-border p-[12px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">
                        {t('spaces.stat_content_velocity')}
                    </div>
                    <div className="grid grid-cols-3 gap-[8px]">
                        <div className="flex flex-col justify-center items-center p-[10px] bg-bg-page border border-border">
                            <span className="text-[18px] font-bold text-text-main">{stats.posts_today}</span>
                            <span className="text-[10px] text-text-muted text-center mt-[4px]">
                                {t('spaces.stat_posts_created')}
                            </span>
                        </div>
                        <div className="flex flex-col justify-center items-center p-[10px] bg-bg-page border border-border">
                            <span className="text-[18px] font-bold text-text-main">{stats.comments_today}</span>
                            <span className="text-[10px] text-text-muted text-center mt-[4px]">
                                {t('spaces.stat_comments_written')}
                            </span>
                        </div>
                        <div className="flex flex-col justify-center items-center p-[10px] bg-bg-page border border-border">
                            <span className="text-[18px] font-bold text-text-main">{stats.likes_today ?? 0}</span>
                            <span className="text-[10px] text-text-muted text-center mt-[4px]">
                                {t('spaces.stat_likes_today')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-bg-box border border-border p-[12px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">
                        {t('spaces.stat_audience_segmentation')}
                    </div>
                    {stats.demographics?.length > 0 ? (
                        stats.demographics.map((item, idx) => (
                            <StatBar
                                key={item.key || idx}
                                label={item.key ? t(`spaces.stat_segment_${item.key}`) : item.label}
                                percentage={item.percentage}
                                count={item.count}
                                color={item.color}
                            />
                        ))
                    ) : (
                        <div className="text-center text-text-muted py-[15px]">{t('spaces.list_empty')}</div>
                    )}
                </div>
            </div>

            {stats.daily_activity?.length > 0 && (
                <div className="bg-bg-box border border-border p-[12px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">
                        {t('spaces.stat_daily_activity')}
                    </div>
                    <div className="flex flex-col gap-[6px]">
                        {stats.daily_activity.map((day) => {
                            const total = (day.posts || 0) + (day.comments || 0) + (day.likes || 0) + (day.new_members || 0);
                            const widthPct = Math.round((total / maxDailyTotal) * 100);

                            return (
                                <div key={day.date} className="flex items-center gap-[10px] text-[10px]">
                                    <span className="w-[42px] shrink-0 font-bold text-text-muted">
                                        {formatShortDate(day.date)}
                                    </span>
                                    <div className="flex-1 h-[6px] bg-[rgba(128,128,128,0.12)] overflow-hidden">
                                        <div
                                            className="h-full bg-theme-link transition-all duration-300"
                                            style={{ width: `${widthPct}%` }}
                                        />
                                    </div>
                                    <div className="shrink-0 flex items-center gap-[8px] text-text-muted">
                                        <span title={t('spaces.stat_new_members')}>+{day.new_members}</span>
                                        <span>•</span>
                                        <span title={t('common.posts')}>{day.posts} {t('admin.dashboard.posts_short')}</span>
                                        <span>•</span>
                                        <span title={t('common.comments')}>{day.comments}</span>
                                        <span>•</span>
                                        <span title={t('common.likes')}>♥ {day.likes}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[10px]">
                <div className="bg-bg-box border border-border p-[12px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">
                        {t('spaces.stat_recent_joined')}
                    </div>
                    {stats.recent_joined?.length > 0 ? (
                        <div className="flex flex-col gap-[6px]">
                            {stats.recent_joined.map((member) => (
                                <div
                                    key={member.username}
                                    className="flex items-center justify-between gap-[8px] p-[6px_8px] bg-bg-page border border-border"
                                >
                                    <div className="flex items-center gap-[8px] min-w-0">
                                        <Link to={`/${member.username}`} className="shrink-0">
                                            <img
                                                src={member.avatar || '/default-avatar.png'}
                                                alt={member.username}
                                                className="w-[26px] h-[26px] object-cover border border-border"
                                            />
                                        </Link>
                                        <div className="min-w-0">
                                            <Link
                                                to={`/${member.username}`}
                                                className="font-bold text-[11px] text-theme-link hover:underline truncate block"
                                            >
                                                {member.first_name || member.username}
                                            </Link>
                                            <div className="text-[10px] text-text-muted">
                                                {t(`spaces.role_${member.role}`)}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-text-muted shrink-0">
                                        {formatTime(member.joined_at)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-text-muted text-[10px] py-[15px]">
                            {t('spaces.stat_recent_joined_empty')}
                        </div>
                    )}
                </div>

                <div className="bg-bg-box border border-border p-[12px]">
                    <div className="font-bold text-[11px] text-theme-link border-b border-border pb-[5px] mb-[10px]">
                        {t('spaces.stat_top_contributors')}
                    </div>
                    {stats.top_contributors?.length > 0 ? (
                        <div className="flex flex-col gap-[6px]">
                            {stats.top_contributors.map((author) => (
                                <div
                                    key={author.username}
                                    className="flex items-center justify-between gap-[8px] p-[6px_8px] bg-bg-page border border-border"
                                >
                                    <div className="flex items-center gap-[8px] min-w-0">
                                        <Link to={`/${author.username}`} className="shrink-0">
                                            <img
                                                src={author.avatar || '/default-avatar.png'}
                                                alt={author.username}
                                                className="w-[26px] h-[26px] object-cover border border-border"
                                            />
                                        </Link>
                                        <div className="min-w-0">
                                            <Link
                                                to={`/${author.username}`}
                                                className="font-bold text-[11px] text-theme-link hover:underline truncate block"
                                            >
                                                {author.first_name || author.username}
                                            </Link>
                                            <div className="text-[10px] text-text-muted">
                                                {author.posts_count} {t('admin.dashboard.posts_short')} • {author.comments_count} {t('common.comments').toLowerCase()}
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[11px] font-bold text-theme-link shrink-0">
                                        {author.total_actions} {t('spaces.stat_actions_count')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-text-muted text-[10px] py-[15px]">
                            {t('spaces.stat_top_contributors_empty')}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SpaceStatsTab;