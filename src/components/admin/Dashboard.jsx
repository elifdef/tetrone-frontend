import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import AdminService from '../../services/admin.service';
import { notifyError } from '../common/Notify';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import Avatar from '../ui/Avatar';
import { useSocket } from '../../context/SocketContext';
import OnlineUsersModal from '../modals/OnlineUsersModal';

export default function Dashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isOnlineModalOpen, setIsOnlineModalOpen] = useState(false);
    const [ping, setPing] = useState(0); // ДОДАНО: Стейт для пінгу
    const { socket } = useSocket();

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const res = await AdminService.getDashboardStats();

        if (res.success) {
            setStats(res.data);
        } else {
            notifyError(res.message || t('error.load_failed'));
        }

        setLoading(false);
    }, [t]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    // Логіка для вимірювання пінгу
    useEffect(() => {
        if (!socket) return;
        const pingInterval = setInterval(() => {
            const start = Date.now();
            // Відправляємо пустий сигнал на сервер і чекаємо відповіді
            socket.emit('admin_ping', () => {
                setPing(Date.now() - start);
            });
        }, 2000); // Оновлюємо пінг кожні 2 секунди

        return () => clearInterval(pingInterval);
    }, [socket]);

    // Об'єднаний useEffect для всіх WebSocket подій
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
                        uptime: metrics.uptime // Зберігаємо аптайм
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

        const handleNewContent = (data) => {
            setStats(prev => {
                if (!prev) return prev;

                const newSummary = {
                    ...prev.summary,
                    posts: data.type === 'post' ? prev.summary.posts + 1 : prev.summary.posts,
                    comments: data.type === 'comment' ? prev.summary.comments + 1 : prev.summary.comments,
                    reposts: data.type === 'repost' ? prev.summary.reposts + 1 : prev.summary.reposts,
                };

                const newContentActivity = [...prev.charts.content_activity];
                if (newContentActivity.length > 0) {
                    const lastIndex = newContentActivity.length - 1;
                    const todayData = { ...newContentActivity[lastIndex] };

                    if (data.type === 'post') todayData.posts += 1;
                    if (data.type === 'comment') todayData.comments += 1;
                    if (data.type === 'repost') todayData.reposts += 1;

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

        return () => {
            socket.off('admin_server_stats', handleServerStats);
            socket.off('admin_user_online', handleUserOnline);
            socket.off('admin_user_offline', handleUserOffline);
            socket.off('admin_new_content', handleNewContent);
        };
    }, [socket]);

    if (loading && !stats) {
        return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    }

    if (!stats) return null;

    // Визначаємо колір пінгу (зелений < 50ms, жовтий < 150ms, червоний > 150ms)
    const pingColor = ping < 50 ? 'var(--theme-success)' : ping < 150 ? '#F1C40F' : 'var(--theme-danger)';

    return (
        <div className="admin-dashboard-wrapper">
            <div className="admin-stats-row admin-tables-row">
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('common.users')}</div>
                    <div className="admin-stats-value">{stats.summary.users}</div>
                </div>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('common.posts')}</div>
                    <div className="admin-stats-value">{stats.summary.posts}</div>
                </div>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('common.reposts')}</div>
                    <div className="admin-stats-value">{stats.summary.reposts}</div>
                </div>
                <div className="admin-stats-box">
                    <div className="admin-stats-label">{t('common.comments')}</div>
                    <div className="admin-stats-value">{stats.summary.comments}</div>
                </div>
            </div>

            <div className="admin-tables-row admin-infrastructure-row">
                <div className="admin-table-card admin-server-card">
                    <h3 className="admin-chart-title">{t('admin.dashboard.server_health')}</h3>

                    <div className="admin-server-metric">
                        <div className="admin-server-metric-header">
                            <span>{t('admin.dashboard.cpu_load')}</span>
                            <span>{stats.server.cpu_load || 0}%</span>
                        </div>
                        <div className="admin-progress-track">
                            <div
                                className="admin-progress-bar cpu"
                                style={{ '--progress-width': `${Math.min(stats.server.cpu_load || 0, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="admin-server-metric">
                        <div className="admin-server-metric-header">
                            <span>
                                {t('admin.dashboard.ram_usage')}
                                {stats.server.memory_total_gb ? ` (${stats.server.memory_total_gb} GB)` : ''}
                            </span>
                            <span>{stats.server.memory_percent || 0}%</span>
                        </div>
                        <div className="admin-progress-track">
                            <div
                                className="admin-progress-bar ram"
                                style={{ '--progress-width': `${Math.min(stats.server.memory_percent || 0, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* ВИПРАВЛЕНО: Повернув трек для диска */}
                    <div className="admin-server-metric">
                        <div className="admin-server-metric-header">
                            <span>{t('admin.dashboard.disk_usage')} ({stats.server.disk_free_gb || 0} GB {t('admin.dashboard.free')})</span>
                            <span>{stats.server.disk_percent || 0}%</span>
                        </div>
                        <div className="admin-progress-track">
                            <div
                                className="admin-progress-bar disk"
                                style={{ '--progress-width': `${Math.min(stats.server.disk_percent || 0, 100)}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="admin-server-info-row" style={{ marginTop: '20px' }}>
                        <span className="tetrone-label">ОС:</span>
                        <span className="tetrone-value" style={{ fontSize: '12px' }}>{stats.server.os}</span>
                    </div>

                    {/* ДОДАНО: Аптайм */}
                    <div className="admin-server-info-row">
                        <span className="tetrone-label">Uptime:</span>
                        <span className="tetrone-value">{stats.server.uptime || '...'}</span>
                    </div>

                    {/* ДОДАНО: Пінг */}
                    <div className="admin-server-info-row">
                        <span className="tetrone-label">Ping:</span>
                        <span className="tetrone-value" style={{ color: pingColor, fontWeight: 'bold' }}>{ping} ms</span>
                    </div>

                    <div className="admin-server-info-row">
                        <span className="tetrone-label">{t('admin.dashboard.version', { version: stats.server.php_version })}</span>
                    </div>

                    <div className="admin-server-info-row">
                        <span className="tetrone-label">
                            {t('admin.dashboard.db_info', { info: `${stats.server.db_info.driver} ${stats.server.db_info.version}` })}
                        </span>
                    </div>

                    <div className="admin-server-info-row">
                        <span className="tetrone-label">
                            {t('admin.dashboard.db_size', { size: stats.server.db_info.size_mb })}
                        </span>
                    </div>
                </div>

                <div
                    className="admin-table-card admin-online-card"
                    onClick={() => setIsOnlineModalOpen(true)}
                    style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                    title={t('admin.dashboard.users_online')}
                >
                    <h3 className="admin-chart-title">
                        {t('admin.dashboard.users_online')}
                        <span className="admin-online-badge">{stats.realtime?.online_count || 0}</span>
                    </h3>

                    {!stats.realtime?.recent_users || stats.realtime.recent_users.length === 0 ? (
                        <div className="tetrone-empty-state">{t('admin.dashboard.no_one_online')}</div>
                    ) : (
                        <div className="admin-online-list">
                            {stats.realtime.recent_users.slice(0, 7).map(user => {
                                const nameColor = user.personalization?.username_color;

                                return (
                                    <div key={user.id} className="admin-online-user">
                                        <Avatar
                                            user={user}
                                            className="admin-online-avatar"
                                        />
                                        <div className="admin-online-details">
                                            <span
                                                className="admin-online-name"
                                                style={nameColor ? { color: nameColor } : undefined}
                                            >
                                                {user.first_name} {user.last_name}
                                            </span>
                                            <span className="admin-online-nick">@{user.username}</span>
                                        </div>
                                        <div className="admin-online-indicator"></div>
                                    </div>
                                );
                            })}
                            {stats.realtime.recent_users.length > 7 && (
                                <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--theme-text-muted)', marginTop: '10px' }}>
                                    + ще {stats.realtime.recent_users.length - 7}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="admin-tables-row">
                <div className="admin-table-card admin-chart-card">
                    <h3 className="admin-chart-title">{t('admin.dashboard.registrations_chart')}</h3>
                    <div className="admin-chart-container">
                        <ResponsiveContainer>
                            <LineChart data={stats.charts.registrations} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} tickMargin={10} />
                                <YAxis stroke="var(--theme-text-muted)" fontSize={10} allowDecimals={false} />
                                <Tooltip contentClassName="admin-chart-tooltip" wrapperClassName="admin-chart-tooltip-wrapper" />
                                <Line
                                    type="monotone"
                                    dataKey="count"
                                    name={t('admin.dashboard.new_users')}
                                    stroke="var(--theme-success)"
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: 'var(--theme-success)' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="admin-table-card admin-chart-card">
                    <h3 className="admin-chart-title">{t('admin.dashboard.activity_chart')}</h3>
                    <div className="admin-chart-container">
                        <ResponsiveContainer>
                            <BarChart data={stats.charts.content_activity} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} tickMargin={10} />
                                <YAxis stroke="var(--theme-text-muted)" fontSize={10} allowDecimals={false} />
                                <Tooltip contentClassName="admin-chart-tooltip" wrapperClassName="admin-chart-tooltip-wrapper" />
                                <Legend wrapperClassName="admin-chart-legend" />
                                <Bar dataKey="posts" name={t('common.posts')} fill="#E67E22" />
                                <Bar dataKey="comments" name={t('common.comments')} fill="#F1C40F" />
                                <Bar dataKey="reposts" name={t('common.reposts')} fill="#E91E63" />
                            </BarChart>
                        </ResponsiveContainer>
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