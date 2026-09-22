import { useTranslation } from 'react-i18next';
import { useDateFormatter } from '../../../hooks/useDateFormatter';
import Avatar from '../../ui/Avatar';
import ClassicMessageItem from './ClassicMessageItem';
import ClassicChatComposer from './ClassicChatComposer';
import { getPlainText } from '../utils/messageParser.js';

const TrashIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>;
const CloseIcon = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const PencilIcon = () => <svg className="animate-pulse" viewBox="0 0 24 24" width="12" height="12"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 0 0 0-1.41l-2.34-2.34a.996.996 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" /></svg>;
const GroupIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;

export default function ClassicChatLayout(props) {
    const {
        currentUser, chats, messages, activeChat,
        handleSelectChat, handleBackToInbox,
        handleEditClick, handleDelete, setReplyingTo, togglePin,
        canWrite, cantWriteReason, isTyping, onOpenInfo
    } = props;

    const { t } = useTranslation();
    const formatDate = useDateFormatter();
    const pinnedMessage = messages.find(m => m.is_pinned);

    if (!activeChat) {
        return (
            <div className="bg-bg-box border border-border flex flex-col font-sans text-text-main h-[calc(100vh-80px)] max-h-[800px] w-full">
                <div className="flex p-[12px_15px] bg-header-bg border-b border-border text-[11px]">
                    <span className="text-theme-link cursor-pointer font-bold hover:underline">{t('common.messages')}</span>
                </div>
                <div className="p-[0_15px_15px_15px] overflow-y-auto custom-scrollbar flex-1">
                    {chats.map(chat => (
                        <div
                            key={chat.slug}
                            onClick={() => handleSelectChat(chat.slug)}
                            className={`flex p-[10px_15px] -mx-[15px] border-b border-border cursor-pointer transition-colors hover:bg-bg-page ${chat.unread_count > 0 ? 'bg-[rgba(91,155,213,0.12)] hover:bg-[rgba(91,155,213,0.22)] dark:bg-[rgba(91,155,213,0.18)]' : ''}`}
                        >
                            {chat.is_group ? (
                                <div className="w-[50px] h-[50px] bg-bg-page border border-border flex items-center justify-center text-text-muted shrink-0">
                                    <GroupIcon />
                                </div>
                            ) : (
                                <Avatar user={chat.target_user} className="w-[50px] h-[50px] object-cover border border-border block shrink-0" />
                            )}

                            <div className="flex-1 min-w-0 ml-[15px] flex flex-col justify-center">
                                <div className="flex justify-between mb-[5px] items-baseline">
                                    <span className="font-bold text-[12px] text-theme-link">
                                        {chat.is_group ? getPlainText(chat.title) : `${chat.target_user?.first_name} ${chat.target_user?.last_name}`}
                                    </span>
                                    <span className="text-[10px] text-text-muted shrink-0 ml-[10px]">{formatDate(chat.updated_at)}</span>
                                </div>
                                <div className="flex justify-between items-center w-full">
                                    <span className="text-[11px] text-text-main overflow-hidden text-ellipsis whitespace-nowrap flex-1">
                                        {chat.last_message_sender_id === currentUser?.id && <span className="text-text-muted">{t('common.you')}: </span>}
                                        {getPlainText(chat.last_message)}
                                    </span>
                                    {chat.unread_count > 0 && (
                                        <span className="bg-theme-link text-white p-[1px_6px] text-[10px] font-bold ml-[10px] shrink-0">
                                            {chat.unread_count > 99 ? '99+' : chat.unread_count}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {chats.length === 0 && <div className="p-[20px] text-center text-[11px] text-text-muted italic">{t('empty.inbox')}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-bg-box border border-border flex flex-col font-sans text-text-main h-[calc(100vh-80px)] max-h-[800px] w-full">
            <div className="flex justify-between items-center p-[10px_15px] bg-header-bg border-b border-border shrink-0">
                <span className="text-theme-link cursor-pointer font-bold text-[11px] hover:underline" onClick={handleBackToInbox}>
                    {t('action.go_back')}
                </span>

                <div className="flex flex-col items-center cursor-pointer group" onClick={onOpenInfo}>
                    <span className="font-bold text-[13px] text-theme-link group-hover:underline">
                        {activeChat.is_group ? getPlainText(activeChat.title) : `${activeChat.target_user?.first_name} ${activeChat.target_user?.last_name}`}
                    </span>
                    {isTyping ? (
                        <span className="text-[10px] text-theme-link mt-[2px] flex items-center gap-[4px]">
                            <PencilIcon /> {t('common.typing')}
                        </span>
                    ) : (
                        <span className="text-[10px] text-text-muted mt-[2px] flex items-center">
                            {activeChat.is_group ? (
                                `${activeChat.participants_count} учасників`
                            ) : (
                                <><span className="inline-block w-[6px] h-[6px] bg-theme-success mr-[4px]"></span> {t('common.online')}</>
                            )}
                        </span>
                    )}
                </div>

                <button className="bg-transparent border border-border text-text-muted cursor-pointer text-[12px] p-[3px_6px] hover:bg-bg-page hover:text-theme-error hover:border-theme-error transition-colors outline-none">
                    <TrashIcon />
                </button>
            </div>

            {pinnedMessage && (
                <div className="border-b border-border bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.04)] p-[8px_15px] cursor-pointer flex items-center gap-[10px] hover:bg-[rgba(0,0,0,0.06)] shrink-0 transition-colors">
                    <Avatar user={pinnedMessage.isMine ? currentUser : (pinnedMessage.author || {})} className="w-[32px] h-[32px] object-cover shrink-0 border border-border" />
                    <div className="flex-1 overflow-hidden">
                        <div className="text-[11px] font-bold text-theme-link mb-[2px]">
                            {t('messages.pinned_message')} {pinnedMessage.isMine ? currentUser?.first_name : pinnedMessage.author?.first_name}
                        </div>
                        <div className="text-[11px] text-text-main whitespace-nowrap overflow-hidden text-ellipsis">
                            {getPlainText(pinnedMessage.text)}
                        </div>
                    </div>
                    <button className="bg-transparent border-none cursor-pointer text-text-muted p-[5px] text-[14px] hover:text-theme-error outline-none">
                        <CloseIcon />
                    </button>
                </div>
            )}

            <div className="flex-grow overflow-y-auto px-[15px] custom-scrollbar bg-bg-box">
                {messages.length === 0 ? (
                    <div className="p-[20px] text-center text-[11px] text-text-muted italic">{t('empty.messages')}</div>
                ) : (
                    <div className="flex flex-col">
                        {messages.map(msg => (
                            <ClassicMessageItem
                                key={msg.id} msg={msg} myself={currentUser}
                                formatDate={formatDate} t={t} handleEditClick={handleEditClick}
                                handleDelete={handleDelete} setReplyingTo={setReplyingTo} togglePin={togglePin}
                            />
                        ))}
                    </div>
                )}
            </div>

            {canWrite ? (
                <ClassicChatComposer {...props} myself={currentUser} targetUser={activeChat.is_group ? null : activeChat.target_user} />
            ) : (
                <div className="p-[20px] text-center text-[11px] text-text-muted italic bg-bg-box border-t border-border shrink-0">
                    {cantWriteReason || t('messages.cannot_write')}
                </div>
            )}
        </div>
    );
}