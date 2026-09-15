import i18n from "i18next";
import {userRole} from "../../../config.js";

export const getRoleTitle = (r) => {
    switch (r) {
        case userRole.Support: return i18n.t('common.support');
        case userRole.Moderator: return i18n.t('common.moderator');
        case userRole.Admin: return i18n.t('common.admin');
        case userRole.Owner: return i18n.t('common.owner');
        default: return i18n.t('common.user');
    }
};