import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useNotificationConfig } from '../../hooks/useNotificationConfig';
import ShieldIcon from '../../assets/shield.svg?react';
import Avatar from '../ui/Avatar';
import RichText from './RichText';
import { audioManager } from '../../utils/audioManager';

const NotificationAvatar = ({ user, isSystem }) => {
    if (isSystem) {
        return (
            <div className="w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center bg-white rounded-[3px] p-[2px] shadow-[1px_1px_3px_rgba(0,0,0,0.4)]">
                <ShieldIcon width={28} height={28} className="fill-[#cc0000]" />
            </div>
        );
    }
    return (
        <div className="w-[42px] h-[42px] flex-shrink-0 bg-white p-[2px] rounded-[3px] shadow-[1px_1px_3px_rgba(0,0,0,0.4)]">
            <Avatar user={user} className="w-full h-full object-cover rounded-[2px] block" />
        </div>
    );
};

export default function Notification({ notification, onClose }) {
    const { getConfig } = useNotificationConfig();
    const { t } = useTranslation();
    const navigate = useNavigate();

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
            onCloseRef.current();
        }, 15000); // 15 секунд і сповіщення зникає

        return () => clearTimeout(timer);
    }, [soundId]);

    const isSystem = actor.username === 'system' || !actor.username;

    // Заголовок сповіщення (Нове повідомлення, Заявка в друзі і т.д.)
    const titleName = isSystem
        ? t('common.notification', 'Сповіщення')
        : t('common.notification', 'Сповіщення'); // Тут можна вивести senderName, якщо хочеш

    const senderName = isSystem
        ? t('common.moderation')
        : `${actor.first_name || ''} ${actor.last_name || ''}`.trim();

    const {
        actionText,
        linkText,
        linkUrl,
        snippetText,
        mediaPreview,
        isReaction,
        mediaPosition
    } = getConfig(type, actor, target);

    const handleToastClick = () => {
        if (linkUrl) {
            navigate(linkUrl);
            onClose();
        }
    };

    const handleCloseClick = (e) => {
        e.stopPropagation(); // Щоб клік на хрестик не викликав перехід по посиланню
        onClose();
    };

    return (
        <div
            className="w-[320px] bg-gradient-to-b from-[#5c684b] to-[#445037] border border-[#3a452d] rounded-[5px] shadow-[0_5px_15px_rgba(0,0,0,0.6)] font-tahoma opacity-95 hover:opacity-100 transition-opacity flex flex-col min-w-0"
            onClick={handleToastClick}
            style={{ cursor: linkUrl ? 'pointer' : 'default' }}
        >
            {/* Шапка з хрестиком */}
            <div className="flex justify-between items-center px-[10px] pt-[6px] pb-[4px]">
                <span className="text-[12px] font-bold text-white drop-shadow-[1px_1px_1px_rgba(0,0,0,0.5)]">
                    {titleName}
                </span>
                <button
                    className="w-[16px] h-[16px] bg-[#677359] hover:bg-[#7e8c6e] border border-[#525e44] text-[#ddd] hover:text-white text-[10px] flex items-center justify-center rounded-[2px] cursor-pointer outline-none transition-colors"
                    onClick={handleCloseClick}
                    title={t('action.close')}
                >
                    ✖
                </button>
            </div>

            {/* Основне тіло сповіщення */}
            <div className="flex gap-[12px] px-[10px] pb-[10px] pt-[2px]">
                <NotificationAvatar user={actor} isSystem={isSystem} />

                <div className="flex flex-col text-[11px] leading-[1.3] flex-1 min-w-0 text-white">
                    <span className="whitespace-normal break-words drop-shadow-[1px_1px_1px_rgba(0,0,0,0.3)]">
                        {!isSystem && <span className="font-bold text-[#8fbded] mr-[4px]">{senderName}</span>}
                        {actionText}
                        {actionText && linkText ? ' ' : ''}
                        {linkUrl && linkText ? (
                            <span className="text-[#8fbded] hover:underline cursor-pointer ml-[2px]">
                                {linkText}{snippetText && !isReaction ? ':' : ''}
                            </span>
                        ) : (
                            <span className="ml-[2px]">{linkText}{snippetText && !isReaction ? ':' : ''}</span>
                        )}
                    </span>

                    {/* Додатковий сніпет (якщо є коментар чи текст) */}
                    {(snippetText || (mediaPreview && mediaPosition === 'left')) && (
                        <div className="flex items-start gap-[8px] mt-[6px]">
                            {mediaPreview && mediaPosition === 'left' && (
                                <div className="w-[36px] min-w-[36px] h-[36px] flex-shrink-0 border border-white/30 overflow-hidden block bg-black/20 rounded-[2px]">
                                    <img src={mediaPreview} alt="Media" className="w-full h-full object-cover block" />
                                </div>
                            )}

                            {snippetText && (
                                <div
                                    className="text-[#d5e0ca] italic max-h-[32px] overflow-hidden relative flex-1 whitespace-normal break-words"
                                    style={{
                                        maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)',
                                        WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)'
                                    }}
                                >
                                    {isReaction ? (
                                        <img src={snippetText} alt="Reaction" className="w-[18px] h-[18px] block rounded-none" />
                                    ) : typeof snippetText === 'object' ? (
                                        <RichText text={snippetText} className="text-[11px] m-0" />
                                    ) : (
                                        <span>"{snippetText}"</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {mediaPreview && mediaPosition === 'right' && (
                    <div className="w-[40px] min-w-[40px] h-[40px] flex-shrink-0 border border-white/30 overflow-hidden block bg-black/20 ml-[4px] rounded-[2px]">
                        <img src={mediaPreview} alt="Media" className="w-full h-full object-cover block" />
                    </div>
                )}
            </div>
        </div>
    );
}