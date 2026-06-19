import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import adminService from '../../services/admin.service';
import toast from 'react-hot-toast';

export default function StaffLogs() {
    const { t } = useTranslation();
    const [summary, setSummary] = useState(null);
    const [charts, setCharts] = useState(null);
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const [summaryRes, chartsRes, logsRes] = await Promise.all([
                    adminService.getStaffLogsSummary(),
                    adminService.getStaffLogsCharts(),
                    adminService.getStaffLogs(1)
                ]);

                if (summaryRes.success) setSummary(summaryRes.data);
                if (chartsRes.success) setCharts(chartsRes.data);
                
                if (logsRes.success) {
                    setLogs(logsRes.data.data || logsRes.data);
                    setHasMore((logsRes.data.data || logsRes.data).length > 0);
                }
            } catch (error) {
                toast.error(t('admin.error_loading_data'));
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [t]);

    const loadMoreLogs = async () => {
        const nextPage = page + 1;
        try {
            const res = await adminService.getStaffLogs(nextPage);
            if (res.success) {
                const newLogs = res.data.data || res.data;
                if (newLogs.length === 0) {
                    setHasMore(false);
                } else {
                    setLogs([...logs, ...newLogs]);
                    setPage(nextPage);
                }
            }
        } catch (error) {
            toast.error(t('api.error.ERR_NETWORK'));
        }
    };

    if (loading && !summary) return <div className="tetrone-loading-spinner"></div>;

    const topStaffData = charts ? Object.entries(charts).map(([name, count]) => ({ name, count })) : [];
    const closedTicketsToday = summary?.closed_tickets_today || [];

    return (
        <div className="admin-staff-logs-container">
            <div className="admin-staff-grid-2">
                <div className="admin-staff-chart-card">
                    <h3>{t('admin.charts.top_performers')}</h3>
                    <div className="admin-staff-chart-wrap">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topStaffData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={100} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" name={t('admin.actions_taken')} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="admin-staff-chart-card">
                    <h3>{t('admin.tickets_closed_today')}</h3>
                    <div className="admin-staff-chart-wrap">
                        {closedTicketsToday.length === 0 ? (
                            <div className="tetrone-text-muted admin-staff-center-wrap">
                                {t('admin.no_data')}
                            </div>
                        ) : (
                            <ul className="admin-db-table-list admin-staff-list">
                                {closedTicketsToday.map(staff => (
                                    <li key={staff.admin_id} className="admin-staff-list-item">
                                        <div className="admin-staff-user-wrap">
                                            {staff.admin?.avatar && (
                                                <img src={staff.admin.avatar} alt="avatar" className="admin-staff-avatar" />
                                            )}
                                            <strong>{staff.admin?.username || 'Unknown'}</strong>
                                        </div>
                                        <div className="admin-staff-action-badge admin-staff-badge-primary">
                                            {staff.total}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            <div className="admin-staff-chart-card">
                <h3>{t('admin.audit_trail')}</h3>
                
                <div className="admin-staff-table-wrap">
                    <table className="admin-staff-table">
                        <thead>
                            <tr>
                                <th>{t('common.date')}</th>
                                <th>{t('admin.staff_member')}</th>
                                <th>{t('admin.action')}</th>
                                <th>{t('admin.reason')}</th>
                                <th>{t('admin.target_id')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td>{new Date(log.created_at).toLocaleString()}</td>
                                    <td>
                                        <strong>{log.admin?.username || 'System'}</strong>
                                    </td>
                                    <td>
                                        <span className="admin-staff-action-badge">
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="tetrone-text-muted">{log.reason || '-'}</td>
                                    <td>{log.target_id || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {hasMore && (
                    <div className="admin-staff-load-more">
                        <button onClick={loadMoreLogs} className="tetrone-btn tetrone-btn-secondary">
                            {t('common.load_more')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
