import ProfileAvatar from "./ProfileAvatar";
import ProfileActions from "./ProfileActions";
import ProfileHeader from "./ProfileHeader";
import ProfileStatus from "./ProfileStatus";
import ProfileInfo from "./ProfileInfo";
import StaffBanner from "./StaffBanner";

export default function ClassicProfileCard(props) {
    const { isPreview, isStaff, isBanned, isBlockedByTarget, isPrivateProfile, authUser, sameUser } = props;

    return (
        <div className="w-full max-w-[800px] mx-auto p-[20px] bg-bg-page border border-border text-[11px] text-text-main box-border overflow-visible">

            {!isPreview && isStaff && !isBanned && (
                <StaffBanner role={props.user.role} />
            )}

            <div className="flex gap-[15px] flex-nowrap overflow-visible max-md:flex-col max-md:gap-[10px]">

                {/* tetrone-left-col */}
                <div className="w-[200px] shrink-0 relative z-50 overflow-visible max-md:w-full">
                    <ProfileAvatar {...props} />

                    {!isPreview && authUser && (!isPreview || sameUser) && (
                        <ProfileActions {...props} />
                    )}
                </div>

                {/* tetrone-right-col */}
                <div className="grow min-w-0 pr-[5px] relative z-10 max-md:w-full max-md:pr-0">
                    <ProfileHeader {...props} />
                    <ProfileStatus bio={props.effectiveBio} />

                    {(isPreview || (!isBlockedByTarget && !isBanned && !isPrivateProfile)) && (
                        <ProfileInfo {...props} />
                    )}
                </div>
            </div>
        </div>
    );
}