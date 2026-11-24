import { useState, useMemo, useCallback, type ReactNode } from 'react';
import { SpaceContext, isSpaceAdminRole, isSpaceStaffRole } from './space-context';
import type { SpaceData } from '@/types/space';

interface SpaceProviderProps {
    children: ReactNode;
    initialSpace: SpaceData | null;
}

export const SpaceProvider = ({ children, initialSpace }: SpaceProviderProps) => {
    const [override, setOverride] = useState<{
        base: SpaceData | null;
        updates: Partial<SpaceData>;
    } | null>(null);

    const space = useMemo<SpaceData | null>(() => {
        if (!initialSpace) return null;
        if (override && override.base === initialSpace) {
            return { ...initialSpace, ...override.updates };
        }
        return initialSpace;
    }, [initialSpace, override]);

    const updateSpace = useCallback(
        (updates: Partial<SpaceData>) => {
            setOverride((prev) => ({
                base: initialSpace,
                updates:
                    prev && prev.base === initialSpace
                        ? { ...prev.updates, ...updates }
                        : updates,
            }));
        },
        [initialSpace]
    );

    const permissions = useMemo(() => {
        const role = space?.member_role;
        const isOwner = role === 'owner';
        const canManageSettings = isOwner;
        const canManageInvites = isSpaceAdminRole(role);
        const canManageMembers = isSpaceStaffRole(role);
        const canPost = Boolean(
            space?.is_member && (space?.posting_rule !== 'admins' || canManageMembers)
        );

        return {
            isOwner,
            canManageSettings,
            canManageInvites,
            canManageMembers,
            canPost,
        };
    }, [space?.member_role, space?.is_member, space?.posting_rule]);

    return (
        <SpaceContext.Provider value={{ space, updateSpace, ...permissions }}>
            {children}
        </SpaceContext.Provider>
    );
};