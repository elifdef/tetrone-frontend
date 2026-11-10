import { useTranslation } from 'react-i18next';
import UserDisplayName from '../../ui/UserDisplayName';

export default function ProfileHeader({ user, isPreview, statusText, isOnline }) {
    const { t } = useTranslation();
    const activeOnline = isOnline !== undefined ? isOnline : user.is_online;

    return (
        <div className="flex justify-between items-start flex-wrap border-b border-border pb-[5px] mb-[10px] max-md:flex-col max-md:gap-[10px]">
            <h2 className="m-0 text-[14px] text-theme-link font-bold break-words max-w-full leading-[1.2]">
                <UserDisplayName user={user} showUsername={true} />
            </h2>

            {!isPreview && !user.is_private && (
                <span className={`text-[11px] flex items-center gap-[5px] ${activeOnline ? 'text-theme-success font-bold' : 'text-[#888]'}`}>
                    {activeOnline && <span className="w-[6px] h-[6px] bg-theme-success inline-block"></span>}
                    {statusText}
                </span>
            )}
        </div>
    );
}