import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import AdminService from '../../services/admin.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Button from '../ui/Button';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useModal } from '../../context/ModalContext';

const StatusBadge = ({ status, t }) =>
{
    const statusClasses = {
        open: 'tetrone-admin-status-pending',
        waiting_for_user: 'tetrone-admin-status-pending',
        in_progress: 'tetrone-admin-status-progress',
        resolved: 'tetrone-admin-status-resolved',
        closed: 'tetrone-admin-status-rejected'
    };

    const cls = statusClasses[status] || '';
    return <span className={ `tetrone-admin-status-badge ${ cls }` }>{ t(`support.status_${ status }`) }</span>;
};

const AdminTicketDetail = ({ ticket, onBack, onTicketUpdated }) =>
{
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { openPrompt } = useModal();

    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [replying, setReplying] = useState(false);

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    const handleReply = async (e) =>
    {
        e.preventDefault();
        if (!replyText.trim())
        {
            return;
        }

        setReplying(true);
        try
        {
            await AdminService.replyToTicket(ticket.id, replyText, isInternal);
            setReplyText('');
            setIsInternal(false);
            notifySuccess(t('admin.support.reply_sent'));
            onTicketUpdated(ticket.id);
        } catch (error)
        {
            notifyError(t('common.error'));
        } finally
        {
            setReplying(false);
        }
    };

    const handleClose = async () =>
    {
        const reason = await openPrompt(t('admin.common.prompt_placeholder'), t('action.close'), true);
        if (reason === null)
        {
            return;
        }

        try
        {
            await AdminService.closeTicket(ticket.id, reason.trim());
            notifySuccess(t('common.success'));
            onTicketUpdated(ticket.id);
        } catch (error)
        {
            notifyError(t('common.error'));
        }
    };

    return (
        <div className="tetrone-admin-container">
            <div className="tetrone-admin-block">
                <div className="tetrone-admin-block-header tetrone-flex-between">
                    <span>#{ ticket.id } — { ticket.subject }</span>
                    <Button variant="secondary" onClick={ onBack }>
                        { t('action.go_back') }
                    </Button>
                </div>

                <div className="tetrone-admin-block-content tetrone-admin-ticket-meta-content">
                    <div className="tetrone-admin-meta-row">
                        <span className="tetrone-admin-meta-label">{ t('support.field_category') }:</span>
                        <strong className="tetrone-link">
                            { t(`support.cat_${ ticket.category }`) }
                        </strong>
                        { ticket.subcategory && (
                            <span className="text-muted tetrone-admin-subcat">
                                / { t(`support.subcat_${ ticket.subcategory }`) }
                            </span>
                        ) }
                    </div>

                    <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                        <span className="tetrone-admin-meta-label">{ t('admin.support.ticket_author') }:</span>
                        <Link to={ `/${ ticket.user?.username }` } className="tetrone-link" target="_blank">
                            { ticket.user?.first_name } { ticket.user?.last_name } (@{ ticket.user?.username })
                        </Link>
                    </div>

                    <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                        <span className="tetrone-admin-meta-label">{ t('common.status') }:</span>
                        <StatusBadge status={ ticket.status } t={ t }/>
                    </div>

                    { (ticket.meta_data?.user_agent || ticket.meta_data?.steps_to_reproduce) && (
                        <div className="tetrone-admin-meta-section">
                            { ticket.meta_data?.user_agent && (
                                <div className="tetrone-admin-meta-row">
                                    <span className="text-muted">{ ticket.meta_data.user_agent }</span>
                                </div>
                            ) }
                            { ticket.meta_data?.steps_to_reproduce && (
                                <div className="tetrone-admin-meta-row tetrone-admin-meta-row-spaced">
                                    <div className="tetrone-admin-meta-label tetrone-admin-meta-label-compact">
                                        { t('support.field_steps') }:
                                    </div>
                                    <div className="tetrone-admin-report-quote">
                                        { ticket.meta_data.steps_to_reproduce }
                                    </div>
                                </div>
                            ) }
                        </div>
                    ) }
                </div>
            </div>

            <div className="tetrone-ticket-chat-container">
                { ticket.messages?.map(msg =>
                {
                    const isAdmin = msg.user?.id !== ticket.user?.id;
                    const msgClass = msg.is_internal_note ? 'msg-internal' : (isAdmin ? 'msg-admin' : 'msg-user');

                    return (
                        <div key={ msg.id } className={ `tetrone-ticket-msg-box ${ msgClass }` }>
                            <div className="tetrone-ticket-msg-header">
                                <span className="tetrone-ticket-msg-author">
                                    { msg.user?.first_name || msg.user?.username || t('admin.support.system') }
                                    { msg.is_internal_note && (
                                        <span
                                            className="tetrone-internal-badge">[{ t('admin.support.internal_note') }]</span>
                                    ) }
                                </span>
                                <span className="tetrone-ticket-msg-date">{ formatDate(msg.created_at) }</span>
                            </div>
                            <div className="tetrone-ticket-msg-body">
                                { msg.message }
                            </div>

                            { msg.attachments?.length > 0 && (
                                <div className="tetrone-ticket-attachments">
                                    { msg.attachments.map(att => (
                                        <a key={ att.id } href={ att.url || att.file_url } target="_blank"
                                           rel="noreferrer" className="tetrone-ticket-attach-link">
                                            { att.file_name }
                                        </a>
                                    )) }
                                </div>
                            ) }
                        </div>
                    );
                }) }
            </div>

            { !isClosed ? (
                <div className="tetrone-admin-block">
                    <div className="tetrone-admin-block-header">{ t('action.reply') }</div>
                    <form onSubmit={ handleReply } className="tetrone-admin-block-content">
                        <textarea
                            className="tetrone-form-textarea tetrone-ticket-textarea"
                            value={ replyText }
                            onChange={ (e) => setReplyText(e.target.value) }
                            placeholder={ t('admin.support.reply_placeholder') }
                            required
                        />
                        <div className="tetrone-ticket-form-actions">
                            <label className="tetrone-ticket-internal-check">
                                <input
                                    type="checkbox"
                                    checked={ isInternal }
                                    onChange={ (e) => setIsInternal(e.target.checked) }
                                />
                                { t('admin.support.internal_note_desc') }
                            </label>

                            <div className="tetrone-admin-ticket-actions">
                                <Button type="button" variant="reject" onClick={ handleClose }>
                                    { t('action.close') }
                                </Button>
                                <Button type="submit" variant="primary" disabled={ replying || !replyText.trim() }>
                                    { replying ? t('action.saving') : t('action.send') }
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="tetrone-empty-state-compact tetrone-admin-closed-meta-box">
                    { t('support.ticket_closed') }
                    { ticket.closed_by && (
                        <div className="tetrone-admin-closed-meta">
                            { t('admin.support.closed_by') } <Link to={ `/${ ticket.closed_by.username }` }
                                                                              className="tetrone-link">@{ ticket.closed_by.username }</Link>
                        </div>
                    ) }
                </div>
            ) }
        </div>
    );
};

export default function AdminTickets()
{
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);

    const loadTickets = useCallback(async () =>
    {
        setLoading(true);
        try
        {
            const res = await AdminService.getTickets(statusFilter);
            setTickets(res.data?.data || res.data || res.tickets || []);
        } catch (error)
        {
            notifyError(t('admin.support.error_loading_tickets'));
        } finally
        {
            setLoading(false);
        }
    }, [statusFilter, t]);

    useEffect(() =>
    {
        if (!selectedTicket)
        {
            loadTickets();
        }
    }, [selectedTicket, loadTickets]);

    const handleSelectTicket = async (id) =>
    {
        setLoading(true);
        try
        {
            const res = await AdminService.getTicket(id);
            setSelectedTicket(res.data || res.ticket || res);
        } catch (error)
        {
            notifyError(t('admin.support.error_loading_ticket'));
        } finally
        {
            setLoading(false);
        }
    };

    if (selectedTicket)
    {
        return <AdminTicketDetail
            ticket={ selectedTicket }
            onBack={ () => setSelectedTicket(null) }
            onTicketUpdated={ handleSelectTicket }
        />;
    }

    return (
        <div className="tetrone-admin-container">
            <div className="tetrone-admin-filters-section tetrone-admin-filters-compact">
                <select
                    className="tetrone-form-input tetrone-admin-filter-select"
                    value={ statusFilter }
                    onChange={ (e) => setStatusFilter(e.target.value) }
                >
                    <option value="">{ t('admin.support.filter_all') }</option>
                    <option value="open">{ t('support.status_open') }</option>
                    <option value="in_progress">{ t('support.status_in_progress') }</option>
                    <option value="waiting_for_user">{ t('support.status_waiting_for_user') }</option>
                    <option value="resolved">{ t('support.status_resolved') }</option>
                    <option value="closed">{ t('support.status_closed') }</option>
                </select>
            </div>

            <div className="tetrone-admin-block">
                { loading ? (
                    <div className="tetrone-empty-state">{ t('common.loading') }</div>
                ) : tickets.length === 0 ? (
                    <div className="tetrone-empty-state">{ t('admin.support.no_tickets_found') }</div>
                ) : (
                    <table className="tetrone-admin-table">
                        <thead>
                        <tr>
                            <th width="50">{ t('common.id') }</th>
                            <th>{ t('support.field_subject') }</th>
                            <th width="150">{ t('support.field_category') }</th>
                            <th width="120">{ t('common.status') }</th>
                            <th width="140">{ t('common.date') }</th>
                        </tr>
                        </thead>
                        <tbody>
                        { tickets.map(ticket => (
                            <tr key={ ticket.id } onClick={ () => handleSelectTicket(ticket.id) }
                                className="tetrone-admin-table-row">
                                <td>#{ ticket.id }</td>
                                <td>
                                    <strong className="tetrone-link">{ ticket.subject }</strong>
                                    <div className="tetrone-admin-ticket-sender">
                                        { t('common.from') }: { ticket.user?.username || 'Unknown' }
                                    </div>
                                </td>
                                <td>{ t(`support.cat_${ ticket.category }`) }</td>
                                <td><StatusBadge status={ ticket.status } t={ t }/></td>
                                <td className="text-muted">{ formatDate(ticket.created_at) }</td>
                            </tr>
                        )) }
                        </tbody>
                    </table>
                ) }
            </div>
        </div>
    );
}