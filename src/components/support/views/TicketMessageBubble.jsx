import { useTranslation } from 'react-i18next';
import Avatar from '../../ui/Avatar';
import { SecurityIcon as SupportIcon } from '../../ui/Icons';

export default function TicketMessageBubble({ msg, ticketOwnerId, currentUserId, formatDate }) {
    const { t } = useTranslation();

    const msgUserId = msg.user?.id;
    const isTicketOwner = msgUserId === ticketOwnerId;
    const isMe = msgUserId === currentUserId;

    const getRoleName = (roleId) => {
        switch (Number(roleId)) {
            case 1: return t('common.support');
            case 2: return t('common.moderator');
            case 3: return t('common.admin');
            case 4: return t('common.creator')
            default: return t('common.system');
        }
    };

    let authorName = isMe ? t('common.you') : (msg.user?.first_name || msg.user?.username || t('common.support'));

    if (!isTicketOwner && msg.user?.role !== undefined && msg.user?.role !== null) {
        authorName = `${authorName} (${getRoleName(msg.user.role)})`;
    }

    return (
        <div className="tetrone-support-msg-wrapper">
            <div className="tetrone-support-msg-avatar-col">
                {isTicketOwner ? (
                    <Avatar user={msg.user} />
                ) : (
                    <div className="tetrone-support-system-avatar">
                        <SupportIcon width={24} height={24} />
                    </div>
                )}
            </div>

            <div className={`tetrone-support-msg ${isTicketOwner ? 'msg-user' : 'msg-admin'}`}>
                <div className="tetrone-support-msg-header">
                    <span className="author">{authorName}</span>
                    <span className="date">{formatDate(msg.created_at)}</span>
                </div>
                <div className="tetrone-support-msg-body">{msg.message}</div>

                {msg.attachments?.length > 0 && (
                    <div className="tetrone-support-msg-attach">
                        {msg.attachments.map(att => (
                            <a key={att.id} href={att.url || att.file_url} target="_blank" rel="noreferrer">
                                <img src={att.url || att.file_url} alt="attachment" />
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}