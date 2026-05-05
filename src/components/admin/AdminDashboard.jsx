import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import AdminService from '../../services/admin.service';
import { notifyError } from '../common/Notify';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        const res = await AdminService.getDashboardStats();

        if (res.success) {
            setStats(res.data);
        } else {
            // console.error("Dashboard stats load failed:", res.message);
            notifyError(res.message || t('error.load_failed'));
        }

        setLoading(false);
    }, [t]);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    if (loading && !stats) {
        return <div className="tetrone-empty-state">{t('common.loading')}</div>;
    }

    if (!stats) return null;

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
                            <span>{stats.server.cpu_load}%</span>
                        </div>
                        <div className="admin-progress-track">
                            <div
                                className="admin-progress-bar cpu"
                                style={{ '--progress-width': `${Math.min(stats.server.cpu_load, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="admin-server-metric">
                        <div className="admin-server-metric-header">
                            <span>
                                {t('admin.dashboard.ram_usage')}
                                {stats.server.memory_total_gb > 0 ? ` (${stats.server.memory_total_gb} GB)` : ''}
                            </span>
                            <span>{stats.server.memory_percent}%</span>
                        </div>
                        <div className="admin-progress-track">
                            <div
                                className="admin-progress-bar ram"
                                style={{ '--progress-width': `${Math.min(stats.server.memory_percent, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="admin-server-metric">
                        <div className="admin-server-metric-header">
                            <span>{t('admin.dashboard.disk_usage')} ({stats.server.disk_free_gb} GB {t('admin.dashboard.free')})</span>
                            <span>{stats.server.disk_percent}%</span>
                        </div>
                        <div className="admin-progress-track">
                            <div
                                className="admin-progress-bar disk"
                                style={{ '--progress-width': `${Math.min(stats.server.disk_percent, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <div className="admin-server-info-row" style={{ marginTop: '15px' }}>
                        <span className="tetrone-label">{t('admin.dashboard.version')}</span>
                        <span className="tetrone-value">{stats.server.php_version}</span>
                    </div>

                    <div className="admin-server-info-row">
                        <span className="tetrone-label">{t('admin.dashboard.db_info')}</span>
                        <span className="tetrone-value">
                            {stats.server.db_driver} ({stats.server.db_version})
                        </span>
                    </div>
                    <div className="admin-server-info-row">
                        <span className="tetrone-label">{t('admin.dashboard.db_size')}</span>
                        <span className="tetrone-value">{stats.server.db_size_mb} MB</span>
                    </div>
                </div>

                <div className="admin-table-card admin-online-card">
                    <h3 className="admin-chart-title">
                        {t('admin.dashboard.users_online')}
                        <span className="admin-online-badge">{stats.realtime.online_count}</span>
                    </h3>

                    {stats.realtime.users.length === 0 ? (
                        <div className="tetrone-empty-state">{t('admin.dashboard.no_one_online')}</div>
                    ) : (
                        <div className="admin-online-list">
                            {stats.realtime.users.map(user => {
                                const nameColor = user.personalization?.username_color;

                                return (
                                    <Link key={user.id} to={`/${user.username}`} className="admin-online-user">
                                        <img src={user.avatar} alt={user.username} className="admin-online-avatar" />
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
                                    </Link>
                                );
                            })}
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
                            <BarChart data={stats.charts.activity} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} tickMargin={10} />
                                <YAxis stroke="var(--theme-text-muted)" fontSize={10} allowDecimals={false} />
                                <Tooltip contentClassName="admin-chart-tooltip" wrapperClassName="admin-chart-tooltip-wrapper" />
                                <Legend wrapperClassName="admin-chart-legend" />
                                <Bar dataKey="posts" name={t('common.posts')} fill="#E67E22"/>
                                <Bar dataKey="comments" name={t('common.comments')} fill="#F1C40F" />
                                <Bar dataKey="reposts" name={t('common.reposts')} fill="#E91E63" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}