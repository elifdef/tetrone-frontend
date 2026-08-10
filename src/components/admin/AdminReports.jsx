import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import AdminService from "../../services/admin.service";
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from "../../context/ModalContext";
import { useDateFormatter } from "../../hooks/useDateFormatter";
import Button from "../ui/Button.jsx";

export default function AdminReports()
{
    const { t } = useTranslation();
    const { openPrompt } = useModal(); // openConfirm прибрано, бо не використовується
    const formatDate = useDateFormatter();

    const [reports, setReports] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ status: 'pending', date: 'all', reason: 'all', type: 'all', search: '' });
    const [searchInput, setSearchInput] = useState('');

    useEffect(() =>
    {
        const timer = setTimeout(() =>
        {
            setFilters(prev =>
            {
                if (prev.search === searchInput)
                {
                    return prev;
                }
                return { ...prev, search: searchInput };
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchReports = useCallback(async (currentFilters) =>
    {
        setLoading(true);
        const res = await AdminService.getReports(currentFilters);

        if (res && res.code === 'REPORTS_RETRIEVED')
        {
            setStats(res.stats || { total: 0, pending: 0, resolved: 0, rejected: 0 });
            setReports(res.reports || []);
        }
        else
        {
            notifyError(t('common.error'));
        }
        setLoading(false);
    }, [t]);

    // Викликаємо щоразу, коли змінився об'єкт filters
    useEffect(() =>
    {
        fetchReports(filters);
    }, [filters, fetchReports]);

    const handleFilterChange = (key, value) =>
    {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleAction = async (reportId, actionType) =>
    {
        let title = '';

        if (actionType === 'revert')
        {
            title = t('admin.reports.prompt_revert');
        }
        else if (actionType === 'resolve')
        {
            title = t('admin.reports.prompt_resolve');
        }
        else
        {
            title = t('admin.reports.prompt_reject');
        }

        const responseText = await openPrompt(t('admin.common.prompt_placeholder'), title, true);
        if (responseText === null)
        {
            return;
        }

        const res = await AdminService.handleReport(reportId, actionType, responseText.trim());

        if (res && (res.code === 'REPORT_RESOLVED' || res.code === 'REPORT_REJECTED' || res.code === 'REPORT_REVERTED'))
        {
            notifySuccess(t('common.success'));
            fetchReports();
        }
        else
        {
            notifyError(t('common.error'));
        }
    };

    const renderCompactTarget = (report) =>
    {
        const target = report.target;

        if (!target)
        {
            return <span className="tetrone-settings-desc">{ t('admin.reports.target_deleted') }</span>;
        }

        const isDeleted = target.is_deleted || target.is_hard_deleted;
        const formattedDate = target.created_at ? formatDate(target.created_at) : '';
        const targetIdLabel = <span className="tetrone-admin-target-id">(ID: { target.id })</span>;

        if (isDeleted)
        {
            let deletedText = '';

            switch (target.type)
            {
                case 'Post':
                    deletedText = t('admin.reports.target_post', { date: formattedDate });
                    break;
                case 'Comment':
                    deletedText = t('admin.reports.target_comment', { date: formattedDate });
                    break;
                case 'User':
                    deletedText = `@${ target.username }`;
                    break;
                default:
                    deletedText = t('admin.reports.target_deleted', { id: target.id });
                    break;
            }

            return (
                <span className="tetrone-admin-target-deleted">
                    { deletedText } { targetIdLabel }
                </span>
            );
        }

        switch (target.type)
        {
            case 'Post':
                return (
                    <span>
                        <Link to={ `/post/${ target.id }` } className="tetrone-link" target="_blank">
                            { t('admin.reports.target_post', { date: formattedDate }) }
                        </Link>
                        { targetIdLabel }
                    </span>
                );

            case 'Comment':
            {
                const commentUrl = target.post_id ? `/post/${ target.post_id }?comment=${ target.id }` : '#';
                return (
                    <span>
                        <Link to={ commentUrl } className="tetrone-link" target="_blank">
                            { t('admin.reports.target_comment', { date: formattedDate }) }
                        </Link>
                        { targetIdLabel }
                    </span>
                );
            }

            case 'User':
                return (
                    <span>
                        <Link to={ `/${ target.username }` } className="tetrone-link" target="_blank">
                            { target.first_name } { target.last_name } (@{ target.username })
                        </Link>
                        { targetIdLabel }
                    </span>
                );

            case 'StickerPack':
                return (
                    <span>
                        <Link to={ `/stickers/${ target.id }` } className="tetrone-link" target="_blank">
                            { t('admin.reports.target_stickerpack', { id: target.id }) }
                        </Link>
                        { targetIdLabel }
                    </span>
                );

            case 'Space':
                return (
                    <span>
                        <Link to={ `/space/${ target.id }` } className="tetrone-link" target="_blank">
                            { t('admin.reports.target_space', { id: target.id }) }
                        </Link>
                        { targetIdLabel }
                    </span>
                );

            default:
                return (
                    <span>
                        { target.type }
                        { targetIdLabel }
                    </span>
                );
        }
    };

    const getStatusClass = (status) =>
    {
        switch (status)
        {
            case 'pending':
                return 'tetrone-admin-status-pending';
            case 'resolved':
                return 'tetrone-admin-status-resolved';
            case 'rejected':
                return 'tetrone-admin-status-rejected';
            default:
                return '';
        }
    };

    return (
        <div className="admin-reports-page">
            <div className="tetrone-admin-stats-container">
                <div className="tetrone-admin-stat-box">
                    <div className="tetrone-admin-stat-label">{ t('admin.stats.total') }</div>
                    <div className="tetrone-admin-stat-value">{ stats.total }</div>
                </div>
                <div className="tetrone-admin-stat-box">
                    <div className="tetrone-admin-stat-label">{ t('admin.stats.pending') }</div>
                    <div className="tetrone-admin-stat-value tetrone-admin-status-pending">{ stats.pending }</div>
                </div>
                <div className="tetrone-admin-stat-box">
                    <div className="tetrone-admin-stat-label">{ t('admin.stats.resolved') }</div>
                    <div className="tetrone-admin-stat-value tetrone-admin-status-resolved">{ stats.resolved }</div>
                </div>
                <div className="tetrone-admin-stat-box">
                    <div className="tetrone-admin-stat-label">{ t('admin.stats.rejected') }</div>
                    <div className="tetrone-admin-stat-value tetrone-admin-status-rejected">{ stats.rejected }</div>
                </div>
            </div>

            <div className="tetrone-admin-filters-section">
                <input
                    type="text"
                    className="tetrone-form-input tetrone-admin-filter-search"
                    placeholder={ t('admin.reports.filters.search_placeholder') }
                    value={ searchInput }
                    onChange={ (e) => setSearchInput(e.target.value) }
                />

                <select className="tetrone-form-input tetrone-admin-filter-select" value={ filters.status }
                        onChange={ (e) => handleFilterChange('status', e.target.value) }>
                    <option value="all">{ t('admin.stats.total') }</option>
                    <option value="pending">{ t('admin.stats.pending') }</option>
                    <option value="resolved">{ t('admin.stats.resolved') }</option>
                    <option value="rejected">{ t('admin.stats.rejected') }</option>
                </select>

                <select className="tetrone-form-input tetrone-admin-filter-select" value={ filters.date }
                        onChange={ (e) => handleFilterChange('date', e.target.value) }>
                    <option value="all">{ t('admin.reports.filters.date_all') }</option>
                    <option value="today">{ t('admin.reports.filters.date_today') }</option>
                    <option value="yesterday">{ t('admin.reports.filters.date_yesterday') }</option>
                    <option value="week">{ t('admin.reports.filters.date_week') }</option>
                    <option value="month">{ t('admin.reports.filters.date_month') }</option>
                </select>

                <select className="tetrone-form-input tetrone-admin-filter-select" value={ filters.type }
                        onChange={ (e) => handleFilterChange('type', e.target.value) }>
                    <option value="all">{ t('admin.reports.filters.type_all') }</option>
                    <option value="user">{ t('admin.reports.filters.type_user') }</option>
                    <option value="post">{ t('admin.reports.filters.type_post') }</option>
                    <option value="comment">{ t('admin.reports.filters.type_comment') }</option>
                    <option value="stickerpack">{ t('admin.reports.filters.type_stickerpack') }</option>
                    <option value="space">{ t('admin.reports.filters.type_space') }</option>
                </select>

                <select className="tetrone-form-input tetrone-admin-filter-select" value={ filters.reason }
                        onChange={ (e) => handleFilterChange('reason', e.target.value) }>
                    <option value="all">{ t('admin.reports.filters.reason_all') }</option>
                    <option value="spam">{ t('reports.reasons.spam') }</option>
                    <option value="nsfw">{ t('reports.reasons.nsfw') }</option>
                    <option value="harassment">{ t('reports.reasons.harassment') }</option>
                    <option value="fake_info">{ t('reports.reasons.fake_info') }</option>
                    <option value="illegal">{ t('reports.reasons.illegal') }</option>
                    <option value="bullying">{ t('reports.reasons.bullying') }</option>
                    <option value="child_abuse">{ t('reports.reasons.child_abuse') }</option>
                    <option value="scam">{ t('reports.reasons.scam') }</option>
                    <option value="hate_speech">{ t('reports.reasons.hate_speech') }</option>
                </select>
            </div>

            { loading ? (
                <div className="tetrone-empty-state">{ t('common.loading') }</div>
            ) : reports.length === 0 ? (
                <div className="tetrone-empty-state">{ t('admin.reports.empty') }</div>
            ) : (
                <div className="tetrone-feed-list">
                    { reports.map((report) => (
                        <div key={ report.id } className="tetrone-admin-report-card">
                            <div className="tetrone-admin-report-info">
                                <div className="tetrone-admin-meta-row">
                                    <span className="tetrone-admin-meta-label">{ t('common.date') }:</span>
                                    <span>{ formatDate(report.created_at) }</span>
                                </div>
                                <div className="tetrone-admin-meta-row">
                                    <span className="tetrone-admin-meta-label">{ t('admin.reports.from') }:</span>
                                    <Link to={ `/${ report.reporter?.username }` } className="tetrone-link">
                                        { report.reporter?.first_name } { report.reporter?.last_name } (@{ report.reporter?.username })
                                    </Link>
                                </div>
                                <div className="tetrone-admin-meta-row">
                                    <span className="tetrone-admin-meta-label">{ t('admin.reports.reason') }:</span>
                                    <strong className="admin-status-red">
                                        { t(`reports.reasons.${ report.reason }`) }
                                    </strong>
                                </div>

                                { report.details && (
                                    <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                        <div className="tetrone-admin-report-quote">
                                            "{ report.details }"
                                        </div>
                                    </div>
                                ) }

                                <div className="tetrone-admin-meta-row">
                                    <span className="tetrone-admin-meta-label">{ t('admin.reports.target') }:</span>
                                    { renderCompactTarget(report) }
                                </div>

                                { report.status === 'pending' ? (
                                    <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                        <span className="tetrone-admin-meta-label">{ t('common.status') }:</span>
                                        <span
                                            className={ `tetrone-admin-status-badge ${ getStatusClass(report.status) }` }>
                                            { t(`admin.stats.${ report.status }`) }
                                        </span>
                                    </div>
                                ) : (
                                    <div className={ `tetrone-admin-decision-box status-${ report.status }` }>
                                        <div className="tetrone-admin-meta-row">
                                            <span className="tetrone-admin-meta-label">{ t('common.status') }:</span>
                                            <span
                                                className={ `tetrone-admin-status-badge ${ getStatusClass(report.status) }` }>
                                                { t(`admin.stats.${ report.status }`) }
                                            </span>
                                        </div>

                                        { report.admin_response && (
                                            <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                                <span
                                                    className="tetrone-admin-meta-label">{ t('admin.common.admin_response') }</span>
                                                <span className="tetrone-admin-response-text">
                                                    { report.admin_response }
                                                </span>
                                            </div>
                                        ) }

                                        <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                            <span
                                                className="tetrone-admin-meta-label">{ t('admin.reports.closed_at') }:</span>
                                            <span className="tetrone-admin-meta-value-bold">
                                                { formatDate(report.updated_at) }
                                            </span>
                                        </div>

                                        { report.moderator && (
                                            <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                                <span
                                                    className="tetrone-admin-meta-label">{ t('admin.reports.reviewed_by') }:</span>
                                                <Link to={ `/${ report.moderator.username }` } className="tetrone-link">
                                                    { report.moderator.first_name } { report.moderator.last_name } (@{ report.moderator.username })
                                                </Link>
                                            </div>
                                        ) }
                                    </div>
                                ) }
                            </div>

                            <div className="tetrone-admin-report-actions">
                                { report.status === 'pending' && (
                                    <>
                                        <Button variant="approve" onClick={ () => handleAction(report.id, 'resolve') }>
                                            { t('admin.reports.btn_resolve') }
                                        </Button>
                                        <Button variant="reject" onClick={ () => handleAction(report.id, 'reject') }>
                                            { t('admin.reports.btn_reject') }
                                        </Button>
                                    </>
                                ) }

                                { report.status !== 'pending' && (
                                    <Button variant="warning" onClick={ () => handleAction(report.id, 'revert') }
                                            title={ t('admin.reports.undo_tooltip') }>
                                        { t('action.undo') }
                                    </Button>
                                ) }
                            </div>
                        </div>
                    )) }
                </div>
            ) }
        </div>
    );
}