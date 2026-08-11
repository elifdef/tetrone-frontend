import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import supportService from '../../../services/support.service';
import { useDateFormatter } from '../../../hooks/useDateFormatter';
import Button from '../../ui/Button';

export default function SupportTicketList({ navigateTo }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadTickets = async () => {
            try {
                const res = await supportService.getTickets();
                setTickets(res.tickets || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadTickets();
    }, []);

    const getStatusBadge = (status) => {
        let cls = 'tetrone-support-status-badge ';
        if (status === 'open' || status === 'in_progress') cls += 'status-pending';
        else if (status === 'resolved') cls += 'status-resolved';
        else if (status === 'closed') cls += 'status-rejected';
        return <span className={cls}>{t(`support.status_${status}`)}</span>;
    };

    return (
        <div className="tetrone-support-block">
            <div className="tetrone-support-block-header tetrone-flex-between">
                <span>{t('support.tab_my_tickets')}</span>
                <div className="tetrone-support-actions-mini">
                    <Button variant="primary" onClick={() => navigateTo('form')}>{t('support.create_ticket')}</Button>
                    <Button variant="secondary" onClick={() => navigateTo('home')}>{t('action.go_back')}</Button>
                </div>
            </div>

            {loading ? (
                <div className="tetrone-support-empty">{t('common.loading')}</div>
            ) : tickets.length === 0 ? (
                <div className="tetrone-support-empty">{t('support.no_tickets')}</div>
            ) : (
                <table className="tetrone-support-table">
                    <thead>
                    <tr>
                        <th width="50">{t('common.id')}</th>
                        <th>{t('support.field_subject')}</th>
                        <th width="150">{t('support.field_category')}</th>
                        <th width="120">{t('common.status')}</th>
                        <th width="140">{t('common.date')}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {tickets.map(ticket => (
                        <tr key={ticket.id} onClick={() => navigateTo('ticket_detail', { ticket_id: ticket.id })}>
                            <td>#{ticket.id}</td>
                            <td><strong>{ticket.subject}</strong></td>
                            <td>{t(`support.cat_${ticket.category}`)}</td>
                            <td>{getStatusBadge(ticket.status)}</td>
                            <td className="text-muted">{formatDate(ticket.created_at)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}