import React from 'react';
import VerifiedBadge from './VerifiedBadge';

export default function UserDisplayName({ user, showUsername = true, className = "", nameStyle = {} }) {
    if (!user) return null;

    const customColor = user.personalization?.username_color || user.username_color;

    let style = { ...nameStyle };
    if (customColor) {
        if (customColor.includes('gradient')) {
            style = {
                background: customColor,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                ...nameStyle
            };
        } else {
            style = { color: customColor, ...nameStyle };
        }
    }

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

    return (
        <span className={`inline-flex items-center gap-[3px] font-bold ${className}`} style={style}>
            <span>{fullName}</span>
            <VerifiedBadge user={user} />

            {showUsername && user.username && fullName !== user.username && (
                <span className={`text-[11px] font-normal ${customColor ? 'opacity-80' : 'text-text-muted'}`}>
                    @{user.username}
                </span>
            )}
        </span>
    );
}