import { APP_NAME, userRole } from "../../../config";
import { getRoleTitle } from "../utils/getRoleTitle";

const getStaffBannerClass = (role) => {
    switch (role) {
        case userRole.Support:
            return 'staff-banner-support';
        case userRole.Moderator:
            return 'staff-banner-moderator';
        case userRole.Admin:
            return 'staff-banner-admin';
        case userRole.Owner:
            return 'staff-banner-owner';
        default:
            return 'staff-banner-support';
    }
};

export default function StaffBanner({ role }) {
    return (
        <div className={`flex justify-between items-center border py-[8px] px-[15px] mb-[10px] text-[11px] transition-colors 
        ${getStaffBannerClass(role)}`}>
            <div className="flex items-center"
            >
                <span className="font-bold">{getRoleTitle(role)} {APP_NAME}</span>
            </div>
        </div>
    );
}