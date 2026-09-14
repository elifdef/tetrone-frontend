import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/admin.service';
import { notifyError } from '../common/Notify';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Avatar from '../ui/Avatar';
import { useSocket } from '../../context/SocketContext';
import OnlineUsersModal from '../modals/OnlineUsersModal';
import InfoBox from '../ui/InfoBox';

const PIE_COLORS = [
    'var(--theme-link)',
    'var(--theme-success)',
    'var(--theme-btn-warning-bg)',
    'var(--theme-error)',
    'var(--theme-text-muted)'
];

export default function Dashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
    const [ping, setPing] = useState(0);
    const { socket } = useSocket();

    const fetchStats = useCallback(() => {
        setLoading(true);
        AdminService.getDashboardStats()
        .onSuccess((res) => {
            setStats(res.data);
            setLoading(false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setLoading(false);
        });
    }, [t]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    useEffect(() => {
        if (!socket) return;
        const pingInterval = setInterval(() => {
            const start = Date.now();
            socket.emit('admin_ping', () => setPing(Date.now() - start));
        }, 2000);
        return () => clearInterval(pingInterval);
    }, [socket]);

    useEffect(() => {
        if (!socket) return;
        const handleServerStats = (metrics) => {
            setStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    server: {
                        ...prev.server,
                        cpu_load: parseFloat(metrics.cpu_usage || 0).toFixed(1),
                        memory_percent: parseFloat(metrics.memory_usage || 0).toFixed(1),
                        memory_total_gb: metrics.memory_total_gb,
                        disk_percent: parseFloat(metrics.disk_percent || 0).toFixed(1),
                        disk_free_gb: metrics.disk_free_gb,
                        uptime: metrics.uptime
                    }
                };
            });
        };

        const handleUserOnline = (user) => {
            setStats(prev => {
                if (!prev) return prev;
                if (prev.realtime.recent_users.some(u => u.id === user.id)) return prev;
                return {
                    ...prev,
                    realtime: {
                        online_count: prev.realtime.online_count + 1,
                        recent_users: [user, ...prev.realtime.recent_users]
                    }
                };
            });
        };

        const handleUserOffline = (data) => {
            setStats(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    realtime: {
                        online_count: Math.max(0, prev.realtime.online_count - 1),
                        recent_users: prev.realtime.recent_users.filter(u => u.id !== data.user_id)
                    }
                };
            });
        };

        socket.on('admin_server_stats', handleServerStats);
        socket.on('admin_user_online', handleUserOnline);
        socket.on('admin_user_offline', handleUserOffline);

        return () => {
            socket.off('admin_server_stats', handleServerStats);
            socket.off('admin_user_online', handleUserOnline);
            socket.off('admin_user_offline', handleUserOffline);
        };
    }, [socket]);

    const chartsAndDemographics = useMemo(() => {
        if (!stats) return null;

        const hasBacklog = (stats.content_health.unchecked_posts + stats.content_health.pending_reports) > 0;

        return (
            <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                    <div className="bg-bg-box border border-border !rounded-none">
                        <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                            {t('admin.dashboard.demographics')}
                        </div>
                        <div className="p-[10px] flex gap-[10px]">
                            <div className="flex-1 h-[160px]">
                                <h4 className="text-center text-text-muted text-[10px] m-0 mb-[5px] uppercase">{t('admin.dashboard.countries')}</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.demographics.countries} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2} dataKey="value" nameKey="country" stroke="var(--theme-border)">
                                            {stats.demographics.countries.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg-box)', border: '1px solid var(--theme-border)', borderRadius: '0', fontSize: '11px', color: 'var(--theme-text-main)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex-1 h-[160px]">
                                <h4 className="text-center text-text-muted text-[10px] m-0 mb-[5px] uppercase">{t('admin.dashboard.age')}</h4>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={stats.demographics.age_cohorts} cx="50%" cy="50%" innerRadius={30} outerRadius={60} paddingAngle={2} dataKey="value" nameKey="age_group" stroke="var(--theme-border)">
                                            {stats.demographics.age_cohorts.map((entry, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--theme-bg-box)', border: '1px solid var(--theme-border)', borderRadius: '0', fontSize: '11px', color: 'var(--theme-text-main)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="bg-bg-box border border-border !rounded-none">
                        <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                            {t('admin.dashboard.content_health')}
                        </div>
                        <div className="p-[15px] flex flex-col justify-center h-[180px] gap-[20px]">
                            <div>
                                <div className="flex justify-between text-[10px] uppercase font-bold mb-[6px]">
                                    <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                                        <span className="text-text-muted">{t('admin.dashboard.engagement_rate')}</span>
                                        <div className="absolute left-0 top-full mt-[5px] hidden group-hover:block w-[250px] z-[50] font-normal normal-case tracking-normal">
                                            <InfoBox title={t('admin.dashboard.engagement_rate')} text={t('admin.dashboard.er_desc')} />
                                        </div>
                                    </div>
                                    <span className="text-theme-link">{stats.content_health.engagement_rate} {t('admin.dashboard.actions_per_post')}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-[10px] uppercase font-bold mb-[4px]">
                                    <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                                        <span className="text-text-muted">{t('admin.dashboard.media_richness')}</span>
                                        <div className="absolute left-0 top-full mt-[5px] hidden group-hover:block w-[250px] z-[50] font-normal normal-case tracking-normal">
                                            <InfoBox title={t('admin.dashboard.media_richness')} text={t('admin.dashboard.media_desc')} />
                                        </div>
                                    </div>
                                    <span className="text-[#e5a43b]">{stats.content_health.media_percent}%</span>
                                </div>
                                <div className="bg-bg-page border border-border h-[8px] w-full !rounded-none relative">
                                    <div className="h-full bg-[#e5a43b] transition-all" style={{ width: `${stats.content_health.media_percent}%` }}></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-[10px] border-t border-border pt-[10px]">
                                <div>
                                    <div className="text-text-muted text-[10px] uppercase font-bold mb-[2px]">
                                        <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                                            {t('admin.dashboard.discussion_depth')}
                                            {/* ФІКС: додано font-normal normal-case tracking-normal */}
                                            <div className="absolute left-0 top-full mt-[5px] hidden group-hover:block w-[200px] z-[50] font-normal normal-case tracking-normal">
                                                <InfoBox title={t('admin.dashboard.discussion_depth')} text={t('admin.dashboard.discussion_desc')} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[14px] font-bold text-theme-success">{stats.content_health.avg_comments}</div>
                                </div>
                                <div>
                                    <div className="text-text-muted text-[10px] uppercase font-bold mb-[2px]">{t('admin.dashboard.moderation_backlog')}</div>
                                    <div className={`text-[12px] font-bold ${hasBacklog ? 'text-theme-error' : 'text-theme-success'}`}>
                                        {stats.content_health.unchecked_posts} {t('admin.dashboard.posts_short')} / {stats.content_health.pending_reports} {t('admin.dashboard.reports_short')}
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                    <div className="bg-bg-box border border-border !rounded-none">
                        <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                            {t('admin.dashboard.registrations_chart')}
                        </div>
                        <div className="p-[10px]">
                            <div className="h-[200px] mt-[10px]">
                                <ResponsiveContainer>
                                    <LineChart data={stats.charts.registrations} margin={{top: 5, right: 5, bottom: 0, left: -20}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false}/>
                                        <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} tickMargin={5}/>
                                        <YAxis stroke="var(--theme-text-muted)" fontSize={10} allowDecimals={false}/>
                                        <Tooltip contentClassName="bg-bg-box border border-border text-text-main shadow-sm !rounded-none"/>
                                        <Line type="monotone" dataKey="count" name={t('admin.dashboard.new_users')} stroke="#4bb34b" strokeWidth={2} dot={{r: 3}}/>
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="bg-bg-box border border-border !rounded-none">
                        <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                            {t('admin.dashboard.activity_chart')}
                        </div>
                        <div className="p-[10px]">
                            <div className="h-[200px] mt-[10px]">
                                <ResponsiveContainer>
                                    <BarChart data={stats.charts.content_activity} margin={{top: 5, right: 5, bottom: 0, left: -20}}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false}/>
                                        <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} tickMargin={5}/>
                                        <YAxis stroke="var(--theme-text-muted)" fontSize={10} allowDecimals={false}/>
                                        <Tooltip contentClassName="bg-bg-box border border-border text-text-main shadow-sm !rounded-none"/>
                                        <Legend wrapperStyle={{fontSize: '11px', color: 'var(--theme-text-main)'}}/>
                                        <Bar dataKey="posts" name={t('common.posts')} fill="#5d81ab" stackId="a"/>
                                        <Bar dataKey="comments" name={t('common.comments')} fill="#e5a43b" stackId="a"/>
                                        <Bar dataKey="reposts" name={t('common.reposts')} fill="#c95151" stackId="a"/>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    }, [stats, t]);

    if (loading && !stats) {
        return <div className="p-[15px] text-center text-text-muted italic">{t('common.loading')}</div>;
    }

    if (!stats) return null;

    const getPingColor = () => {
        if (ping < 50) return 'text-theme-success';
        if (ping < 150) return 'text-[#e5a43b]';
        return 'text-theme-error';
    };

    return (
        <div className="flex flex-col gap-[15px] font-tahoma text-[11px] text-text-main">
            <div className="grid grid-cols-2 md:grid-cols-4 bg-bg-box border border-border !rounded-none">
                <div className="p-[12px_10px] text-center border-b md:border-b-0 border-r border-border">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('admin.dashboard.active_users')}</div>
                    <div className="text-theme-link text-[18px] font-bold">{stats.audience.active}</div>
                </div>
                <div className="p-[12px_10px] text-center border-b md:border-b-0 md:border-r border-border">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('admin.dashboard.toxicity')}</div>
                    <div className="text-theme-error text-[18px] font-bold">{stats.audience.toxicity_percent}%</div>
                </div>
                <div className="p-[12px_10px] text-center border-r border-border">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('admin.dashboard.churn')}</div>
                    <div className="text-text-main text-[18px] font-bold">{stats.audience.churn_percent}%</div>
                </div>
                <div className="p-[12px_10px] text-center">
                    <div className="text-text-muted text-[11px] mb-[4px] relative">
                        <div className="group relative inline-block cursor-help border-b border-dashed border-text-muted">
                            {t('admin.dashboard.ugc')}
                            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-[5px] hidden group-hover:block w-[250px] z-[50] font-normal normal-case tracking-normal">
                                <InfoBox
                                    title={t('admin.dashboard.ugc_title')}
                                    text={t('admin.dashboard.ugc_desc')}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="text-theme-success text-[18px] font-bold">{stats.content_health.ugc_index}</div>
                </div>
            </div>

            {chartsAndDemographics}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                <div className="bg-bg-box border border-border !rounded-none">
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                        {t('admin.dashboard.server_health')}
                    </div>
                    <div className="p-[10px]">
                        <div className="mb-[12px]">
                            <div className="flex justify-between mb-[4px]">
                                <span>{t('admin.dashboard.cpu_load')}</span>
                                <span>{stats.server.cpu_load || 0}%</span>
                            </div>
                            <div className="bg-bg-page border border-border h-[8px] w-full !rounded-none">
                                <div className="h-full bg-theme-link transition-all duration-500 ease-in-out" style={{width: `${Math.min(stats.server.cpu_load || 0, 100)}%`}}></div>
                            </div>
                        </div>

                        <div className="mb-[12px]">
                            <div className="flex justify-between mb-[4px]">
                                <span>{t('admin.dashboard.ram_usage')} {stats.server.memory_total_gb ? `(${stats.server.memory_total_gb} GB)` : ''}</span>
                                <span>{stats.server.memory_percent || 0}%</span>
                            </div>
                            <div className="bg-bg-page border border-border h-[8px] w-full !rounded-none">
                                <div className="h-full bg-theme-success transition-all duration-500 ease-in-out" style={{width: `${Math.min(stats.server.memory_percent || 0, 100)}%`}}></div>
                            </div>
                        </div>

                        <div className="mb-[12px]">
                            <div className="flex justify-between mb-[4px]">
                                <span>{t('admin.dashboard.disk_usage')} ({stats.server.disk_free_gb || 0} GB {t('admin.dashboard.free')})</span>
                                <span>{stats.server.disk_percent || 0}%</span>
                            </div>
                            <div className="bg-bg-page border border-border h-[8px] w-full !rounded-none">
                                <div className="h-full bg-theme-error transition-all duration-500 ease-in-out" style={{width: `${Math.min(stats.server.disk_percent || 0, 100)}%`}}></div>
                            </div>
                        </div>

                        <div className="text-[10px] mt-[8px] pt-[8px] border-t border-border flex flex-col gap-[2px]">
                            <div className="flex justify-between border-b border-dotted border-border pb-[2px] last:border-b-0">
                                <span className="text-text-muted mr-[5px]">{t('admin.dashboard.os')}:</span>
                                <span>{stats.server.os}</span>
                            </div>
                            <div className="flex justify-between border-b border-dotted border-border pb-[2px] last:border-b-0">
                                <span className="text-text-muted mr-[5px]">{t('admin.dashboard.uptime')}:</span>
                                <span>{stats.server.uptime || '...'}</span>
                            </div>
                            <div className="flex justify-between border-b border-dotted border-border pb-[2px] last:border-b-0">
                                <span className="text-text-muted mr-[5px]">{t('admin.dashboard.ping')}:</span>
                                <strong className={`font-bold ${getPingColor()}`}>{ping} ms</strong>
                            </div>
                            <div className="flex justify-between border-b border-dotted border-border pb-[2px] last:border-b-0">
                                <span className="text-text-muted mr-[5px]">{t('admin.dashboard.php_version_label')}:</span>
                                <span>{stats.server.php_version}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-bg-box border border-border cursor-pointer hover:border-theme-link transition-colors !rounded-none" onClick={() => setIsOnlineModalOpen(true)}>
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                        <span>{t('admin.dashboard.users_online')}</span>
                        <span className="text-theme-link font-bold">{stats.realtime?.online_count || 0}</span>
                    </div>
                    <div className="p-0">
                        {!stats.realtime?.recent_users || stats.realtime.recent_users.length === 0 ? (
                            <div className="p-[15px] text-center text-text-muted italic">
                                {t('admin.dashboard.no_one_online')}
                            </div>
                        ) : (
                            <div className="max-h-[220px] overflow-y-auto">
                                {stats.realtime.recent_users.slice(0, 7).map(user => {
                                    const nameColor = user.personalization?.username_color;
                                    return (
                                        <div key={user.username} className="flex items-center p-[6px] border-b border-bg-page text-text-main no-underline hover:bg-bg-page transition-colors">
                                            <Avatar user={user} className="w-[32px] h-[32px] mr-[8px] border border-border !rounded-none"/>
                                            <div className="flex-1 flex flex-col">
                                                <span className="font-bold text-theme-link" style={nameColor ? {color: nameColor} : undefined}>
                                                    {user.first_name} {user.last_name}
                                                </span>
                                                <span className="text-text-muted text-[10px]">@{user.username}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <OnlineUsersModal
                isOpen={isOnlineModalOpen}
                onClose={() => setIsOnlineModalOpen(false)}
                users={stats.realtime?.recent_users || []}
            />
        </div>
    );
}