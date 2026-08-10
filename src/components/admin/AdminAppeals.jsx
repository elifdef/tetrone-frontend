import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import AdminService from "../../services/admin.service";
import { notifySuccess, notifyError } from "../common/Notify";
import { useModal } from "../../context/ModalContext";
import { useDateFormatter } from "../../hooks/useDateFormatter";
import Button from "../ui/Button.jsx";

export default function AdminAppeals()
{
    const { t } = useTranslation();
    const { openPrompt } = useModal();
    const formatDate = useDateFormatter();

    const [appeals, setAppeals] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        status: 'pending',
        date: 'all',
        search: ''
    });

    const [searchInput, setSearchInput] = useState('');

    const handleFilterChange = (key, value) =>
    {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

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

    const fetchAppeals = useCallback(async (currentFilters) =>
    {
        setLoading(true);
        try
        {
            const res = await AdminService.getAppeals(currentFilters);

            if (res && res.code === 'APPEALS_RETRIEVED')
            {
                setStats(res.stats || { total: 0, pending: 0, resolved: 0, rejected: 0 });
                setAppeals(res.appeals || []);
            }
            else
            {
                notifyError(t('common.error'));
            }
        } catch (error)
        {
            notifyError(t('common.error'));
        }
        setLoading(false);
    }, [t]);

    useEffect(() =>
    {
        fetchAppeals(filters);
    }, [filters, fetchAppeals]);

    const handleAction = async (appealId, actionType) =>
    {
        const title = actionType === 'resolve'
            ? t('admin.appeals.prompt_approve')
            : t('admin.appeals.prompt_reject');

        const responseText = await openPrompt(t('admin.common.prompt_placeholder'), title, true);
        if (responseText === null)
        {
            return;
        }

        try
        {
            const res = await AdminService.handleAppeal(appealId, actionType, responseText.trim());

            if (res && (res.code === 'APPEAL_RESOLVED' || res.code === 'APPEAL_REJECTED'))
            {
                notifySuccess(t('common.success'));
                fetchAppeals();
            }
            else
            {
                notifyError(t('common.error'));
            }
        } catch (error)
        {
            notifyError(t('common.error'));
        }
    };

    const getStatusClass = (status) =>
    {
        switch (status)
        {
            case 'open':
            case 'in_progress':
                return 'tetrone-admin-status-pending';
            case 'resolved':
                return 'tetrone-admin-status-resolved';
            case 'closed':
                return 'tetrone-admin-status-rejected';
            default:
                return '';
        }
    };

    const getStatusLabel = (status) =>
    {
        switch (status)
        {
            case 'open':
            case 'in_progress':
                return t('admin.stats.pending');
            case 'resolved':
                return t('admin.stats.approved');
            case 'closed':
                return t('admin.stats.rejected');
            default:
                return status;
        }
    };

    return (
        <div className="admin-appeals-page">
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
                    <div className="tetrone-admin-stat-label">{ t('admin.stats.approved') }</div>
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
                    placeholder={ t('admin.appeals.filters.search_placeholder') }
                    value={ searchInput }
                    onChange={ (e) => setSearchInput(e.target.value) }
                />

                <select className="tetrone-form-input tetrone-admin-filter-select" value={ filters.status }
                        onChange={ (e) => handleFilterChange('status', e.target.value) }>
                    <option value="all">{ t('admin.stats.total') }</option>
                    <option value="pending">{ t('admin.stats.pending') }</option>
                    <option value="resolved">{ t('admin.stats.approved') }</option>
                    <option value="closed">{ t('admin.stats.rejected') }</option>
                </select>

                <select className="tetrone-form-input tetrone-admin-filter-select" value={ filters.date }
                        onChange={ (e) => handleFilterChange('date', e.target.value) }>
                    <option value="all">{ t('admin.reports.filters.date_all') }</option>
                    <option value="today">{ t('admin.reports.filters.date_today') }</option>
                    <option value="yesterday">{ t('admin.reports.filters.date_yesterday') }</option>
                    <option value="week">{ t('admin.reports.filters.date_week') }</option>
                    <option value="month">{ t('admin.reports.filters.date_month') }</option>
                </select>
            </div>

            { loading ? (
                <div className="tetrone-empty-state">{ t('common.loading') }</div>
            ) : appeals.length === 0 ? (
                <div className="tetrone-empty-state">{ t('admin.appeals.empty') }</div>
            ) : (
                <div className="tetrone-feed-list">
                    { appeals.map((appeal) =>
                    {
                        const appealText = appeal.messages?.[0]?.message || appeal.message;
                        const isPending = appeal.status === 'open' || appeal.status === 'in_progress';

                        return (
                            <div key={ appeal.id } className="tetrone-admin-report-card">
                                <div className="tetrone-admin-report-info">
                                    <div className="tetrone-admin-meta-row">
                                        <span className="tetrone-admin-meta-label">{ t('common.date') }:</span>
                                        <span>{ formatDate(appeal.created_at) }</span>
                                    </div>
                                    <div className="tetrone-admin-meta-row">
                                        <span className="tetrone-admin-meta-label">{ t('admin.appeals.from') }:</span>
                                        <Link to={ `/${ appeal.user?.username }` } className="tetrone-link"
                                              target="_blank">
                                            { appeal.user?.first_name } { appeal.user?.last_name } (@{ appeal.user?.username })
                                        </Link>
                                    </div>

                                    { appealText && (
                                        <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                            <div className="tetrone-admin-meta-label"
                                                 style={ { marginBottom: '4px' } }>{ t('admin.appeals.message') }:
                                            </div>
                                            <div className="tetrone-admin-report-quote">
                                                "{ appealText }"
                                            </div>
                                        </div>
                                    ) }

                                    {/* БЛОК РІШЕННЯ */ }
                                    { isPending ? (
                                        <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                            <span className="tetrone-admin-meta-label">{ t('common.status') }:</span>
                                            <span
                                                className={ `tetrone-admin-status-badge ${ getStatusClass(appeal.status) }` }>
                                                { getStatusLabel(appeal.status) }
                                            </span>
                                        </div>
                                    ) : (
                                        <div
                                            className={ `tetrone-admin-decision-box status-${ appeal.status === 'closed' ? 'rejected' : appeal.status }` }>
                                            <div className="tetrone-admin-meta-row">
                                                <span
                                                    className="tetrone-admin-meta-label">{ t('common.status') }:</span>
                                                <span
                                                    className={ `tetrone-admin-status-badge ${ getStatusClass(appeal.status) }` }>
                                                    { getStatusLabel(appeal.status) }
                                                </span>
                                            </div>

                                            { appeal.admin_response && (
                                                <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                                    <span
                                                        className="tetrone-admin-meta-label">{ t('admin.common.admin_response') }:</span>
                                                    <span className="tetrone-admin-response-text">
                                                        { appeal.admin_response }
                                                    </span>
                                                </div>
                                            ) }

                                            <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                                <span
                                                    className="tetrone-admin-meta-label">{ t('admin.reports.closed_at') }:</span>
                                                <span className="tetrone-admin-meta-value-bold">
                                                    { formatDate(appeal.updated_at || appeal.closed_at) }
                                                </span>
                                            </div>

                                            { appeal.closed_by && (
                                                <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                                    <span
                                                        className="tetrone-admin-meta-label">{ t('admin.reports.reviewed_by') }:</span>
                                                    <Link to={ `/${ appeal.closed_by.username }` }
                                                          className="tetrone-link" target="_blank">
                                                        { appeal.closed_by.first_name } { appeal.closed_by.last_name } (@{ appeal.closed_by.username })
                                                    </Link>
                                                </div>
                                            ) }
                                        </div>
                                    ) }
                                </div>

                                <div className="tetrone-admin-report-actions">
                                    { isPending && (
                                        <>
                                            <Button variant="approve"
                                                    onClick={ () => handleAction(appeal.id, 'resolve') }>
                                                { t('admin.appeals.btn_approve') }
                                            </Button>
                                            <Button variant="reject"
                                                    onClick={ () => handleAction(appeal.id, 'reject') }>
                                                { t('admin.appeals.btn_reject') }
                                            </Button>
                                        </>
                                    ) }
                                </div>
                            </div>
                        );
                    }) }
                </div>
            ) }
        </div>
    );
}