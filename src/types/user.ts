import type { PaginationMeta } from './api';
import type { TipTapDoc } from './tiptap';

export type {
    TipTapAllowedFontFamily,
    TipTapAllowedFontSize,
    TipTapTextAlign,
    TipTapHeadingLevel,
    EditorPresetName,
    EditorFormatFeature,
    TipTapNodeType,
    TipTapMarkType,
    TipTapMark,
    TipTapInlineNode,
    TipTapBlockNode,
    TipTapNode,
    TipTapDoc,
} from './tiptap';

export interface VerificationBadge {
    type: string;
    sticker_id: number | null;
    sticker_url: string | null;
}

export interface UserPersonalization {
    banner_color: string | null;
    username_color: string | null;
    banner_image: string | null;
}

export interface UserPermissions {
    can_message: boolean;
    can_post_on_wall: boolean;
    can_view_friends: boolean;
}

export type FriendshipStatusValue =
    | 'none'
    | 'friends'
    | 'pending_sent'
    | 'pending_received'
    | 'blocked_by_me'
    | 'blocked_by_target';

export interface UserData {
    username: string;
    aliases?: string[] | null;
    first_name: string | null;
    last_name: string | null;
    avatar: string | null;
    gender: number | null;
    is_setup_complete: boolean;
    is_banned: boolean;
    is_deleted: boolean;
    is_verified: boolean;
    verification_badge: VerificationBadge | null;
    personalization: UserPersonalization | null;
    id?: number;
    email?: string | null;
    bio?: TipTapDoc | null;
    birth_date?: string | null;
    country?: string | null;
    email_verified_at?: string | null;
    role?: number | null;
    created_at?: string | null;
    ban_reason?: string | null;
    is_private?: boolean;
    permissions?: UserPermissions;
    is_online?: boolean;
    last_seen?: string | null;
    friendship_status?: FriendshipStatusValue | string | null;
    can_view_friends?: boolean;
    friends_count?: number;
    followers_count?: number;
    notification_settings?: Record<string, unknown> | null;
}

export interface UsersListResponse {
    code: string;
    users: UserData[];
    meta?: PaginationMeta;
}