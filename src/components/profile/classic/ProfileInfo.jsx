import { Link } from "react-router";
import { useTranslation } from 'react-i18next';
import isoCountries from "i18n-iso-countries";
import { useDateFormatter } from "../../../hooks/useDateFormatter";

export default function ProfileInfo({ user, displayBirth, displayCountry, displayGender, joinedDate, isPreview }) {
    const { t, i18n } = useTranslation();
    const formatDate = useDateFormatter();
    const langCode = i18n.language || 'en';

    // ФІКС ДАТИ НАРОДЖЕННЯ:
    const hasBirth = user?.birth_date || displayBirth;
    const formattedBirth = user?.birth_date
        ? formatDate(user.birth_date, { withTime: false, useRelative: false })
        : displayBirth;

    const hasCountry = user?.country || displayCountry;

    // tetrone-info-row + tetrone-label + tetrone-value
    const InfoRow = ({ label, value }) => (
        <div className="flex mb-[6px] max-sm:flex-col max-sm:mb-[10px]">
            <div className="w-[130px] text-text-muted shrink-0">{label}:</div>
            <div className="text-text-main flex-1">{value}</div>
        </div>
    );

    return (
        <>
            <div className="mt-[20px]">
                <h4 className="bg-section-bg text-section-text py-[4px] px-[8px] m-0 mb-[10px] font-bold text-[11px] border-y border-border">
                    {t('profile.information')}
                </h4>

                {hasBirth && <InfoRow label={t('common.birthday')} value={formattedBirth} />}

                {hasCountry && (
                    <InfoRow label={t('common.country')} value={
                        user?.country?.length === 2 ? (
                            <span className="flex items-center gap-[5px]">
                                <span className={`fi fi-${user.country.toLowerCase()}`}></span>
                                <span>{isoCountries.getName(user.country, langCode) || user.country}</span>
                            </span>
                        ) : displayCountry
                    } />
                )}

                <InfoRow label={t('profile.joined')} value={joinedDate} />

                {displayGender && <InfoRow label={t('common.gender')} value={displayGender} />}
            </div>

            {!isPreview && (
                <div className="mt-[20px]">
                    <h4 className="bg-section-bg text-section-text py-[4px] px-[8px] m-0 mb-[10px] font-bold text-[11px] border-y border-border">
                        {t('common.friends')}
                    </h4>

                    <InfoRow label={t('common.friends')} value={
                        <Link to={`/${user.username}/friends`} className="text-theme-link no-underline hover:underline">
                            {user?.friends_count || 0}
                        </Link>
                    } />

                    <InfoRow label={t('profile.subscribers')} value={
                        <Link to={`/${user.username}/followers`} className="text-theme-link no-underline hover:underline">
                            {user?.followers_count || 0}
                        </Link>
                    } />
                </div>
            )}
        </>
    );
}