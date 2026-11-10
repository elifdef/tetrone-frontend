import { VerifiedIcon } from "../ui/Icons";

export default function VerifiedBadge({ user, className = "w-[16px] h-[16px] inline-block align-middle ml-[4px]" }) {
    if (!user || !user.is_verified) return null;

    const badge = user.verification_badge || {};
    const badgeType = badge.type || user.verification_badge_type || 'classic';

    if (badgeType === 'sticker' && (badge.sticker_url || user.verification_sticker_url)) {
        const src = badge.sticker_url || user.verification_sticker_url;
        return (
            <img
                src={src}
                alt="Verified"
                className={`object-contain ${className}`}
            />
        );
    }

    return <VerifiedIcon width={11} height={11} />;
}