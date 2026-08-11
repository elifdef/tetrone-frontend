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
        let cls = 'tetrone-support-status-badge ';
        if (status === 'open' || status === 'in_progress') cls += 'status-pending';
        else if (status === 'resolved') cls += 'status-resolved';
        else if (status === 'closed') cls += 'status-rejected';
        return <span className={cls}>{t(`support.status_${status}`)}</span>;
    };

    if (loading) return <div className="tetrone-support-block"><div className="tetrone-support-empty">{t('common.loading')}</div></div>;
    if (!ticket) return null;

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    return (
        <>
            <div className="tetrone-support-block">
                <div className="tetrone-support-block-header tetrone-flex-between">
                    <span>#{ticket.id} — {ticket.subject}</span>
                    <div className="tetrone-support-actions-mini">
                        {getStatusBadge(ticket.status)}
                        <Button variant="primary" onClick={() => navigateTo('tickets')}>
                            {t('support.tab_my_tickets')}
                        </Button>
                    </div>
                </div>
            </div>

            <div className="tetrone-support-chat-box">
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
                <div className="tetrone-support-block">
                    <div className="tetrone-support-block-header">{t('support.reply_placeholder')}</div>
                    <form onSubmit={handleSubmit(onReplySubmit)} className="tetrone-support-block-content">
                        <textarea
                            {...register("message")}
                            className="tetrone-support-textarea"
                            placeholder={t('support.reply_placeholder')}
                        />
                        {errors.message && <div className="tetrone-support-error-text">{errors.message.message}</div>}
                        <div className="tetrone-support-form-footer">
                            <Button type="submit" variant="primary" disabled={isSubmitting}>
                                {isSubmitting ? t('common.loading') : t('action.send')}
                            </Button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="tetrone-support-closed-notice">
                    {t('support.ticket_closed')}
                </div>
            )}
        </>
    );
}