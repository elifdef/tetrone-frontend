import { createContext, useState, useEffect, useMemo } from 'react';

export const SpaceContext = createContext(null);

export const STAFF_ROLES = ['owner', 'admin', 'moderator'];
export const ADMIN_ROLES = ['owner', 'admin'];

export const SpaceProvider = ({ children, initialSpace }) => {
    const [space, setSpace] = useState(initialSpace);

    useEffect(() => {
        setSpace(initialSpace);
    }, [initialSpace]);

    const updateSpace = (updates) => {
        setSpace(prev => (prev ? { ...prev, ...updates } : prev));
    };

    const permissions = useMemo(() => {
        const role = space?.member_role;
        const isOwner = role === 'owner';
        const canManageSettings = isOwner;
        const canManageInvites = Boolean(role && ADMIN_ROLES.includes(role));
        const canManageMembers = Boolean(role && STAFF_ROLES.includes(role));
        const canPost = Boolean(
            space?.is_member && (space?.posting_rule !== 'admins' || canManageMembers)
        );

        return {
            isOwner,
            canManageSettings,
            canManageInvites,
            canManageMembers,
            canPost
        };
    }, [space?.member_role, space?.is_member, space?.posting_rule]);

    return (
        <SpaceContext.Provider value={{ space, updateSpace, ...permissions }}>
            {children}
        </SpaceContext.Provider>
    );
};