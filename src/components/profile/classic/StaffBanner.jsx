import { APP_NAME } from "../../../config";
import { VerifiedIcon } from "../../ui/Icons";
import {getRoleTitle} from "../utils/getRoleTitle";

export default function StaffBanner({ role }) {

    return (
        <div className="flex justify-between items-center bg-staff-bg border border-staff-border py-[8px] px-[15px] mb-[10px] text-[11px] transition-colors">
            <div className="flex items-center">
                <span className="font-bold text-staff-text">{getRoleTitle(role)} {APP_NAME}</span>
                <span className="flex items-center ml-[6px] cursor-help text-staff-icon" title={getRoleTitle(role)}>
                    <VerifiedIcon width={12} height={12} />
                </span>
            </div>
        </div>
    );
}