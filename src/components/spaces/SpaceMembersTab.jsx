import { useState, useEffect, useContext, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { SpaceContext } from '../../context/SpaceContext';
import SpaceService from '../../services/space.service';
import Button from '../ui/Button';
import CustomSelect from '../ui/CustomSelect';
import Input from '../ui/Input';

const SpaceMembersTab = () => {
    const { t } = useTranslation();
    const { space, isAdmin, isOwner } = useContext(SpaceContext);

    // Додано 'staff' таб
    const [activeTab, setActiveTab] = useState('approved');
    const [searchQuery, setSearchQuery] = useState('');
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            // Ми беремо approved завжди для списку, а потім фільтруємо штат локально (щоб не дописувати бекенд)
            const queryStatus = activeTab === 'pending' ? 'pending' : 'approved';
            const params = { status: queryStatus };
            if (searchQuery) params['filter[name]'] = searchQuery;

            const res = await SpaceService.getSpaceMembers(space.username, params);
            if (res.members) setMembers(res.members || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [space.username, activeTab, searchQuery]);

    useEffect(() => {
        const delay = setTimeout(() => fetchMembers(), 400);
        return () => clearTimeout(delay);
    }, [fetchMembers]);

    if (space.is_members_hidden && !isAdmin && !isOwner) {
        return (
            <div className="bg-bg-box border border-border p-[20px] text-center text-text-muted text-[11px]">
                {t('spaces.members_hidden_msg')}
            </div>
        );
    }

    const handleRoleChange = async (targetUsername, newRole, customTitle = null) => {
        try {
            await SpaceService.updateMemberRole(space.username, targetUsername, {
                role: newRole,
                custom_title: customTitle
            });
            setMembers(prev => prev.map(m => m.user.username === targetUsername ? { ...m, role: newRole, custom_title: customTitle } : m));
        } catch (error) {
            console.error(error);
        }
    };

    const handleKick = async (targetUsername) => {
        if (!window.confirm(t('common.confirm_action'))) return;
        try {
            await SpaceService.kickMember(space.username, targetUsername);
            setMembers(prev => prev.filter(m => m.user.username !== targetUsername));
        } catch (error) {
            console.error(error);
        }
    };

    const handleApprove = async (targetUsername) => {
        try {
            await SpaceService.approveMember(space.username, targetUsername);
            setMembers(prev => prev.filter(m => m.user.username !== targetUsername));
        } catch (error) {
            console.error(error);
        }
    };

    const roleOptions = [
        { value: 'member', label: t('spaces.role_member') },
        { value: 'moderator', label: t('spaces.role_moderator') },
        { value: 'admin', label: t('spaces.role_admin') }
    ];

    // ФІЛЬТРАЦІЯ ДЛЯ ТАБУ "ПЕРСОНАЛ"
    const displayMembers = activeTab === 'staff'
        ? members.filter(m => ['owner', 'admin', 'moderator'].includes(m.role))
        : members;

    return (
        <div className="bg-bg-box border border-border">
            <div className="bg-theme-header-bg text-theme-link p-[6px_8px] text-[11px] font-bold border-b border-border">
                {t('spaces.blocks_members')}
            </div>

            <div className="flex border-b border-border bg-bg-page">
                <button
                    className={`flex-1 py-[8px] text-[11px] font-bold border-r border-border transition-colors ${activeTab === 'approved' ? 'bg-bg-box text-theme-link' : 'text-text-muted hover:bg-bg-box'}`}
                    onClick={() => setActiveTab('approved')}
                >
                    {t('spaces.members_all')}
                </button>
                <button
                    className={`flex-1 py-[8px] text-[11px] font-bold border-r border-border transition-colors ${activeTab === 'staff' ? 'bg-bg-box text-theme-link' : 'text-text-muted hover:bg-bg-box'}`}
                    onClick={() => setActiveTab('staff')}
                >
                    {t('spaces.blocks_staff')}
                </button>
                {isAdmin && space.privacy_type !== 'public' && (
                    <button
                        className={`flex-1 py-[8px] text-[11px] font-bold transition-colors ${activeTab === 'pending' ? 'bg-bg-box text-theme-link' : 'text-text-muted hover:bg-bg-box'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        {t('spaces.members_requests')}
                    </button>
                )}
            </div>

            <div className="p-[10px] border-b border-border">
                <Input type="text" placeholder={t('spaces.list_search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>

            <div className="p-[10px] flex flex-col gap-[10px]">
                {loading ? (
                    <div className="text-center text-text-muted py-[20px]">{t('common.loading')}</div>
                ) : displayMembers.length === 0 ? (
                    <div className="text-center text-text-muted py-[20px]">{t('spaces.list_empty')}</div>
                ) : (
                    displayMembers.map(member => (
                        <div key={member.user.username} className="flex items-center gap-[10px] p-[10px] border border-border bg-bg-page max-md:flex-col">
                            <Link to={`/${member.user.username}`} className="shrink-0">
                                <img src={member.user.avatar} alt={member.user.username} className="w-[50px] h-[50px] object-cover border border-border" />
                            </Link>
                            <div className="flex-1 max-md:text-center">
                                <Link to={`/${member.user.username}`} className="font-bold text-theme-link hover:underline text-[12px]">
                                    {member.user.first_name || member.user.username}
                                </Link>
                                <div className="text-[10px] text-text-muted mt-[2px]">
                                    {/* Тут відображається кастомний титул (бос) або системна роль */}
                                    {member.custom_title || t(`spaces.role_${member.role}`)}
                                </div>
                            </div>

                            {isAdmin && member.role !== 'owner' && (
                                <div className="flex flex-col gap-[5px] shrink-0 w-[200px]">
                                    {activeTab === 'pending' ? (
                                        <div className="flex gap-[5px]">
                                            <Button variant="primary" className="flex-1 text-[10px]" onClick={() => handleApprove(member.user.username)}>
                                                {t('action.approve')}
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex gap-[5px]">
                                                <div className="flex-1">
                                                    <CustomSelect
                                                        options={isOwner ? roleOptions : roleOptions.filter(r => r.value !== 'admin')}
                                                        value={member.role}
                                                        onChange={(val) => handleRoleChange(member.user.username, val, member.custom_title)}
                                                    />
                                                </div>
                                                <Button variant="danger" onClick={() => handleKick(member.user.username)}>
                                                    {t('spaces.kick')}
                                                </Button>
                                            </div>
                                            <Input
                                                type="text"
                                                placeholder={t('spaces.custom_title_placeholder')}
                                                defaultValue={member.custom_title || ''}
                                                onBlur={(e) => handleRoleChange(member.user.username, member.role, e.target.value)}
                                            />
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default SpaceMembersTab;