import React from 'react';

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

    return (
        <svg
            className={`${className} text-theme-link`}
            viewBox="0 0 24 24"
            fill="currentColor"
        >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
    );
}