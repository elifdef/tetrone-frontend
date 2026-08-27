import { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import supportService from '../../../services/support.service';
import { useDateFormatter } from '../../../hooks/useDateFormatter';
import Button from '../../ui/Button';
import { AuthContext } from '../../../context/AuthContext';
import TicketMessageBubble from './TicketMessageBubble';

export default function SupportTicketDetail({ navigateTo, ticketId }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { user: currentUser } = useContext(AuthContext);
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);

    const replySchema = z.object({
        message: z.string().min(1, t('validation.required') || 'Field is required')
    });

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(replySchema)
    });

    const loadSingleTicket = async () => {
        setLoading(true);
        try {
            const res = await supportService.getTicket(ticketId);
            setTicket(res.ticket || res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (ticketId) loadSingleTicket();
    }, [ticketId]);

    const onReplySubmit = async (data) => {
        try {
            const res = await supportService.replyToTicket(ticketId, data.message);
            if (res.code === 'REPLY_SENT' || res.success) {
                reset();
                loadSingleTicket();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const getStatusBadge = (status) => {
        let cls = 'inline-block px-[6px] py-[2px] text-[10px] font-bold border ';
        if (status === 'open' || status === 'in_progress') cls += 'bg-[rgba(255,204,0,0.1)] border-[#e5a43b] text-[#e5a43b]';
        else if (status === 'resolved') cls += 'bg-[rgba(75,179,75,0.1)] border-[#4bb34b] text-[#4bb34b]';
        else if (status === 'closed') cls += 'bg-[rgba(255,51,71,0.1)] border-[#ff3347] text-[#ff3347]';
        return <span className={cls}>{t(`support.status_${status}`)}</span>;
    };

    if (loading) return <div className="p-[20px] text-center text-text-muted italic border border-border bg-[rgba(128,128,128,0.02)]">{t('common.loading')}</div>;
    if (!ticket) return null;

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <div>
            <div className="flex justify-between items-center bg-theme-header-bg text-theme-link text-[11px] font-bold p-[8px_10px] -mt-[20px] -mx-[20px] mb-[15px] border-b border-border max-md:-mt-[10px] max-md:-mx-[10px]">
                <span className="truncate pr-[10px]">#{ticket.id} — {ticket.subject}</span>
                <div className="flex items-center gap-[10px] shrink-0">
                    {getStatusBadge(ticket.status)}
                    <Button variant="primary" onClick={() => navigateTo('tickets')}>
                        {t('support.tab_my_tickets')}
                    </Button>
                </div>
            </div>

            <div className="border border-border bg-[rgba(128,128,128,0.02)] p-[15px] flex flex-col gap-[15px] mb-[20px] max-h-[500px] overflow-y-auto">
                {ticket.messages?.map(msg => (
                    <TicketMessageBubble
                        key={msg.id}
                        msg={msg}
                        ticketOwnerId={ticket.user?.id}
                        currentUserId={currentUser?.id}
                        formatDate={formatDate}
                    />
                ))}
            </div>

            {!isClosed ? (
                <div>
                    <div className="font-bold text-theme-link border-b border-border pb-[5px] mb-[10px] text-[12px]">
                        {t('support.reply_placeholder')}
                    </div>
                    <form onSubmit={handleSubmit(onReplySubmit)}>
                        <textarea
                            {...register("message")}
                            className="w-full h-[80px] bg-input-bg border border-input-border text-text-main p-[6px] text-[11px] outline-none focus:border-theme-link resize-y mb-[5px]"
                            placeholder={t('support.reply_placeholder')}
                        />
                        {errors.message && <div className="text-[10px] text-[#ff3347] mb-[10px]">{errors.message.message}</div>}

                        <div className="flex justify-end mt-[5px]">
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                {isSubmitting ? t('common.loading') : t('action.send')}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="bg-[rgba(128,128,128,0.05)] border border-border p-[10px] text-center text-text-muted italic text-[11px]">
                    {t('support.ticket_closed')}
                </div>
            )}
        </div>
    );
}