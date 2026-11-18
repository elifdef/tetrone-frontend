import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import RichText from "../common/RichText";
import { NotificationListAvatar } from "./NotificationListAvatar";

export const NotificationListItem = ({ notif, handleNotificationClick, handleMarkRead, getConfig, formatDate }) => {
    const { t } = useTranslation();

    const isUnread = !notif.read_at;
    const payload = notif.data || {};

    const type = payload.type || notif.type;
    const actor = payload.actor || {};
    const target = payload.target || {};

    const isSystemReport = [
        'report_reviewed',
        'content_deleted',
        'report_reverted',
        'content_restored'
    ].includes(type);

    const hasSpaceSubject = !actor?.username && Boolean(payload.space_username);
    const subjectEntity = hasSpaceSubject
        ? {
            username: payload.space_username,
            first_name: payload.space_name,
            avatar: payload.space_avatar,
        }
        : actor;

    const isSystem = !hasSpaceSubject && (!actor?.username || actor.username === 'system' || isSystemReport);
    const senderName = isSystem
        ? (actor.first_name ? `${actor.first_name} ${actor.last_name || ''}`.trim() : t('common.moderator'))
        : hasSpaceSubject
            ? payload.space_name
            : `${actor.first_name || ''} ${actor.last_name || ''}`.trim() || actor.username;

    const {
        actionText,
        linkText,
        linkUrl,
        snippetText,
        mediaPreview,
        isReaction,
        mediaPosition
    } = getConfig(type, actor, target, payload);

    const onBlockClick = () => {
        handleNotificationClick(notif, payload, isSystemReport, linkUrl);
    };

    const handleEntityClick = (e) => {
        e.stopPropagation();
        if (isUnread && handleMarkRead) {
            handleMarkRead(notif);
        }
    };

    const handleLinkClick = (e) => {
        e.stopPropagation();
        if (isUnread && handleMarkRead) {
            handleMarkRead(notif);
        }
    };

    return (
        <div
            className={`flex p-[10px_15px] border-b border-border last:border-b-0 hover:bg-bg-hover cursor-pointer relative transition-colors ${isUnread ? 'bg-[rgba(91,155,213,0.05)]' : ''}`}
            onClick={onBlockClick}
        >
            <div className="flex gap-[15px] w-full min-w-0">
                <div className="flex-shrink-0">
                    {isSystem ? (
                        <NotificationListAvatar isSystem={true} />
                    ) : (
                        <Link to={`/${subjectEntity.username}`} onClick={handleEntityClick}>
                            <NotificationListAvatar actor={subjectEntity} isSystem={false} />
                        </Link>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="text-[11px] text-text-main mb-[4px] leading-[1.3]">
                        {!isSystemReport && (
                            isSystem ? (
                                <span className="font-bold text-theme-link">{senderName}</span>
                            ) : (
                                <Link
                                    to={`/${subjectEntity.username}`}
                                    className="font-bold text-theme-link no-underline hover:underline"
                                    onClick={handleEntityClick}
                                    style={subjectEntity.personalization?.username_color ? { color: subjectEntity.personalization.username_color } : undefined}
                                >
                                    {senderName}
                                </Link>
                            )
                        )}
                        {!isSystemReport && ' '}
                        <span className="text-text-main">
                            {actionText}
                            {actionText && linkText ? ' ' : ''}
                            {linkUrl && linkText ? (
                                <Link to={linkUrl} className="text-theme-link no-underline hover:underline" onClick={handleLinkClick}>
                                    {linkText}{snippetText && !isReaction ? ':' : ''}
                                </Link>
                            ) : (
                                <>{linkText}{snippetText && !isReaction ? ':' : ''}</>
                            )}
                        </span>
                    </div>

                    {(snippetText || (mediaPreview && mediaPosition === 'left')) && (
                        <div className="flex gap-[10px] mt-[4px] mb-[4px] p-[6px_10px] bg-bg-page border-l-[2px] border-border text-[11px] text-text-muted">
                            {mediaPreview && mediaPosition === 'left' && (
                                <div className="w-[40px] h-[40px] flex-shrink-0">
                                    <img src={mediaPreview} alt="" className="w-full h-full object-cover border border-border" />
                                </div>
                            )}

                            {snippetText && (
                                <div className="flex-1 min-w-0">
                                    {isReaction ? (
                                        <img src={snippetText} alt="" className="w-[16px] h-[16px] object-contain inline-block align-middle" />
                                    ) : typeof snippetText === 'object' ? (
                                        <RichText text={snippetText.text || snippetText} className="text-[11px] text-text-muted" />
                                    ) : (
                                        <span className="italic">"{snippetText}"</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="text-[10px] text-text-muted mt-[4px]">
                        {formatDate(notif.created_at)}
                    </div>
                </div>
            </div>

            {mediaPreview && mediaPosition === 'right' && (
                <div className="w-[40px] h-[40px] flex-shrink-0 ml-[15px]">
                    <img src={mediaPreview} alt="" className="w-full h-full object-cover border border-border" />
                </div>
            )}

            {isUnread && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead?.(notif);
                    }}
                    className="ml-[10px] self-center shrink-0 w-[24px] h-[24px] flex items-center justify-center bg-transparent border-none cursor-pointer group outline-none"
                    title={t('notifications.mark_read')}
                >
                    <span className="w-[8px] h-[8px] bg-theme-link group-hover:scale-125 transition-transform block" />
                </button>
            )}
        </div>
    );
};