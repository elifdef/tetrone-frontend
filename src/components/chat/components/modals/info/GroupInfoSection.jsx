import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import Avatar from '@ui/Avatar';
import Button from '@ui/Button';
import SmartEditor from '@components/editor/SmartEditor';
import RichText from '@common/RichText.jsx';
import { parseRichText } from '../../../utils/messageParser.js';

const GroupPlaceholderSvg = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export default function GroupInfoSection({
    chat,
    currentUser,
    friendsList = [],
    onUpdateGroupInfo,
    onInviteMember,
    onUpdateMemberRole,
    onKickMember
}) {
    const { t } = useTranslation();
    const [inviteUserId, setInviteUserId] = useState('');
    const [groupTitle, setGroupTitle] = useState(() => parseRichText(chat?.title));
    const [groupDesc, setGroupDesc] = useState(() => parseRichText(chat?.description));

    const isGroupAdmin = Boolean(
        chat?.owner_id === currentUser?.id ||
        chat?.owner_id === currentUser?.username ||
        chat?.participants?.some(p => p.user.id === currentUser?.id && (p.role === 'owner' || p.role === 'admin'))
    );

    const availableFriendsToInvite = friendsList.filter(
        f => !(chat.participants || []).some(p => p.user.id === f.id)
    );

    const handleSaveGroupInfo = () => {
        onUpdateGroupInfo?.(groupTitle, groupDesc);
    };

    return (
        <div className="flex flex-col gap-[15px]">
            <div className="flex flex-col items-center p-[15px] bg-bg-page border border-border">
                <div className="w-[60px] h-[60px] rounded-full bg-input-bg border border-border mb-[10px] flex items-center justify-center text-text-muted overflow-hidden">
                    {chat.avatar ? (
                        <img src={chat.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <GroupPlaceholderSvg />
                    )}
                </div>

                {isGroupAdmin ? (
                    <div className="w-full flex flex-col gap-[10px]">
                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">
                            {t('chat.info_modal.group_title')}
                        </div>
                        <div className="border border-input-border bg-input-bg focus-within:border-theme-link transition-colors">
                            <SmartEditor
                                key={`group_title_${chat.id}`}
                                className="min-h-[40px] text-[12px] outline-none"
                                value={groupTitle}
                                onChange={setGroupTitle}
                            />
                        </div>

                        <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-[5px]">
                            {t('chat.info_modal.group_desc')}
                        </div>
                        <div className="border border-input-border bg-input-bg focus-within:border-theme-link transition-colors">
                            <SmartEditor
                                key={`group_desc_${chat.id}`}
                                className="min-h-[60px] text-[12px] outline-none"
                                value={groupDesc}
                                onChange={setGroupDesc}
                            />
                        </div>

                        <Button variant="primary" onClick={handleSaveGroupInfo} className="mt-[5px]">
                            {t('chat.actions.save')}
                        </Button>
                    </div>
                ) : (
                    <div className="text-center">
                        <div className="font-bold text-[14px] text-theme-link mb-[5px]">
                            <RichText
                                text={parseRichText(chat.title)}
                                className="post-text [&_p]:inline [&_p]:m-0"
                                limit={100000}
                            />
                        </div>
                        <div className="text-[11px] text-text-main">
                            <RichText
                                text={parseRichText(chat.description)}
                                className="post-text [&_p]:inline [&_p]:m-0"
                                limit={100000}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="border border-border">
                <div className="bg-header-bg p-[8px_15px] border-b border-border font-bold flex justify-between items-center gap-[8px] flex-wrap">
                    <span>{t('chat.info_modal.participants')} ({chat.participants_count})</span>

                    {isGroupAdmin && availableFriendsToInvite.length > 0 && (
                        <div className="flex items-center gap-[6px]">
                            <select
                                value={inviteUserId}
                                onChange={(e) => setInviteUserId(e.target.value)}
                                className="px-[6px] py-[3px] text-[11px] bg-bg-box border border-border text-text-main font-normal"
                            >
                                <option value="">{t('chat.modals.select_friend')}</option>
                                {availableFriendsToInvite.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.first_name} {f.last_name}
                                    </option>
                                ))}
                            </select>
                            <Button
                                variant="primary"
                                onClick={() => {
                                    if (inviteUserId) {
                                        onInviteMember?.(Number(inviteUserId));
                                        setInviteUserId('');
                                    }
                                }}
                            >
                                {t('chat.info_modal.invite')}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar bg-bg-box">
                    {(chat.participants || []).map(p => (
                        <div
                            key={p.user.username}
                            className="flex justify-between items-center p-[8px_15px] border-b border-border last:border-b-0 hover:bg-bg-page"
                        >
                            <div className="flex items-center gap-[10px]">
                                <Avatar
                                    user={p.user}
                                    className="w-[30px] h-[30px] object-cover border border-border"
                                />
                                <div className="flex flex-col">
                                    <Link
                                        to={`/${p.user.username}`}
                                        className="font-bold text-theme-link hover:underline leading-tight"
                                    >
                                        {p.user.first_name} {p.user.last_name}
                                    </Link>
                                    <span className="text-[10px] text-text-muted leading-tight mt-[2px]">
                                        {p.role === 'owner'
                                            ? t('chat.roles.owner')
                                            : p.role === 'admin'
                                                ? t('chat.roles.admin')
                                                : t('chat.roles.member')}
                                    </span>
                                </div>
                            </div>

                            {isGroupAdmin && p.user.id !== currentUser?.id && (
                                <div className="flex items-center gap-[8px]">
                                    <select
                                        value={p.role}
                                        onChange={(e) => onUpdateMemberRole?.(p.user.id, e.target.value)}
                                        className="px-[4px] py-[2px] text-[10px] bg-bg-box border border-border text-text-main"
                                    >
                                        <option value="member">{t('chat.roles.member')}</option>
                                        <option value="admin">{t('chat.roles.admin')}</option>
                                        <option value="owner">{t('chat.roles.owner')}</option>
                                    </select>
                                    <Button
                                        variant="danger"
                                        onClick={() => onKickMember?.(p.user.id)}
                                        className="px-[8px] py-[2px] text-[10px]"
                                    >
                                        {t('chat.info_modal.kick')}
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}