import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminService from '../../services/admin.service';
import PublicService from '../../services/public.service';
import { notifyError } from '../common/Notify';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import InfoBox from '../ui/InfoBox';
import InfiniteScrollList from '../common/InfiniteScrollList';
import { userRole } from '../../config';
import { getRoleTitle } from '../profile/utils/getRoleTitle.jsx';

const CHART_COLORS = ['#5b9bd5', '#4bb34b', '#e5a43b', '#c95151', '#8884d8', '#82ca9d', '#ffc658'];
const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0];
const DAY_KEYS = { 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat', 0: 'sun' };
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const getRoleBadgeStyle = (role) => {
    switch (role) {
        case userRole.Owner: return "border-theme-error text-theme-error bg-[rgba(255,51,71,0.05)]";
        case userRole.Admin: return "border-[#d39e00] text-[#d39e00] bg-[rgba(211,158,0,0.05)]";
        case userRole.Moderator: return "border-theme-link text-theme-link bg-[rgba(69,104,142,0.05)]";
        case userRole.Support: return "border-theme-success text-theme-success bg-[rgba(75,179,75,0.05)]";
        default: return "border-border text-text-muted bg-bg-page";
    }
};

export default function StaffLogs() {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const [searchParams, setSearchParams] = useSearchParams();

    // Стан з URL
    const usernameParam = searchParams.get('username');

    // Глобальні дані
    const [summary, setSummary] = useState(null);
    const [chartsRaw, setChartsRaw] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [staffList, setStaffList] = useState([]);
    
    // Стан Infinite Scroll
    const [logs, setLogs] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingInitial, setLoadingInitial] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const updateUrl = useCallback((paramsObj) => {
        const newParams = new URLSearchParams(searchParams);
        Object.entries(paramsObj).forEach(([key, val]) => {
            if (val === null) newParams.delete(key);
            else newParams.set(key, val);
        });
        setSearchParams(newParams, { replace: true });
    }, [searchParams, setSearchParams]);

    // 1. Одноразове завантаження списку персоналу
    useEffect(() => {
        PublicService.getStaff()
            .then(res => setStaffList(res.staff || []))
            .catch(() => {});
            
        // Глобальну аналітику підвантажуємо одразу (щоб профіль юзера мав дані)
        AdminService.getStaffLogsSummary().onSuccess(res => setSummary(res.summary));
        AdminService.getStaffLogsCharts().onSuccess(res => setAnalytics(res.analytics));
    }, []);

    // 2. Головний UseEffect
    useEffect(() => {
        setLoadingInitial(true);
        setPage(1);
        setLogs([]);

        const fetchLogsReq = usernameParam 
            ? AdminService.getAdminLogs(usernameParam, 1) 
            : AdminService.getStaffLogs(1);

        fetchLogsReq.onSuccess(res => {
            setLogs(res.logs || []);
            setHasMore(res.meta ? res.meta.current_page < res.meta.last_page : false);
            
            if (usernameParam && res.charts) {
                // Графік конкретного юзера
                setChartsRaw(res.charts);
            } else if (!usernameParam) {
                // Глобальний графік
                AdminService.getStaffLogsCharts().onSuccess(cRes => setChartsRaw(cRes.charts || []));
            }
        }).onFinally(() => setLoadingInitial(false));
    }, [usernameParam]);

    // 3. Infinite Scroll Підвантаження
    const loadMoreLogs = useCallback(() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        
        const nextPage = page + 1;
        const req = usernameParam
            ? AdminService.getAdminLogs(usernameParam, nextPage)
            : AdminService.getStaffLogs(nextPage);

        req.onSuccess(res => {
            setLogs(prev => [...prev, ...(res.logs || [])]);
            setPage(nextPage);
            setHasMore(res.meta ? res.meta.current_page < res.meta.last_page : false);
        }).onError(() => notifyError(t('api.error.ERR_NETWORK')))
          .onFinally(() => setLoadingMore(false));
    }, [hasMore, loadingMore, page, usernameParam, t]);

    // Обробка графіків
    const { chartData, uniqueActions } = useMemo(() => {
        if (!chartsRaw || chartsRaw.length === 0) return { chartData: [], uniqueActions: [] };
        const grouped = {};
        const actionsSet = new Set();
        chartsRaw.forEach(item => {
            if (!grouped[item.date]) grouped[item.date] = { date: item.date.slice(5) }; 
            grouped[item.date][item.action] = item.count;
            actionsSet.add(item.action);
        });
        return { chartData: Object.values(grouped), uniqueActions: Array.from(actionsSet) };
    }, [chartsRaw]);

    const maxHeat = useMemo(() => analytics?.heatmap ? Math.max(1, ...Object.values(analytics.heatmap)) : 1, [analytics]);

    const activeAdminProfile = useMemo(() => {
        if (!usernameParam || !analytics?.profiles) return null;
        return analytics.profiles.find(p => p.admin.username === usernameParam);
    }, [usernameParam, analytics]);

    const renderMeta = (meta) => {
        if (!meta || (Array.isArray(meta) && meta.length === 0)) return '-';
        if (typeof meta === 'string') return meta;
        const parts = [];
        if (meta.reason) parts.push(meta.reason);
        if (meta.old_role !== undefined && meta.new_role !== undefined) parts.push(`${t('admin.staff_logs.role_label')} ${getRoleTitle(meta.old_role)} ➔ ${getRoleTitle(meta.new_role)}`);
        if (meta.is_checked !== undefined) parts.push(meta.is_checked ? t('admin.common.checked', 'Перевірено') : t('admin.common.unchecked', 'Знято перевірку'));
        
        if (parts.length > 0) return parts.join(' | ');
        return JSON.stringify(meta).replace(/[{}"_]/g, ' ').trim();
    };

    return (
        <div className="flex flex-col gap-[15px] font-tahoma text-[11px]">
            
            {/* РЕЖИМ 1: ГЛОБАЛЬНИЙ ДАШБОАРД */}
            {!usernameParam && (
                <>
                    {/* 3 Колонки (Склад персоналу | Топ модераторів | Дії за сьогодні) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[15px]">
                        
                        {/* КОЛОНКА 1: Склад персоналу */}
                        <div className="bg-bg-box border border-border flex flex-col">
                            <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                                {t('admin.staff_logs.staff_list_title')}
                            </div>
                            <div className="p-[10px] flex flex-col gap-[6px] max-h-[300px] overflow-y-auto custom-scrollbar">
                                {staffList.length === 0 && <div className="text-text-muted italic text-center">{t('common.loading')}</div>}
                                {staffList.map(user => (
                                    <div 
                                        key={user.id} 
                                        onClick={() => updateUrl({ username: user.username })}
                                        className="flex items-center justify-between p-[6px] border border-border cursor-pointer hover:border-theme-link transition-colors bg-bg-page hover:bg-[rgba(69,104,142,0.05)]"
                                    >
                                        <div className="flex items-center gap-[10px]">
                                            <Avatar user={user} className="w-[28px] h-[28px] object-cover rounded-none border border-border shrink-0" />
                                            <div className="flex flex-col">
                                                <span className="text-theme-link font-bold text-[11px]">{user.first_name || user.username}</span>
                                                <span className="text-[9px] text-text-muted mt-[1px]">@{user.username}</span>
                                            </div>
                                        </div>
                                        <span className={`px-[4px] py-[1px] text-[8px] font-bold border rounded-[2px] uppercase ${getRoleBadgeStyle(user.role)}`}>
                                            {getRoleTitle(user.role)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* КОЛОНКА 2: Топ модераторів */}
                        <div className="bg-bg-box border border-border flex flex-col">
                            <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                                {t('admin.staff_logs.top_performers')}
                            </div>
                            <div className="p-[10px] flex flex-col gap-[8px]">
                                {analytics?.profiles?.slice(0, 5).map(prof => (
                                    <div 
                                        key={prof.admin.id} 
                                        onClick={() => updateUrl({ username: prof.admin.username })}
                                        className="flex items-center justify-between border-b border-dashed border-border pb-[8px] cursor-pointer hover:bg-[rgba(69,104,142,0.05)] transition-colors last:border-0 last:pb-0"
                                    >
                                        <div className="flex items-center gap-[8px]">
                                            <Avatar user={prof.admin} className="w-[28px] h-[28px] object-cover rounded-none border border-border block" />
                                            <div className="flex flex-col">
                                                <span className="text-theme-link font-bold text-[11px]">
                                                    {prof.admin.first_name || prof.admin.username}
                                                </span>
                                                <div className="text-text-muted mt-[2px] flex items-center gap-[4px] text-[9px]">
                                                    <span className="group relative cursor-help border-b border-dashed border-text-muted">
                                                        {t('admin.staff_logs.bi_severity')}
                                                        <div className="absolute left-0 bottom-full mb-[5px] hidden group-hover:block w-[240px] z-[50] normal-case font-normal text-left shadow-md">
                                                            <InfoBox title={t('admin.staff_logs.bi_severity')} text={t('admin.staff_logs.bi_severity_desc')} />
                                                        </div>
                                                    </span>: <span className={prof.severity_index > 2 ? 'text-theme-error font-bold' : 'text-theme-success font-bold'}>{prof.severity_index}</span>
                                                    <span className="mx-[2px]">|</span>
                                                    <span className="group relative cursor-help border-b border-dashed border-text-muted">
                                                        {t('admin.staff_logs.bi_mttr')}
                                                        <div className="absolute left-0 bottom-full mb-[5px] hidden group-hover:block w-[240px] z-[50] normal-case font-normal text-left shadow-md">
                                                            <InfoBox title={t('admin.staff_logs.bi_mttr')} text={t('admin.staff_logs.bi_mttr_desc')} />
                                                        </div>
                                                    </span>: <span className="font-bold">{prof.mttr_minutes} {t('admin.staff_logs.bi_minutes')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-[#d39e00] text-[12px]">{prof.total_actions}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* КОЛОНКА 3: Дії за сьогодні */}
                        <div className="bg-bg-box border border-border flex flex-col">
                            <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                                {t('admin.staff_logs.actions_today')}
                            </div>
                            <div className="p-[10px] flex flex-wrap gap-[6px]">
                                {Object.entries(summary?.actions || {}).map(([action, count]) => (
                                    <div key={action} className="bg-bg-page border border-border p-[6px_8px] flex flex-col items-center flex-1 min-w-[70px]">
                                        <span className="text-[14px] font-bold text-theme-link leading-none">{count}</span>
                                        <span className="text-[9px] text-text-muted text-center mt-[4px]">
                                            {t(`admin.actions.${action}`)}
                                        </span>
                                    </div>
                                ))}
                                {(!summary?.actions || Object.keys(summary.actions).length === 0) && !loadingInitial && (
                                    <div className="text-text-muted italic w-full p-[10px] text-center">{t('admin.staff_logs.empty_logs')}</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ТЕПЛОВА КАРТА */}
                    {analytics?.heatmap && (
                        <div className="bg-bg-box border border-border flex flex-col">
                            <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex items-center gap-[6px]">
                                {t('admin.staff_logs.bi_heatmap')}
                                <div className="group relative cursor-help text-theme-link font-normal">
                                    [?]
                                    <div className="absolute left-0 bottom-full mb-[5px] hidden group-hover:block w-[260px] z-[50] normal-case font-normal text-left shadow-md">
                                        <InfoBox title={t('admin.staff_logs.bi_heatmap')} text={t('admin.staff_logs.bi_heatmap_desc')} className="!p-[8px]" />
                                    </div>
                                </div>
                            </div>
                            <div className="p-[10px] overflow-x-auto">
                                <table className="w-full border-collapse text-[9px] text-center table-fixed">
                                    <thead>
                                        <tr>
                                            <td className="w-[30px]"></td>
                                            <td colSpan="24" className="text-text-muted font-bold pb-[5px] border-b border-border text-center">
                                                {t('admin.staff_logs.hours_axis')}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td></td>
                                            {HOURS.map(h => <td key={h} className="text-text-muted pt-[5px] pb-[2px]">{h}</td>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {DAYS_ORDER.map(d => (
                                            <tr key={d}>
                                                <td className="text-text-muted pr-[6px] text-right font-bold truncate">
                                                    {t(`date.days.${DAY_KEYS[d]}`)}
                                                </td>
                                                {HOURS.map(h => {
                                                    const count = analytics.heatmap[`${d}_${h}`];
                                                    const opacity = count > 0 ? Math.max(0.15, count / maxHeat) : 0;
                                                    return (
                                                        <td key={h} className="p-[1px]">
                                                            <div 
                                                                className="w-full h-[14px] border border-border cursor-help transition-all hover:border-theme-link"
                                                                style={{ backgroundColor: count > 0 ? `rgba(211, 158, 0, ${opacity})` : 'transparent' }}
                                                                title={`${count} ${t('admin.staff_logs.actions_count')}`}
                                                            ></div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* РЕЖИМ 2: ІНДИВІДУАЛЬНА АНАЛІТИКА ЮЗЕРА */}
            {usernameParam && (
                <div className="bg-bg-box border border-border flex flex-col">
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                        <span>Аналітика персоналу — @{usernameParam}</span>
                        <Button variant="secondary" onClick={() => updateUrl({ username: null })} className="py-[2px] px-[8px] text-[10px] !rounded-none">
                            {t('admin.staff_logs.back_to_global')}
                        </Button>
                    </div>
                    
                    {activeAdminProfile?.anomaly_detected && (
                        <div className="bg-[rgba(255,51,71,0.1)] border-b border-theme-error p-[8px] text-theme-error text-[10px]">
                            <strong>{t('admin.staff_logs.bi_anomaly')}:</strong> {t('admin.staff_logs.bi_anomaly_desc')}
                        </div>
                    )}

                    <div className="p-[10px] flex flex-col md:flex-row gap-[10px] items-center">
                        {/* Аватар та Роль */}
                        <div className="flex items-center gap-[10px] bg-bg-page border border-border p-[10px] min-w-[200px] w-full md:w-auto h-[65px]">
                            {activeAdminProfile ? (
                                <Avatar user={activeAdminProfile.admin} className="w-[40px] h-[40px] object-cover rounded-none border border-border block shrink-0" />
                            ) : (
                                <div className="w-[40px] h-[40px] bg-border shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-bold text-theme-link truncate">{activeAdminProfile?.admin?.first_name || usernameParam}</span>
                                <span className="text-[10px] text-text-muted mb-[2px] truncate">@{usernameParam}</span>
                                {activeAdminProfile && (
                                    <span className={`px-[4px] py-[1px] text-[9px] font-bold border rounded-none uppercase text-center w-fit ${getRoleBadgeStyle(activeAdminProfile.admin.role)}`}>
                                        {getRoleTitle(activeAdminProfile.admin.role)}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Метрики (БЕЗ КАПСУ В ТУЛТИПАХ І З МЕНШИМ ШРИФТОМ) */}
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-[8px] w-full h-[65px]">
                            <div className="bg-bg-page border border-border p-[8px] text-center flex flex-col justify-center">
                                <div className="text-[16px] text-theme-link font-bold mb-[2px]">{activeAdminProfile?.total_actions || 0}</div>
                                <div className="text-[9px] text-text-muted uppercase">{t('admin.staff_logs.actions_total_label', 'Дій виконано')}</div>
                            </div>
                            
                            <div className="bg-bg-page border border-border p-[8px] text-center flex flex-col justify-center">
                                <div className={`text-[16px] font-bold mb-[2px] ${activeAdminProfile?.severity_index > 2 ? 'text-theme-error' : 'text-theme-success'}`}>
                                    {activeAdminProfile?.severity_index || 0}
                                </div>
                                <div className="group relative cursor-help border-b border-dashed border-text-muted w-fit mx-auto text-[9px] text-text-muted uppercase">
                                    {t('admin.staff_logs.bi_severity')}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[5px] hidden group-hover:block w-[240px] z-[50] normal-case font-normal text-left shadow-md">
                                        <InfoBox title={t('admin.staff_logs.bi_severity')} text={t('admin.staff_logs.bi_severity_desc')} className="!p-[8px]" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg-page border border-border p-[8px] text-center flex flex-col justify-center">
                                <div className="text-[16px] text-[#d39e00] font-bold mb-[2px]">{activeAdminProfile?.mttr_minutes || 0} <span className="text-[10px] font-normal">{t('admin.staff_logs.bi_minutes')}</span></div>
                                <div className="group relative cursor-help border-b border-dashed border-text-muted w-fit mx-auto text-[9px] text-text-muted uppercase">
                                    {t('admin.staff_logs.bi_mttr')}
                                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-[5px] hidden group-hover:block w-[240px] z-[50] normal-case font-normal text-left shadow-md">
                                        <InfoBox title={t('admin.staff_logs.bi_mttr')} text={t('admin.staff_logs.bi_mttr_desc')} className="!p-[8px]" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-bg-page border border-border p-[8px] text-center flex flex-col justify-center">
                                <div className="text-[16px] text-theme-error font-bold mb-[2px]">{activeAdminProfile?.reverts_count || 0}</div>
                                <div className="group relative cursor-help border-b border-dashed border-text-muted w-fit mx-auto text-[9px] text-text-muted uppercase">
                                    {t('admin.staff_logs.bi_reverts')}
                                    <div className="absolute right-0 bottom-full mb-[5px] hidden group-hover:block w-[240px] z-[50] normal-case font-normal text-left shadow-md">
                                        <InfoBox title={t('admin.staff_logs.bi_reverts')} text={t('admin.staff_logs.bi_reverts_desc')} className="!p-[8px]" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ГРАФІК АКТИВНОСТІ (Спільний для обох режимів) */}
            {chartData.length > 0 && (
                <div className="bg-bg-box border border-border flex flex-col">
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                        {usernameParam ? `Графік активності модератора` : t('admin.staff_logs.chart_activity')}
                    </div>
                    <div className="p-[10px] pt-[15px] h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border)" vertical={false} />
                                <XAxis dataKey="date" stroke="var(--theme-text-muted)" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--theme-text-muted)" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--theme-bg-box)', borderColor: 'var(--theme-border)', color: 'var(--theme-text-main)', fontSize: '11px', fontFamily: 'var(--font-tahoma)', borderRadius: '0px' }}
                                    itemStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                                    formatter={(value, name) => [value, t(`admin.actions.${name}`, name.replace(/_/g, ' '))]}
                                />
                                {uniqueActions.map((action, i) => (
                                    <Bar key={action} dataKey={action} stackId="a" fill={CHART_COLORS[i % CHART_COLORS.length]} />
                                ))}
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ТАБЛИЦЯ ЛОГІВ (Infinity Scroll) */}
            <div className="bg-bg-box border border-border flex flex-col">
                <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                    {usernameParam ? `${t('admin.staff_logs.audit_trail')} — @${usernameParam}` : t('admin.staff_logs.audit_trail')}
                </div>
                
                <InfiniteScrollList
                    itemsCount={logs.length}
                    isLoadingInitial={loadingInitial}
                    isLoadingMore={loadingMore}
                    hasMore={hasMore}
                    onLoadMore={loadMoreLogs}
                    className="w-full"
                    emptyState={<div className="p-[20px] text-center text-text-muted italic">{t('admin.staff_logs.empty_logs')}</div>}
                >
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-[11px] bg-bg-box m-0">
                            <thead>
                                <tr>
                                    <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[120px]">{t('common.date')}</th>
                                    <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[160px]">{t('admin.staff_logs.staff_member')}</th>
                                    <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[140px]">{t('admin.staff_logs.action')}</th>
                                    <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[110px]">{t('admin.staff_logs.target_id')}</th>
                                    <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border">{t('admin.reports.reason')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-bg-page transition-colors">
                                        <td className="p-[10px] border-b border-bg-page text-text-muted align-top whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </td>
                                        <td className="p-[10px] border-b border-bg-page align-top">
                                            <div className="flex items-center gap-[6px] flex-wrap">
                                                <span onClick={() => updateUrl({ username: log.admin?.username })} className="text-theme-link font-bold hover:underline cursor-pointer bg-transparent no-underline w-fit">
                                                    @{log.admin?.username || 'System'}
                                                </span>
                                                {log.admin?.role > userRole.User && (
                                                    <span className={`px-[4px] py-[1px] text-[8px] font-bold border rounded-[2px] uppercase w-fit ${getRoleBadgeStyle(log.admin.role)}`}>
                                                        {getRoleTitle(log.admin.role)}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-[10px] border-b border-bg-page text-text-main align-top font-bold">
                                            {t(`admin.actions.${log.action}`, log.action.replace(/_/g, ' '))}
                                        </td>
                                        <td className="p-[10px] border-b border-bg-page text-text-main align-top">
                                            {log.entity_id ? (
                                                <span className="bg-bg-page border border-border px-[4px] py-[2px] font-mono text-[10px]">
                                                    {log.entity_id}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="p-[10px] border-b border-bg-page text-text-main align-top italic">
                                            {renderMeta(log.meta)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </InfiniteScrollList>
            </div>
            
        </div>
    );
}