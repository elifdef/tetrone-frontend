import {useState, useEffect, useCallback} from 'react';
import {useTranslation} from 'react-i18next';
import AdminService from '../../services/admin.service';
import {notifyError} from '../common/Notify';
import {LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import Avatar from '../ui/Avatar';
import {useSocket} from '../../context/SocketContext';
import OnlineUsersModal from '../modals/OnlineUsersModal';

export default function Dashboard()
{
    const {t} = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
    const [ping, setPing] = useState(0);
    const {socket} = useSocket();
    const fetchStats = useCallback(() =>
    {
        setLoading(true);
        AdminService.getDashboardStats()
        .onSuccess((res) =>
        {
            setStats(res.data);
            setLoading(false);
        })
        .onError((err) =>
        {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setLoading(false);
        });
    }, [t]);

    useEffect(() =>
    {
        fetchStats();
    }, [fetchStats]);

    useEffect(() =>
    {
        if (!socket) return;

        const pingInterval = setInterval(() =>
        {
            const start = Date.now();
            socket.emit('admin_ping', () =>
            {
                setPing(Date.now() - start);
            });
        }, 2000);

        return () => clearInterval(pingInterval);
    }, [socket]);

    useEffect(() =>
    {
        if (!socket) return;

        const handleServerStats = (metrics) =>
        {
            setStats(prev =>
            {
                if (!prev) return prev;
                return {
                    ...prev,
                    server: {
                        ...prev.server,
                        cpu_load:        parseFloat(metrics.cpu_usage || 0).toFixed(1),
                        memory_percent:  parseFloat(metrics.memory_usage || 0).toFixed(1),
                        memory_total_gb: metrics.memory_total_gb,
                        disk_percent:    parseFloat(metrics.disk_percent || 0).toFixed(1),
                        disk_free_gb:    metrics.disk_free_gb,
                        uptime:          metrics.uptime
                    }
                };
            });
        };

        const handleUserOnline = (user) =>
        {
            setStats(prev =>
            {
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

        const handleUserOffline = (data) =>
        {
            setStats(prev =>
            {
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

        const handleNewContent = (data) =>
        {
            setStats(prev =>
            {
                if (!prev) return prev;

                const newSummary = {
                    ...prev.summary,
                    posts:    data.type === 'post' ? prev.summary.posts + 1 : prev.summary.posts,
                    comments: data.type === 'comment' ? prev.summary.comments + 1 : prev.summary.comments,
                    reposts:  data.type === 'repost' ? prev.summary.reposts + 1 : prev.summary.reposts,
                };

                const newContentActivity = [...prev.charts.content_activity];
                if (newContentActivity.length > 0)
                {
                    const lastIndex = newContentActivity.length - 1;
                    const todayData = {...newContentActivity[lastIndex]};

                    if (data.type === 'post') todayData.posts += 1;
                    if (data.type === 'comment') todayData.comments += 1;
                    if (data.type === 'repost') todayData.reposts += 1;

                    newContentActivity[lastIndex] = todayData;
                }

                return {
                    ...prev,
                    summary: newSummary,
                    charts:  {
                        ...prev.charts,
                        content_activity: newContentActivity
                    }
                };
            });
        };

        socket.on('admin_server_stats', handleServerStats);
        socket.on('admin_user_online', handleUserOnline);
        socket.on('admin_user_offline', handleUserOffline);
        socket.on('admin_new_content', handleNewContent);

        return () =>
        {
            socket.off('admin_server_stats', handleServerStats);
            socket.off('admin_user_online', handleUserOnline);
            socket.off('admin_user_offline', handleUserOffline);
            socket.off('admin_new_content', handleNewContent);
        };
    }, [socket]);

    if (loading && !stats)
    {
        return <div className="p-[15px] text-center text-text-muted">{t('common.loading')}</div>;
    }

    if (!stats) return null;

    const getPingColor = () =>
    {
        if (ping < 50) return 'text-theme-success';
        if (ping < 150) return 'text-[#F1C40F]';
        return 'text-theme-error';
    };

    return (
        <div className="flex flex-col gap-[15px] font-tahoma text-[11px] text-text-main">
            <div className="grid grid-cols-2 md:grid-cols-4 bg-bg-box border border-border">
                <div className="p-[12px_10px] text-center border-b md:border-b-0 border-r border-border">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('common.users')}</div>
                    <div className="text-theme-link text-[18px] font-bold">{stats.summary.users}</div>
                </div>
                <div className="p-[12px_10px] text-center border-b md:border-b-0 md:border-r border-border">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('common.posts')}</div>
                    <div className="text-theme-link text-[18px] font-bold">{stats.summary.posts}</div>
                </div>
                <div className="p-[12px_10px] text-center border-r border-border">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('common.reposts')}</div>
                    <div className="text-theme-link text-[18px] font-bold">{stats.summary.reposts}</div>
                </div>
                <div className="p-[12px_10px] text-center">
                    <div className="text-text-muted text-[11px] mb-[4px]">{t('common.comments')}</div>
                    <div className="text-theme-link text-[18px] font-bold">{stats.summary.comments}</div>
                </div>
            </div>

            {/* 2 Колонки: Сервер та Онлайн */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                {/* Стан сервера */}
                <div className="bg-bg-box border border-border">
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                        {t('admin.dashboard.server_health')}
                    </div>
                    <div className="p-[10px]">
                        <div className="mb-[12px]">
                            <div className="flex justify-between mb-[4px]">
                                <span>{t('admin.dashboard.cpu_load')}</span>
                                <span>{stats.server.cpu_load || 0}%</span>
                            </div>
                            <div className="bg-bg-page border border-border h-[8px] w-full">
                                <div className="h-full bg-[#5b9bd5] transition-all duration-500 ease-in-out" style={{width: `${Math.min(stats.server.cpu_load || 0, 100)}%`}}></div>
                            </div>
                        </div>

                        <div className="mb-[12px]">
                            <div className="flex justify-between mb-[4px]">
                                <span>{t('admin.dashboard.ram_usage')} {stats.server.memory_total_gb ? `(${stats.server.memory_total_gb} GB)` : ''}</span>
                                <span>{stats.server.memory_percent || 0}%</span>
                            </div>
                            <div className="bg-bg-page border border-border h-[8px] w-full">
                                <div className="h-full bg-[#4bb34b] transition-all duration-500 ease-in-out" style={{width: `${Math.min(stats.server.memory_percent || 0, 100)}%`}}></div>
                            </div>
                        </div>

                        <div className="mb-[12px]">
                            <div className="flex justify-between mb-[4px]">
                                <span>{t('admin.dashboard.disk_usage')} ({stats.server.disk_free_gb || 0} GB {t('admin.dashboard.free')})</span>
                                <span>{stats.server.disk_percent || 0}%</span>
                            </div>
                            <div className="bg-bg-page border border-border h-[8px] w-full">
                                <div className="h-full bg-[#e64646] transition-all duration-500 ease-in-out" style={{width: `${Math.min(stats.server.disk_percent || 0, 100)}%`}}></div>
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
                            <div className="flex justify-between border-b border-dotted border-border pb-[2px] last:border-b-0">
                                <span className="text-text-muted mr-[5px]">{t('admin.dashboard.db_version_label')}:</span>
                                <span>{stats.server.db_info.driver} {stats.server.db_info.version}</span>
                            </div>
                            <div className="flex justify-between border-b border-dotted border-border pb-[2px] last:border-b-0">
                                <span className="text-text-muted mr-[5px]">{t('admin.dashboard.db_size_label')}:</span>
                                <span>{stats.server.db_info.size_mb} MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Користувачі онлайн */}
                <div className="bg-bg-box border border-border cursor-pointer hover:border-theme-link transition-colors" onClick={() => setIsOnlineModalOpen(true)}>
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                        <span>{t('admin.dashboard.users_online')}</span>
                        <span className="text-theme-link font-bold">{stats.realtime?.online_count || 0}</span>
                    </div>
                    <div className="p-0">
                        {!stats.realtime?.recent_users || stats.realtime.recent_users.length === 0 ? (
                            <div className="p-[15px] text-center text-text-muted">
                                {t('admin.dashboard.no_one_online')}
                            </div>
                        ) : (
                            <div className="max-h-[220px] overflow-y-auto">
                                {stats.realtime.recent_users.slice(0, 7).map(user =>
                                {
                                    const nameColor = user.personalization?.username_color;
                                    return (
                                        <div key={user.username} className="flex items-center p-[6px] border-b border-bg-page text-text-main no-underline hover:bg-bg-page transition-colors">
                                            <Avatar user={user} className="w-[32px] h-[32px] mr-[8px] border border-border"/>
                                            <div className="flex-1 flex flex-col">
                                                <span className="font-bold text-theme-link" style={nameColor ? {color: nameColor} : undefined}>
                                                    {user.first_name} {user.last_name}
                                                </span>
                                                <span className="text-text-muted text-[10px]">@{user.username}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                {stats.realtime.recent_users.length > 7 && (
                                    <div className="p-[8px] text-center text-theme-link border-t border-border bg-bg-box hover:bg-bg-page transition-colors">
                                        {t('common.show_more')} (+{stats.realtime.recent_users.length - 7})
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Графіки */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[15px]">
                <div className="bg-bg-box border border-border">
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
                                    <Tooltip contentClassName="bg-bg-box border border-border text-text-main shadow-sm"/>
                                    <Line type="monotone" dataKey="count" name={t('admin.dashboard.new_users')} stroke="#4bb34b" strokeWidth={2} dot={{r: 3}}/>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="bg-bg-box border border-border">
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
                                    <Tooltip contentClassName="bg-bg-box border border-border text-text-main shadow-sm"/>
                                    <Legend wrapperStyle={{fontSize: '11px', color: 'var(--theme-text-main)'}}/>
                                    <Bar dataKey="posts" name={t('common.posts')} fill="#5b9bd5" stackId="a"/>
                                    <Bar dataKey="comments" name={t('common.comments')} fill="#d39e00" stackId="a"/>
                                    <Bar dataKey="reposts" name={t('common.reposts')} fill="#e64646" stackId="a"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
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