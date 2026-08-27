import { useTranslation } from "react-i18next";
import { APP_NAME } from "../../../config";
import { VerifiedIcon } from "../../ui/Icons";

export default function StaffBanner({ role }) {
    const { t } = useTranslation();

    const getRoleTitle = (r) => {
        switch (r) {
            case 1: return t('common.support');
            case 2: return t('common.moderator');
            case 3: return t('common.admin');
            case 4: return t('common.owner');
            default: return null;
        }
    };

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