import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/admin.service';
import { notifySuccess, notifyError } from '../common/Notify';
import Button from '../ui/Button';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { useModal } from '../../context/ModalContext';
import CustomSelect from '../ui/CustomSelect'; // Підключаємо твій селект

const StatusBadge = ({ status, t }) => {
    let colors = "";
    switch (status) {
        case 'open':
        case 'waiting_for_user':
            colors = "text-[#d39e00] border-[#d39e00]";
            break;
        case 'in_progress':
            colors = "text-[#5b9bd5] border-[#5b9bd5]";
            break;
        case 'resolved':
            colors = "text-theme-success border-theme-success";
            break;
        case 'closed':
            colors = "text-theme-error border-theme-error";
            break;
        default:
            colors = "text-text-main border-border";
    }
    return <span className={`inline-block px-[6px] py-[2px] text-[10px] font-bold border bg-bg-page ${colors}`}>{t(`support.status_${status}`)}</span>;
};

const AdminTicketDetail = ({ ticket, onBack, onTicketUpdated }) => {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { openPrompt } = useModal();

    const [replyText, setReplyText] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [replying, setReplying] = useState(false);

    const isClosed = ticket.status === 'closed' || ticket.status === 'resolved';

    const handleReply = (e) => {
        e.preventDefault();
        if (!replyText.trim()) return;

        setReplying(true);
        AdminService.replyToTicket(ticket.id, replyText, isInternal)
        .onSuccess(() => {
            setReplyText('');
            setIsInternal(false);
            notifySuccess(t('admin.support.reply_sent'));
            onTicketUpdated(ticket.id);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        })
        .onFinally(() => {
            setReplying(false);
        });
    };

    const handleClose = async () => {
        const reason = await openPrompt(t('admin.common.prompt_placeholder'), t('action.close'), true);
        if (reason === null) return;

        AdminService.closeTicket(ticket.id, reason.trim())
        .onSuccess(() => {
            notifySuccess(t('common.success'));
            onTicketUpdated(ticket.id);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        });
    };

    return (
        <div className="flex flex-col gap-[15px] font-tahoma text-[11px]">
            <div className="bg-bg-box border border-border">
                <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main flex justify-between items-center">
                    <span>#{ticket.id} — {ticket.subject}</span>
                    <Button variant="secondary" onClick={onBack}>
                        {t('action.go_back')}
                    </Button>
                </div>

                <div className="p-[10px_15px]">
                    <div className="mb-[4px]">
                        <span className="text-text-muted mr-[5px]">{t('support.field_category')}:</span>
                        <strong className="text-theme-link">
                            {t(`support.cat_${ticket.category}`)}
                        </strong>
                        {ticket.subcategory && (
                            <span className="text-text-muted ml-[5px]">
                                / {t(`support.subcat_${ticket.subcategory}`)}
                            </span>
                        )}
                    </div>

                    <div className="mt-[8px] mb-[4px]">
                        <span className="text-text-muted mr-[5px]">{t('admin.support.ticket_author')}:</span>
                        <Link to={`/${ticket.user?.username}`} className="text-theme-link hover:underline bg-transparent no-underline" target="_blank">
                            {ticket.user?.first_name} {ticket.user?.last_name} (@{ticket.user?.username})
                        </Link>
                    </div>

                    <div className="mt-[8px] mb-[4px]">
                        <span className="text-text-muted mr-[5px]">{t('common.status')}:</span>
                        <StatusBadge status={ticket.status} t={t} />
                    </div>

                    {(ticket.meta_data?.user_agent || ticket.meta_data?.steps_to_reproduce) && (
                        <div className="mt-[10px] pt-[10px] border-t border-dotted border-border">
                            {ticket.meta_data?.user_agent && (
                                <div className="mb-[4px]">
                                    <span className="text-text-muted">{ticket.meta_data.user_agent}</span>
                                </div>
                            )}
                            {ticket.meta_data?.steps_to_reproduce && (
                                <div className="mt-[8px] mb-[4px]">
                                    <div className="mb-[4px] text-text-muted font-bold">
                                        {t('support.field_steps')}:
                                    </div>
                                    <div className="italic bg-bg-page border-l-[2px] border-theme-link p-[5px_8px] text-text-muted">
                                        {ticket.meta_data.steps_to_reproduce}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-[10px]">
                {ticket.messages?.map(msg => {
                    const isAdmin = msg.user?.id !== ticket.user?.id;
                    const isInternal = msg.is_internal_note;

                    // Базові класи
                    let borderClass = "border-border";
                    let headerBgClass = "bg-header-bg";
                    let headerTextClass = "text-text-main";
                    let bodyBgClass = "bg-bg-box";
                    let bodyTextClass = "text-text-main";

                    if (isInternal) {
                        borderClass = "border-[#d39e00] dark:border-[#664d00]";
                        headerBgClass = "bg-[#fff9e6] dark:bg-[#332600]";
                        headerTextClass = "text-[#8a6d3b] dark:text-[#d4a017]";
                        bodyBgClass = "bg-[#fffdf5] dark:bg-[#1a1400]";
                        bodyTextClass = "text-[#333333] dark:text-[#e0e0e0]";
                    } else if (isAdmin) {
                        borderClass = "border-[#a3c2e0] dark:border-[#2b4b6b]";
                        headerBgClass = "bg-[#eef5fc] dark:bg-[#1a2a3a]";
                        bodyBgClass = "bg-[#f7fafd] dark:bg-[#15202b]";
                    }

                    return (
                        <div key={msg.id} className={`border text-[12px] ${borderClass} ${bodyBgClass}`}>
                            <div className={`border-b p-[6px_10px] flex justify-between items-center ${headerBgClass} ${borderClass}`}>
                                <span className={`font-bold ${isInternal ? headerTextClass : 'text-theme-link'}`}>
                                    {msg.user?.first_name || msg.user?.username || t('admin.support.system')}
                                    {isInternal && (
                                        <span className="text-[#cc0000] dark:text-[#ff4d4d] font-bold ml-[5px] text-[10px]">
                                            [{t('admin.support.internal_note')}]
                                        </span>
                                    )}
                                </span>
                                <span className="text-[10px] text-text-muted">{formatDate(msg.created_at)}</span>
                            </div>
                            <div className={`p-[10px] leading-[1.4] whitespace-pre-wrap ${bodyTextClass}`}>
                                {msg.message}
                            </div>

                            {msg.attachments?.length > 0 && (
                                <div className="border-t border-dotted border-border bg-bg-page p-[8px_10px] flex flex-col gap-[5px]">
                                    {msg.attachments.map(att => (
                                        <a key={att.id} href={att.url || att.file_url} target="_blank" rel="noreferrer" className="text-[11px] text-theme-link font-bold hover:underline no-underline bg-transparent">
                                            {att.file_name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {!isClosed ? (
                <div className="bg-bg-box border border-border">
                    <div className="bg-header-bg p-[6px_10px] font-bold text-[11px] border-b border-border text-text-main">
                        {t('action.reply')}
                    </div>
                    <form onSubmit={handleReply} className="p-[10px]">
                        <textarea
                            className="w-full min-h-[100px] mb-[10px] resize-y border border-input-border bg-input-bg p-[6px] text-[11px] text-text-main focus:outline-none focus:border-border shadow-[inset_1px_1px_2px_rgba(0,0,0,0.1)]"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t('admin.support.reply_placeholder')}
                            required
                        />
                        <div className="flex justify-between items-center border-t border-dotted border-border pt-[10px]">
                            <label className="flex items-center gap-[5px] font-bold text-[#cc0000] dark:text-[#ff4d4d] cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isInternal}
                                    onChange={(e) => setIsInternal(e.target.checked)}
                                    className="cursor-pointer"
                                />
                                {t('admin.support.internal_note_desc')}
                            </label>

                            <div className="flex gap-[8px]">
                                <Button type="button" variant="reject" onClick={handleClose}>
                                    {t('action.close')}
                                </Button>
                                <Button type="submit" variant="primary" disabled={replying || !replyText.trim()}>
                                    {replying ? t('action.saving') : t('action.send')}
                                </Button>
                            </div>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="p-[15px] text-center text-text-muted border border-border bg-bg-box">
                    {t('support.ticket_closed')}
                    {ticket.closed_by && (
                        <div className="mt-[5px] text-[10px]">
                            {t('admin.support.closed_by')} <Link to={`/${ticket.closed_by.username}`} className="text-theme-link hover:underline bg-transparent no-underline">@{ticket.closed_by.username}</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function AdminTickets() {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);

    const loadTickets = useCallback(() => {
        setLoading(true);
        AdminService.getTickets(statusFilter)
        .onSuccess((res) => {
            setTickets(res.tickets || []);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        })
        .onFinally(() => {
            setLoading(false);
        });
    }, [statusFilter, t]);

    useEffect(() => {
        if (!selectedTicket) {
            loadTickets();
        }
    }, [selectedTicket, loadTickets]);

    const handleSelectTicket = (id) => {
        setLoading(true);
        AdminService.getTicket(id)
        .onSuccess((res) => {
            setSelectedTicket(res.ticket);
        })
        .onError((err) => {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        })
        .onFinally(() => {
            setLoading(false);
        });
    };

    const statusOptions = [
        { value: '', label: t('admin.support.filter_all') },
        { value: 'open', label: t('support.status_open') },
        { value: 'in_progress', label: t('support.status_in_progress') },
        { value: 'waiting_for_user', label: t('support.status_waiting_for_user') },
        { value: 'resolved', label: t('support.status_resolved') },
        { value: 'closed', label: t('support.status_closed') }
    ];

    if (selectedTicket) {
        return <AdminTicketDetail
            ticket={selectedTicket}
            onBack={() => setSelectedTicket(null)}
            onTicketUpdated={handleSelectTicket}
        />;
    }

    return (
        <div className="flex flex-col gap-[15px] font-tahoma text-[11px]">
            <div className="bg-bg-box p-[15px] border border-border">
                <CustomSelect
                    options={statusOptions}
                    value={statusFilter}
                    onChange={(v) => setStatusFilter(v)}
                    className="w-[200px] max-md:w-full"
                />
            </div>

            <div className="bg-bg-box border border-border">
                {loading ? (
                    <div className="p-[20px] text-center text-text-muted italic">{t('common.loading')}</div>
                ) : tickets.length === 0 ? (
                    <div className="p-[20px] text-center text-text-muted italic">{t('admin.support.no_tickets_found')}</div>
                ) : (
                    <table className="w-full border-collapse text-[11px] bg-bg-box">
                        <thead>
                        <tr>
                            <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[50px]">{t('common.id')}</th>
                            <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border">{t('support.field_subject')}</th>
                            <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[150px]">{t('support.field_category')}</th>
                            <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[120px]">{t('common.status')}</th>
                            <th className="bg-header-bg text-text-muted font-bold text-left p-[8px_10px] border-b border-border w-[140px]">{t('common.date')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tickets.map(ticket => (
                            <tr key={ticket.id} onClick={() => handleSelectTicket(ticket.id)} className="cursor-pointer hover:bg-bg-page transition-colors">
                                <td className="p-[10px] border-b border-bg-page text-text-main align-top">#{ticket.id}</td>
                                <td className="p-[10px] border-b border-bg-page text-text-main align-top">
                                    <strong className="text-theme-link hover:underline bg-transparent no-underline">{ticket.subject}</strong>
                                    <div className="text-[10px] text-text-muted mt-[3px]">
                                        {t('common.from')}: {ticket.user?.username || 'Unknown'}
                                    </div>
                                </td>
                                <td className="p-[10px] border-b border-bg-page text-text-main align-top">{t(`support.cat_${ticket.category}`)}</td>
                                <td className="p-[10px] border-b border-bg-page text-text-main align-top"><StatusBadge status={ticket.status} t={t} /></td>
                                <td className="p-[10px] border-b border-bg-page text-text-muted align-top">{formatDate(ticket.created_at)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}