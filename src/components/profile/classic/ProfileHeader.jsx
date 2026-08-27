import { useTranslation } from 'react-i18next';

export default function ProfileHeader({ user, isPreview, statusText }) {
    const { t } = useTranslation();

    const customNameColor = user.personalization?.username_color;
    const nameStyle = customNameColor && customNameColor.startsWith('#') ? { color: customNameColor } : {};

    return (
        <div className="flex justify-between items-start flex-wrap border-b border-border pb-[5px] mb-[10px] max-md:flex-col max-md:gap-[10px]">
            <h2 className="m-0 text-[14px] text-theme-link font-bold break-words max-w-full leading-[1.2]" style={nameStyle}>
                {user.first_name} {user.last_name}
                <span className="text-[12px] text-text-muted font-normal whitespace-nowrap ml-[5px]" style={nameStyle}>@{user.username}</span>
            </h2>

            {!isPreview && !user.is_private && (
                <span className={`text-[11px] flex items-center gap-[5px] ${user.is_online ? 'text-theme-success font-bold' : 'text-[#888]'}`}>
                    {user.is_online && <span className="w-[6px] h-[6px] bg-theme-success inline-block"></span>}
                    {statusText}
                </span>
            )}
        </div>
    );
}