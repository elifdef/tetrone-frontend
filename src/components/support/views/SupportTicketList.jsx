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
        let cls = 'inline-block px-[6px] py-[2px] text-[10px] font-bold border ';
        if (status === 'open' || status === 'in_progress') cls += 'bg-[rgba(255,204,0,0.1)] border-[#e5a43b] text-[#e5a43b]';
        else if (status === 'resolved') cls += 'bg-[rgba(75,179,75,0.1)] border-[#4bb34b] text-[#4bb34b]';
        else if (status === 'closed') cls += 'bg-[rgba(255,51,71,0.1)] border-[#ff3347] text-[#ff3347]';
        return <span className={cls}>{t(`support.status_${status}`)}</span>;
    };

    return (
        <div>
            <div className="flex justify-between items-center bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                <span>{t('support.tab_my_tickets')}</span>
                <div className="flex gap-[5px]">
                    <Button variant="primary" onClick={() => navigateTo('form')}>{t('support.create_ticket')}</Button>
                    <Button variant="secondary" onClick={() => navigateTo('home')}>{t('action.go_back')}</Button>
                </div>
            </div>

            {loading ? (
                <div className="p-[20px] text-center text-text-muted italic border border-border bg-[rgba(128,128,128,0.02)]">{t('common.loading')}</div>
            ) : tickets.length === 0 ? (
                <div className="p-[20px] text-center text-text-muted italic border border-border bg-[rgba(128,128,128,0.02)]">{t('support.no_tickets')}</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-border text-[11px] min-w-[500px]">
                        <thead>
                        <tr>
                            <th className="border border-border p-[6px_10px] bg-[rgba(128,128,128,0.05)] text-left font-bold text-text-muted w-[50px]">{t('common.id')}</th>
                            <th className="border border-border p-[6px_10px] bg-[rgba(128,128,128,0.05)] text-left font-bold text-text-muted">{t('support.field_subject')}</th>
                            <th className="border border-border p-[6px_10px] bg-[rgba(128,128,128,0.05)] text-left font-bold text-text-muted w-[150px]">{t('support.field_category')}</th>
                            <th className="border border-border p-[6px_10px] bg-[rgba(128,128,128,0.05)] text-left font-bold text-text-muted w-[120px]">{t('common.status')}</th>
                            <th className="border border-border p-[6px_10px] bg-[rgba(128,128,128,0.05)] text-left font-bold text-text-muted w-[140px]">{t('common.date')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-bg-hover cursor-pointer transition-colors" onClick={() => navigateTo('ticket_detail', { ticket_id: ticket.id })}>
                                <td className="border border-border p-[6px_10px]">#{ticket.id}</td>
                                <td className="border border-border p-[6px_10px]"><strong>{ticket.subject}</strong></td>
                                <td className="border border-border p-[6px_10px]">{t(`support.cat_${ticket.category}`)}</td>
                                <td className="border border-border p-[6px_10px]">{getStatusBadge(ticket.status)}</td>
                                <td className="border border-border p-[6px_10px] text-text-muted">{formatDate(ticket.created_at)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}