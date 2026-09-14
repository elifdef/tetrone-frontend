import { useState, useEffect, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import AdminService from '../../services/admin.service';
import { userRole } from '../../config';
import { notifySuccess, notifyError } from "../common/Notify";
import { AuthContext } from "../../context/AuthContext";
import { useModal } from '../../context/ModalContext';
import { usePageTitle } from "../../hooks/usePageTitle";
import Button from '../ui/Button';
import Input from '../ui/Input';
import Avatar from '../ui/Avatar';

const UserSearchForm = ({ search, setSearch, handleSearch }) => {
    const { t } = useTranslation();
    return (
        <form onSubmit={handleSearch} className="flex gap-[10px] items-end mb-[15px] bg-bg-box p-[15px] border border-border font-tahoma">
            <div className="flex-1 min-w-[200px]">
                <Input
                    label={t('admin.search_user')}
                    type="text"
                    placeholder={t('admin.search_placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            <Button type="submit" className="h-[28px] px-[15px] mb-[1px]">{t('action.find')}</Button>
        </form>
    );
};

const UserCard = ({ user, handleMute, handleBan, canBan }) => {
    const { t } = useTranslation();
    const { user: currentAdmin } = useContext(AuthContext);
    const isAdmin = currentAdmin?.role >= userRole.Admin;

    const profilePath = `/${isAdmin ? 'control-panel/users/' : ''}${user.username}`;
    const nameColor = user.personalization?.username_color;

    return (
        <div className="flex items-center gap-[15px] p-[10px] bg-bg-box border border-border text-[11px] font-tahoma mb-[10px]">
            <a href={profilePath} target="_blank" rel="noreferrer" className="shrink-0">
                <Avatar user={user} className="w-[50px] h-[50px] object-cover border border-border rounded-[2px] block" />
            </a>
            <div className="flex-1 flex flex-col min-w-0">
                <a href={profilePath} className="font-bold text-[12px] text-theme-link hover:underline no-underline truncate" target="_blank" rel="noreferrer" style={nameColor ? { color: nameColor } : undefined}>
                    {user.first_name} {user.last_name || ''}
                </a>
                <div className="text-text-muted mt-[4px] truncate">
                    @{user.username} • {user.email} • {t('admin.user_info.posts_count', { count: user.posts_count || 0 })}
                </div>
                <div className="mt-[6px] flex gap-[4px] flex-wrap">
                    {user.is_banned && <span className="text-theme-error font-bold border border-theme-error px-[4px] py-[2px] text-[10px] bg-[rgba(255,51,71,0.1)]">{t('admin.user_info.status_banned_full')}</span>}
                    {user.is_muted && <span className="text-[#d39e00] font-bold border border-[#d39e00] px-[4px] py-[2px] text-[10px] bg-[rgba(211,158,0,0.1)]">{t('admin.read_only')}</span>}
                </div>
            </div>
            {(user.role <= userRole.Moderator) && !user.is_deleted && (
                <div className="flex flex-col gap-[6px] min-w-[140px] shrink-0">
                    <Button variant={user.is_muted ? "success" : "warning"} onClick={() => handleMute(user.username, user.is_muted)} className="py-[4px] px-[8px] text-[10px] w-full">
                        {user.is_muted ? t('admin.allow_posting') : t('admin.forbid_posting')}
                    </Button>
                    {canBan && (
                        <Button variant={user.is_banned ? "success" : "danger"} onClick={() => handleBan(user.username, user.is_banned)} className="py-[4px] px-[8px] text-[10px] w-full">
                            {user.is_banned ? t('admin.actions.unban') : t('admin.actions.ban')}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export const UsersManager = ({ canBan = true }) => {
    const { t } = useTranslation();
    const { openPrompt } = useModal();

    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    usePageTitle(t('admin.users_management'));

    const fetchUsersAndStats = useCallback((searchQuery = '') => {
        setIsLoading(true);

        AdminService.getUserStats(searchQuery)
        .onSuccess(res => setStats(res.stats))
        .onError(() => setStats(null));

        AdminService.getUsers(searchQuery)
        .onSuccess((res) => setUsers(res.data || []))
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)))
        .onFinally(() => setIsLoading(false));
    }, [t]);

    useEffect(() => {
        fetchUsersAndStats('');
    }, [fetchUsersAndStats]);

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsersAndStats(search);
    };

    const handleMute = async (username, currentStatus) => {
        const reason = await openPrompt(t('admin.actions.reason_prompt'), "", currentStatus ? t('admin.actions.unmute') : t('admin.read_only'), t('action.cancel'));
        if (reason === null) return;

        AdminService.toggleMute(username, reason)
        .onSuccess((res) => {
            setUsers(prev => prev.map(u => u.username === username ? { ...u, is_muted: !currentStatus } : u));
            notifySuccess(t(`api.success.${res.code || 'SUCCESS'}`));
            AdminService.getUserStats(search).onSuccess(statRes => setStats(statRes.stats));
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    const handleBan = async (username, currentStatus) => {
        const reason = await openPrompt(t('admin.actions.reason_prompt'), "", currentStatus ? t('admin.actions.unban') : t('admin.actions.ban'), t('action.cancel'));
        if (reason === null) return;

        AdminService.toggleBan(username, reason)
        .onSuccess((res) => {
            setUsers(prev => prev.map(u => u.username === username ? { ...u, is_banned: !currentStatus } : u));
            notifySuccess(t(`api.success.${res.code || 'SUCCESS'}`));
            AdminService.getUserStats(search).onSuccess(statRes => setStats(statRes.stats));
        })
        .onError((err) => notifyError(t(`api.error.${err.code || 'ERR_UNKNOWN'}`)));
    };

    return (
        <div className="flex flex-col text-[11px] font-tahoma text-text-main">
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[10px] mb-[15px]">
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.total_users')}</div>
                        <div className="text-[18px] text-theme-link font-bold">{stats.total}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.today')}</div>
                        <div className="text-[18px] text-theme-success font-bold">{stats.today}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.banned')}</div>
                        <div className="text-[18px] text-theme-error font-bold">{stats.banned}</div>
                    </div>
                    <div className="bg-bg-box border border-border p-[10px] text-center">
                        <div className="text-[10px] text-text-muted font-bold uppercase mb-[5px]">{t('admin.stats.muted')}</div>
                        <div className="text-[18px] text-[#d39e00] font-bold">{stats.muted}</div>
                    </div>
                </div>
            )}

            <UserSearchForm search={search} setSearch={setSearch} handleSearch={handleSearch} />

            {isLoading ? (
                <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('common.loading')}</div>
            ) : (
                <div className="flex flex-col">
                    {users.map(user => (
                        <UserCard key={user.id} user={user} handleMute={handleMute} handleBan={handleBan} canBan={canBan} />
                    ))}
                    {users.length === 0 && (
                        <div className="p-[20px] text-center text-text-muted italic bg-bg-box border border-border">{t('admin.users_not_found')}</div>
                    )}
                </div>
            )}
        </div>
    );
};