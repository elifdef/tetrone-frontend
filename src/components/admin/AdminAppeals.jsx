import {useState, useEffect, useCallback} from "react";
import {Link} from "react-router";
import {useTranslation} from "react-i18next";
import AdminService from "../../services/admin.service";
import {notifySuccess, notifyError} from "../common/Notify";
import {useModal} from "../../context/ModalContext";
import {useDateFormatter} from "../../hooks/useDateFormatter";
import Button from "../ui/Button.jsx";
import CustomSelect from "../ui/CustomSelect.jsx";

export default function AdminAppeals()
{
    const {t} = useTranslation();
    const {openPrompt} = useModal();
    const formatDate = useDateFormatter();

    const [appeals, setAppeals] = useState([]);
    const [stats, setStats] = useState({total: 0, pending: 0, resolved: 0, rejected: 0});
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        status: 'pending',
        date:   'all',
        search: ''
    });

    const [searchInput, setSearchInput] = useState('');

    const handleFilterChange = (key, value) =>
    {
        setFilters(prev => ({...prev, [key]: value}));
    };

    useEffect(() =>
    {
        const timer = setTimeout(() =>
        {
            setFilters(prev =>
            {
                if (prev.search === searchInput) return prev;
                return {...prev, search: searchInput};
            });
        }, 800);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchAppeals = useCallback((currentFilters) =>
    {
        setLoading(true);
        AdminService.getAppeals(currentFilters)
        .onSuccess((res) =>
        {
            setStats(res.stats || {total: 0, pending: 0, resolved: 0, rejected: 0});
            setAppeals(res.appeals || []);
            setLoading(false);
        })
        .onError((err) =>
        {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
            setLoading(false);
        });
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
        if (responseText === null) return;

        AdminService.handleAppeal(appealId, actionType, responseText.trim())
        .onSuccess((res) =>
        {
            notifySuccess(t(`api.success.${res.code}`));
            fetchAppeals(filters);
        })
        .onError((err) =>
        {
            notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`));
        });
    };

    const getStatusBadge = (status) =>
    {
        let colors = "";
        switch (status)
        {
            case 'open':
            case 'in_progress':
                colors = "text-[#d39e00] border-[#d39e00]";
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
        return `inline-block px-[6px] py-[2px] text-[10px] font-bold border bg-bg-page ${colors}`;
    };

    const getStatusBorder = (status) =>
    {
        switch (status)
        {
            case 'resolved':
                return "border-l-[3px] border-l-theme-success";
            case 'closed':
                return "border-l-[3px] border-l-theme-error";
            default:
                return "";
        }
    };

    const getStatusLabel = (status) =>
    {
        switch (status)
        {
            case 'open':
            case 'in_progress':
                return t('admin.common.pending');
            case 'resolved':
                return t('admin.common.approved');
            case 'closed':
                return t('admin.common.rejected');
            default:
                return status;
        }
    };

    // Опції для CustomSelect
    const statusOptions = [
        {value: 'all', label: t('admin.common.total')},
        {value: 'pending', label: t('admin.common.pending')},
        {value: 'resolved', label: t('admin.common.approved')},
        {value: 'closed', label: t('admin.common.rejected')}
    ];

    const dateOptions = [
        {value: 'all', label: t('admin.reports.filters.date_all')},
        {value: 'today', label: t('admin.reports.filters.date_today')},
        {value: 'yesterday', label: t('admin.reports.filters.date_yesterday')},
        {value: 'week', label: t('admin.reports.filters.date_week')},
        {value: 'month', label: t('admin.reports.filters.date_month')}
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
                    <div className="text-[11px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.approved')}</div>
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
            </div>

            {loading ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('common.loading')}</div>
            ) : appeals.length === 0 ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('admin.appeals.empty')}</div>
            ) : (
                <div className="flex flex-col gap-[10px]">
                    {appeals.map((appeal) =>
                    {
                        const appealText = appeal.messages?.[0]?.message || appeal.message;
                        const isPending = appeal.status === 'open' || appeal.status === 'in_progress';

                        return (
                            <div key={appeal.id} className="bg-bg-box border border-border p-[10px] flex justify-between text-[11px]">
                                {/* Інфо-блок */}
                                <div className="flex-1 flex flex-col">
                                    <div className="mb-[4px]">
                                        <span className="text-text-muted mr-[5px]">{t('common.date')}:</span>
                                        <span>{formatDate(appeal.created_at)}</span>
                                    </div>
                                    <div className="mb-[4px]">
                                        <span className="text-text-muted mr-[5px]">{t('admin.appeals.from')}:</span>
                                        <Link to={`/${appeal.user?.username}`} className="text-theme-link hover:underline bg-transparent no-underline" target="_blank">
                                            {appeal.user?.first_name} {appeal.user?.last_name} (@{appeal.user?.username})
                                        </Link>
                                    </div>

                                    {appealText && (
                                        <div className="mt-[8px] mb-[4px]">
                                            <div className="text-text-muted mb-[4px]">{t('admin.appeals.message')}:</div>
                                            <div className="italic bg-bg-page border-l-[2px] border-theme-link p-[5px_8px] text-text-muted">
                                                "{appealText}"
                                            </div>
                                        </div>
                                    )}

                                    {/* Блок рішення */}
                                    {isPending ? (
                                        <div className="mt-[8px] mb-[4px]">
                                            <span className="text-text-muted mr-[5px]">{t('common.status')}:</span>
                                            <span className={getStatusBadge(appeal.status)}>
                                                {getStatusLabel(appeal.status)}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className={`mt-[15px] p-[10px_12px] bg-bg-page border border-border flex flex-col gap-[8px] ${getStatusBorder(appeal.status)}`}>
                                            <div>
                                                <span className="text-text-muted mr-[5px]">{t('common.status')}:</span>
                                                <span className={getStatusBadge(appeal.status)}>
                                                    {getStatusLabel(appeal.status)}
                                                </span>
                                            </div>

                                            {appeal.admin_response && (
                                                <div>
                                                    <span className="text-text-muted mr-[5px]">{t('admin.common.admin_response')}:</span>
                                                    <span className="italic text-text-muted">
                                                        {appeal.admin_response}
                                                    </span>
                                                </div>
                                            )}

                                            <div>
                                                <span className="text-text-muted mr-[5px]">{t('admin.reports.closed_at')}:</span>
                                                <span className="font-bold">
                                                    {formatDate(appeal.updated_at || appeal.closed_at)}
                                                </span>
                                            </div>

                                            {appeal.closed_by && (
                                                <div>
                                                    <span className="text-text-muted mr-[5px]">{t('admin.reports.reviewed_by')}:</span>
                                                    <Link to={`/${appeal.closed_by.username}`} className="text-theme-link hover:underline bg-transparent no-underline" target="_blank">
                                                        {appeal.closed_by.first_name} {appeal.closed_by.last_name} (@{appeal.closed_by.username})
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Блок дій */}
                                <div className="flex flex-col gap-[6px] min-w-[140px] items-stretch ml-[15px]">
                                    {isPending && (
                                        <>
                                            <Button variant="success" onClick={() => handleAction(appeal.id, 'resolve')}>
                                                {t('admin.appeals.btn_approve')}
                                            </Button>
                                            <Button variant="danger" onClick={() => handleAction(appeal.id, 'reject')}>
                                                {t('admin.appeals.btn_reject')}
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}