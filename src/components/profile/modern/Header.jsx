import { useTranslation } from 'react-i18next';
import Avatar from "../../ui/Avatar";
import ProfileActions from "../classic/ProfileActions";

export default function Header(props) {
    const {
        user, isPreview, displayAvatar, isBlockedByTarget, isBanned, isPrivateProfile,
        authUser, sameUser, statusText, onAvatarClick, isAvatarLoading
    } = props;

    const { t } = useTranslation();

    // Логіка для аватара
    const isBlocked = isBlockedByTarget || isBanned || isPrivateProfile;
    const hasCustomAvatar = displayAvatar && !displayAvatar.includes('defaultAvatar');
    const canViewAvatar = !isPreview && !isBlocked && hasCustomAvatar;

    const customNameColor = user.personalization?.username_color;
    const nameStyle = customNameColor && customNameColor.startsWith('#') ? { color: customNameColor } : {};

    return (
        <div className="flex justify-between items-end px-[20px] -mt-[60px] relative z-10 gap-[15px] flex-wrap max-md:flex-col max-md:items-center max-md:-mt-[65px] max-md:px-[15px]">

            <div className="flex items-end gap-[15px] flex-1 min-w-0 max-md:flex-col max-md:items-center max-md:w-full max-md:text-center">
                {/* Аватарка */}
                <div className="w-[130px] h-[130px] border-[6px] border-bg-box bg-bg-box overflow-hidden relative z-10 box-border shrink-0 max-md:mx-auto">
                    <Avatar
                        user={{ ...user, avatar: displayAvatar }}
                        className={`w-full h-full object-cover block 
                            ${isBlocked && !isPreview ? 'opacity-60 grayscale' : ''} 
                            ${canViewAvatar ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} 
                            ${isAvatarLoading ? 'opacity-50 pointer-events-none' : ''}`}
                        onClick={canViewAvatar ? onAvatarClick : undefined}
                    />
                </div>

                {/* Інформація (Ім'я, Нік, Статус) */}
                <div className="mb-[12px] flex flex-col flex-1 min-w-0">
                    <h1 className="text-[20px] font-bold m-0 leading-[1.1] text-text-main whitespace-normal overflow-wrap-anywhere break-words" style={nameStyle}>
                        {user.first_name} {user.last_name}
                    </h1>

                    <div className="flex items-center gap-[10px] mt-[4px] flex-wrap max-md:justify-center">
                        <span className="text-[13px] text-text-muted" style={nameStyle}>@{user.username}</span>
                        {!isPreview && !user.is_private && (
                            <span className={`text-[12px] flex items-center gap-[5px] ${user.is_online ? 'text-theme-success font-bold' : 'text-text-muted'}`}>
                                {user.is_online && <span className="w-[6px] h-[6px] bg-theme-success inline-block"></span>}
                                {statusText}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Блок з кнопками дій */}
            <div className="flex gap-[10px] items-end pb-[15px] z-10 max-md:w-full max-md:justify-center max-md:pb-0 max-md:mt-[15px]">
                {!sameUser && !isPreview && authUser && !user.is_deleted && (
                    <div className="flex gap-[10px] items-center mb-[12px] max-md:w-full max-md:justify-center max-md:flex-wrap [&_.relative]:w-auto [&_button]:w-auto [&_button]:px-[15px] [&_button]:py-[6px] [&_.absolute]:right-0 [&_.absolute]:left-auto [&_.absolute]:min-w-[180px]">
                        {/* Ми просто перевикористовуємо логіку кнопок з класичної теми! */}
                        <ProfileActions {...props} />
                    </div>
                )}
            </div>
        </div>
    );
}