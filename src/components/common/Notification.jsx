import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router'; // ДОДАНО
import { useNotificationConfig } from '../../hooks/useNotificationConfig';
import ShieldIcon from '../../assets/shield.svg?react';
import Avatar from '../ui/Avatar';
import RichText from './RichText';
import { audioManager } from '../../utils/audioManager';

const NotificationAvatar = ({ user, isSystem }) =>
{
    if (isSystem)
    {
        return (
            <div className="tetrone-toast-avatar system-toast-avatar">
                <ShieldIcon width={ 64 } height={ 64 } className="system-toast-icon"/>
            </div>
        );
    }
    return <Avatar user={ user } className="tetrone-toast-avatar toast-avatar-img"/>;
};

const NotificationContent = ({ name, text, snippet, mediaPreview, isReaction, mediaPosition }) =>
{
    return (
        <div className="tetrone-toast-body">
            <div className="tetrone-toast-content">
                <span className="tetrone-toast-name">{ name }</span>
                <span className="tetrone-toast-text">{ text }</span>

                { (snippet || (mediaPreview && mediaPosition === 'left')) && (
                    <div className="toast-ntf-snippet-container">
                        { mediaPreview && mediaPosition === 'left' && (
                            <div className="toast-ntf-media-left">
                                <img src={ mediaPreview } alt="Media" className="ntf-media-img"/>
                            </div>
                        ) }

                        { snippet && (
                            <div className="toast-ntf-snippet">
                                { isReaction ? (
                                    <img src={ snippet } alt="Reaction" className="toast-ntf-reaction-img"/>
                                ) : typeof snippet === 'object' ? (
                                    <RichText text={ snippet } className="tetrone-notification-richtext"/>
                                ) : (
                                    <span>"{ snippet }"</span>
                                ) }
                            </div>
                        ) }
                    </div>
                ) }
            </div>

            { mediaPreview && mediaPosition === 'right' && (
                <div className="toast-ntf-media-right">
                    <img src={ mediaPreview } alt="Media" className="ntf-media-img"/>
                </div>
            ) }
        </div>
    );
};

export default function Notification({ notification, onClose })
{
    const { getConfig } = useNotificationConfig();
    const { t } = useTranslation();
    const navigate = useNavigate(); // ДОДАНО

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
        }, 5000);

        return () => clearTimeout(timer);
    }, [soundId]);

    const isSystem = actor.username === 'system' || !actor.username;

    const senderName = isSystem
        ? t('common.moderation')
        : `${ actor.first_name || '' } ${ actor.last_name || '' }`.trim();

    const {
        actionText,
        linkText,
        linkUrl,
        snippetText,
        mediaPreview,
        isReaction,
        mediaPosition
    } = getConfig(type, actor, target);

    const fullText = `${ actionText } ${ linkText || '' }`.trim();

    const handleToastClick = () =>
    {
        if (linkUrl)
        {
            navigate(linkUrl);
            onClose();
        }
    };

    return (
        <div
            className="tetrone-toast"
            onClick={ handleToastClick }
            style={ { cursor: linkUrl ? 'pointer' : 'default' } }
        >
            <NotificationAvatar user={ actor } isSystem={ isSystem }/>
            <NotificationContent
                name={ senderName }
                text={ fullText }
                snippet={ snippetText }
                mediaPreview={ mediaPreview }
                isReaction={ isReaction }
                mediaPosition={ mediaPosition }
            />
        </div>
    );
}