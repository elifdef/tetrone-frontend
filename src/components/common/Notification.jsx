import { useEffect, useRef, useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useNotificationConfig } from '../../hooks/useNotificationConfig';
import { NotificationContext } from '../../context/NotificationContext';
import ReportResultModal from '../modals/ReportResultModal';
import ShieldIcon from '../../assets/shield.svg?react';
import Avatar from '../ui/Avatar';
import RichText from './RichText';
import { audioManager } from '../../utils/audioManager';
import { getPlainText } from '../chat/utils/messageParser';

const NotificationAvatar = ({ user, isSystem }) => {
    if (isSystem) {
        return (
            <div className="w-[38px] h-[38px] shrink-0 flex items-center justify-center bg-theme-header-bg border border-border text-theme-link rounded-none">
                <ShieldIcon width={22} height={22} />
            </div>
        );
    }
    return (
        <div className="w-[38px] h-[38px] shrink-0 bg-bg-page border border-border p-[1px] rounded-none">
            <Avatar user={user} className="w-full h-full object-cover rounded-none block" />
        </div>
    );
};

export default function Notification({ notification, onClose }) {
    const { getConfig } = useNotificationConfig();
    const { markAsRead } = useContext(NotificationContext);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [selectedReport, setSelectedReport] = useState(null);

    const payload = notification.data || notification;
    const type = payload.type || notification.type;
    const actor = payload.actor || {};
    const target = payload.target || {};
    const soundId = Number(payload.sound_id);

    const soundPlayed = useRef(false);
    const onCloseRef = useRef(onClose);

    useEffect(() => {
        onCloseRef.current = onClose;
    }, [onClose]);

    useEffect(() => {
        if (soundId && soundId !== 0 && !soundPlayed.current) {
            audioManager.play(soundId);
            soundPlayed.current = true;
        }

        const timer = setTimeout(() => {
            if (!selectedReport) {
                onCloseRef.current();
            }
        }, 12000);

        return () => clearTimeout(timer);
    }, [soundId, selectedReport]);

    const isChatMessage = type === 'new_message';
    const isSystemReport = [
        'report_reviewed',
        'content_deleted',
        'report_reverted',
        'content_restored'
    ].includes(type);

    const isSystem = !isChatMessage && (actor.username === 'system' || !actor.username || isSystemReport);

    const titleName = isChatMessage
        ? t('notifications.new_message')
        : t('common.notifications');

    const senderName = isSystem
        ? t('common.moderation')
        : `${actor.first_name || ''} ${actor.last_name || ''}`.trim() || actor.username;

    const chatMsg = notification.message;
    const chatBadges = [];

    if (isChatMessage && chatMsg) {
        if (chatMsg.shareable) {
            const shareType = chatMsg.shareable.type;
            const key = shareType === 'comment'
                ? 'chat.badges.forwarded_comment'
                : shareType === 'user'
                    ? 'chat.badges.shared_profile'
                    : 'chat.badges.forwarded_post';
            chatBadges.push({ key: shareType, label: t(key) });
        }
        if (chatMsg.files?.length > 0) {
            const first = chatMsg.files[0];
            const isImg = first.type?.startsWith('image/') || first.name?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
            const isVid = first.type?.startsWith('video/') || first.name?.match(/\.(mp4|webm)$/i);
            const isAud = first.type?.startsWith('audio/') || first.name?.match(/\.(mp3|ogg|wav)$/i);

            chatBadges.push({
                key: 'file',
                label: isImg
                    ? t('chat.composer.attach.photo')
                    : isVid
                        ? t('chat.composer.attach.video')
                        : isAud
                            ? t('chat.composer.attach.audio')
                            : t('chat.composer.attach.document')
            });
        }
    }

    const chatPlainText = isChatMessage && chatMsg?.text ? getPlainText(chatMsg.text) : '';

    const {
        actionText,
        linkText,
        linkUrl,
        snippetText,
        mediaPreview,
        isReaction,
        mediaPosition
    } = getConfig(type, actor, target);

    const targetLink = notification.link || linkUrl;

    const handleToastClick = () => {
        if (markAsRead && !notification.read_at && notification.id) {
            markAsRead(notification.id);
        }

        if (isSystemReport) {
            setSelectedReport(payload);
        } else if (targetLink) {
            navigate(targetLink);
            onClose();
        }
    };

    const handleCloseClick = (e) => {
        e.stopPropagation();
        onClose();
    };

    return (
        <>
            <div
                className="w-[320px] bg-bg-box border border-border rounded-none shadow-[0_5px_15px_rgba(0,0,0,0.35)] font-tahoma opacity-95 hover:opacity-100 transition-opacity flex flex-col min-w-0"
                onClick={handleToastClick}
                style={{ cursor: (targetLink || isSystemReport) ? 'pointer' : 'default' }}
            >
                <div className="flex justify-between items-center px-[10px] pt-[6px] pb-[4px] border-b border-border bg-header-bg rounded-none">
                    <span className="text-[11px] font-bold text-theme-link drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)]">
                        {titleName}
                    </span>
                    <button
                        type="button"
                        className="w-[16px] h-[16px] bg-bg-box hover:bg-theme-error hover:text-white border border-border text-text-muted text-[10px] flex items-center justify-center rounded-none cursor-pointer outline-none transition-colors"
                        onClick={handleCloseClick}
                        title={t('action.close')}
                    >
                        ✕
                    </button>
                </div>

                <div className="flex gap-[10px] px-[10px] pb-[8px] pt-[6px] items-start">
                    <NotificationAvatar user={actor} isSystem={isSystem} />

                    <div className="flex flex-col text-[11px] leading-[1.3] flex-1 min-w-0 text-text-main">
                        {isChatMessage ? (
                            <>
                                <div className="font-bold text-theme-link truncate mb-[2px]">
                                    {senderName}
                                </div>
                                <div className="text-[11px] truncate flex items-center gap-[4px] flex-wrap">
                                    {chatBadges.map((b) => (
                                        <span key={b.key} className="text-theme-link font-bold shrink-0">
                                            [{b.label}]
                                        </span>
                                    ))}
                                    {chatPlainText && (
                                        <span className="text-text-muted truncate">{chatPlainText}</span>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <span className="whitespace-normal break-words">
                                    {!isSystem && <span className="font-bold text-theme-link mr-[4px]">{senderName}</span>}
                                    {actionText}
                                    {actionText && linkText ? ' ' : ''}
                                    {(targetLink || isSystemReport) && linkText ? (
                                        <span className="text-theme-link hover:underline ml-[2px]">
                                            {linkText}{snippetText && !isReaction ? ':' : ''}
                                        </span>
                                    ) : (
                                        <span className="ml-[2px]">{linkText}{snippetText && !isReaction ? ':' : ''}</span>
                                    )}
                                </span>

                                {(snippetText || (mediaPreview && mediaPosition === 'left')) && (
                                    <div className="flex items-start gap-[8px] mt-[6px]">
                                        {mediaPreview && mediaPosition === 'left' && (
                                            <div className="w-[36px] min-w-[36px] h-[36px] shrink-0 border border-border overflow-hidden bg-bg-page rounded-none">
                                                <img src={mediaPreview} alt="" className="w-full h-full object-cover block" />
                                            </div>
                                        )}

                                        {snippetText && (
                                            <div className="text-text-muted italic max-h-[32px] overflow-hidden flex-1 truncate">
                                                {isReaction ? (
                                                    <img src={snippetText} alt="" className="w-[18px] h-[18px] block" />
                                                ) : typeof snippetText === 'object' ? (
                                                    <RichText text={snippetText} className="text-[11px] m-0" />
                                                ) : (
                                                    <span>"{snippetText}"</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {!isChatMessage && mediaPreview && mediaPosition === 'right' && (
                        <div className="w-[36px] min-w-[36px] h-[36px] shrink-0 border border-border overflow-hidden bg-bg-page ml-[4px] rounded-none">
                            <img src={mediaPreview} alt="" className="w-full h-full object-cover block" />
                        </div>
                    )}
                </div>
            </div>

            {selectedReport && (
                <ReportResultModal
                    payload={selectedReport}
                    onClose={() => {
                        setSelectedReport(null);
                        onClose();
                    }}
                />
            )}
        </>
    );
}