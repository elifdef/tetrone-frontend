import React from 'react';
import VerifiedBadge from './VerifiedBadge';

export default function UserDisplayName({ user, showUsername = true, className = "", nameStyle = {} }) {
    if (!user) return null;

    const customColor = user.personalization?.username_color || user.username_color;
    const style = customColor && customColor.startsWith('#') ? { color: customColor, ...nameStyle } : nameStyle;

    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;

    return (
        <span className={`inline-flex items-center gap-[3px] font-bold ${className}`} style={style}>
            <span>{fullName}</span>
            <VerifiedBadge user={user} />
            
            {showUsername && user.username && fullName !== user.username && (
                <span className="text-[11px] text-text-muted font-normal">@{user.username}</span>
            )}
        </span>
    );
}