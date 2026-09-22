import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useDateFormatter } from '../../hooks/useDateFormatter';
import { AuthContext } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';
import Modal from "../modals/Modal.jsx";
import Button from '../ui/Button';
import SmartEditor from '../editor/SmartEditor';
import ImagePreviewModal from '../ui/ImagePreviewModal';
import { getPlainText } from '../chat/utils/messageParser.js'; // ВИПРАВЛЕНИЙ ІМПОРТ

const LinkIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>;
const FileIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>;

export default function ChatInfoModal({ chat, messages = [], onClose, onScrollToMessage, onDeleteChat, onBlockUser }) {
    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const { user: currentUser } = useContext(AuthContext);

    const [activeTab, setActiveTab] = useState('info'); // info | media | files | audio | links
    const [previewImage, setPreviewImage] = useState(null);

    // Стейт для редагування групи
    const isGroupAdmin = chat?.is_group && chat?.owner_id === currentUser?.username; // Перевірка за username
    const [groupTitle, setGroupTitle] = useState(chat?.title || '');
    const [groupDesc, setGroupDesc] = useState(chat?.description || '');

    if (!chat) return null;

    // --- ФІЛЬТРАЦІЯ МЕДІА ТА ФАЙЛІВ ---
    const allFilesWithContext = messages.flatMap(msg =>
        (msg.files || []).map(file => ({ ...file, messageId: msg.id, createdAt: msg.created_at }))
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const mediaFiles = allFilesWithContext.filter(f => f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm)$/i));
    const audioFiles = allFilesWithContext.filter(f => f.name.match(/\.(mp3|ogg|wav)$/i));
    const documentFiles = allFilesWithContext.filter(f => !f.name.match(/\.(jpg|jpeg|png|gif|webp|mp4|webm|mp3|ogg|wav)$/i));

    // Простий парсинг посилань з RichText (шукаємо 'link' marks)
    const links = messages.flatMap(msg => {
        if (!msg.text || !msg.text.includes('"type":"link"')) return [];
        try {
            const parsed = JSON.parse(msg.text);
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
            if (parsed.content) findLinks(parsed.content);
            return foundLinks;
        } catch { return []; }
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // --- ДІЇ ---
    const handleJumpToMessage = (messageId) => {
        onClose();
        if (onScrollToMessage) {
            setTimeout(() => onScrollToMessage(messageId), 100);
        }
    };

    const handleSaveGroupInfo = () => {
        console.log("Saving group info:", { title: groupTitle, desc: groupDesc });
    };

    // --- ВІЗУАЛІЗАЦІЯ ВКАЛДОК ---
    const renderInfoTab = () => {
        if (chat.is_group) {
            return (
                <div className="flex flex-col gap-[15px]">
                    <div className="flex flex-col items-center p-[15px] bg-bg-page border border-border">
                        <div className="w-[60px] h-[60px] rounded-full bg-input-bg border border-border mb-[10px] flex items-center justify-center text-[20px]">👥</div>
                        {isGroupAdmin ? (
                            <div className="w-full flex flex-col gap-[10px]">
                                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{t('messages.group_title')}</div>
                                <div className="border border-input-border bg-input-bg focus-within:border-theme-link transition-colors">
                                    <SmartEditor className="min-h-[40px] p-[6px] text-[12px] outline-none" value={groupTitle} onChange={setGroupTitle} />
                                </div>
                                <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-[5px]">{t('messages.group_desc')}</div>
                                <div className="border border-input-border bg-input-bg focus-within:border-theme-link transition-colors">
                                    <SmartEditor className="min-h-[60px] p-[6px] text-[12px] outline-none" value={groupDesc} onChange={setGroupDesc} />
                                </div>
                                <Button onClick={handleSaveGroupInfo} className="mt-[5px]">{t('action.save')}</Button>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="font-bold text-[14px] text-theme-link mb-[5px]">{getPlainText(chat.title)}</div>
                                <div className="text-[11px] text-text-main">{getPlainText(chat.description)}</div>
                            </div>
                        )}
                    </div>

                    <div className="border border-border">
                        <div className="bg-header-bg p-[8px_15px] border-b border-border font-bold flex justify-between items-center">
                            <span>{t('messages.participants')} ({chat.participants_count})</span>
                            {isGroupAdmin && <span className="text-theme-link cursor-pointer hover:underline font-normal">{t('action.invite')}</span>}
                        </div>
                        <div className="flex flex-col max-h-[200px] overflow-y-auto custom-scrollbar bg-bg-box">
                            {(chat.participants || []).map(p => (
                                <div key={p.user.username} className="flex justify-between items-center p-[8px_15px] border-b border-border last:border-b-0 hover:bg-bg-page">
                                    <div className="flex items-center gap-[10px]">
                                        <Avatar user={p.user} className="w-[30px] h-[30px] object-cover border border-border" />
                                        <div className="flex flex-col">
                                            <Link to={`/${p.user.username}`} className="font-bold text-theme-link hover:underline leading-tight">{p.user.first_name}</Link>
                                            <span className="text-[10px] text-text-muted leading-tight mt-[2px]">{p.role === 'owner' ? t('roles.Owner') : t('roles.User')}</span>
                                        </div>
                                    </div>
                                    {isGroupAdmin && p.user.username !== currentUser?.username && (
                                        <button className="bg-transparent border-none text-theme-error cursor-pointer text-[10px] hover:underline p-0">{t('action.kick')}</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Для діалогу тет-а-тет
        const initiatorName = chat.initiator_username === currentUser?.username ? t('common.you') : chat.target_user?.first_name;
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
                            {t('messages.chat_started')}: <b>{initiatorName}</b> ({formatDate(chat.created_at)})
                        </div>
                        <div className="flex gap-[15px] mt-[10px]">
                            <span className="text-[11px] text-theme-error cursor-pointer hover:underline font-bold" onClick={onBlockUser}>{t('action.block')}</span>
                            <span className="text-[11px] text-theme-error cursor-pointer hover:underline font-bold" onClick={onDeleteChat}>{t('messages.delete_for_both')}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderFilesList = (filesList, isLinks = false) => {
        if (filesList.length === 0) return <div className="p-[20px] text-center italic text-text-muted">{t('empty.documents')}</div>;
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
                            <span className="text-[11px] text-theme-link cursor-pointer hover:underline" onClick={() => handleJumpToMessage(item.messageId)}>➜</span>
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
                title={chat.is_group ? t('messages.group_info') : t('messages.chat_info')}
                sizeClass="modal-md"
                bodyClassName="p-[15px]"
            >
                {/* ТАБИ */}
                <div className="flex gap-[15px] mb-[15px] border-b border-border text-[11px] font-bold">
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent ${activeTab === 'info' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('info')}>
                        {t('messages.info')}
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'media' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('media')}>
                        {t('messages.tab_media')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{mediaFiles.length}</span>
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'files' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('files')}>
                        {t('messages.tab_files')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{documentFiles.length}</span>
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'audio' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('audio')}>
                        {t('action.attach_audio')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{audioFiles.length}</span>
                    </button>
                    <button className={`pb-[8px] border-b-[2px] transition-colors cursor-pointer outline-none bg-transparent flex items-center gap-[4px] ${activeTab === 'links' ? 'border-theme-link text-text-main' : 'border-transparent text-text-muted hover:text-theme-link'}`} onClick={() => setActiveTab('links')}>
                        {t('action.attach_link')} <span className="bg-[rgba(128,128,128,0.1)] px-[4px] py-[1px] text-[9px] rounded-full font-normal">{links.length}</span>
                    </button>
                </div>

                {/* КОНТЕНТ ТАБІВ */}
                <div>
                    {activeTab === 'info' && renderInfoTab()}

                    {activeTab === 'media' && (
                        <div className="grid grid-cols-4 gap-[5px] border border-border p-[5px] bg-bg-page max-h-[300px] overflow-y-auto custom-scrollbar">
                            {mediaFiles.length > 0 ? mediaFiles.map((file, idx) => (
                                <div key={idx} className="relative aspect-square border border-border cursor-pointer group overflow-hidden bg-bg-box">
                                    {file.name.match(/\.(mp4|webm)$/i) ? (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-text-muted bg-[rgba(0,0,0,0.05)] hover:bg-[rgba(0,0,0,0.1)] transition-colors" onClick={() => handleJumpToMessage(file.messageId)}>
                                            <span className="text-[20px] mb-[2px]">🎥</span>
                                            <span className="text-[9px] font-bold">VIDEO</span>
                                        </div>
                                    ) : (
                                        <img src={file.url} alt="media" className="w-full h-full object-cover group-hover:scale-105 transition-transform" onClick={() => setPreviewImage(file.url)} />
                                    )}
                                    <div className="absolute top-[2px] right-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="bg-[rgba(0,0,0,0.6)] text-white border-none p-[2px_4px] text-[9px] cursor-pointer rounded-sm" onClick={(e) => { e.stopPropagation(); handleJumpToMessage(file.messageId); }}>➜ Msg</button>
                                    </div>
                                </div>
                            )) : <div className="col-span-4 p-[20px] text-center italic text-text-muted">{t('empty.documents')}</div>}
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