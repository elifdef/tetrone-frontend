import { createContext } from 'react';
import type { SpaceData, SpaceRole } from '@/types/space';

export interface SpaceContextValue {
    space: SpaceData | null;
    updateSpace: (updates: Partial<SpaceData>) => void;
    isOwner: boolean;
    canManageSettings: boolean;
    canManageInvites: boolean;
    canManageMembers: boolean;
    canPost: boolean;
}

export const SpaceContext = createContext<SpaceContextValue>({
    space: null,
    updateSpace: () => {},
    isOwner: false,
    canManageSettings: false,
    canManageInvites: false,
    canManageMembers: false,
    canPost: false,
});

export const STAFF_ROLES: readonly SpaceRole[] = ['owner', 'admin', 'moderator'];
export const ADMIN_ROLES: readonly SpaceRole[] = ['owner', 'admin'];

export const isSpaceStaffRole = (role: SpaceRole | null | undefined): boolean =>
    Boolean(role && STAFF_ROLES.includes(role));

export const isSpaceAdminRole = (role: SpaceRole | null | undefined): boolean =>
    Boolean(role && ADMIN_ROLES.includes(role));
