import { Link } from "react-router-dom";
import { useState } from "react";
import { extractPreviewText } from '../../utils/editorHelpers';
import MessageImage from './MessageImage';
import RichText from '../common/RichText';
import Avatar from "../ui/Avatar";

export default function MessageItemOld({
    msg, myAvatar, myName, targetUser, formatDate, t,
    handleEditClick, handleDelete, setReplyingTo, togglePin, chatSlug
}) {
    const isTemp = msg.status === 'sending' || msg.status === 'error';

    const renderMessageText = (textStr) => {
        if (!textStr) return null;
        try {
            const parsed = JSON.parse(textStr);
            return <RichText text={parsed} />;
        } catch (e) {
            return <span className="tetrone-plain-text">{textStr}</span>;
        }
    };

    return (
        <div id={`message-${msg.id}`} className={`tetrone-messages-old-message-row ${msg.status === 'error' ? 'error-state' : ''}`}>
            <div className="tetrone-messages-old-msg-left">
                <Avatar src={msg.isMine ? myAvatar : targetUser?.avatar} className="tetrone-messages-old-avatar" />
            </div>

            <div className="tetrone-messages-old-msg-right">
                <div className="tetrone-im-msg-header">
                    <Link
                        to={`/${msg.isMine ? myName : targetUser.username}`}
                        className="tetrone-messages-old-author"
                    >
                        {msg.isMine ? myName : targetUser?.first_name}
                    </Link>
                    <span className="tetrone-messages-old-date">
                        {msg.status === 'sending' ? t('action.sending') : formatDate(msg.created_at)}
                    </span>
                </div>

                {msg.reply_to && (
                    <div className="tetrone-message-reply-quote">
                        <div className="reply-author">{msg.reply_to.sender_name}</div>
                        <div className="reply-text">{extractPreviewText(msg.reply_to.text, t)}</div>
                    </div>
                )}

                <div className="tetrone-messages-old-msg-text">
                    {renderMessageText(msg.text)}

                    {msg.is_edited && <span className="tetrone-edited-mark"> ({t('common.edited')})</span>}

                    {msg.status === 'error' && (
                        <div className="tetrone-message-error-indicator" title={msg.errorText}>
                            ❌ {t('messages.not_sent')}
                        </div>
                    )}
                </div>

                {msg.files?.length > 0 && (
                    <div className="tetrone-msg-files">
                        {msg.files.map((fileItem, idx) => {
                            const fileUrl = typeof fileItem === 'string'
                                ? `${import.meta.env.VITE_API_URL}/chat/${chatSlug}/files/${fileItem}`
                                : fileItem.url;

                            return (
                                <MessageImage
                                    key={idx}
                                    src={fileUrl}
                                    alt="attachment"
                                    className="tetrone-msg-image-attachment"
                                />
                            );
                        })}
                    </div>
                )}

                <div className="tetrone-messages-old-actions-bottom">
                    {!isTemp && (
                        <>
                            <span className="tetrone-action-link" onClick={() => setReplyingTo(msg)}>
                                {t('action.reply')}
                            </span>
                            <span className="tetrone-action-link" onClick={() => togglePin(msg.id)}>
                                {msg.is_pinned ? t('action.unpin') : t('action.pin')}
                            </span>
                            {msg.isMine && (
                                <>
                                    <span className="tetrone-action-link" onClick={() => handleEditClick(msg)}>
                                        {t('action.edit')}
                                    </span>
                                    <span className="tetrone-action-link danger" onClick={() => handleDelete(msg.id)}>
                                        {t('action.delete')}
                                    </span>
                                </>
                            )}
                            {msg.isMine && (
                                <span className={`tetrone-messages-old-read-status ${msg.read_at ? 'is-read' : 'is-sent'}`}>
                                    {msg.read_at ? '✓✓' : '✓'}
                                </span>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}