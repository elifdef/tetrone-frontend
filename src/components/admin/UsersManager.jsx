import {useState, useEffect, useCallback, useContext} from 'react';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router';
import AdminService from '../../services/admin.service';
import {userRole} from '../../config';
import {notifySuccess, notifyError} from "../common/Notify";
import {AuthContext} from "../../context/AuthContext";
import {useModal} from '../../context/ModalContext';
import {usePageTitle} from "../../hooks/usePageTitle";
import {useDateFormatter} from "../../hooks/useDateFormatter";
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';
import {getRoleTitle} from "../profile/utils/getRoleTitle.jsx";
import ChangeRoleModal from '../modals/ChangeRoleModal';

const UserSearchForm = ({search, setSearch, handleSearch}) =>
{
    const {t} = useTranslation();
    return (
        <form onSubmit={handleSearch} className="flex gap-[10px] items-end mb-[15px] bg-bg-box p-[15px] border border-border font-tahoma">
            <div className="flex-1 min-w-[200px]">
                <Input
                    label={t('admin.common.search_placeholder')}
                    type="text"
                    placeholder={t('admin.common.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button type="submit" className="h-[28px] px-[15px] mb-[1px]">{t('action.find')}</Button>
        </form>
    );
};

const getRoleBadgeStyle = (role) =>
{
    switch (role)
    {
        case userRole.Owner:
            return "border-theme-error text-theme-error bg-[rgba(255,51,71,0.05)]";
        case userRole.Admin:
            return "border-[#d39e00] text-[#d39e00] bg-[rgba(211,158,0,0.05)]";
        case userRole.Moderator:
            return "border-theme-link text-theme-link bg-[rgba(69,104,142,0.05)]";
        case userRole.Support:
            return "border-theme-success text-theme-success bg-[rgba(75,179,75,0.05)]";
        default:
            return "border-border text-text-muted bg-bg-page";
    }
};

const UserCard = ({user, handleMute, handleBan, handleWarn, handleChangeRoleClick, canBan}) =>
{
    const {t} = useTranslation();
    const {user: currentAdmin} = useContext(AuthContext);
    const formatDate = useDateFormatter();

    const isAdmin = currentAdmin?.role >= userRole.Admin;
    const isOwner = currentAdmin?.role === userRole.Owner;
    const canChangeRole = isAdmin && (isOwner || user.role < currentAdmin.role);

    const profilePath = `/${isAdmin ? 'control-panel/users/' : ''}${user.username}`;
    const nameColor = user.personalization?.username_color;

    const g = user.gender === 2 ? 'female' : 'male';

    return (
        <div className="flex flex-col p-[10px] bg-bg-box border border-border text-[11px] font-tahoma mb-[15px]">

            <div className="flex items-start gap-[15px]">
                <a href={profilePath} target="_blank" rel="noreferrer" className="shrink-0">
                    <Avatar user={user} className="w-[50px] h-[50px] object-cover border border-border rounded-none block"/>
                </a>

                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center flex-wrap gap-[6px]">
                            <a href={profilePath} className="font-bold text-[13px] text-theme-link hover:underline no-underline truncate" target="_blank" rel="noreferrer" style={nameColor ? {color: nameColor} : undefined}>
                                {user.first_name} {user.last_name || ''}
                            </a>

                            {user.role > userRole.User && (
                                <span className={`px-[4px] py-[2px] text-[9px] font-bold border rounded-[2px] uppercase ${getRoleBadgeStyle(user.role)}`}>
                                    {getRoleTitle(user.role)}
                                </span>
                            )}
                        </div>
                        <span className="text-[9px] text-text-muted">{t('admin.users.registered')}: {formatDate(user.created_at)}</span>
                    </div>

                    <div className="text-text-muted mt-[4px] truncate">
                        @{user.username} • {user.email}
                    </div>

                    <div className="mt-[6px] flex gap-[4px] flex-wrap">
                        {user.is_banned && <span className="border-theme-error text-theme-error bg-[rgba(255,51,71,0.05)] font-bold border px-[4px] py-[2px] text-[10px] uppercase">{t('admin.users.status_banned_full')}</span>}
                        {user.is_muted && <span className="border-[#d39e00] text-[#d39e00] bg-[rgba(211,158,0,0.05)] font-bold border px-[4px] py-[2px] text-[10px] uppercase">{t('admin.common.read_only')}</span>}
                    </div>
                </div>
            </div>

            {/* БЛОК СТАТИСТИКИ (i18next Конструктор) */}
            <div className="flex flex-wrap gap-[15px] mt-[10px] p-[10px] bg-bg-page border border-border text-[10px]">

                {/* Колонка 1: Контент */}
                <div className="flex flex-col gap-[4px] min-w-[150px]">
                    <Link to={`?tab=posts&search=${user.username}`} className="text-theme-link hover:underline bg-transparent no-underline">
                        {t('stats.posts', {context: g, count: user.posts_count || 0})}
                    </Link>
                    <span className="text-text-main">{t('stats.reposts', {context: g, count: user.reposts_count || 0})}</span>
                    <span className="text-text-main">{t('stats.comments', {context: g, count: user.comments_count || 0})}</span>
                    <span className="text-text-main">{t('stats.likes', {context: g, count: user.likes_count || 0})}</span>
                    <span className="text-text-main">{t('stats.spaces', {context: g, count: user.spaces_owned_count || 0})}</span>
                    <span className="text-text-main">{t('stats.packs', {context: g, count: user.created_sticker_packs_count || 0})}</span>
                </div>

                {/* Колонка 2: Модерація та Підтримка */}
                <div className="flex flex-col gap-[4px] border-l border-border pl-[15px] min-w-[280px]">

                    <div className="flex items-center flex-wrap leading-none gap-[4px]">
                        <Link to={`?tab=reports&search=${user.username}`} className="text-[#d39e00] font-bold hover:underline bg-transparent no-underline">
                            {t('stats.reports_from', {context: g, count: user.reports_from_count || 0})}
                        </Link>
                        <span className="text-text-muted">:</span>
                        <Link to={`?tab=reports&search=${user.username}&status=pending`} className="text-[9px] text-[#d39e00] hover:underline bg-transparent no-underline">{t('nouns.stat_pending', {count: user.reports_from_pending_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=reports&search=${user.username}&status=resolved`} className="text-[9px] text-theme-success hover:underline bg-transparent no-underline">{t('nouns.stat_resolved', {count: user.reports_from_resolved_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=reports&search=${user.username}&status=rejected`} className="text-[9px] text-theme-error hover:underline bg-transparent no-underline">{t('nouns.stat_rejected', {count: user.reports_from_rejected_count || 0})}</Link>
                    </div>

                    <div className="flex items-center flex-wrap leading-none gap-[4px]">
                        <Link to={`?tab=reports&search=${user.username}`} className="text-theme-error font-bold hover:underline bg-transparent no-underline">
                            {t('stats.reports_against', {context: g, count: user.reports_against_count || 0})}
                        </Link>
                        <span className="text-text-muted">:</span>
                        <Link to={`?tab=reports&search=${user.username}&status=pending`} className="text-[9px] text-[#d39e00] hover:underline bg-transparent no-underline">{t('nouns.stat_pending', {count: user.reports_against_pending_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=reports&search=${user.username}&status=resolved`} className="text-[9px] text-theme-success hover:underline bg-transparent no-underline">{t('nouns.stat_resolved', {count: user.reports_against_resolved_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=reports&search=${user.username}&status=rejected`} className="text-[9px] text-theme-error hover:underline bg-transparent no-underline">{t('nouns.stat_rejected', {count: user.reports_against_rejected_count || 0})}</Link>
                    </div>

                    <div className="flex items-center flex-wrap leading-none gap-[4px]">
                        <Link to={`?tab=tickets&search=${user.username}`} className="text-theme-link font-bold hover:underline bg-transparent no-underline">
                            {t('stats.tickets', {context: g, count: user.tickets_count || 0})}
                        </Link>
                        <span className="text-text-muted">:</span>
                        <Link to={`?tab=tickets&search=${user.username}&status=open`} className="text-[9px] text-[#d39e00] hover:underline bg-transparent no-underline">{t('nouns.stat_open', {count: user.tickets_open_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=tickets&search=${user.username}&status=closed`} className="text-[9px] text-theme-error hover:underline bg-transparent no-underline">{t('nouns.stat_closed', {count: user.tickets_closed_count || 0})}</Link>
                    </div>

                    <div className="flex items-center flex-wrap leading-none gap-[4px]">
                        <Link to={`?tab=appeals&search=${user.username}`} className="text-[#d39e00] font-bold hover:underline bg-transparent no-underline">
                            {t('stats.appeals', {context: g, count: user.appeals_count || 0})}
                        </Link>
                        <span className="text-text-muted">:</span>
                        <Link to={`?tab=appeals&search=${user.username}&status=pending`} className="text-[9px] text-[#d39e00] hover:underline bg-transparent no-underline">{t('nouns.stat_pending', {count: user.appeals_pending_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=appeals&search=${user.username}&status=resolved`} className="text-[9px] text-theme-success hover:underline bg-transparent no-underline">{t('nouns.stat_resolved', {count: user.appeals_resolved_count || 0})}</Link>
                        <span className="text-text-muted">,</span>
                        <Link to={`?tab=appeals&search=${user.username}&status=closed`} className="text-[9px] text-theme-error hover:underline bg-transparent no-underline">{t('nouns.stat_rejected', {count: user.appeals_rejected_count || 0})}</Link>
                    </div>
                </div>

                {/* Колонка 3: Покарання */}
                <div className="flex flex-col gap-[4px] border-l border-border pl-[15px]">
                    <span className={`font-bold ${user.warnings_count > 0 ? 'text-[#d39e00]' : 'text-text-main'}`}>
                        {t('stats.warnings', {context: g, count: user.warnings_count || 0})}
                    </span>
                    <span className={`font-bold ${user.mutes_count > 0 ? 'text-[#d39e00]' : 'text-text-main'}`}>
                        {t('stats.mutes', {context: g, count: user.mutes_count || 0})}
                    </span>
                    <span className={`font-bold ${user.bans_count > 0 ? 'text-theme-error' : 'text-text-main'}`}>
                        {t('stats.bans', {context: g, count: user.bans_count || 0})}
                    </span>
                </div>
            </div>

            {/* ПАНЕЛЬ ДІЙ */}
            {(user.role <= userRole.Moderator) && !user.is_deleted && (
                <div className="flex flex-wrap gap-[8px] mt-[10px] pt-[10px] border-t border-border">
                    <Button variant="secondary" onClick={() => handleWarn(user.username)} className="py-[4px] px-[12px] text-[11px] !rounded-none">
                        {t('admin.common.issue_warning')}
                    </Button>
                    <Button variant={user.is_muted ? "success" : "warning"} onClick={() => handleMute(user.username, user.is_muted)} className="py-[4px] px-[12px] text-[11px] !rounded-none">
                        {user.is_muted ? t('admin.common.unmute') : t('admin.common.mute')}
                    </Button>
                    {canBan && (
                        <Button variant={user.is_banned ? "success" : "danger"} onClick={() => handleBan(user.username, user.is_banned)} className="py-[4px] px-[12px] text-[11px] !rounded-none">
                            {user.is_banned ? t('admin.common.unban') : t('admin.common.ban')}
                        </Button>
                    )}
                    {canChangeRole && (
                        <Button variant="primary" onClick={() => handleChangeRoleClick(user)} className="py-[4px] px-[12px] text-[11px] !rounded-none ml-auto">
                            {t('admin.actions.change_role')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export const UsersManager = ({canBan = true}) =>
{
    const {t} = useTranslation();
    const {openPrompt} = useModal();

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const {user: currentAdmin} = useContext(AuthContext);
    const [roleModalUser, setRoleModalUser] = useState(null)

    usePageTitle(t('admin.users.title'));

    const fetchUsersAndStats = useCallback((searchQuery = '') =>
    {
        setIsLoading(true);

        AdminService.getUserStats(searchQuery)
        .onSuccess(res => setStats(res.stats))
        .onError(() => setStats(null));

        AdminService.getUsers(searchQuery)
        .onSuccess((res) => setUsers(res.data || []))
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)))
        .onFinally(() => setIsLoading(false));
    }, [t]);

    useEffect(() =>
    {
        fetchUsersAndStats('');
    }, [fetchUsersAndStats]);

    const handleSearch = (e) =>
    {
        e.preventDefault();
        fetchUsersAndStats(search);
    };

    const handleWarn = async (username) =>
    {
        const reason = await openPrompt(t('admin.actions.reason_prompt'), "", t('admin.common.issue_warning'), t('action.cancel'));
        if (reason === null) return;

        AdminService.issueWarning(username, reason)
        .onSuccess((res) =>
        {
            notifySuccess(t(`api.success.${res.code}`));
            fetchUsersAndStats(search);
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    const handleMute = async (username, currentStatus) =>
    {
        const reason = await openPrompt(t('admin.actions.reason_prompt'), "", currentStatus ? t('admin.common.unmute') : t('admin.common.read_only'), t('action.cancel'));
        if (reason === null) return;

        AdminService.toggleMute(username, reason)
        .onSuccess((res) =>
        {
            setUsers(prev => prev.map(u => u.username === username ? {...u, is_muted: !currentStatus} : u));
            notifySuccess(t(`api.success.${res.code}`));
            AdminService.getUserStats(search).onSuccess(statRes => setStats(statRes.stats));
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    const handleBan = async (username, currentStatus) =>
    {
        const reason = await openPrompt(t('admin.actions.reason_prompt'), "", currentStatus ? t('admin.common.unban') : t('admin.common.ban'), t('action.cancel'));
        if (reason === null) return;

        AdminService.toggleBan(username, reason)
        .onSuccess((res) =>
        {
            setUsers(prev => prev.map(u => u.username === username ? {...u, is_banned: !currentStatus} : u));
            notifySuccess(t('common.success'));
            AdminService.getUserStats(search).onSuccess(statRes => setStats(statRes.stats));
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    return (
        <div className="flex flex-col text-[11px] font-tahoma text-text-main">
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-[15px]">
                    <div className="bg-bg-box border border-border p-[10px] text-center !rounded-none">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.total')}</div>
                        <div className="text-[18px] text-theme-link font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center !rounded-none">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.dashboard.new_users')}</div>
                        <div className="text-[18px] text-theme-success font-bold">{stats.today}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center !rounded-none">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.ban')}</div>
                        <div className="text-[18px] text-theme-error font-bold">{stats.banned}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center !rounded-none">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.common.read_only')}</div>
                        <div className="text-[18px] text-[#d39e00] font-bold">{stats.muted}</div>
                    </div>
                </div>
            )}

            <UserSearchForm search={search} setSearch={setSearch} handleSearch={handleSearch}/>

            {isLoading ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('common.loading')}</div>
            ) : (
                <div className="flex flex-col">
                    {users.map(user => (
                        <UserCard
                            key={user.username}
                            user={user}
                            handleMute={handleMute}
                            handleBan={handleBan}
                            handleWarn={handleWarn}
                            handleChangeRoleClick={setRoleModalUser}
                            canBan={canBan}
                        />
                    ))}
                    {users.length === 0 && (
                        <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">Не знайдено жодного користувача</div>
                    )}
                </div>
            )}
            <ChangeRoleModal
                isOpen={!!roleModalUser}
                onClose={() => setRoleModalUser(null)}
                targetUser={roleModalUser}
                currentUser={currentAdmin}
                onSuccess={() => fetchUsersAndStats(search)}
            />
        </div>
    );
};