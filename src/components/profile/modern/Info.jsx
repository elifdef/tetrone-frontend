import { useTranslation } from "react-i18next";
import { useDateFormatter } from "../../../hooks/useDateFormatter";
import isoCountries from "i18n-iso-countries";
import ProfileStatus from "../classic/ProfileStatus";

export default function Info(props) {
    const {
        user, displayBirth, displayCountry, displayGender,
        isPreview, isBlockedByTarget, isBanned, isDeleted, isPrivateProfile, effectiveBio, joinedDate
    } = props;

    const { t, i18n } = useTranslation();
    const formatDate = useDateFormatter();
    const langCode = i18n.language || 'en';

    // ФІКС ДАТИ НАРОДЖЕННЯ
    const formattedBirth = user?.birth_date
        ? formatDate(user.birth_date, { withTime: false, useRelative: false })
        : displayBirth;

    // Перевикористовуваний компонент елемента гріда
    const GridItem = ({ label, value }) => (
        <div className="flex flex-col gap-[4px]">
            <span className="text-[11px] text-text-muted uppercase font-bold">{label}</span>
            <span className="text-[13px] text-text-main">{value}</span>
        </div>
    );

    return (
        <div className="p-[20px] relative">
            {/* Біографія / Статус */}
            <ProfileStatus bio={effectiveBio} />

            {/* Грід з даними */}
            {/* Грід з даними */}
            {(isPreview || (!isBlockedByTarget && !isBanned && !isPrivateProfile && !isDeleted)) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-[15px] max-md:grid-cols-1 mt-[20px]">

                    <GridItem label={t('common.birthday')} value={formattedBirth} />

                    <GridItem label={t('common.country')} value={
                        user?.country?.length === 2 ? (
                            <span className="flex items-center gap-[6px]">
                                <span className={`fi fi-${user.country.toLowerCase()}`}></span>
                                <span>{isoCountries.getName(user.country, langCode) || user.country}</span>
                            </span>
                        ) : displayCountry
                    } />

                    <GridItem label={t('common.gender')} value={displayGender} />

                    <GridItem label={t('profile.joined')} value={joinedDate} />

                </div>
            )}
        </div>
    );
}