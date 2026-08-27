import Avatar from "../../ui/Avatar";

export default function ProfileAvatar({ user, displayAvatar, isPreview, isBlockedByTarget, isBanned, isPrivateProfile, onAvatarClick, isAvatarLoading }) {
    const isBlocked = isBlockedByTarget || isBanned || isPrivateProfile;
    const hasCustomAvatar = displayAvatar && !displayAvatar.includes('defaultAvatar');
    const canViewAvatar = !isPreview && !isBlocked && hasCustomAvatar;

    return (
        <div className="relative z-10 overflow-visible mb-[15px]">
            <Avatar
                user={{ ...user, avatar: displayAvatar }}
                className={`w-full h-auto block min-h-[200px] bg-[#333] object-cover max-md:max-w-[300px] max-md:mx-auto max-md:min-h-0 
                    ${isBlocked && !isPreview ? 'opacity-60 grayscale' : ''} 
                    ${canViewAvatar ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} 
                    ${isAvatarLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={canViewAvatar ? onAvatarClick : undefined}
            />
        </div>
    );
}