import StaffBanner from "../classic/StaffBanner";
import Banner from "./Banner";
import Header from "./Header";
import Info from "./Info";

export default function ModernProfileCard(props) {
    const { isPreview, isStaff, isBanned, user } = props;

    return (
        <div className="w-full max-w-[800px] mx-auto bg-bg-box border border-border overflow-hidden text-[13px] text-text-main">
            {!isPreview && isStaff && !isBanned && (
                <StaffBanner role={user.role} />
            )}

            <Banner personalization={user?.personalization} />

            <Header {...props} />

            <Info {...props} />
        </div>
    );
}