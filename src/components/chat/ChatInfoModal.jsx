import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Modal from '../modals/Modal.jsx';
import Button from '../ui/Button';
import SmartEditor from '../editor/SmartEditor';
import RichText from '../common/RichText.jsx';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import { parseRichText } from './utils/messageParser.js';
import {SavedMessagesIcon} from "../ui/Icons.jsx";

const LinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const FileIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
        <polyline points="13 2 13 9 20 9" />
    </svg>
);

const GroupPlaceholderSvg = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

const ArrowJumpSvg = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="12 5 19 12 12 19" />
    </svg>
);

export default function ChatInfoModal({
    chat,
    messages = [],
    friendsList = [],
    currentUser: fallbackUser,
    onClose,
    onScrollToMessage,
    onUpdateGroupInfo,
    onInviteMember,
    onUpdateMemberRole,
    onKickMember,
    onDeleteChat,
    onBlockUser
}) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { user: authUser } = useContext(AuthContext);
    const currentUser = authUser || fallbackUser;

    const [activeTab, setActiveTab] = useState('info');
    const [previewImage, setPreviewImage] = useState(null);
    const [inviteUserId, setInviteUserId] = useState('');

    const isGroupAdmin = Boolean(
        chat?.is_group && (
            chat?.owner_id === currentUser?.id ||
            chat?.owner_id === currentUser?.username ||
            chat?.participants?.some(p => p.user.id === currentUser?.id && (p.role === 'owner' || p.role === 'admin'))
        )
    );

    const [groupTitle, setGroupTitle] = useState(() => parseRichText(chat?.title));
    const [groupDesc, setGroupDesc] = useState(() => parseRichText(chat?.description));

    if (!chat) return null;

    const allFilesWithContext = messages.flatMap(msg =>
        (msg.files || []).map(file => ({ ...file, messageId: msg.id, createdAt: msg.created_at }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const mediaFiles = allFilesWithContext.filter(f => f.type?.startsWith('image/') || f.type?.startsWith('video/') || f.name?.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i));
    const audioFiles = allFilesWithContext.filter(f => f.type?.startsWith('audio/') || f.name?.match(/\.(mp3|ogg|wav)$/i));
    const documentFiles = allFilesWithContext.filter(f => !mediaFiles.includes(f) && !audioFiles.includes(f));

    const links = messages.flatMap(msg => {
        const doc = parseRichText(msg.text);
        if (!doc || !doc.content) return [];
        const foundLinks = [];
        const findLinks = (nodes) => {
            nodes.forEach(node => {
                if (node.marks) {
                    const linkMark = node.marks.find(m => m.type === 'link');
                    if (linkMark) foundLinks.push({ url: linkMark.attrs.href, text: node.text, messageId: msg.id, createdAt: msg.created_at });
                }
                if (node.content) findLinks(node.content);
            });
        };
        findLinks(doc.content);
        return foundLinks;
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const availableFriendsToInvite = friendsList.filter(
        f => !(chat.participants || []).some(p => p.user.id === f.id)
    );

    const handleJumpToMessage = (messageId) => {
        onClose();
        if (onScrollToMessage) {
            setTimeout(() => onScrollToMessage(messageId), 100);
        }
    };

    const handleSaveGroupInfo = () => {
        onUpdateGroupInfo?.(groupTitle, groupDesc);
    };

    const renderInfoTab = () => {
            if (chat.is_saved) {
                return (
                    <div className="flex flex-col items-center p-[20px] bg-bg-page border border-border text-center">
                        <div className="w-[60px] h-[60px] bg-theme-link/15 border border-theme-link/40 mb-[10px] flex items-center justify-center text-theme-link">
                            <SavedMessagesIcon size={28} />
                        </div>
                        <div className="font-bold text-[14px] text-theme-link mb-[6px]">
                            {t('chat.saved_messages')}
                        </div>
                        <div className="text-[11px] text-text-main max-w-[360px] leading-[1.45]">
                            {t('chat.saved_description')}
                        </div>
                    </div>
                );
            }

        if (chat.is_group) {
            return (
                <div className="flex flex-col gap-[15px]">
                    <div className="flex flex-col items-center p-[15px] bg-bg-page border border-border">
                        <div className="w-[60px] h-[60px] rounded-full bg-input-bg border border-border mb-[10px] flex items-center justify-center text-text-muted overflow-hidden">
                            {chat.avatar ? <img src={chat.avatar} alt="" className="w-full h-full object-cover" /> : <GroupPlaceholderSvg />}
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
                                    <RichText text={parseRichText(chat.title)} className="post-text [&_p]:inline [&_p]:m-0" limit={100000} />
                                </div>
                                <div className="text-[11px] text-text-main">
                                    <RichText text={parseRichText(chat.description)} className="post-text [&_p]:inline [&_p]:m-0" limit={100000} />
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
                                            <option key={f.id} value={f.id}>{f.first_name} {f.last_name}</option>
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
                                <div key={p.user.username} className="flex justify-between items-center p-[8px_15px] border-b border-border last:border-b-0 hover:bg-bg-page">
                                    <div className="flex items-center gap-[10px]">
                                        <Avatar user={p.user} className="w-[30px] h-[30px] object-cover border border-border" />
                                        <div className="flex flex-col">
                                            <Link to={`/${p.user.username}`} className="font-bold text-theme-link hover:underline leading-tight">
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

        const initiatorName = chat.initiator_username === currentUser?.username ? t('chat.you') : chat.target_user?.first_name;
        return (
            <div className="flex flex-col">
                <div className="flex items-center gap-[15px] p-[15px] border border-border bg-bg-page">
                    <Link to={`/${chat.target_user?.username}`}>
                        <Avatar user={chat.target_user} className="w-[80px] h-[80px] object-cover border border-border shadow-sm" />
                    </Link>
                    <div className="flex flex-col gap-[4px] flex-1">
                        <Link to={`/${chat.target_user?.username}`} className="font-bold text-[14px] text-theme-link hover:underline">
                            {chat.target_user?.first_name} {chat.target_user?.last_name}
                        </Link>
                        <span className="text-[11px] text-text-muted">@{chat.target_user?.username}</span>
                        <div className="text-[11px] text-text-main mt-[5px] bg-[rgba(128,128,128,0.05)] p-[6px] border border-border">
                            {t('chat.info_modal.chat_started')}: <b>{initiatorName}</b> ({formatDate(chat.created_at || chat.updated_at)})
                        </div>
                        <div className="flex gap-[8px] mt-[10px]">
                            <Button variant="danger" onClick={onBlockUser}>
                                {t('chat.info_modal.block')}
                            </Button>
                            <Button variant="danger" onClick={onDeleteChat}>
                                {t('chat.info_modal.delete_for_both')}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFilesList = (filesList, isLinks = false) => {
        if (filesList.length === 0) return <div className="p-[20px] text-center italic text-text-muted">{t('chat.empty.files')}</div>;
        return (
            <div className="flex flex-col border border-border border-t-0 max-h-[300px] overflow-y-auto custom-scrollbar bg-bg-box">
                {filesList.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-[10px_15px] border-b border-border last:border-b-0 hover:bg-bg-page transition-colors">
                        <div className="flex items-center gap-[10px] overflow-hidden">
                            <span className="text-text-muted">{isLinks ? <LinkIcon /> : <FileIcon />}</span>
                            <a href={item.url} target="_blank" rel="noreferrer" className="text-[11px] text-theme-link hover:underline whitespace-nowrap overflow-hidden text-ellipsis">
                                {isLinks ? item.url : item.name}
                            </a>
                        </div>
                        <div className="flex items-center gap-[15px] shrink-0 ml-[10px]">
                            <span className="text-[10px] text-text-muted">{formatDate(item.createdAt)}</span>
                            <button
                                type="button"
                                className="text-theme-link bg-transparent border-none cursor-pointer flex items-center"
                                onClick={() => handleJumpToMessage(item.messageId)}
                            >
                                <ArrowJumpSvg />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <>
            <Modal
                isOpen={true}
                onClose={onClose}
                title={chat.is_group ? t('chat.info_modal.group_info') : t('chat.info_modal.chat_info')}
                sizeClass="modal-md"
                bodyClassName="p-[15px]"
            >
                <div className="flex gap-[15px] mb-[15px] border-b border-border text-[11px] font-bold">
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent ${activeTab === 'info' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('info')}>
                        {t('chat.info_modal.tab_info')}
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'media' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('media')}>
                        {t('chat.info_modal.tab_media')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{mediaFiles.length}</span>
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'files' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('files')}>
                        {t('chat.info_modal.tab_files')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{documentFiles.length}</span>
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'audio' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('audio')}>
                        {t('chat.info_modal.tab_audio')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{audioFiles.length}</span>
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'links' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('links')}>
                        {t('chat.info_modal.tab_links')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{links.length}</span>
                    </button>
                </div>

                <div>
                    {activeTab === 'info' && renderInfoTab()}
                    {activeTab === 'media' && (
                        <div className="grid grid-cols-4 gap-[5px] border border-border p-[5px] bg-bg-page max-h-[300px] overflow-y-auto custom-scrollbar">
                            {mediaFiles.length > 0 ? mediaFiles.map((file, idx) => (
                                <div key={idx} className="relative aspect-square border border-border cursor-pointer group overflow-hidden bg-bg-box">
                                    {file.type?.startsWith('video/') || file.name?.match(/\.(mp4|webm)$/i) ? (
                                        <video
                                            src={file.url}
                                            className="w-full h-full object-cover"
                                            muted
                                            onClick={() => handleJumpToMessage(file.messageId)}
                                        />
                                    ) : (
                                        <img
                                            src={file.url}
                                            alt=""
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            onClick={() => setPreviewImage(file.url)}
                                        />
                                    )}
                                    <div className="absolute top-[2px] right-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            type="button"
                                            className="bg-[rgba(0,0,0,0.65)] text-white border-none p-[3px] cursor-pointer flex items-center justify-center"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleJumpToMessage(file.messageId);
                                            }}
                                        >
                                            <ArrowJumpSvg />
                                        </button>
                                    </div>
                                </div>
                            )) : <div className="col-span-4 p-[20px] text-center italic text-text-muted">{t('chat.empty.files')}</div>}
                        </div>
                    )}
                    {activeTab === 'files' && renderFilesList(documentFiles)}
                    {activeTab === 'audio' && renderFilesList(audioFiles)}
                    {activeTab === 'links' && renderFilesList(links, true)}
                </div>
            </Modal>

            {previewImage && (
                <ImagePreviewModal
                    isOpen={true}
                    onClose={() => setPreviewImage(null)}
                    imageUrl={previewImage}
                />
            )}
        </>
    );
}