import { useMemo, memo } from 'react';
import { Link } from 'react-router';
import RichText from '../../common/RichText';
import Avatar from '../../ui/Avatar';
import { isTipTapJson, parseRichText, getPlainText } from '../utils/messageParser';

const CheckIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>;
const DoubleCheckIcon = () => <svg width="16" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 6 7 17 2 12"></polyline><polyline points="22 6 11 17"></polyline></svg>;
const ErrorIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;

const ClassicMessageItem = memo(({ msg, myself, formatDate, t, handleEditClick, handleDelete, setReplyingTo, togglePin }) => {

    // Системне повідомлення
    if (msg.is_system) {
        return (
            <div id={`message-${msg.id}`} className="py-[10px] text-center border-b border-border last:border-b-0">
                <span className="text-[10px] text-text-muted bg-bg-page px-[10px] py-[4px] border border-border">
                    {msg.text}
                </span>
            </div>
        );
    }

    const isTemp = msg.status === 'sending' || msg.status === 'error';

    const author = msg.isMine ? myself : (msg.author || {});
    const authorName = author?.first_name || 'Unknown';
    const authorUsername = author?.username || '';

    // Розумний рендерер тексту повідомлення (працює і з RichText JSON, і з plain text)
    const renderMessageContent = () => {
        if (!msg.text) return null;
        if (isTipTapJson(msg.text)) {
            return <RichText text={parseRichText(msg.text)} />;
        }
        return <span className="whitespace-pre-wrap">{msg.text}</span>;
    };

    return (
        <div id={`message-${msg.id}`} className={`flex py-[15px] border-b border-border last:border-b-0 ${msg.status === 'error' ? 'bg-[rgba(255,0,0,0.05)]' : ''}`}>
            <div className="w-[50px] shrink-0 mr-[15px]">
                <Avatar user={author} className="w-[50px] h-[50px] object-cover border border-border block" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-[6px]">
                    <Link to={`/${authorUsername}`} className="font-bold text-[12px] text-theme-link hover:underline">
                        {authorName}
                    </Link>
                    <span className="text-[10px] text-text-muted">
                        {msg.status === 'sending' ? t('action.sending') : formatDate(msg.created_at)}
                    </span>
                </div>

                {/* Блок відповіді з використанням глобального getPlainText */}
                {msg.reply_to && (
                    <div className="border-l-[2px] border-theme-link bg-[rgba(0,0,0,0.03)] dark:bg-[rgba(255,255,255,0.05)] p-[6px_10px] mb-[8px] cursor-pointer flex flex-col gap-[2px]">
                        <div className="text-[11px] font-bold text-theme-link">{msg.reply_to.sender_name}</div>
                        <div className="text-[11px] text-text-main whitespace-nowrap overflow-hidden text-ellipsis">
                            {getPlainText(msg.reply_to.text)}
                        </div>
                    </div>
                )}

                {/* Текст повідомлення без дублювання */}
                <div className="text-[12px] text-text-main leading-[1.4] break-words whitespace-pre-wrap w-full mb-[8px]">
                    {renderMessageContent()}
                    {msg.is_edited && <span className="text-[10px] text-text-muted ml-[4px]">({t('common.edited')})</span>}
                    {msg.status === 'error' && (
                        <div className="text-[10px] text-theme-error font-bold mt-[4px] flex items-center gap-[4px]">
                            <ErrorIcon /> {t('messages.not_sent')}
                        </div>
                    )}
                </div>

                <div className="flex justify-end items-center gap-[12px] mt-[8px]">
                    {!isTemp && (
                        <>
                            <span className="cursor-pointer text-theme-link text-[11px] hover:underline" onClick={() => setReplyingTo(msg)}>{t('action.reply')}</span>
                            <span className="cursor-pointer text-theme-link text-[11px] hover:underline" onClick={() => togglePin(msg.id)}>{msg.is_pinned ? t('action.unpin') : t('action.pin')}</span>
                            {msg.isMine && (
                                <>
                                    <span className="cursor-pointer text-theme-link text-[11px] hover:underline" onClick={() => handleEditClick(msg)}>{t('action.edit')}</span>
                                    <span className="cursor-pointer text-theme-error text-[11px] hover:underline" onClick={() => handleDelete(msg.id)}>{t('action.delete')}</span>
                                </>
                            )}
                            {msg.isMine && (
                                <span className={`flex items-center ml-[4px] ${msg.read_at ? 'text-theme-link' : 'text-text-muted'}`}>
                                    {msg.read_at ? <DoubleCheckIcon /> : <CheckIcon />}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});

export default ClassicMessageItem;