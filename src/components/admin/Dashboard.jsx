import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/admin.service';
import { notifyError } from '../common/Notify';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Avatar from '../ui/Avatar';
import { useSocket } from '../../context/SocketContext';
import OnlineUsersModal from '../modals/OnlineUsersModal';

export default function Dashboard()
{
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
    const [ping, setPing] = useState(0);
    const { socket } = useSocket();

    const fetchStats = useCallback(async () =>
    {
        setLoading(true);
        const res = await AdminService.getDashboardStats();

        if (res)
        {
            setStats(res.data);
        }
        else
        {
            notifyError(t('error.load_failed'));
        }

        setLoading(false);
    }, [t]);

    useEffect(() =>
    {
        fetchStats();
    }, [fetchStats]);

    useEffect(() =>
    {
        if (!socket)
        {
            return;
        }

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
        if (!socket)
        {
            return;
        }

        const handleServerStats = (metrics) =>
        {
            setStats(prev =>
            {
                if (!prev)
                {
                    return prev;
                }
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

        const handleUserOnline = (user) =>
        {
            setStats(prev =>
            {
                if (!prev)
                {
                    return prev;
                }
                if (prev.realtime.recent_users.some(u => u.id === user.id))
                {
                    return prev;
                }

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
                if (!prev)
                {
                    return prev;
                }
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
                if (!prev)
                {
                    return prev;
                }

                const newSummary = {
                    ...prev.summary,
                    posts: data.type === 'post' ? prev.summary.posts + 1 : prev.summary.posts,
                    comments: data.type === 'comment' ? prev.summary.comments + 1 : prev.summary.comments,
                    reposts: data.type === 'repost' ? prev.summary.reposts + 1 : prev.summary.reposts,
                };

                const newContentActivity = [...prev.charts.content_activity];
                if (newContentActivity.length > 0)
                {
                    const lastIndex = newContentActivity.length - 1;
                    const todayData = { ...newContentActivity[lastIndex] };

                    if (data.type === 'post')
                    {
                        todayData.posts += 1;
                    }
                    if (data.type === 'comment')
                    {
                        todayData.comments += 1;
                    }
                    if (data.type === 'repost')
                    {
                        todayData.reposts += 1;
                    }

                    newContentActivity[lastIndex] = todayData;
                }

                return {
                    ...prev,
                    summary: newSummary,
                    charts: {
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
        return <div className="tetrone-empty-state">{ t('common.loading') }</div>;
    }

    if (!stats)
    {
        return null;
    }

    const getPingClass = () =>
    {
        if (ping < 50)
        {
            return 'tetrone-ping-good';
        }
        if (ping < 150)
        {
            return 'tetrone-ping-warn';
        }
        return 'tetrone-ping-error';
    };

    return (
        <div className="tetrone-admin-container">
            <div className="tetrone-admin-stats-row">
                <div className="tetrone-admin-stat-item">
                    <div className="tetrone-admin-stat-title">{ t('common.users') }</div>
                    <div className="tetrone-admin-stat-count">{ stats.summary.users }</div>
                </div>
                <div className="tetrone-admin-stat-item">
                    <div className="tetrone-admin-stat-title">{ t('common.posts') }</div>
                    <div className="tetrone-admin-stat-count">{ stats.summary.posts }</div>
                </div>
                <div className="tetrone-admin-stat-item">
                    <div className="tetrone-admin-stat-title">{ t('common.reposts') }</div>
                    <div className="tetrone-admin-stat-count">{ stats.summary.reposts }</div>
                </div>
                <div className="tetrone-admin-stat-item">
                    <div className="tetrone-admin-stat-title">{ t('common.comments') }</div>
                    <div className="tetrone-admin-stat-count">{ stats.summary.comments }</div>
                </div>
            </div>

            <div className="tetrone-admin-grid-2">
                <div className="tetrone-admin-block">
                    <div className="tetrone-admin-block-header">
                        { t('admin.dashboard.server_health') }
                    </div>
                    <div className="tetrone-admin-block-content">
                        <div className="tetrone-admin-progress-wrap">
                            <div className="tetrone-admin-progress-header">
                                <span>{ t('admin.dashboard.cpu_load') }</span>
                                <span>{ stats.server.cpu_load || 0 }%</span>
                            </div>
                            <div className="tetrone-admin-progress-track">
                                <div className="tetrone-admin-progress-bar bg-cpu"
                                     style={ { width: `${ Math.min(stats.server.cpu_load || 0, 100) }%` } }></div>
                            </div>
                        </div>

                        <div className="tetrone-admin-progress-wrap">
                            <div className="tetrone-admin-progress-header">
                                <span>{ t('admin.dashboard.ram_usage') } { stats.server.memory_total_gb ? `(${ stats.server.memory_total_gb } GB)` : '' }</span>
                                <span>{ stats.server.memory_percent || 0 }%</span>
                            </div>
                            <div className="tetrone-admin-progress-track">
                                <div className="tetrone-admin-progress-bar bg-ram"
                                     style={ { width: `${ Math.min(stats.server.memory_percent || 0, 100) }%` } }></div>
                            </div>
                        </div>

                        <div className="tetrone-admin-progress-wrap">
                            <div className="tetrone-admin-progress-header">
                                <span>{ t('admin.dashboard.disk_usage') } ({ stats.server.disk_free_gb || 0 } GB { t('admin.dashboard.free') })</span>
                                <span>{ stats.server.disk_percent || 0 }%</span>
                            </div>
                            <div className="tetrone-admin-progress-track">
                                <div className="tetrone-admin-progress-bar bg-disk"
                                     style={ { width: `${ Math.min(stats.server.disk_percent || 0, 100) }%` } }></div>
                            </div>
                        </div>

                        <div className="tetrone-admin-info-list tetrone-admin-info-list-compact">
                            <div className="tetrone-admin-info-row">
                                <span className="tetrone-admin-meta-label">{ t('admin.dashboard.os') }:</span>
                                <span>{ stats.server.os }</span>
                            </div>
                            <div className="tetrone-admin-info-row">
                                <span className="tetrone-admin-meta-label">{ t('admin.dashboard.uptime') }:</span>
                                <span>{ stats.server.uptime || '...' }</span>
                            </div>
                            <div className="tetrone-admin-info-row">
                                <span className="tetrone-admin-meta-label">{ t('admin.dashboard.ping') }:</span>
                                <strong className={ `tetrone-ping-indicator ${ getPingClass() }` }>{ ping } ms</strong>
                            </div>
                            <div className="tetrone-admin-info-row">
                                <span className="tetrone-admin-meta-label">{ t('admin.dashboard.php_version_label') }:</span>
                                <span>{ stats.server.php_version }</span>
                            </div>
                            <div className="tetrone-admin-info-row">
                                <span className="tetrone-admin-meta-label">{ t('admin.dashboard.db_version_label') }:</span>
                                <span>{ stats.server.db_info.driver } { stats.server.db_info.version }</span>
                            </div>
                            <div className="tetrone-admin-info-row">
                                <span className="tetrone-admin-meta-label">{ t('admin.dashboard.db_size_label') }:</span>
                                <span>{ stats.server.db_info.size_mb } MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="tetrone-admin-block tetrone-admin-block-clickable"
                     onClick={ () => setIsOnlineModalOpen(true) }>
                    <div className="tetrone-admin-block-header">
                        <span>{ t('admin.dashboard.users_online') }</span>
                        <span className="tetrone-admin-online-count">{ stats.realtime?.online_count || 0 }</span>
                    </div>
                    <div className="tetrone-admin-block-content tetrone-admin-block-content-no-padding">
                        { !stats.realtime?.recent_users || stats.realtime.recent_users.length === 0 ? (
                            <div className="tetrone-empty-state-compact">
                                { t('admin.dashboard.no_one_online') }
                            </div>
                        ) : (
                            <div className="tetrone-admin-online-list">
                                { stats.realtime.recent_users.slice(0, 7).map(user =>
                                {
                                    const nameColor = user.personalization?.username_color;
                                    return (
                                        <div key={ user.id } className="tetrone-admin-online-item">
                                            <Avatar user={ user } className="tetrone-admin-online-avatar"/>
                                            <div className="tetrone-admin-online-details">
                                                <span className="tetrone-admin-online-name"
                                                      style={ nameColor ? { color: nameColor } : undefined }>
                                                    { user.first_name } { user.last_name }
                                                </span>
                                                <span className="tetrone-admin-online-nick">@{ user.username }</span>
                                            </div>
                                        </div>
                                    );
                                }) }
                                { stats.realtime.recent_users.length > 7 && (
                                    <div className="tetrone-admin-online-more">
                                        { t('common.show_more') } (+{ stats.realtime.recent_users.length - 7 })
                                    </div>
                                ) }
                            </div>
                        ) }
                    </div>
                </div>
            </div>

            <div className="tetrone-admin-grid-2">
                <div className="tetrone-admin-block">
                    <div className="tetrone-admin-block-header">
                        { t('admin.dashboard.registrations_chart') }
                    </div>
                    <div className="tetrone-admin-block-content">
                        <div className="tetrone-admin-chart-wrap">
                            <ResponsiveContainer>
                                <LineChart data={ stats.charts.registrations }
                                           margin={ { top: 5, right: 5, bottom: 0, left: -20 } }>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)"
                                                   vertical={ false }/>
                                    <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={ 10 }
                                           tickMargin={ 5 }/>
                                    <YAxis stroke="var(--theme-text-muted)" fontSize={ 10 } allowDecimals={ false }/>
                                    <Tooltip contentClassName="admin-chart-tooltip"
                                             wrapperClassName="admin-chart-tooltip-wrapper"/>
                                    <Line type="monotone" dataKey="count" name={ t('admin.dashboard.new_users') }
                                          stroke="#4bb34b" strokeWidth={ 2 } dot={ { r: 3 } }/>
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="tetrone-admin-block">
                    <div className="tetrone-admin-block-header">
                        { t('admin.dashboard.activity_chart') }
                    </div>
                    <div className="tetrone-admin-block-content">
                        <div className="tetrone-admin-chart-wrap">
                            <ResponsiveContainer>
                                <BarChart data={ stats.charts.content_activity }
                                          margin={ { top: 5, right: 5, bottom: 0, left: -20 } }>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)"
                                                   vertical={ false }/>
                                    <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={ 10 }
                                           tickMargin={ 5 }/>
                                    <YAxis stroke="var(--theme-text-muted)" fontSize={ 10 } allowDecimals={ false }/>
                                    <Tooltip contentClassName="admin-chart-tooltip"
                                             wrapperClassName="admin-chart-tooltip-wrapper"/>
                                    <Legend wrapperClassName="admin-chart-legend"/>
                                    <Bar dataKey="posts" name={ t('common.posts') } fill="#5b9bd5" stackId="a"/>
                                    <Bar dataKey="comments" name={ t('common.comments') } fill="#d39e00" stackId="a"/>
                                    <Bar dataKey="reposts" name={ t('common.reposts') } fill="#e64646" stackId="a"/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <OnlineUsersModal
                isOpen={ isOnlineModalOpen }
                onClose={ () => setIsOnlineModalOpen(false) }
                users={ stats.realtime?.recent_users || [] }
            />
        </div>
    );
}