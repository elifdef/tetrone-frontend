import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import AdminService from "../../services/admin.service";
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from "../../context/ModalContext";
import { useDateFormatter } from "../../hooks/useDateFormatter";
import Button from "../ui/Button.jsx";
import CustomSelect from "../ui/CustomSelect.jsx";

export default function AdminReports() {
    const { t } = useTranslation();
    const { openPrompt } = useModal();
    const formatDate = useDateFormatter();

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ status: 'pending', date: 'all', reason: 'all', type: 'all', search: '' });
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilters(prev => {
                if (prev.search === searchInput) return prev;
                return { ...prev, search: searchInput };
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchReports = useCallback((currentFilters) => {
        setLoading(true);
        AdminService.getReports(currentFilters)
        .onSuccess((res) => {
            setStats(res.stats || { total: 0, pending: 0, resolved: 0, rejected: 0 });
            setReports(res.reports || []);
            setLoading(false);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setLoading(false);
        });
    }, [t]);

    useEffect(() => {
        fetchReports(filters);
    }, [filters, fetchReports]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleAction = async (reportId, actionType) => {
        let title = '';
        if (actionType === 'revert') title = t('admin.reports.prompt_revert');
        else if (actionType === 'resolve') title = t('admin.reports.prompt_resolve');
        else title = t('admin.reports.prompt_reject');

        const responseText = await openPrompt(t('admin.common.prompt_placeholder'), title, true);
        if (responseText === null) return;

        AdminService.handleReport(reportId, actionType, responseText.trim())
        .onSuccess((res) => {
            notifySuccess(t(`api.success.${res.code}`));
            fetchReports(filters);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        });
    };

    const renderCompactTarget = (report) => {
        const target = report.target;

        if (!target) {
            return <span className="text-text-muted italic">{t('admin.reports.target_deleted')}</span>;
        }

        const isDeleted = target.is_deleted || target.is_hard_deleted;
        const formattedDate = target.created_at ? formatDate(target.created_at) : '';
        const targetIdLabel = <span className="text-[9px] ml-[5px] text-text-muted">(ID: {target.id})</span>;

        if (isDeleted) {
            let deletedText = '';
            switch (target.type) {
                case 'Post': deletedText = t('admin.reports.target_post', { date: formattedDate }); break;
                case 'Comment': deletedText = t('admin.reports.target_comment', { date: formattedDate }); break;
                case 'User': deletedText = `@${target.username}`; break;
                default: deletedText = t('admin.reports.target_deleted', { id: target.id }); break;
            }
            return (
                <span className="line-through text-text-muted">
                    {deletedText} {targetIdLabel}
                </span>
            );
        }

        switch (target.type) {
            case 'Post':
                return (
                    <span>
                        <Link to={`/post/${target.id}`} className="text-theme-link hover:underline no-underline bg-transparent" target="_blank">
                            {t('admin.reports.target_post', { date: formattedDate })}
                        </Link>
                        {targetIdLabel}
                    </span>
                );
            case 'Comment': {
                const commentUrl = target.post_id ? `/post/${target.post_id}?comment=${target.id}` : '#';
                return (
                    <span>
                        <Link to={commentUrl} className="text-theme-link hover:underline no-underline bg-transparent" target="_blank">
                            {t('admin.reports.target_comment', { date: formattedDate })}
                        </Link>
                        {targetIdLabel}
                    </span>
                );
            }
            case 'User':
                return (
                    <span>
                        <Link to={`/${target.username}`} className="text-theme-link hover:underline no-underline bg-transparent" target="_blank">
                            {target.first_name} {target.last_name} (@{target.username})
                        </Link>
                        {targetIdLabel}
                    </span>
                );
            case 'StickerPack':
                return (
                    <span>
                        <Link to={`/stickers/${target.id}`} className="text-theme-link hover:underline no-underline bg-transparent" target="_blank">
                            {t('admin.reports.target_stickerpack', { id: target.id })}
                        </Link>
                        {targetIdLabel}
                    </span>
                );
            case 'Space':
                return (
                    <span>
                        <Link to={`/space/${target.id}`} className="text-theme-link hover:underline no-underline bg-transparent" target="_blank">
                            {t('admin.reports.target_space', { id: target.id })}
                        </Link>
                        {targetIdLabel}
                    </span>
                );
            default:
                return <span>{target.type}{targetIdLabel}</span>;
        }
    };

    const getStatusBadge = (status) => {
        let colors = "";
        switch (status) {
            case 'pending': colors = "text-[#d39e00] border-[#d39e00]"; break;
            case 'resolved': colors = "text-theme-success border-theme-success"; break;
            case 'rejected': colors = "text-theme-error border-theme-error"; break;
            default: colors = "text-text-main border-border";
        }
        return `inline-block px-[6px] py-[2px] text-[10px] font-bold border bg-bg-page ${colors}`;
    };

    const getStatusBorder = (status) => {
        switch (status) {
            case 'resolved': return "border-l-[3px] border-l-theme-success";
            case 'rejected': return "border-l-[3px] border-l-theme-error";
            default: return "";
        }
    };

    // Опції для CustomSelect
    const statusOptions = [
        { value: 'all', label: t('admin.common.total') },
        { value: 'pending', label: t('admin.common.pending') },
        { value: 'resolved', label: t('admin.common.resolved') },
        { value: 'rejected', label: t('admin.common.rejected') }
    ];

    const dateOptions = [
        { value: 'all', label: t('admin.reports.filters.date_all') },
        { value: 'today', label: t('admin.reports.filters.date_today') },
        { value: 'yesterday', label: t('admin.reports.filters.date_yesterday') },
        { value: 'week', label: t('admin.reports.filters.date_week') },
        { value: 'month', label: t('admin.reports.filters.date_month') }
    ];

    const typeOptions = [
        { value: 'all', label: t('admin.reports.filters.type_all') },
        { value: 'user', label: t('admin.reports.filters.type_user') },
        { value: 'post', label: t('admin.reports.filters.type_post') },
        { value: 'comment', label: t('admin.reports.filters.type_comment') },
        { value: 'stickerpack', label: t('admin.reports.filters.type_stickerpack') },
        { value: 'space', label: t('admin.reports.filters.type_space') }
    ];

    const reasonOptions = [
        { value: 'all', label: t('admin.reports.filters.reason_all') },
        { value: 'spam', label: t('reports.reasons.spam') },
        { value: 'nsfw', label: t('reports.reasons.nsfw') },
        { value: 'harassment', label: t('reports.reasons.harassment') },
        { value: 'fake_info', label: t('reports.reasons.fake_info') },
        { value: 'illegal', label: t('reports.reasons.illegal') },
        { value: 'bullying', label: t('reports.reasons.bullying') },
        { value: 'child_abuse', label: t('reports.reasons.child_abuse') },
        { value: 'scam', label: t('reports.reasons.scam') },
        { value: 'hate_speech', label: t('reports.reasons.hate_speech') }
    ];

    return (
        <div>
            <div className="flex flex-wrap gap-[10px] mb-[15px]">
                <div className="flex-1 min-w-[120px] bg-bg-box border border-border p-[10px] text-center">
                    <div className="text-[11px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.total')}</div>
                    <div className="text-[20px] text-theme-link font-bold">{stats.total}</div>
                </div>
                <div className="flex-1 min-w-[120px] bg-bg-box border border-border p-[10px] text-center">
                    <div className="text-[11px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.pending')}</div>
                    <div className="text-[20px] text-[#d39e00] font-bold">{stats.pending}</div>
                </div>
                <div className="flex-1 min-w-[120px] bg-bg-box border border-border p-[10px] text-center">
                    <div className="text-[11px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.resolved')}</div>
                    <div className="text-[20px] text-theme-success font-bold">{stats.resolved}</div>
                </div>
                <div className="flex-1 min-w-[120px] bg-bg-box border border-border p-[10px] text-center">
                    <div className="text-[11px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.rejected')}</div>
                    <div className="text-[20px] text-theme-error font-bold">{stats.rejected}</div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-[10px] mb-[20px] bg-bg-box p-[15px] border border-border">
                <input
                    type="text"
                    className="flex-1 basis-[200px] border border-input-border bg-input-bg px-[8px] h-[28px] box-border text-[11px] text-text-main focus:outline-none focus:border-border transition-colors shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                    placeholder={t('admin.common.search_placeholder')}
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                />

                <CustomSelect
                    options={statusOptions}
                    value={filters.status}
                    onChange={(v) => handleFilterChange('status', v)}
                    className="flex-1 basis-[120px]"
                />

                <CustomSelect
                    options={dateOptions}
                    value={filters.date}
                    onChange={(v) => handleFilterChange('date', v)}
                    className="flex-1 basis-[120px]"
                />

                <CustomSelect
                    options={typeOptions}
                    value={filters.type}
                    onChange={(v) => handleFilterChange('type', v)}
                    className="flex-1 basis-[120px]"
                />

                <CustomSelect
                    options={reasonOptions}
                    value={filters.reason}
                    onChange={(v) => handleFilterChange('reason', v)}
                    className="flex-1 basis-[120px]"
                />
            </div>

            {loading ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('common.loading')}</div>
            ) : reports.length === 0 ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('admin.reports.empty')}</div>
            ) : (
                <div className="flex flex-col gap-[10px]">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-bg-box border border-border p-[10px] flex justify-between text-[11px]">

                            <div className="flex-1 flex flex-col">
                                <div className="mb-[4px]">
                                    <span className="text-text-muted mr-[5px]">{t('common.date')}:</span>
                                    <span>{formatDate(report.created_at)}</span>
                                </div>
                                <div className="mb-[4px]">
                                    <span className="text-text-muted mr-[5px]">{t('admin.reports.from')}:</span>
                                    <Link to={`/${report.reporter?.username}`} className="text-theme-link hover:underline bg-transparent no-underline">
                                        {report.reporter?.first_name} {report.reporter?.last_name} (@{report.reporter?.username})
                                    </Link>
                                </div>
                                <div className="mb-[4px]">
                                    <span className="text-text-muted mr-[5px]">{t('admin.reports.reason')}:</span>
                                    <strong className="text-theme-error">
                                        {t(`reports.reasons.${report.reason}`)}
                                    </strong>
                                </div>

                                {report.details && (
                                    <div className="mt-[8px] mb-[4px]">
                                        <div className="italic bg-bg-page border-l-[2px] border-theme-link p-[5px_8px] text-text-muted">
                                            "{report.details}"
                                        </div>
                                    </div>
                                )}

                                <div className="mb-[4px]">
                                    <span className="text-text-muted mr-[5px]">{t('admin.reports.target')}:</span>
                                    {renderCompactTarget(report)}
                                </div>

                                {report.status === 'pending' ? (
                                    <div className="mt-[8px] mb-[4px]">
                                        <span className="text-text-muted mr-[5px]">{t('common.status')}:</span>
                                        <span className={getStatusBadge(report.status)}>
                                            {t(`admin.stats.${report.status}`)}
                                        </span>
                                    </div>
                                ) : (
                                    <div className={`mt-[15px] p-[10px_12px] bg-bg-page border border-border flex flex-col gap-[8px] ${getStatusBorder(report.status)}`}>
                                        <div>
                                            <span className="text-text-muted mr-[5px]">{t('common.status')}:</span>
                                            <span className={getStatusBadge(report.status)}>
                                                {t(`admin.common.${report.status}`)}
                                            </span>
                                        </div>

                                        {report.admin_response && (
                                            <div>
                                                <span className="text-text-muted mr-[5px]">{t('admin.reports.staff_answer')}</span>
                                                <span className="italic text-text-muted">
                                                    {report.admin_response}
                                                </span>
                                            </div>
                                        )}

                                        <div>
                                            <span className="text-text-muted mr-[5px]">{t('admin.reports.closed_at')}:</span>
                                            <span className="font-bold">
                                                {formatDate(report.updated_at)}
                                            </span>
                                        </div>

                                        {report.moderator && (
                                            <div>
                                                <span className="text-text-muted mr-[5px]">{t('admin.reports.reviewed_by')}:</span>
                                                <Link to={`/${report.moderator.username}`} className="text-theme-link hover:underline bg-transparent no-underline">
                                                    {report.moderator.first_name} {report.moderator.last_name} (@{report.moderator.username})
                                                </Link>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-[6px] min-w-[140px] items-stretch ml-[15px]">
                                {report.status === 'pending' && (
                                    <>
                                        <Button variant="success" onClick={() => handleAction(report.id, 'resolve')}>
                                            {t('admin.reports.btn_resolve')}
                                        </Button>
                                        <Button variant="danger" onClick={() => handleAction(report.id, 'reject')}>
                                            {t('admin.reports.btn_reject')}
                                        </Button>
                                    </>
                                )}

                                {report.status !== 'pending' && (
                                    <Button variant="warning" onClick={() => handleAction(report.id, 'revert')} title={t('admin.reports.undo_tooltip')}>
                                        {t('action.undo')}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}