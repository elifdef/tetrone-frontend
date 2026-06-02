import { useState, useMemo, memo } from 'react';
import RichText from '../common/RichText';
import { extractPreviewText } from '../../utils/messageParser';
import MessageImage from './MessageImage';

function MessageItem({
    msg, targetUser, formatDate, t, handleEditClick, handleDelete, setReplyingTo, togglePin, chatSlug 
}) {
    const [showActions, setShowActions] = useState(false);

    const isTemp = msg.status === 'sending' || msg.status === 'error';
    const isError = msg.status === 'error';

    const parsedText = useMemo(() => {
        if (!msg.text) return null;
        try {
            return JSON.parse(msg.text);
        } catch (e) {
            return msg.text;
        }
    }, [msg.text]);

    const renderMessageText = () => {
        if (!parsedText) return null;
        if (typeof parsedText === 'object') {
            return <RichText text={parsedText} />;
        }
        return parsedText;
    };

    return (
        <div
            id={`message-${msg.id}`}
            className={`tetrone-modern-message-wrapper ${msg.isMine ? 'mine' : 'theirs'} ${isError ? 'error-state' : ''}`}
            onMouseEnter={() => !isTemp && setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className="tetrone-modern-message-content">
                <div className="tetrone-modern-message-bubble">
                    {!msg.isMine && targetUser && (
                        <div className="tetrone-modern-msg-author-name">
                            {targetUser.first_name} {targetUser.last_name}
                        </div>
                    )}

                    {msg.reply_to && (
                        <div className="tetrone-modern-reply-quote" onClick={() => document.getElementById(`message-${msg.reply_to.id}`)?.scrollIntoView({ behavior: 'smooth' })}>
                            <div className="reply-author">{msg.reply_to.sender_name}</div>
                            <div className="reply-text">{extractPreviewText(msg.reply_to.text, t)}</div>
                        </div>
                    )}

                    {msg.files?.length > 0 && (
                        <div className="tetrone-modern-msg-files">
                            {msg.files.map((fileItem, idx) => {
                                const fileUrl = typeof fileItem === 'string'
                                    ? `${import.meta.env.VITE_API_URL}/chat/${chatSlug}/files/${fileItem}`
                                    : fileItem.url;

                                return (
                                    <MessageImage
                                        key={idx}
                                        src={fileUrl}
                                        alt="attachment"
                                        className="tetrone-modern-image-attachment"
                                    />
                                );
                            })}
                        </div>
                    )}

                    <div className="tetrone-modern-msg-text">
                        {renderMessageText()} 
                        <span className="tetrone-modern-msg-meta">
                            {msg.is_edited && <span className="tetrone-modern-edited">{t('common.edited')}</span>}
                            <span className="tetrone-modern-time">
                                {msg.status === 'sending' ? '⏱' : formatDate(msg.created_at, true)}
                            </span>
                            {msg.isMine && !isTemp && (
                                <span className={`tetrone-modern-read-status ${msg.read_at ? 'is-read' : 'is-sent'}`}>
                                    {msg.read_at ? '✓✓' : '✓'}
                                </span>
                            )}
                        </span>
                    </div>
                </div>

                <div className={`tetrone-modern-message-actions-bottom ${showActions && !isTemp ? 'visible' : ''}`}>
                    <button onClick={() => setReplyingTo(msg)}>{t('action.reply')}</button>
                    {msg.isMine && (
                        <>
                            <button onClick={() => handleEditClick(msg)}>{t('action.edit')}</button>
                            <button onClick={() => handleDelete(msg.id)} className="tetrone-text-danger">{t('action.delete')}</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(MessageItem);